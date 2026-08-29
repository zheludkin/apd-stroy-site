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

module.exports = { appendLead, getPool, ensureSchema, getLeadsPendingMetrikaUpload, markMetrikaUploaded };
