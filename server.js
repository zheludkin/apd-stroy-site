require('dotenv').config();
const path = require('path');
const express = require('express');
const { appendLead } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
    res.status(500).json({ ok: false, error: 'Не удалось сохранить заявку. Попробуйте ещё раз.' });
  }
});

app.listen(PORT, () => {
  console.log(`АПД Строй сайт запущен: http://localhost:${PORT}`);
});
