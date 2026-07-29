require('dotenv').config();
const sqlPackage = require('mssql');

const server = process.env.DB_SERVER || 'DESKTOP-QROBQA9\\SQLEXPRESS';
const database = process.env.DB_DATABASE || 'GestionBibliotheque';
const trustCert = process.env.DB_TRUST_CERT !== 'false';
const dbUser = process.env.DB_USER?.trim();
const dbPassword = process.env.DB_PASSWORD?.trim();
const useWindowsAuth = !dbUser && !dbPassword;

const sql = useWindowsAuth ? require('mssql/msnodesqlv8') : sqlPackage;
const driverName = process.env.DB_DRIVER?.trim() || 'ODBC Driver 17 for SQL Server';

const config = useWindowsAuth
  ? {
      driver: 'msnodesqlv8',
      server,
      database,
      connectionString: `Driver=${driverName};Server=${server};Database=${database};Trusted_Connection=Yes;Encrypt=No;TrustServerCertificate=${trustCert ? 'Yes' : 'No'};`,
      options: {
        trustServerCertificate: trustCert,
        encrypt: false,
        trustedConnection: true,
      },
    }
  : {
      server,
      database,
      user: dbUser,
      password: dbPassword,
      options: {
        trustServerCertificate: trustCert,
        encrypt: false,
      },
    };

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

async function ensurePhotoColumn() {
  const pool = await getPool();
  const result = await pool
    .request()
    .query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Adherents' AND COLUMN_NAME='Photo_Image'");
  if (result.recordset.length === 0) {
    await pool.request().query('ALTER TABLE Adherents ADD Photo_Image VARBINARY(MAX) NULL');
    console.log('Added missing Adherents.Photo_Image column');
  }
}

function handleDbError(res, err) {
  const message = err.originalError?.message || err.message || 'Erreur base de données';
  console.error('[DB]', message);
  if (message.includes('JSON')) {
    return res.status(400).json({ error: 'JSON invalide ou trop volumineux' });
  }
  res.status(400).json({ error: message });
}

module.exports = { sql, getPool, ensurePhotoColumn, handleDbError };
