require('dotenv').config();
const express = require('express');
const path = require('path');
const { getPool, ensurePhotoColumn } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/livres', require('./routes/livres'));
app.use('/api/adherents', require('./routes/adherents'));
app.use('/api/emprunts', require('./routes/emprunts'));
app.use('/api/emplacements', require('./routes/emplacements'));
app.use('/api/stats', require('./routes/stats'));

app.get('/api/settings', (_req, res) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'data', 'settings.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Impossible de charger les paramètres' });
  }
});

app.put('/api/settings', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'data', 'settings.json');
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Données invalides' });
    }
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de sauvegarder les paramètres' });
  }
});

app.use((err, _req, res, _next) => {
  if (err && err.status === 400 && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }
  res.status(500).json({ error: 'Erreur serveur' });
});

app.get('/api/health', async (_req, res) => {
  try {
    await getPool();
    res.json({ status: 'ok', database: process.env.DB_DATABASE });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  try {
    await getPool();
    await ensurePhotoColumn();
    console.log('Connexion SQL Server établie');
  } catch (err) {
    const msg = err.originalError?.message || err.message || String(err);
    console.error('Impossible de se connecter à SQL Server:', msg);
    console.error('Vérifiez .env et que la base GestionBibliotheque existe (biblio.sql)');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Bibliothèque → http://localhost:${PORT}`);
  });
}

start();
