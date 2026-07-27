require('dotenv').config();
const { getPool } = require('../config/db');

async function migrate() {
  const pool = await getPool();
  
  console.log('Running migration...');
  
  // Check if Categorie column exists in Livres table
  const checkColumn = await pool.request().query(`
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Livres' AND COLUMN_NAME = 'Categorie'
  `);
  
  if (checkColumn.recordset.length === 0) {
    console.log("Adding 'Categorie' column to 'Livres' table...");
    await pool.request().query(`
      ALTER TABLE Livres ADD Categorie NVARCHAR(100);
    `);
    console.log("Column 'Categorie' added successfully.");
  } else {
    console.log("Column 'Categorie' already exists.");
  }
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
