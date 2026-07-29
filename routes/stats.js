const express = require('express');
const { getPool, handleDbError } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Livres) AS total_livres,
        (SELECT ISNULL(SUM(Quantite_Totale), 0) FROM Livres) AS total_exemplaires,
        (SELECT ISNULL(SUM(Quantite_Disponible), 0) FROM Livres) AS exemplaires_disponibles,
        (SELECT COUNT(*) FROM Adherents WHERE Statut = N'نشط') AS adherents_actifs,
        (SELECT COUNT(*) FROM Emprunts WHERE Statut = N'قيد الإعارة') AS emprunts_en_cours,
        (SELECT COUNT(*) FROM Emprunts WHERE Statut = N'قيد الإعارة' AND Date_Retour_Prévue < GETDATE()) AS emprunts_en_retard
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

module.exports = router;
