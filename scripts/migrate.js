require('dotenv').config();
const { getPool, sql } = require('../config/db');

async function migrate() {
  const pool = await getPool();
  
  console.log('Running migration...');
  
  // Check if Categorie column exists in Livres table
  const checkIdEmp = await pool.request().query(`
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Livres' AND COLUMN_NAME = 'ID_Emplacement'
  `);

  if (checkIdEmp.recordset.length === 0) {
    console.log("Colonne 'ID_Emplacement' manquante — tentative de migration depuis 'Categorie'...");

    // If Categorie exists, create Categories/Emplacements and migrate
    const checkCategorie = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Livres' AND COLUMN_NAME = 'Categorie'
    `);

    if (checkCategorie.recordset.length > 0) {
      console.log("Migration: création de Categories/Emplacements depuis les valeurs existantes de 'Categorie'");
      // Add ID_Emplacement column nullable
      await pool.request().query(`ALTER TABLE Livres ADD ID_Emplacement INT NULL;`);

      // For each distinct categorie, create Category + Emplacement, then update Livres
      const cats = await pool.request().query(`SELECT DISTINCT Categorie FROM Livres WHERE Categorie IS NOT NULL`);
      for (const row of cats.recordset) {
        const nom = row.Categorie;
        const resCat = await pool.request().input('Nom', sql.NVarChar(100), nom).query(`
          IF NOT EXISTS (SELECT 1 FROM Categories WHERE Nom_Categorie = @Nom)
            INSERT INTO Categories (Nom_Categorie) VALUES (@Nom);
          SELECT ID_Categorie FROM Categories WHERE Nom_Categorie = @Nom;
        `);
        const idCat = resCat.recordset[0].ID_Categorie;
        const resEmp = await pool.request().input('ID_Categorie', sql.Int, idCat).query(`
          IF NOT EXISTS (SELECT 1 FROM Emplacements WHERE ID_Categorie = @ID_Categorie AND Rang = 'A' AND Etage = 1)
            INSERT INTO Emplacements (Rang, Etage, ID_Categorie) VALUES ('A', 1, @ID_Categorie);
          SELECT TOP 1 ID_Emplacement FROM Emplacements WHERE ID_Categorie = @ID_Categorie ORDER BY ID_Emplacement;
        `);
        const idEmp = resEmp.recordset[0].ID_Emplacement;
        await pool.request().input('Nom', sql.NVarChar(100), nom).input('ID_Emplacement', sql.Int, idEmp).query(`
          UPDATE Livres SET ID_Emplacement = @ID_Emplacement WHERE Categorie = @Nom;
        `);
      }

      // Optionally drop old Categorie column
      console.log("Migration terminée — supprimer manuellement la colonne 'Categorie' si désiré.");
    } else {
      console.log("Aucune colonne 'Categorie' détectée — ajout simple de 'ID_Emplacement' (nullable).");
      await pool.request().query(`ALTER TABLE Livres ADD ID_Emplacement INT NULL;`);
    }
  } else {
    console.log("Colonne 'ID_Emplacement' déjà présente.");
  }
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
