const express = require('express');
const { sql, getPool, handleDbError } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT E.ID_Emplacement, E.Rang, E.Etage, E.ID_Categorie, C.Nom_Categorie
      FROM Emplacements E
      LEFT JOIN Categories C ON C.ID_Categorie = E.ID_Categorie
      ORDER BY C.Nom_Categorie, E.Etage, E.Rang
    `);
    res.json(result.recordset.map(r => ({
      ID_Emplacement: r.ID_Emplacement,
      Rang: r.Rang,
      Etage: r.Etage,
      ID_Categorie: r.ID_Categorie,
      Nom_Categorie: r.Nom_Categorie,
    })));
  } catch (err) {
    handleDbError(res, err);
  }
});

module.exports = router;
