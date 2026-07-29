const express = require('express');
const { sql, getPool, handleDbError } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ID_Adherent, Nom, Prenom, Adresse, Email, Telephone, Specialite, Classe_Section, Date_Adhesion, Statut, Numero_Carte, Code_QR, QRCode_Image, Photo_Image, Date_Modification
      FROM Adherents
      ORDER BY Nom, Prenom
    `);
    // Convert VARBINARY QRCode_Image to base64 data URL for the client
    const rows = result.recordset.map(r => {
      const out = { ...r };
      if (r.QRCode_Image && Buffer.isBuffer(r.QRCode_Image)) {
        out.QRCode_B64 = 'data:image/png;base64,' + r.QRCode_Image.toString('base64');
      } else {
        out.QRCode_B64 = null;
      }
      if (r.Photo_Image && Buffer.isBuffer(r.Photo_Image)) {
        out.Photo_B64 = 'data:image/png;base64,' + r.Photo_Image.toString('base64');
      } else {
        out.Photo_B64 = null;
      }
      delete out.QRCode_Image;
      delete out.Photo_Image;
      return out;
    });
    res.json(rows);
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
      WHERE Statut = N'نشط'
      ORDER BY Nom, Prenom
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  console.log('[ROUTE] GET /api/adherents/:id ->', req.params.id);
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ID_Adherent, Nom, Prenom, Adresse, Email, Telephone, Specialite, Classe_Section, Date_Adhesion, Statut, Numero_Carte, Code_QR, QRCode_Image, Photo_Image, Date_Modification
        FROM Adherents WHERE ID_Adherent = @id
      `);

    if (!result.recordset.length) return res.status(404).json({ error: 'Adhérent introuvable' });

    const r = result.recordset[0];
    const out = { ...r };
    out.QRCode_B64 = r.QRCode_Image && Buffer.isBuffer(r.QRCode_Image) ? 'data:image/png;base64,' + r.QRCode_Image.toString('base64') : null;
    out.Photo_B64 = r.Photo_Image && Buffer.isBuffer(r.Photo_Image) ? 'data:image/png;base64,' + r.Photo_Image.toString('base64') : null;
    delete out.QRCode_Image;
    delete out.Photo_Image;

    res.json(out);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.post('/', async (req, res) => {
  const { nom, prenom, email, telephone, statut, adresse, specialite, classe_section, date_adhesion, Photo_B64 } = req.body;

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
      .input('Statut', sql.NVarChar(20), statut || 'نشط')
      .input('Adresse', sql.NVarChar(200), adresse || null)
      .input('Specialite', sql.NVarChar(100), specialite || null)
      .input('Classe', sql.NVarChar(50), classe_section || null)
      .input('DateAdhesion', sql.Date, date_adhesion ? new Date(date_adhesion) : null)
      .input('Photo', sql.VarBinary(sql.MAX), Photo_B64 ? Buffer.from(Photo_B64.split(',')[1], 'base64') : null)
      .query(`
        INSERT INTO Adherents (Nom, Prenom, Email, Telephone, Statut, Adresse, Specialite, Classe_Section, Date_Adhesion, Photo_Image)
        OUTPUT INSERTED.*
        VALUES (@Nom, @Prenom, @Email, @Telephone, @Statut, @Adresse, @Specialite, @Classe, COALESCE(@DateAdhesion, CAST(GETDATE() AS DATE)), @Photo)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  const { nom, prenom, email, telephone, statut, adresse, specialite, classe_section, date_adhesion, Photo_B64 } = req.body;

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
      .input('Adresse', sql.NVarChar(200), adresse || null)
      .input('Specialite', sql.NVarChar(100), specialite || null)
      .input('Classe', sql.NVarChar(50), classe_section || null)
      .input('DateAdhesion', sql.Date, date_adhesion ? new Date(date_adhesion) : null)
      .input('Photo', sql.VarBinary(sql.MAX), Photo_B64 ? Buffer.from(Photo_B64.split(',')[1], 'base64') : null)
      .query(`
        UPDATE Adherents
        SET Nom = @Nom, Prenom = @Prenom, Email = @Email, Telephone = @Telephone,
            Statut = @Statut, Adresse = @Adresse, Specialite = @Specialite, Classe_Section = @Classe,
            Date_Adhesion = ISNULL(@DateAdhesion, Date_Adhesion), Photo_Image = COALESCE(@Photo, Photo_Image), Date_Modification = GETDATE()
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
      .query('SELECT COUNT(*) AS n FROM Emprunts WHERE ID_Adherent = @id');

    if (emprunts.recordset[0].n > 0) {
      return res.status(400).json({ error: "Impossible de supprimer : des emprunts existent (historique conservé)." });
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
