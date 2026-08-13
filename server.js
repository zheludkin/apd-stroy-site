require('dotenv').config();
const path = require('path');
const express = require('express');
const { appendLead, getPool, ensureSchema } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Сеть Timeweb до api.telegram.org нестабильна (fetch failed/ETIMEDOUT).
// Быстрый путь (sendTelegramMessage) пробует сразу с короткими повторами;
// параллельно фоновый цикл (backgroundRetryLoop) каждые 2 минуты добивает
// то, что быстрый путь не смог — до RETRY_LIMIT попыток на заявку. Работает
// пока запущен процесс на Timeweb, без зависимости от локального компьютера.
const RETRY_LIMIT = 96; // ~48 часов добивания при интервале фонового цикла 30 минут
const RETRY_INTERVAL_MS = 30 * 60 * 1000;

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
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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

async function backgroundRetryLoop() {
  try {
    const { rows } = await getPool().query(
      `SELECT id, name, phone, project, call_time AS "callTime"
       FROM leads
       WHERE source = 'Сайт' AND notified_at IS NULL AND notify_attempts < $1
       ORDER BY id ASC`,
      [RETRY_LIMIT]
    );

    for (const lead of rows) {
      await getPool().query('UPDATE leads SET notify_attempts = notify_attempts + 1 WHERE id = $1', [lead.id]);
      try {
        await sendTelegramMessage(lead);
        await getPool().query('UPDATE leads SET notified_at = now() WHERE id = $1', [lead.id]);
        console.log(`Фоновый повтор: заявка #${lead.id} отправлена в Telegram.`);
      } catch (err) {
        console.error(`Фоновый повтор: заявка #${lead.id} — попытка не удалась —`, err.message);
      }
    }
  } catch (err) {
    console.error('Фоновый цикл повторов упал:', err.message);
  }
}

app.post('/api/leads', async (req, res) => {
  const { name, phone, project, callTime } = req.body || {};

  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ ok: false, error: 'Укажите имя и телефон.' });
  }

  let leadId;
  try {
    leadId = await appendLead({ name, phone, project, callTime, source: 'Сайт' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Не удалось сохранить заявку в базу данных:', err.message);
    return res.status(500).json({ ok: false, error: 'Не удалось сохранить заявку. Попробуйте ещё раз.' });
  }

  notifyTelegramGroup({ id: leadId, name, phone, project, callTime });
});

ensureSchema()
  .then(() => {
    backgroundRetryLoop();
    setInterval(backgroundRetryLoop, RETRY_INTERVAL_MS);
  })
  .catch((err) => console.error('Не удалось подготовить схему БД:', err.message));

app.listen(PORT, () => {
  console.log(`АПД Строй сайт запущен: http://localhost:${PORT}`);
});
