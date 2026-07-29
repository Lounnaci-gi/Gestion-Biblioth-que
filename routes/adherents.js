const express = require('express');
const QRCode = require('qrcode');
const { sql, getPool, handleDbError } = require('../config/db');

const router = express.Router();

function buildQrPayload(adherent) {
  const lines = [
    'بطاقة انخراط — المكتبة',
    '────────────────────',
    `الاسم: ${adherent.Prenom} ${adherent.Nom}`,
    `رقم البطاقة: ${adherent.Numero_Carte || '—'}`,
  ];

  if (adherent.Email) lines.push(`البريد: ${adherent.Email}`);
  if (adherent.Telephone) lines.push(`الهاتف: ${adherent.Telephone}`);
  if (adherent.Classe_Section) lines.push(`القسم: ${adherent.Classe_Section}`);
  if (adherent.Specialite) lines.push(`التخصص: ${adherent.Specialite}`);

  return lines.join('\n');
}

function photoMime(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp';
  return 'image/jpeg';
}

function toPhotoDataUrl(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return null;
  const mime = photoMime(buffer);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function decodePhotoInput(photoB64) {
  if (!photoB64 || typeof photoB64 !== 'string') return null;
  const base64 = photoB64.includes(',') ? photoB64.split(',')[1] : photoB64;
  return Buffer.from(base64, 'base64');
}

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ID_Adherent, Nom, Prenom, Adresse, Email, Telephone, Specialite, Classe_Section,
             Date_Adhesion, Statut, Numero_Carte, Code_QR, Date_Modification,
             CASE WHEN Photo_Image IS NOT NULL THEN 1 ELSE 0 END AS Has_Photo
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
      WHERE Statut = N'نشط'
      ORDER BY Nom, Prenom
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.get('/:id/qrcode', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ID_Adherent, Nom, Prenom, Email, Telephone, Specialite, Classe_Section, Numero_Carte, QRCode_Image
        FROM Adherents WHERE ID_Adherent = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Adhérent introuvable' });
    }

    const adherent = result.recordset[0];
    const stored = adherent.QRCode_Image;

    if (stored && Buffer.isBuffer(stored) && stored.length > 0) {
      res.set('Content-Type', photoMime(stored));
      res.set('Cache-Control', 'private, max-age=3600');
      return res.send(stored);
    }

    const png = await QRCode.toBuffer(buildQrPayload(adherent), {
      type: 'png',
      width: 180,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(png);
  } catch (err) {
    handleDbError(res, err);
  }
});

router.get('/:id/photo', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT Photo_Image FROM Adherents WHERE ID_Adherent = @id');

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Adhérent introuvable' });
    }

    const photo = result.recordset[0].Photo_Image;
    if (!photo || !Buffer.isBuffer(photo)) {
      return res.status(404).json({ error: 'Aucune photo disponible' });
    }

    res.set('Content-Type', photoMime(photo));
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(photo);
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
        SELECT ID_Adherent, Nom, Prenom, Adresse, Email, Telephone, Specialite, Classe_Section, Date_Adhesion, Statut, Numero_Carte, Code_QR, QRCode_Image, Photo_Image, Date_Modification
        FROM Adherents WHERE ID_Adherent = @id
      `);

    if (!result.recordset.length) return res.status(404).json({ error: 'Adhérent introuvable' });

    const r = result.recordset[0];
    const out = { ...r };
    out.QRCode_B64 = toPhotoDataUrl(r.QRCode_Image);
    out.Photo_B64 = toPhotoDataUrl(r.Photo_Image);
    out.Has_Photo = Boolean(r.Photo_Image);
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
      .input('Photo', sql.VarBinary(sql.MAX), decodePhotoInput(Photo_B64))
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
      .input('Photo', sql.VarBinary(sql.MAX), decodePhotoInput(Photo_B64))
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
