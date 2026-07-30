const express = require('express');
const { sql, getPool, handleDbError } = require('../config/db');

const router = express.Router();

router.get('/categories', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ID_Categorie, Nom_Categorie
      FROM Categories
      ORDER BY Nom_Categorie
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT E.ID_Emplacement, E.Rang, E.Etage, E.ID_Categorie, C.Nom_Categorie,
             COUNT(L.ID_Livre) AS Nb_Livres
      FROM Emplacements E
      LEFT JOIN Categories C ON C.ID_Categorie = E.ID_Categorie
      LEFT JOIN Livres L ON L.ID_Emplacement = E.ID_Emplacement
      GROUP BY E.ID_Emplacement, E.Rang, E.Etage, E.ID_Categorie, C.Nom_Categorie
      ORDER BY C.Nom_Categorie, E.Etage, E.Rang
    `);
    res.json(result.recordset.map((r) => ({
      ID_Emplacement: r.ID_Emplacement,
      Rang: r.Rang,
      Etage: r.Etage,
      ID_Categorie: r.ID_Categorie,
      Nom_Categorie: r.Nom_Categorie,
      Nb_Livres: r.Nb_Livres,
    })));
  } catch (err) {
    handleDbError(res, err);
  }
});

router.post('/', async (req, res) => {
  const { rang, etage, id_categorie, nom_categorie } = req.body;
  const rangVal = String(rang || '').trim().toUpperCase();
  const etageVal = parseInt(etage, 10);

  if (!rangVal || !/^[A-Z]$/.test(rangVal)) {
    return res.status(400).json({ error: 'Rang invalide (une lettre A–Z requise)' });
  }
  if (!etageVal || etageVal < 1 || etageVal > 20) {
    return res.status(400).json({ error: 'Étage invalide (1 à 20)' });
  }

  try {
    const pool = await getPool();
    let categorieId = id_categorie ? parseInt(id_categorie, 10) : null;

    if (!categorieId && nom_categorie) {
      const catRes = await pool.request().input('Nom', sql.NVarChar(100), nom_categorie.trim()).query(`
        IF NOT EXISTS (SELECT 1 FROM Categories WHERE Nom_Categorie = @Nom)
        BEGIN
          INSERT INTO Categories (Nom_Categorie) VALUES (@Nom);
        END
        SELECT ID_Categorie FROM Categories WHERE Nom_Categorie = @Nom;
      `);
      categorieId = catRes.recordset[0].ID_Categorie;
    }

    if (!categorieId) {
      return res.status(400).json({ error: 'Catégorie obligatoire' });
    }

    const existing = await pool
      .request()
      .input('Rang', sql.Char(1), rangVal)
      .input('Etage', sql.TinyInt, etageVal)
      .input('ID_Categorie', sql.Int, categorieId)
      .query(`
        SELECT ID_Emplacement FROM Emplacements
        WHERE Rang = @Rang AND Etage = @Etage AND ID_Categorie = @ID_Categorie
      `);

    if (existing.recordset.length) {
      return res.status(400).json({ error: 'Cet emplacement existe déjà pour cette catégorie' });
    }

    const result = await pool
      .request()
      .input('Rang', sql.Char(1), rangVal)
      .input('Etage', sql.TinyInt, etageVal)
      .input('ID_Categorie', sql.Int, categorieId)
      .query(`
        INSERT INTO Emplacements (Rang, Etage, ID_Categorie)
        OUTPUT INSERTED.*
        VALUES (@Rang, @Etage, @ID_Categorie)
      `);

    const row = result.recordset[0];
    const catName = await pool
      .request()
      .input('id', sql.Int, categorieId)
      .query('SELECT Nom_Categorie FROM Categories WHERE ID_Categorie = @id');

    res.status(201).json({
      ...row,
      Nom_Categorie: catName.recordset[0]?.Nom_Categorie,
      Nb_Livres: 0,
    });
  } catch (err) {
    handleDbError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(req.params.id, 10);

    const livres = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) AS n FROM Livres WHERE ID_Emplacement = @id');

    if (livres.recordset[0].n > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer : des livres sont rattachés à cet emplacement',
      });
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Emplacements OUTPUT DELETED.ID_Emplacement WHERE ID_Emplacement = @id');

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Emplacement introuvable' });
    }

    res.json({ message: 'Emplacement supprimé' });
  } catch (err) {
    handleDbError(res, err);
  }
});

module.exports = router;
