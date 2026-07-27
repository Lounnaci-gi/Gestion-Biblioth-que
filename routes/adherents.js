const express = require('express');
const { sql, getPool, handleDbError } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ID_Adherent, Nom, Prenom, Email, Telephone, Date_Adhesion, Statut, Date_Modification
      FROM Adherents
      ORDER BY Nom, Prenom
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.get('/actifs', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ID_Adherent, Nom, Prenom, Email
      FROM Adherents
      WHERE Statut = 'Actif'
      ORDER BY Nom, Prenom
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.post('/', async (req, res) => {
  const { nom, prenom, email, telephone, statut } = req.body;

  if (!nom || !prenom || !email) {
    return res.status(400).json({ error: 'Nom, prénom et email sont obligatoires' });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('Nom', sql.NVarChar(50), nom)
      .input('Prenom', sql.NVarChar(50), prenom)
      .input('Email', sql.VarChar(100), email)
      .input('Telephone', sql.VarChar(20), telephone || null)
      .input('Statut', sql.NVarChar(20), statut || 'Actif')
      .query(`
        INSERT INTO Adherents (Nom, Prenom, Email, Telephone, Statut)
        OUTPUT INSERTED.*
        VALUES (@Nom, @Prenom, @Email, @Telephone, @Statut)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  const { nom, prenom, email, telephone, statut } = req.body;

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('Nom', sql.NVarChar(50), nom)
      .input('Prenom', sql.NVarChar(50), prenom)
      .input('Email', sql.VarChar(100), email)
      .input('Telephone', sql.VarChar(20), telephone || null)
      .input('Statut', sql.NVarChar(20), statut)
      .query(`
        UPDATE Adherents
        SET Nom = @Nom, Prenom = @Prenom, Email = @Email, Telephone = @Telephone,
            Statut = @Statut, Date_Modification = GETDATE()
        OUTPUT INSERTED.*
        WHERE ID_Adherent = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Adhérent introuvable' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const emprunts = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query("SELECT COUNT(*) AS n FROM Emprunts WHERE ID_Adherent = @id AND Statut = 'En cours'");

    if (emprunts.recordset[0].n > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer : des emprunts sont en cours' });
    }

    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Adherents OUTPUT DELETED.ID_Adherent WHERE ID_Adherent = @id');

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Adhérent introuvable' });
    }
    res.json({ message: 'Adhérent supprimé' });
  } catch (err) {
    handleDbError(res, err);
  }
});

module.exports = router;
