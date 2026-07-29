require('dotenv').config();
const { getPool, sql } = require('../config/db');

async function cleanup() {
  const pool = await getPool();
  console.log('Recherche des enregistrements de test...');

  const adhRes = await pool.request().input('e1', sql.VarChar(200), 'test.user@example.com').input('e2', sql.VarChar(200), 'test.up@example.com').query(`
    SELECT ID_Adherent FROM Adherents WHERE Email IN (@e1, @e2)
  `);
  const adIds = adhRes.recordset.map(r => r.ID_Adherent);

  const livreRes = await pool.request().input('isbn', sql.VarChar(100), 'ISBN-TEST-001').query(`
    SELECT ID_Livre FROM Livres WHERE ISBN = @isbn
  `);
  const livreIds = livreRes.recordset.map(r => r.ID_Livre);

  if (!adIds.length && !livreIds.length) {
    console.log('Aucun enregistrement de test trouvé.');
    process.exit(0);
  }

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    if (livreIds.length) {
      await new sql.Request(transaction)
        .input('ids', sql.VarChar, livreIds.join(','))
        .query(`DELETE FROM Emprunts WHERE ID_Livre IN (${livreIds.join(',')})`);
      await new sql.Request(transaction)
        .input('ids', sql.VarChar, livreIds.join(','))
        .query(`DELETE FROM Livres WHERE ID_Livre IN (${livreIds.join(',')})`);
      console.log(`Livres supprimés: ${livreIds.join(',')}`);
    }

    if (adIds.length) {
      await new sql.Request(transaction)
        .input('ids', sql.VarChar, adIds.join(','))
        .query(`DELETE FROM Emprunts WHERE ID_Adherent IN (${adIds.join(',')})`);
      await new sql.Request(transaction)
        .input('ids', sql.VarChar, adIds.join(','))
        .query(`DELETE FROM Adherents WHERE ID_Adherent IN (${adIds.join(',')})`);
      console.log(`Adhérents supprimés: ${adIds.join(',')}`);
    }

    await transaction.commit();
    console.log('Nettoyage terminé.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur pendant le nettoyage:', err.message || err);
    try { if (transaction && transaction.rollback) await transaction.rollback(); } catch (e) {}
    process.exit(1);
  }
}

cleanup();
