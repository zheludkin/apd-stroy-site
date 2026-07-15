const { Pool } = require('pg');

let pool = null;
let schemaReady = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Не задан DATABASE_URL в .env');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        source TEXT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        project TEXT,
        call_time TEXT
      )
    `);
  }
  return schemaReady;
}

async function appendLead({ name, phone, project, callTime, source }) {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO leads (source, name, phone, project, call_time) VALUES ($1, $2, $3, $4, $5)`,
    [
      source || 'Сайт',
      name.trim(),
      phone.trim(),
      project ? project.trim() : '',
      callTime ? callTime.trim() : '',
    ]
  );
}

module.exports = { appendLead };
