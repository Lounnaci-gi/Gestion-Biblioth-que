require('dotenv').config();
const { getPool, sql } = require('../config/db');

const livres = [
  { titre: 'الأمير الصغير', isbn: '978-2070612758', auteur: 'أنتوان دو سانت إكزوبيري', editeur: 'Gallimard', annee: 1943, qte: 5, categorie: 'رواية' },
  { titre: 'ألف وتسعمائة وأربعة وثمانون', isbn: '978-2070368228', auteur: 'جورج أورويل', editeur: 'Gallimard', annee: 1949, qte: 3, categorie: 'رواية' },
  { titre: 'البؤساء', isbn: '978-2253082586', auteur: 'فيكتور هوغو', editeur: 'Le Livre de Poche', annee: 1862, qte: 4, categorie: 'رواية' },
  { titre: 'الغريب', isbn: '978-2070360024', auteur: 'ألبير كامو', editeur: 'Gallimard', annee: 1942, qte: 3, categorie: 'فلسفة' },
  { titre: 'هاري بوتر وحجر الفيلسوف', isbn: '978-2070584628', auteur: 'ج. ك. رولينج', editeur: 'Gallimard Jeunesse', annee: 1997, qte: 6, categorie: 'أطفال' },
];

const adherents = [
  { nom: 'بن علي', prenom: 'أحمد', email: 'ahmed.benaliexample@mail.test', tel: '0612345678' },
  { nom: 'الحداد', prenom: 'ليلى', email: 'laila.haddad@mail.test', tel: '0698765432' },
  { nom: 'المكي', prenom: 'يوسف', email: 'youssef.makki@mail.test', tel: '0655443322' },
];

async function seed() {
  const pool = await getPool();

  const count = await pool.request().query('SELECT COUNT(*) AS n FROM Livres');
  if (count.recordset[0].n > 0) {
    console.log('La base contient déjà des données — seed ignoré.');
    process.exit(0);
  }
    // Les données d'exemple doivent respecter les contraintes (texte en arabe)

  // Insérer les catégories et emplacements si nécessaires
  const uniqueCats = [...new Set(livres.map((l) => l.categorie).filter(Boolean))];
  const catMap = {};
  for (const c of uniqueCats) {
    const res = await pool.request().input('Nom', sql.NVarChar(100), c).query(`
      IF NOT EXISTS (SELECT 1 FROM Categories WHERE Nom_Categorie = @Nom)
      BEGIN
        INSERT INTO Categories (Nom_Categorie) VALUES (@Nom);
      END
      SELECT ID_Categorie FROM Categories WHERE Nom_Categorie = @Nom;
    `);
    catMap[c] = res.recordset[0].ID_Categorie;
  }

  // Créer un emplacement par catégorie si absent (Rang 'A', Etage 1)
  const emplacementMap = {};
  for (const c of uniqueCats) {
    const idCat = catMap[c];
    const res = await pool.request()
      .input('ID_Categorie', sql.Int, idCat)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Emplacements WHERE ID_Categorie = @ID_Categorie AND Rang = 'A' AND Etage = 1)
        BEGIN
          INSERT INTO Emplacements (Rang, Etage, ID_Categorie) VALUES ('A', 1, @ID_Categorie);
        END
        SELECT TOP 1 ID_Emplacement FROM Emplacements WHERE ID_Categorie = @ID_Categorie ORDER BY ID_Emplacement;
      `);
    emplacementMap[c] = res.recordset[0].ID_Emplacement;
  }

  for (const l of livres) {
    const idEmp = l.categorie ? emplacementMap[l.categorie] : null;
    await pool.request()
      .input('Titre', sql.NVarChar(150), l.titre)
      .input('ISBN', sql.VarChar(20), l.isbn)
      .input('Auteur', sql.NVarChar(100), l.auteur)
      .input('Editeur', sql.NVarChar(100), l.editeur || null)
      .input('Annee', sql.Int, l.annee || null)
      .input('Qte', sql.Int, l.qte)
      .input('ID_Emplacement', sql.Int, idEmp)
      .query(`INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
              VALUES (@Titre, @ISBN, @Auteur, @Editeur, @Annee, @Qte, @Qte, @ID_Emplacement)`);
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
