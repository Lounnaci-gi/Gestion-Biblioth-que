const express = require('express');
const { sql, getPool, handleDbError } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT L.ID_Livre, L.Titre, L.ISBN, L.Auteur, L.Editeur, L.Annee_Publication,
             L.Quantite_Totale, L.Quantite_Disponible, L.Date_Creation, L.Date_Modification,
             E.Rang, E.Etage, C.Nom_Categorie AS Categorie
      FROM Livres L
      LEFT JOIN Emplacements E ON E.ID_Emplacement = L.ID_Emplacement
      LEFT JOIN Categories C ON C.ID_Categorie = E.ID_Categorie
      ORDER BY C.Nom_Categorie, L.Titre
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
      .query(`
        SELECT L.ID_Livre, L.Titre, L.ISBN, L.Auteur, L.Editeur, L.Annee_Publication,
               L.Quantite_Totale, L.Quantite_Disponible, L.ID_Emplacement,
               L.Date_Creation, L.Date_Modification,
               E.Rang, E.Etage, C.Nom_Categorie AS Categorie
        FROM Livres L
        LEFT JOIN Emplacements E ON E.ID_Emplacement = L.ID_Emplacement
        LEFT JOIN Categories C ON C.ID_Categorie = E.ID_Categorie
        WHERE L.ID_Livre = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Livre introuvable' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.post('/', async (req, res) => {
  const { titre, isbn, auteur, editeur, annee_publication, quantite_totale, id_emplacement, categorie } = req.body;

  if (!titre || !isbn || !auteur || !quantite_totale) {
    return res.status(400).json({ error: 'Titre, ISBN, auteur et quantité totale sont obligatoires' });
  }

  try {
    const pool = await getPool();
    // Si l'appelant a envoyé une 'categorie' textuelle, trouver/créer Category+Emplacement
    let emplacementId = id_emplacement ? parseInt(id_emplacement, 10) : null;
    if (!emplacementId && categorie) {
      const catRes = await pool.request().input('Nom', sql.NVarChar(100), categorie).query(`
        IF NOT EXISTS (SELECT 1 FROM Categories WHERE Nom_Categorie = @Nom)
        BEGIN
          INSERT INTO Categories (Nom_Categorie) VALUES (@Nom);
        END
        SELECT ID_Categorie FROM Categories WHERE Nom_Categorie = @Nom;
      `);
      const idCat = catRes.recordset[0].ID_Categorie;
      const empRes = await pool.request().input('ID_Categorie', sql.Int, idCat).query(`
        IF NOT EXISTS (SELECT 1 FROM Emplacements WHERE ID_Categorie = @ID_Categorie AND Rang = 'A' AND Etage = 1)
        BEGIN
          INSERT INTO Emplacements (Rang, Etage, ID_Categorie) VALUES ('A', 1, @ID_Categorie);
        END
        SELECT TOP 1 ID_Emplacement FROM Emplacements WHERE ID_Categorie = @ID_Categorie ORDER BY ID_Emplacement;
      `);
      emplacementId = empRes.recordset[0].ID_Emplacement;
    }

    if (!emplacementId) {
      return res.status(400).json({
        error: 'Un emplacement ou une catégorie est obligatoire pour enregistrer un livre',
      });
    }

    const result = await pool
      .request()
      .input('Titre', sql.NVarChar(150), titre)
      .input('ISBN', sql.VarChar(20), isbn)
      .input('Auteur', sql.NVarChar(100), auteur)
      .input('Editeur', sql.NVarChar(100), editeur || null)
      .input('Annee', sql.Int, annee_publication || null)
      .input('Quantite', sql.Int, quantite_totale)
      .input('ID_Emplacement', sql.Int, emplacementId || null)
      .query(`
        INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
        OUTPUT INSERTED.*
        VALUES (@Titre, @ISBN, @Auteur, @Editeur, @Annee, @Quantite, @Quantite, @ID_Emplacement)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  const { titre, isbn, auteur, editeur, annee_publication, quantite_totale, id_emplacement, categorie } = req.body;

  try {
    const pool = await getPool();
    let emplacementId = id_emplacement ? parseInt(id_emplacement, 10) : null;
    if (!emplacementId && categorie) {
      const catRes = await pool.request().input('Nom', sql.NVarChar(100), categorie).query(`
        IF NOT EXISTS (SELECT 1 FROM Categories WHERE Nom_Categorie = @Nom)
        BEGIN
          INSERT INTO Categories (Nom_Categorie) VALUES (@Nom);
        END
        SELECT ID_Categorie FROM Categories WHERE Nom_Categorie = @Nom;
      `);
      const idCat = catRes.recordset[0].ID_Categorie;
      const empRes = await pool.request().input('ID_Categorie', sql.Int, idCat).query(`
        IF NOT EXISTS (SELECT 1 FROM Emplacements WHERE ID_Categorie = @ID_Categorie AND Rang = 'A' AND Etage = 1)
        BEGIN
          INSERT INTO Emplacements (Rang, Etage, ID_Categorie) VALUES ('A', 1, @ID_Categorie);
        END
        SELECT TOP 1 ID_Emplacement FROM Emplacements WHERE ID_Categorie = @ID_Categorie ORDER BY ID_Emplacement;
      `);
      emplacementId = empRes.recordset[0].ID_Emplacement;
    }

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

    // Construire la requête UPDATE dynamiquement pour ne pas écrire ID_Emplacement NULL
    const reqBuilder = pool.request().input('id', sql.Int, req.params.id)
      .input('Titre', sql.NVarChar(150), titre)
      .input('ISBN', sql.VarChar(20), isbn)
      .input('Auteur', sql.NVarChar(100), auteur)
      .input('Editeur', sql.NVarChar(100), editeur || null)
      .input('Annee', sql.Int, annee_publication || null)
      .input('QuantiteTotale', sql.Int, newTotal)
      .input('QuantiteDispo', sql.Int, newDispo);

    let setClauses = `Titre = @Titre, ISBN = @ISBN, Auteur = @Auteur, Editeur = @Editeur,
            Annee_Publication = @Annee, Quantite_Totale = @QuantiteTotale,
            Quantite_Disponible = @QuantiteDispo`;

    if (emplacementId !== null && emplacementId !== undefined) {
      reqBuilder.input('ID_Emplacement', sql.Int, emplacementId);
      setClauses += `, ID_Emplacement = @ID_Emplacement`;
    }

    setClauses += `, Date_Modification = GETDATE()`;

    const result = await reqBuilder.query(`
      UPDATE Livres
      SET ${setClauses}
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
      .query('SELECT COUNT(*) AS n FROM Emprunts WHERE ID_Livre = @id');

    if (emprunts.recordset[0].n > 0) {
      return res.status(400).json({ error: "Impossible de supprimer : des emprunts existent (historique conservé)." });
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
