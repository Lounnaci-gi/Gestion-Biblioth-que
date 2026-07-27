require('dotenv').config();
const { getPool, sql } = require('../config/db');

const livres = [
  { titre: 'Le Petit Prince', isbn: '978-2070612758', auteur: 'Antoine de Saint-Exupéry', editeur: 'Gallimard', annee: 1943, qte: 5, categorie: 'رواية' },
  { titre: '1984', isbn: '978-2070368228', auteur: 'George Orwell', editeur: 'Gallimard', annee: 1949, qte: 3, categorie: 'رواية' },
  { titre: 'Les Misérables', isbn: '978-2253082586', auteur: 'Victor Hugo', editeur: 'Le Livre de Poche', annee: 1862, qte: 4, categorie: 'رواية' },
  { titre: 'L\'Étranger', isbn: '978-2070360024', auteur: 'Albert Camus', editeur: 'Gallimard', annee: 1942, qte: 3, categorie: 'فلسفة' },
  { titre: 'Harry Potter à l\'école des sorciers', isbn: '978-2070584628', auteur: 'J.K. Rowling', editeur: 'Gallimard Jeunesse', annee: 1997, qte: 6, categorie: 'أطفال' },
];

const adherents = [
  { nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@email.fr', tel: '0612345678' },
  { nom: 'Bernard', prenom: 'Lucas', email: 'lucas.bernard@email.fr', tel: '0698765432' },
  { nom: 'Dubois', prenom: 'Emma', email: 'emma.dubois@email.fr', tel: '0655443322' },
];

async function seed() {
  const pool = await getPool();

  const count = await pool.request().query('SELECT COUNT(*) AS n FROM Livres');
  if (count.recordset[0].n > 0) {
    console.log('La base contient déjà des données — seed ignoré.');
    process.exit(0);
  }

  for (const l of livres) {
    await pool.request()
      .input('Titre', sql.NVarChar(150), l.titre)
      .input('ISBN', sql.VarChar(20), l.isbn)
      .input('Auteur', sql.NVarChar(100), l.auteur)
      .input('Editeur', sql.NVarChar(100), l.editeur || null)
      .input('Annee', sql.Int, l.annee || null)
      .input('Qte', sql.Int, l.qte)
      .input('Categorie', sql.NVarChar(100), l.categorie || null)
      .query(`INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, Categorie)
              VALUES (@Titre, @ISBN, @Auteur, @Editeur, @Annee, @Qte, @Qte, @Categorie)`);
  }

  for (const a of adherents) {
    await pool.request()
      .input('Nom', sql.NVarChar(50), a.nom)
      .input('Prenom', sql.NVarChar(50), a.prenom)
      .input('Email', sql.VarChar(100), a.email)
      .input('Tel', sql.VarChar(20), a.tel)
      .query(`INSERT INTO Adherents (Nom, Prenom, Email, Telephone) VALUES (@Nom, @Prenom, @Email, @Tel)`);
  }

  console.log(`Seed terminé : ${livres.length} livres, ${adherents.length} adhérents.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
