require('dotenv').config();
const express = require('express');
const path = require('path');
const { getPool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/livres', require('./routes/livres'));
app.use('/api/adherents', require('./routes/adherents'));
app.use('/api/emprunts', require('./routes/emprunts'));
app.use('/api/stats', require('./routes/stats'));

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
