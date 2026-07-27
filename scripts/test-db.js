require('dotenv').config();
const sqlNative = require('msnodesqlv8');

const server = process.env.DB_SERVER || 'RECOUVREMENT\\SQLEXPRESS';
const db = process.env.DB_DATABASE || 'GestionBibliotheque';

const variants = [
  `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${db};Trusted_Connection=Yes;TrustServerCertificate=Yes;`,
  `Driver={ODBC Driver 18 for SQL Server};Server=${server};Database=${db};Trusted_Connection=Yes;Encrypt=Yes;TrustServerCertificate=Yes;`,
  `Driver={SQL Server};Server=${server};Database=${db};Trusted_Connection=Yes;`,
];

function query(cs) {
  return new Promise((resolve, reject) => {
    sqlNative.query(cs, 'SELECT @@SERVERNAME AS srv, DB_NAME() AS db', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

(async () => {
  for (const cs of variants) {
    const label = cs.match(/Driver=\{([^}]+)\}/)[1];
    try {
      const rows = await query(cs);
      console.log('OK with', label, rows);
      break;
    } catch (err) {
      console.log('FAIL with', label, ':', err.message || err);
    }
  }
})();
