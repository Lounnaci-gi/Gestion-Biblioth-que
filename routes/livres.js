const express = require('express');
const { sql, getPool, handleDbError } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ID_Livre, Titre, ISBN, Auteur, Editeur, Annee_Publication,
             Quantite_Totale, Quantite_Disponible, Date_Creation, Date_Modification
      FROM Livres
      ORDER BY Titre
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Livres WHERE ID_Livre = @id');

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Livre introuvable' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.post('/', async (req, res) => {
  const { titre, isbn, auteur, editeur, annee_publication, quantite_totale } = req.body;

  if (!titre || !isbn || !auteur || !quantite_totale) {
    return res.status(400).json({ error: 'Titre, ISBN, auteur et quantité totale sont obligatoires' });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('Titre', sql.NVarChar(150), titre)
      .input('ISBN', sql.VarChar(20), isbn)
      .input('Auteur', sql.NVarChar(100), auteur)
      .input('Editeur', sql.NVarChar(100), editeur || null)
      .input('Annee', sql.Int, annee_publication || null)
      .input('Quantite', sql.Int, quantite_totale)
      .query(`
        INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible)
        OUTPUT INSERTED.*
        VALUES (@Titre, @ISBN, @Auteur, @Editeur, @Annee, @Quantite, @Quantite)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  const { titre, isbn, auteur, editeur, annee_publication, quantite_totale } = req.body;

  try {
    const pool = await getPool();
    const existing = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT Quantite_Totale, Quantite_Disponible FROM Livres WHERE ID_Livre = @id');

    if (!existing.recordset.length) {
      return res.status(404).json({ error: 'Livre introuvable' });
    }

    const row = existing.recordset[0];
    const empruntes = row.Quantite_Totale - row.Quantite_Disponible;
    const newTotal = quantite_totale ?? row.Quantite_Totale;

    if (newTotal < empruntes) {
      return res.status(400).json({
        error: `Impossible : ${empruntes} exemplaire(s) sont actuellement empruntés`,
      });
    }

    const newDispo = newTotal - empruntes;

    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('Titre', sql.NVarChar(150), titre)
      .input('ISBN', sql.VarChar(20), isbn)
      .input('Auteur', sql.NVarChar(100), auteur)
      .input('Editeur', sql.NVarChar(100), editeur || null)
      .input('Annee', sql.Int, annee_publication || null)
      .input('QuantiteTotale', sql.Int, newTotal)
      .input('QuantiteDispo', sql.Int, newDispo)
      .query(`
        UPDATE Livres
        SET Titre = @Titre, ISBN = @ISBN, Auteur = @Auteur, Editeur = @Editeur,
            Annee_Publication = @Annee, Quantite_Totale = @QuantiteTotale,
            Quantite_Disponible = @QuantiteDispo, Date_Modification = GETDATE()
        OUTPUT INSERTED.*
        WHERE ID_Livre = @id
      `);

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
      .query("SELECT COUNT(*) AS n FROM Emprunts WHERE ID_Livre = @id AND Statut = 'En cours'");

    if (emprunts.recordset[0].n > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer : des emprunts sont en cours' });
    }

    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Livres OUTPUT DELETED.ID_Livre WHERE ID_Livre = @id');

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Livre introuvable' });
    }
    res.json({ message: 'Livre supprimé' });
  } catch (err) {
    handleDbError(res, err);
  }
});

module.exports = router;
