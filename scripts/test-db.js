require('dotenv').config();
const sql = require('mssql');

const server = process.env.DB_SERVER || 'DESKTOP-QROBQA9\\SQLEXPRESS';
const database = process.env.DB_DATABASE || 'GestionBibliotheque';
const config = {
  server,
  database,
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
    encrypt: false,
  },
};

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
} else {
  config.options.trustedConnection = true;
}

(async () => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT @@SERVERNAME AS srv, DB_NAME() AS db');
    console.log('Connexion SQL Server OK', result.recordset[0]);
    await pool.close();
  } catch (err) {
    console.error('Échec de connexion SQL Server:', err.message || err);
    process.exit(1);
  }
})();
