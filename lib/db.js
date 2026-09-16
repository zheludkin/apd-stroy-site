const { Pool } = require('pg');

let pool = null;
let schemaReady = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Не задан DATABASE_URL в .env');
    }
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 8000,
      statement_timeout: 8000,
      query_timeout: 8000,
    });
  }
  return pool;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(
        `
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        source TEXT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        project TEXT,
        call_time TEXT
      )
    `
      )
      .then(() =>
        getPool().query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS notify_attempts INT NOT NULL DEFAULT 0
    `)
      )
      .then(() =>
        getPool().query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS yclid TEXT,
        ADD COLUMN IF NOT EXISTS metrika_uploaded_at TIMESTAMPTZ
    `)
      )
      .then(() =>
        getPool().query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS email_attempts INT NOT NULL DEFAULT 0
    `)
      )
      .then(() =>
        getPool().query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS max_notified_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS max_notify_attempts INT NOT NULL DEFAULT 0
    `)
      )
      .then(() =>
        getPool().query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        visitor_id TEXT NOT NULL,
        direction TEXT NOT NULL,
        text TEXT NOT NULL,
        telegram_message_id BIGINT
      )
    `)
      )
      .then(() =>
        getPool().query(`
      CREATE INDEX IF NOT EXISTS chat_messages_visitor_idx ON chat_messages (visitor_id, id)
    `)
      )
      .then(() =>
        getPool().query(`
      CREATE INDEX IF NOT EXISTS chat_messages_tg_idx ON chat_messages (telegram_message_id)
    `)
      )
      .then(() =>
        getPool().query(`
      CREATE TABLE IF NOT EXISTS bot_state (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)
      );
  }
  return schemaReady;
}

async function appendLead({ name, phone, project, callTime, source, yclid }) {
  await ensureSchema();
  const { rows } = await getPool().query(
    `INSERT INTO leads (source, name, phone, project, call_time, yclid) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      source || 'Сайт',
      name.trim(),
      phone.trim(),
      project ? project.trim() : '',
      callTime ? callTime.trim() : '',
      yclid ? String(yclid).trim() : null,
    ]
  );
  return rows[0].id;
}

async function getLeadsPendingMetrikaUpload() {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT id, yclid, created_at FROM leads WHERE yclid IS NOT NULL AND yclid <> '' AND metrika_uploaded_at IS NULL ORDER BY id ASC LIMIT 500`
  );
  return rows;
}

async function markMetrikaUploaded(ids) {
  if (!ids.length) return;
  await getPool().query(`UPDATE leads SET metrika_uploaded_at = now() WHERE id = ANY($1::int[])`, [ids]);
}

async function insertChatMessage({ visitorId, direction, text }) {
  await ensureSchema();
  const { rows } = await getPool().query(
    `INSERT INTO chat_messages (visitor_id, direction, text) VALUES ($1, $2, $3) RETURNING id, created_at`,
    [visitorId, direction, text]
  );
  return rows[0];
}

async function setChatMessageTelegramId(id, telegramMessageId) {
  await getPool().query(`UPDATE chat_messages SET telegram_message_id = $1 WHERE id = $2`, [telegramMessageId, id]);
}

async function getChatMessagesSince(visitorId, sinceId) {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT id, direction, text, created_at FROM chat_messages WHERE visitor_id = $1 AND id > $2 ORDER BY id ASC`,
    [visitorId, sinceId || 0]
  );
  return rows;
}

async function findVisitorByTelegramMessageId(telegramMessageId) {
  const { rows } = await getPool().query(`SELECT visitor_id FROM chat_messages WHERE telegram_message_id = $1 LIMIT 1`, [
    telegramMessageId,
  ]);
  return rows[0] ? rows[0].visitor_id : null;
}

// MAX не отдаёт в апдейтах, на какое сообщение отвечает менеджер (нет reply/link
// в message_created, проверено вживую 16.09.2026) — поэтому вместо тегов/threading
// ответ менеджера в MAX-диалоге маршрутизируется последнему написавшему посетителю
// (по решению пользователя: "по принципу последнего написавшего").
async function getLastActiveVisitorId() {
  const { rows } = await getPool().query(
    `SELECT visitor_id FROM chat_messages WHERE direction = 'visitor' ORDER BY id DESC LIMIT 1`
  );
  return rows[0] ? rows[0].visitor_id : null;
}

async function getBotState(key) {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT value FROM bot_state WHERE key = $1`, [key]);
  return rows[0] ? rows[0].value : null;
}

async function setBotState(key, value) {
  await getPool().query(
    `INSERT INTO bot_state (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value]
  );
}

module.exports = {
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
};
