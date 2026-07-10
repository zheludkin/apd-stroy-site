require('dotenv').config();
const path = require('path');
const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const HEADERS = ['Дата', 'Источник', 'Имя', 'Телефон', 'Проект', 'Время звонка'];
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let leadsSheetPromise = null;

function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error(
      'Не заданы GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY — заполните .env (см. .env.example).'
    );
  }

  return new JWT({ email, key, scopes: SCOPES });
}

async function loadLeadsSheet() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('Не задан GOOGLE_SHEET_ID — заполните .env (см. .env.example).');
  }

  const doc = new GoogleSpreadsheet(sheetId, getServiceAccountAuth());
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  try {
    await sheet.loadHeaderRow();
  } catch {
    await sheet.setHeaderRow(HEADERS);
  }

  return sheet;
}

function getLeadsSheet() {
  if (!leadsSheetPromise) {
    leadsSheetPromise = loadLeadsSheet().catch((err) => {
      leadsSheetPromise = null;
      throw err;
    });
  }
  return leadsSheetPromise;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/leads', async (req, res) => {
  const { name, phone, project, callTime } = req.body || {};

  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ ok: false, error: 'Укажите имя и телефон.' });
  }

  const date = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  try {
    const sheet = await getLeadsSheet();
    await sheet.addRow(
      {
        'Дата': date,
        'Источник': 'Сайт',
        'Имя': name.trim(),
        'Телефон': phone.trim(),
        'Проект': project ? project.trim() : '',
        'Время звонка': callTime ? callTime.trim() : '',
      },
      { raw: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Не удалось сохранить заявку в Google Таблицу:', err.message);
    res.status(500).json({ ok: false, error: 'Не удалось сохранить заявку. Попробуйте ещё раз.' });
  }
});

app.listen(PORT, () => {
  console.log(`АПД Строй сайт запущен: http://localhost:${PORT}`);
});
