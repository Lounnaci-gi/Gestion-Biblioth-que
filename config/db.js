require('dotenv').config();
const sql = require('mssql');

const server = process.env.DB_SERVER || 'DESKTOP-QROBQA9\\SQLEXPRESS';
const database = process.env.DB_DATABASE || 'GestionBibliotheque';
const trustCert = process.env.DB_TRUST_CERT !== 'false';

const config = {
  server,
  database,
  options: {
    trustServerCertificate: trustCert,
    encrypt: false,
  },
};

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
} else {
  config.options.trustedConnection = true;
}

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

function handleDbError(res, err) {
  const message = err.originalError?.message || err.message || 'Erreur base de données';
  console.error('[DB]', message);
  res.status(400).json({ error: message });
}

module.exports = { sql, getPool, handleDbError };
