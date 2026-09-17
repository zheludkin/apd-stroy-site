require('dotenv').config();
const path = require('path');
const express = require('express');
const { ProxyAgent } = require('undici');
const {
  appendLead,
  getPool,
  ensureSchema,
  getLeadsPendingMetrikaUpload,
  markMetrikaUploaded,
  insertChatMessage,
  setChatMessageTelegramId,
  getChatMessagesSince,
  findVisitorByTelegramMessageId,
  getLastActiveVisitorId,
  getBotState,
  setBotState,
} = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Timeweb (ru-3) ненадёжно достаёт до api.telegram.org напрямую (см. память
// apd-stroy-lead-instant-notify / apd-stroy-site-live-chat-relay). Если задан
// TELEGRAM_PROXY_URL (http://user:pass@host:port или socks5://...) — все
// запросы к Telegram API идут через него; если не задан — обычный прямой fetch,
// поведение не меняется.
const telegramProxyAgent = process.env.TELEGRAM_PROXY_URL ? new ProxyAgent(process.env.TELEGRAM_PROXY_URL) : null;

function telegramFetch(url, options = {}) {
  return fetch(url, telegramProxyAgent ? { ...options, dispatcher: telegramProxyAgent } : options);
}

// Сеть Timeweb до api.telegram.org нестабильна (fetch failed/ETIMEDOUT).
// Быстрый путь (sendTelegramMessage) пробует сразу с короткими повторами;
// параллельно фоновый цикл (backgroundRetryLoop) каждые 2 минуты добивает
// то, что быстрый путь не смог — до RETRY_LIMIT попыток на заявку. Работает
// пока запущен процесс на Timeweb, без зависимости от локального компьютера.
const RETRY_LIMIT = 96; // ~48 часов добивания при интервале фонового цикла 30 минут
const RETRY_INTERVAL_MS = 30 * 60 * 1000;

// MAX доступен с Timeweb напрямую — опрашиваем каждые 4 сек, без локального relay.
const MAX_CHAT_POLL_INTERVAL_MS = 4000;

// Офлайн-конверсии в Яндекс.Метрику по yclid — обходят cookie-баннер (152-ФЗ),
// т.к. Метрика на сайте грузится только после согласия, а yclid ловится ДО него
// (см. attribution-скрипт в index.html). Матчинг у Метрики работает до 21 дня
// с момента клика по рекламе, поэтому раз в час достаточно.
const METRIKA_COUNTER_ID = 111213103;
const METRIKA_LEAD_SUBMIT_GOAL_ID = 595569138; // цель "lead_submit"
const METRIKA_UPLOAD_INTERVAL_MS = 60 * 60 * 1000;

async function uploadOfflineConversionsLoop() {
  try {
    const leads = await getLeadsPendingMetrikaUpload();
    if (!leads.length) return;

    const token = process.env.METRIKA_OAUTH_TOKEN;
    if (!token) {
      console.error('METRIKA_OAUTH_TOKEN не задан — офлайн-конверсии не выгружены');
      return;
    }

    const rows = leads.map((lead) => {
      const dateTime = Math.floor(new Date(lead.created_at).getTime() / 1000);
      return `yclid:${lead.yclid},${METRIKA_LEAD_SUBMIT_GOAL_ID},${dateTime},,`;
    });
    const csv = `UserId,Target,DateTime,Price,Currency\n${rows.join('\n')}\n`;

    const form = new FormData();
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'offline_conversions.csv');

    const response = await fetch(
      `https://api-metrika.yandex.net/management/v1/counter/${METRIKA_COUNTER_ID}/offline_conversions/upload?type=BASIC`,
      { method: 'POST', headers: { Authorization: `OAuth ${token}` }, body: form }
    );
    const json = await response.json();

    if (!response.ok) {
      console.error('Метрика offline_conversions upload — ошибка:', response.status, JSON.stringify(json));
      return;
    }

    if (json.uploading && json.uploading.line_quantity === leads.length) {
      await markMetrikaUploaded(leads.map((lead) => lead.id));
      console.log(`Офлайн-конверсии: выгружено ${leads.length} заявок в Метрику (uploading id ${json.uploading.id}).`);
    } else {
      console.error('Метрика приняла не все строки CSV:', JSON.stringify(json));
    }
  } catch (err) {
    console.error('Ошибка цикла выгрузки офлайн-конверсий:', err.message);
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function sendTelegramMessage({ name, phone, project, callTime }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN/TELEGRAM_GROUP_CHAT_ID не заданы');
  }

  const text =
    `🆕 Новая заявка (Сайт)\n` +
    `Имя: ${name}\n` +
    `Телефон: ${phone}\n` +
    `Проект: ${project || '—'}\n` +
    `Удобное время звонка: ${callTime || '—'}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await telegramFetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage ${response.status}: ${body}`);
  }
}

async function notifyTelegramGroup(lead, { attempts = 3 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await sendTelegramMessage(lead);
      if (lead.id) {
        await getPool().query('UPDATE leads SET notified_at = now() WHERE id = $1', [lead.id]);
      }
      return true;
    } catch (err) {
      lastError = err;
      console.error(`Попытка ${attempt}/${attempts} отправки в Telegram не удалась:`, err.message);
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  console.error('Быстрый путь отправки исчерпан, заявка уйдёт в фоновый цикл повторов:', lastError?.message);
  return false;
}

// Дублирование заявок в MAX (российский мессенджер) — в отличие от api.telegram.org,
// platform-api2.max.ru доступен с Timeweb напрямую (см. память apd-stroy-site-live-chat-relay).
// Требует NODE_EXTRA_CA_CERTS (см. certs/russian_trusted_ca_bundle.crt) — MAX использует
// TLS-сертификат от НУЦ Минцифры, без него будет UNABLE_TO_GET_ISSUER_CERT_LOCALLY.
async function sendMaxMessage({ name, phone, project, callTime }) {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('MAX_BOT_TOKEN/MAX_CHAT_ID не заданы');
  }

  const text =
    `🆕 Новая заявка (Сайт)\n` +
    `Имя: ${name}\n` +
    `Телефон: ${phone}\n` +
    `Проект: ${project || '—'}\n` +
    `Удобное время звонка: ${callTime || '—'}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(`https://platform-api2.max.ru/messages?chat_id=${chatId}`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MAX sendMessage ${response.status}: ${body}`);
  }
}

async function notifyMaxChat(lead, { attempts = 3 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await sendMaxMessage(lead);
      if (lead.id) {
        await getPool().query('UPDATE leads SET max_notified_at = now() WHERE id = $1', [lead.id]);
      }
      return true;
    } catch (err) {
      lastError = err;
      console.error(`Попытка ${attempt}/${attempts} отправки в MAX не удалась:`, err.message);
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  console.error('Быстрый путь MAX исчерпан, заявка уйдёт в фоновый цикл повторов:', lastError?.message);
  return false;
}

async function backgroundRetryLoop() {
  try {
    const { rows } = await getPool().query(
      `SELECT id, name, phone, project, call_time AS "callTime", notified_at, max_notified_at
       FROM leads
       WHERE source = 'Сайт'
         AND (
           (notified_at IS NULL AND notify_attempts < $1)
           OR (max_notified_at IS NULL AND max_notify_attempts < $1)
         )
       ORDER BY id ASC`,
      [RETRY_LIMIT]
    );

    for (const lead of rows) {
      if (!lead.notified_at) {
        await getPool().query('UPDATE leads SET notify_attempts = notify_attempts + 1 WHERE id = $1', [lead.id]);
        try {
          await sendTelegramMessage(lead);
          await getPool().query('UPDATE leads SET notified_at = now() WHERE id = $1', [lead.id]);
          console.log(`Фоновый повтор: заявка #${lead.id} отправлена в Telegram.`);
        } catch (err) {
          console.error(`Фоновый повтор: заявка #${lead.id} — Telegram попытка не удалась —`, err.message);
        }
      }
      if (!lead.max_notified_at) {
        await getPool().query('UPDATE leads SET max_notify_attempts = max_notify_attempts + 1 WHERE id = $1', [lead.id]);
        try {
          await sendMaxMessage(lead);
          await getPool().query('UPDATE leads SET max_notified_at = now() WHERE id = $1', [lead.id]);
          console.log(`Фоновый повтор: заявка #${lead.id} отправлена в MAX.`);
        } catch (err) {
          console.error(`Фоновый повтор: заявка #${lead.id} — MAX попытка не удалась —`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('Фоновый цикл повторов упал:', err.message);
  }
}

// Живой чат на сайте: сообщения посетителя летят в тот же Telegram-канал,
// куда падают уведомления о заявках (TELEGRAM_BOT_TOKEN/TELEGRAM_GROUP_CHAT_ID).
// Менеджер отвечает через Reply на сообщение в группе — бот вычленяет
// visitor_id по telegram_message_id (см. chat_messages) и long-polling'ом
// (getUpdates) забирает ответ обратно на сайт. Это НЕ тот же бот, что
// apd-stroy-bot (там своя Telegraf-сессия и long polling на другом токене) —
// делать так же на TELEGRAM_BOT_TOKEN apd-stroy-bot нельзя, будет конфликт
// (см. память apd-stroy-telegram-bridge-duplicate-conflict).
const CHAT_OFFSET_KEY = 'chat_update_offset';
let chatPolling = false;

async function sendChatMessageToGroup(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN/TELEGRAM_GROUP_CHAT_ID не заданы');
  }
  const response = await telegramFetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(`Telegram sendMessage ${response.status}: ${JSON.stringify(json)}`);
  }
  return json.result.message_id;
}

async function chatPollLoop() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!token || !groupChatId || chatPolling) return;
  chatPolling = true;
  try {
    const stored = await getBotState(CHAT_OFFSET_KEY);
    const offset = stored ? Number(stored) : 0;
    const response = await telegramFetch(
      `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=0&allowed_updates=["message"]`
    );
    const json = await response.json();
    if (!json.ok) {
      console.error('Чат: getUpdates вернул ошибку:', JSON.stringify(json));
      return;
    }

    let maxUpdateId = offset - 1;
    for (const update of json.result) {
      if (update.update_id > maxUpdateId) maxUpdateId = update.update_id;
      const message = update.message;
      if (!message || !message.reply_to_message || !message.text) continue;
      if (String(message.chat.id) !== String(groupChatId)) continue;

      const visitorId = await findVisitorByTelegramMessageId(message.reply_to_message.message_id);
      if (!visitorId) continue;

      await insertChatMessage({ visitorId, direction: 'manager', text: message.text });
    }

    if (maxUpdateId >= offset) {
      await setBotState(CHAT_OFFSET_KEY, String(maxUpdateId + 1));
    }
  } catch (err) {
    console.error('Чат: цикл опроса Telegram упал:', err.message);
  } finally {
    chatPolling = false;
  }
}

// Живой чат через MAX — работает напрямую с Timeweb, без локального relay
// (в отличие от Telegram-ветки выше). MAX не отдаёт в апдейтах, на какое
// сообщение отвечает менеджер, поэтому по решению пользователя (16.09.2026)
// ответ маршрутизируется ПОСЛЕДНЕМУ НАПИСАВШЕМУ посетителю (getLastActiveVisitorId),
// без тегов — простая и предсказуемая логика для сайта с низким трафиком чата.
const MAX_CHAT_MARKER_KEY = 'max_chat_marker';
let maxChatPolling = false;

async function sendMaxChatMessage(text) {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('MAX_BOT_TOKEN/MAX_CHAT_ID не заданы');
  }
  const response = await fetch(`https://platform-api2.max.ru/messages?chat_id=${chatId}`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MAX sendMessage ${response.status}: ${body}`);
  }
}

async function maxChatPollLoop() {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_CHAT_ID;
  if (!token || !chatId || maxChatPolling) return;
  maxChatPolling = true;
  try {
    const stored = await getBotState(MAX_CHAT_MARKER_KEY);
    const url = stored
      ? `https://platform-api2.max.ru/updates?marker=${stored}`
      : `https://platform-api2.max.ru/updates`;
    const response = await fetch(url, { headers: { Authorization: token } });
    const json = await response.json();
    if (!response.ok) {
      console.error('MAX-чат: /updates вернул ошибку:', JSON.stringify(json));
      return;
    }

    for (const update of json.updates || []) {
      if (update.update_type !== 'message_created') continue;
      const message = update.message;
      if (!message || !message.body || !message.body.text) continue;
      if (String(message.recipient.chat_id) !== String(chatId)) continue;
      if (message.sender && message.sender.is_bot) continue;

      const visitorId = await getLastActiveVisitorId();
      if (!visitorId) continue;

      await insertChatMessage({ visitorId, direction: 'manager', text: message.body.text });
    }

    if (json.marker) {
      await setBotState(MAX_CHAT_MARKER_KEY, String(json.marker));
    }
  } catch (err) {
    console.error('MAX-чат: цикл опроса упал:', err.message);
  } finally {
    maxChatPolling = false;
  }
}

// Ежедневный отчёт по Яндекс Директ в MAX (по просьбе пользователя, 17.09.2026).
// Проверка раз в час, отправка один раз в сутки после 9:00 — так переживает
// рестарты процесса и не спамит, если сервер перезапустился несколько раз подряд.
const DIRECT_REPORT_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const DIRECT_REPORT_STATE_KEY = 'direct_report_last_sent_date';
const DIRECT_REPORT_SEND_AFTER_HOUR = 9;

async function fetchDirectCampaignReport(dateStr) {
  const token = process.env.YANDEX_DIRECT_OAUTH_TOKEN;
  if (!token) throw new Error('YANDEX_DIRECT_OAUTH_TOKEN не задан');

  const body = {
    params: {
      SelectionCriteria: { DateFrom: dateStr, DateTo: dateStr },
      FieldNames: ['CampaignName', 'Impressions', 'Clicks', 'Ctr', 'AvgCpc', 'Cost', 'Conversions'],
      ReportName: `daily-max-report-${Date.now()}`,
      ReportType: 'CAMPAIGN_PERFORMANCE_REPORT',
      DateRangeType: 'CUSTOM_DATE',
      Format: 'TSV',
      IncludeVAT: 'YES',
      IncludeDiscount: 'NO',
    },
  };

  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch('https://api.direct.yandex.com/json/v5/reports', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Accept-Language': 'ru',
        processingMode: 'auto',
        returnMoneyInMicros: 'false',
        skipReportHeader: 'true',
        skipReportSummary: 'true',
      },
      body: JSON.stringify(body),
    });
    if (response.status === 200) return response.text();
    if (response.status === 201 || response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }
    throw new Error(`Direct reports ${response.status}: ${await response.text()}`);
  }
  throw new Error('Direct reports: таймаут ожидания отчёта');
}

function formatDirectReport(dateStr, tsv) {
  const lines = tsv
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((line) => !line.startsWith('CampaignName\t'));
  if (!lines.length) {
    return `📊 Яндекс Директ за ${dateStr}: показов не было.`;
  }
  let totalCost = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  const parts = lines.map((line) => {
    const [name, impressions, clicks, ctr, avgCpc, cost, conversions] = line.split('\t');
    totalCost += parseFloat(cost) || 0;
    totalClicks += parseInt(clicks, 10) || 0;
    totalConversions += parseInt(conversions, 10) || 0;
    return `${name}: ${clicks} кликов (${ctr}% CTR), ${cost}₽ по ${avgCpc}₽/клик, конверсий: ${conversions}`;
  });
  return `📊 Яндекс Директ за ${dateStr}:\n${parts.join('\n')}\n\nИтого: ${totalClicks} кликов, ${totalCost.toFixed(2)}₽, ${totalConversions} конверсий`;
}

async function sendDailyDirectReport() {
  const now = new Date();
  if (now.getHours() < DIRECT_REPORT_SEND_AFTER_HOUR) return;

  const today = now.toISOString().slice(0, 10);
  const lastSent = await getBotState(DIRECT_REPORT_STATE_KEY);
  if (lastSent === today) return;

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const tsv = await fetchDirectCampaignReport(yesterday);
    const message = formatDirectReport(yesterday, tsv);
    await sendMaxChatMessage(message);
    await setBotState(DIRECT_REPORT_STATE_KEY, today);
  } catch (err) {
    console.error('Ежедневный отчёт Директ → MAX не отправлен:', err.message);
  }
}

app.post('/api/chat/send', async (req, res) => {
  const { visitorId, text } = req.body || {};
  const trimmed = (text || '').trim();

  if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 100) {
    return res.status(400).json({ ok: false, error: 'Некорректный visitorId.' });
  }
  if (!trimmed) {
    return res.status(400).json({ ok: false, error: 'Пустое сообщение.' });
  }
  if (trimmed.length > 2000) {
    return res.status(400).json({ ok: false, error: 'Сообщение слишком длинное.' });
  }

  try {
    // Чат идёт только в MAX (по решению пользователя, 17.09.2026) — Telegram-ветка
    // чата отключена. Первое сообщение посетителя получает авто-приветствие с
    // просьбой представиться; второе сообщение трактуется как имя и запоминается
    // (chat_name_<visitorId> в bot_state), дальше уведомления в MAX подписаны им.
    const priorMessages = await getChatMessagesSince(visitorId, 0);
    const isFirstMessage = !priorMessages.some((m) => m.direction === 'visitor');
    const nameStateKey = `chat_name_${visitorId}`;
    let visitorName = isFirstMessage ? null : await getBotState(nameStateKey);

    const saved = await insertChatMessage({ visitorId, direction: 'visitor', text: trimmed });
    res.json({ ok: true, id: saved.id });

    let maxText;
    if (isFirstMessage) {
      await insertChatMessage({ visitorId, direction: 'manager', text: 'Добрый день! Как я могу к вам обращаться?' });
      maxText = `💬 Новый посетитель на сайте:\n${trimmed}`;
    } else if (!visitorName) {
      visitorName = trimmed.slice(0, 60);
      await setBotState(nameStateKey, visitorName);
      maxText = `💬 Представился как «${visitorName}»`;
    } else {
      maxText = `💬 ${visitorName}:\n${trimmed}`;
    }

    try {
      await sendMaxChatMessage(maxText);
    } catch (err) {
      console.error('Чат: не удалось переслать сообщение в MAX:', err.message);
    }
  } catch (err) {
    console.error('Чат: не удалось сохранить сообщение:', err.message);
    res.status(500).json({ ok: false, error: 'Не удалось отправить сообщение. Попробуйте ещё раз.' });
  }
});

app.get('/api/chat/messages', async (req, res) => {
  const { visitorId, since } = req.query || {};
  if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 100) {
    return res.status(400).json({ ok: false, error: 'Некорректный visitorId.' });
  }
  try {
    const messages = await getChatMessagesSince(visitorId, Number(since) || 0);
    res.json({ ok: true, messages });
  } catch (err) {
    console.error('Чат: не удалось получить сообщения:', err.message);
    res.status(500).json({ ok: false, error: 'Не удалось загрузить сообщения.' });
  }
});

app.post('/api/leads', async (req, res) => {
  const { name, phone, project, callTime, yclid } = req.body || {};

  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ ok: false, error: 'Укажите имя и телефон.' });
  }

  let leadId;
  try {
    leadId = await appendLead({ name, phone, project, callTime, source: 'Сайт', yclid });
    res.json({ ok: true });
  } catch (err) {
    console.error('Не удалось сохранить заявку в базу данных:', err.message);
    return res.status(500).json({ ok: false, error: 'Не удалось сохранить заявку. Попробуйте ещё раз.' });
  }

  notifyTelegramGroup({ id: leadId, name, phone, project, callTime });
  notifyMaxChat({ id: leadId, name, phone, project, callTime });
});

// chatPollLoop() (getUpdates) НЕ запускается отсюда — Timeweb (ru-3) ненадёжно
// достаёт до api.telegram.org (см. коммит-сообщение и apd-stroy-lead-instant-notify).
// Ответы менеджера забирает apd-stroy-bot/local_chat_relay.js с локальной машины
// (раз в минуту, тот же паттерн, что и для заявок). Если сеть Timeweb когда-нибудь
// починится — можно вернуть chatPollLoop() в этот интервал, конфликта с локальным
// relay не будет, т.к. оба читают/пишут смещение (offset) независимо, но ЛУЧШЕ
// оставить только один активный consumer getUpdates на этот токен.

ensureSchema()
  .then(() => {
    backgroundRetryLoop();
    setInterval(backgroundRetryLoop, RETRY_INTERVAL_MS);
    uploadOfflineConversionsLoop();
    setInterval(uploadOfflineConversionsLoop, METRIKA_UPLOAD_INTERVAL_MS);
    maxChatPollLoop();
    setInterval(maxChatPollLoop, MAX_CHAT_POLL_INTERVAL_MS);
    sendDailyDirectReport();
    setInterval(sendDailyDirectReport, DIRECT_REPORT_CHECK_INTERVAL_MS);
  })
  .catch((err) => console.error('Не удалось подготовить схему БД:', err.message));

app.listen(PORT, () => {
  console.log(`АПД Строй сайт запущен: http://localhost:${PORT}`);
});
