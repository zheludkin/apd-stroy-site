require('dotenv').config();
const path = require('path');
const express = require('express');
const { appendLead } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function notifyTelegramGroup({ name, phone, project, callTime }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!token || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN/TELEGRAM_GROUP_CHAT_ID не заданы — заявка с сайта не отправлена в группу.');
    return;
  }

  const text =
    `🆕 Новая заявка (Сайт)\n` +
    `Имя: ${name}\n` +
    `Телефон: ${phone}\n` +
    `Проект: ${project || '—'}\n` +
    `Удобное время звонка: ${callTime || '—'}`;

  const attempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
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
      return;
    } catch (err) {
      lastError = err;
      console.error(`Попытка ${attempt}/${attempts} отправки в Telegram не удалась:`, err.message);
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  throw lastError;
}

app.post('/api/leads', async (req, res) => {
  const { name, phone, project, callTime } = req.body || {};

  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ ok: false, error: 'Укажите имя и телефон.' });
  }

  try {
    await appendLead({ name, phone, project, callTime, source: 'Сайт' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Не удалось сохранить заявку в базу данных:', err.message);
    return res.status(500).json({ ok: false, error: 'Не удалось сохранить заявку. Попробуйте ещё раз.' });
  }

  notifyTelegramGroup({ name, phone, project, callTime }).catch((err) => {
    console.error('Не удалось отправить заявку с сайта в группу:', err.message);
  });
});

app.listen(PORT, () => {
  console.log(`АПД Строй сайт запущен: http://localhost:${PORT}`);
});
