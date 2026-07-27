const express = require('express');
const { sql, getPool, handleDbError } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT e.ID_Emprunt, e.Date_Emprunt, e.Date_Retour_Prévue, e.Date_Retour_Reelle, e.Statut,
             l.Titre AS Livre, l.ISBN,
             a.Nom AS AdherentNom, a.Prenom AS AdherentPrenom
      FROM Emprunts e
      INNER JOIN Livres l ON l.ID_Livre = e.ID_Livre
      INNER JOIN Adherents a ON a.ID_Adherent = e.ID_Adherent
      ORDER BY e.Date_Emprunt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.post('/', async (req, res) => {
  const { id_livre, id_adherent } = req.body;

  if (!id_livre || !id_adherent) {
    return res.status(400).json({ error: 'Livre et adhérent sont obligatoires' });
  }

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('ID_Livre', sql.Int, id_livre);
    request.input('ID_Adherent', sql.Int, id_adherent);
    request.output('Date_Retour_Prévue', sql.DateTime);

    const result = await request.execute('sp_EnregistrerEmprunt');
    const dateRetour = result.output['Date_Retour_Prévue'];

    res.status(201).json({
      message: 'Emprunt enregistré avec succès',
      date_retour_prevue: dateRetour,
    });
  } catch (err) {
    handleDbError(res, err);
  }
});

router.post('/:id/retour', async (req, res) => {
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const empruntResult = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT ID_Emprunt, ID_Livre, Statut
          FROM Emprunts
          WHERE ID_Emprunt = @id
        `);

      if (!empruntResult.recordset.length) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Emprunt introuvable' });
      }

      const emprunt = empruntResult.recordset[0];
      if (emprunt.Statut === 'Rendu') {
        await transaction.rollback();
        return res.status(400).json({ error: 'Ce livre a déjà été rendu' });
      }

      await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query(`
          UPDATE Emprunts
          SET Statut = 'Rendu', Date_Retour_Reelle = GETDATE()
          WHERE ID_Emprunt = @id
        `);

      await new sql.Request(transaction)
        .input('id_livre', sql.Int, emprunt.ID_Livre)
        .query(`
          UPDATE Livres
          SET Quantite_Disponible = Quantite_Disponible + 1,
              Date_Modification = GETDATE()
          WHERE ID_Livre = @id_livre
        `);

      await transaction.commit();
      res.json({ message: 'Retour enregistré avec succès' });
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    handleDbError(res, err);
  }
});

module.exports = router;
