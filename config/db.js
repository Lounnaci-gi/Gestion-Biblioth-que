require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

const driver = process.env.DB_DRIVER || 'ODBC Driver 17 for SQL Server';
const server = process.env.DB_SERVER || 'RECOUVREMENT\\SQLEXPRESS';
const database = process.env.DB_DATABASE || 'GestionBibliotheque';
const trustCert = process.env.DB_TRUST_CERT !== 'false' ? 'Yes' : 'No';

const connectionString = process.env.DB_USER && process.env.DB_PASSWORD
  ? `Driver={${driver}};Server=${server};Database=${database};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};TrustServerCertificate=${trustCert};`
  : `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=${trustCert};`;

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect({ connectionString });
  }
  return pool;
}

function handleDbError(res, err) {
  const message = err.originalError?.message || err.message || 'Erreur base de données';
  console.error('[DB]', message);
  res.status(400).json({ error: message });
}

module.exports = { sql, getPool, handleDbError };
