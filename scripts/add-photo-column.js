require('dotenv').config();
const { getPool } = require('../config/db');

async function run() {
  const pool = await getPool();
  console.log('Checking Adherents table for Photo_Image column...');
  const check = await pool.request().query(`
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Adherents' AND COLUMN_NAME = 'Photo_Image'
  `);
  if (check.recordset.length === 0) {
    console.log('Adding Photo_Image VARBINARY(MAX) column to Adherents');
    await pool.request().query(`ALTER TABLE Adherents ADD Photo_Image VARBINARY(MAX) NULL;`);
    console.log('Column added.');
  } else {
    console.log('Photo_Image column already exists.');
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
