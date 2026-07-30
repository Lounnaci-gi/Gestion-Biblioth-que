use master
-- ============================================================================
-- SCRIPT : Création et Optimisation de la Base de Données "GestionBibliotheque"
-- Cible  : SQL Server (Optimisé pour un accès natif via Delphi FireDAC)
-- v5     : Rangement (Rang/Étage/Catégorie) + Carte d'adhérent (QR Code)
--          + Contrainte : les données textuelles doivent être saisies en ARABE
--          + Infos de l'établissement (Université/Lycée/Centre de formation)
-- ============================================================================

-- 1. Création de la base de données
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'GestionBibliotheque')
BEGIN
    CREATE DATABASE GestionBibliotheque;
END
GO

USE GestionBibliotheque;
GO

-- ============================================================================
-- 2. Fonction de validation : n'autorise que les caractères arabes
--    Plage Unicode couverte : lettres arabes (ء-ي), chiffres arabes-indic (٠-٩),
--    espace et tiret. On utilise une collation BINAIRE pour que la comparaison
--    par plage [ء-ي] se fasse bien sur les points de code Unicode et non selon
--    un ordre linguistique qui fausserait le résultat.
-- ============================================================================
CREATE FUNCTION dbo.fn_TexteArabeUniquement (@Texte NVARCHAR(500))
RETURNS BIT
WITH SCHEMABINDING
AS
BEGIN
    IF @Texte IS NULL OR LEN(@Texte) = 0
        RETURN 1;

    IF PATINDEX(N'%[^ء-ي٠-٩0-9 .,،؛؟()/-]%' COLLATE Latin1_General_100_BIN2, @Texte) > 0
        RETURN 0;

    RETURN 1;
END
GO

-- ============================================================================
-- 3. Informations de l'établissement (Université / Lycée / Centre de formation)
--    dont dépend la bibliothèque : utilisées pour l'en-tête des rapports,
--    les cartes d'adhérent imprimées, etc.
-- ============================================================================
CREATE TABLE Etablissement (
    ID_Etablissement INT IDENTITY(1,1) PRIMARY KEY,
    Raison_Sociale NVARCHAR(200) NOT NULL,       -- Nom de l'université / lycée / centre
    Type_Etablissement NVARCHAR(30) NOT NULL
        CHECK (Type_Etablissement IN (N'جامعة', N'ثانوية', N'مركز تكوين')), -- Université / Lycée / Centre de formation
    Adresse NVARCHAR(300),
    Telephone VARCHAR(20),                       -- Numérique, non concerné par la règle arabe
    Fax VARCHAR(20),                              -- Numérique, non concerné par la règle arabe
    Email VARCHAR(100) CHECK (Email LIKE '%@%.%'), -- Alphabet latin (RFC), non concerné
    Site_Web VARCHAR(200) NULL,                   -- Alphabet latin (URL), non concerné
    Logo VARBINARY(MAX) NULL,                     -- Image du logo (PNG/JPG) pour impression carte/rapports
    Date_Creation DATETIME DEFAULT GETDATE(),
    Date_Modification DATETIME DEFAULT GETDATE(),

    CONSTRAINT CK_Etablissement_Nom_Arabe CHECK (dbo.fn_TexteArabeUniquement(Raison_Sociale) = 1),
    CONSTRAINT CK_Etablissement_Adresse_Arabe CHECK (dbo.fn_TexteArabeUniquement(Adresse) = 1)
);
GO
-- Note : conçue pour ne contenir qu'une seule ligne en usage normal
-- (un seul établissement gère la bibliothèque). Rien n'empêche techniquement
-- d'en ajouter d'autres si tu gères plusieurs annexes/campus plus tard.

-- ============================================================================
-- 4. Catégories (thèmes) : تاريخ، علوم، طب، رياضيات، كيمياء...
-- ============================================================================
CREATE TABLE Categories (
    ID_Categorie INT IDENTITY(1,1) PRIMARY KEY,
    Nom_Categorie NVARCHAR(100) NOT NULL UNIQUE,
    CONSTRAINT CK_Categories_Nom_Arabe CHECK (dbo.fn_TexteArabeUniquement(Nom_Categorie) = 1)
);
GO

-- ============================================================================
-- 5. Emplacements physiques : Rang (A, B, C...) + Étage lié à une catégorie
--    Note : Rang reste un code de rayonnage (A/B/C), pas une donnée descriptive.
--    Si tu veux des rangs en lettres arabes (أ, ب, ج), remplace CHAR(1) par
--    NCHAR(1) et ajoute la même contrainte CK que ci-dessus sur Rang.
-- ============================================================================
CREATE TABLE Emplacements (
    ID_Emplacement INT IDENTITY(1,1) PRIMARY KEY,
    Rang CHAR(1) NOT NULL,
    Etage TINYINT NOT NULL CHECK (Etage BETWEEN 1 AND 20),
    ID_Categorie INT NOT NULL,
    CONSTRAINT FK_Emplacements_Categories FOREIGN KEY (ID_Categorie)
        REFERENCES Categories(ID_Categorie) ON DELETE NO ACTION,
    CONSTRAINT UQ_Emplacement UNIQUE (Rang, Etage, ID_Categorie)
);
GO

CREATE INDEX IX_Emplacements_Categorie ON Emplacements(ID_Categorie);
GO

-- ============================================================================
-- 6. Table des Livres
-- ============================================================================
CREATE TABLE Livres (
    ID_Livre INT IDENTITY(1,1) PRIMARY KEY,
    Titre NVARCHAR(150) NOT NULL,
    ISBN VARCHAR(20) UNIQUE NOT NULL,           -- Norme internationale : chiffres/tirets, non concerné par la règle arabe
    Auteur NVARCHAR(100) NOT NULL,
    Editeur NVARCHAR(100),
    Annee_Publication INT CHECK (Annee_Publication BETWEEN 1000 AND 2050),
    Quantite_Totale INT NOT NULL CHECK (Quantite_Totale > 0),
    Quantite_Disponible INT NOT NULL CHECK (Quantite_Disponible >= 0),
    ID_Emplacement INT NOT NULL,
    Date_Creation DATETIME DEFAULT GETDATE(),
    Date_Modification DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Livres_Emplacements FOREIGN KEY (ID_Emplacement)
        REFERENCES Emplacements(ID_Emplacement) ON DELETE NO ACTION,
    CONSTRAINT CK_Livres_Titre_Arabe CHECK (dbo.fn_TexteArabeUniquement(Titre) = 1),
    CONSTRAINT CK_Livres_Auteur_Arabe CHECK (dbo.fn_TexteArabeUniquement(Auteur) = 1),
    CONSTRAINT CK_Livres_Editeur_Arabe CHECK (dbo.fn_TexteArabeUniquement(Editeur) = 1)
);
GO

CREATE INDEX IX_Livres_Emplacement ON Livres(ID_Emplacement);
CREATE INDEX IX_Livres_Auteur ON Livres(Auteur);
GO

CREATE VIEW vw_Livres_Rangement AS
SELECT
    L.ID_Livre,
    L.Titre,
    L.Auteur,
    L.Quantite_Disponible,
    E.Rang,
    E.Etage,
    C.Nom_Categorie
FROM Livres L
JOIN Emplacements E ON E.ID_Emplacement = L.ID_Emplacement
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie;
GO

-- ============================================================================
-- 7. Table des Adhérents (infos carte + QR Code)
--    Statut désormais en arabe : نشط / غير نشط / موقوف
-- ============================================================================
CREATE TABLE Adherents (
    ID_Adherent INT IDENTITY(1,1) PRIMARY KEY,
    Nom NVARCHAR(50) NOT NULL,
    Prenom NVARCHAR(50) NOT NULL,
    Adresse NVARCHAR(200),
    Email VARCHAR(100) UNIQUE NOT NULL CHECK (Email LIKE '%@%.%'), -- Norme RFC : alphabet latin, non concerné
    Telephone VARCHAR(20),                                          -- Numérique, non concerné
    Specialite NVARCHAR(100),
    Classe_Section NVARCHAR(50),
    Date_Adhesion DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    Statut NVARCHAR(20) NOT NULL DEFAULT N'نشط'
        CHECK (Statut IN (N'نشط', N'غير نشط', N'موقوف')),

    Numero_Carte AS (
        'BIB-' + CAST(YEAR(Date_Adhesion) AS VARCHAR(4)) + '-' +
        RIGHT('000000' + CAST(ID_Adherent AS VARCHAR(6)), 6)
    ) PERSISTED UNIQUE,

    Code_QR AS (
        'BIB-' + CAST(YEAR(Date_Adhesion) AS VARCHAR(4)) + '-' +
        RIGHT('000000' + CAST(ID_Adherent AS VARCHAR(6)), 6)
    ) PERSISTED,

    QRCode_Image VARBINARY(MAX) NULL,
    Photo_Image VARBINARY(MAX) NULL,

    Date_Modification DATETIME DEFAULT GETDATE(),

    CONSTRAINT CK_Adherents_Nom_Arabe CHECK (dbo.fn_TexteArabeUniquement(Nom) = 1),
    CONSTRAINT CK_Adherents_Prenom_Arabe CHECK (dbo.fn_TexteArabeUniquement(Prenom) = 1),
    CONSTRAINT CK_Adherents_Adresse_Arabe CHECK (dbo.fn_TexteArabeUniquement(Adresse) = 1),
    CONSTRAINT CK_Adherents_Specialite_Arabe CHECK (dbo.fn_TexteArabeUniquement(Specialite) = 1),
    CONSTRAINT CK_Adherents_Classe_Arabe CHECK (dbo.fn_TexteArabeUniquement(Classe_Section) = 1)
);
GO
-- Note QR Code : SQL Server ne génère pas d'image QR nativement. Code_QR fournit
-- la chaîne à encoder ; l'application (Delphi/FireDAC ou autre) génère le PNG
-- et le stocke dans QRCode_Image pour l'impression de la carte.

-- ============================================================================
-- 8. Table des Emprunts
--    Statut désormais en arabe : قيد الإعارة / معاد / متأخر
-- ============================================================================
CREATE TABLE Emprunts (
    ID_Emprunt INT IDENTITY(1,1) PRIMARY KEY,
    ID_Livre INT NOT NULL,
    ID_Adherent INT NOT NULL,
    Date_Emprunt DATETIME NOT NULL DEFAULT GETDATE(),
    Date_Retour_Prévue DATETIME NOT NULL,
    Date_Retour_Reelle DATETIME NULL,
    Statut NVARCHAR(20) NOT NULL DEFAULT N'قيد الإعارة'
        CHECK (Statut IN (N'قيد الإعارة', N'معاد', N'متأخر')),

    CONSTRAINT FK_Emprunts_Livres FOREIGN KEY (ID_Livre) REFERENCES Livres(ID_Livre) ON DELETE NO ACTION,
    CONSTRAINT FK_Emprunts_Adherents FOREIGN KEY (ID_Adherent) REFERENCES Adherents(ID_Adherent) ON DELETE NO ACTION,
    CONSTRAINT CK_Dates_Emprunt CHECK (Date_Retour_Prévue >= Date_Emprunt)
);
GO

CREATE INDEX IX_Emprunts_Livre ON Emprunts(ID_Livre);
CREATE INDEX IX_Emprunts_Adherent ON Emprunts(ID_Adherent);
GO

CREATE VIEW vw_CarteAdherent AS
SELECT
    ID_Adherent, Numero_Carte, Nom, Prenom, Adresse, Telephone, Email,
    Specialite, Classe_Section, Date_Adhesion, Statut, Code_QR, QRCode_Image
FROM Adherents;
GO

-- ============================================================================
-- 9. Procédure stockée transactionnelle pour enregistrer un emprunt
--    (mise à jour : statut en arabe)
-- ============================================================================
CREATE PROCEDURE sp_EnregistrerEmprunt
    @ID_Livre INT,
    @ID_Adherent INT,
    @Date_Retour_Prévue DATETIME OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Quantite_Disponible INT;
    DECLARE @Statut_Adherent NVARCHAR(20);
    DECLARE @Maintenant DATETIME = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @Quantite_Disponible = Quantite_Disponible
        FROM Livres WITH (UPDLOCK, HOLDLOCK)
        WHERE ID_Livre = @ID_Livre;

        IF @Quantite_Disponible IS NULL OR @Quantite_Disponible <= 0
        BEGIN
            RAISERROR('Le livre demandé n''est pas disponible ou n''existe pas.', 16, 1);
        END

        SELECT @Statut_Adherent = Statut
        FROM Adherents
        WHERE ID_Adherent = @ID_Adherent;

        IF @Statut_Adherent IS NULL OR @Statut_Adherent <> N'نشط'
        BEGIN
            RAISERROR('L''adhérent sélectionné n''est pas actif ou n''existe pas (carte non valide).', 16, 1);
        END

        SET @Date_Retour_Prévue = DATEADD(DAY, 30, @Maintenant);

        UPDATE Livres
        SET Quantite_Disponible = Quantite_Disponible - 1,
            Date_Modification = @Maintenant
        WHERE ID_Livre = @ID_Livre;

        INSERT INTO Emprunts (ID_Livre, ID_Adherent, Date_Emprunt, Date_Retour_Prévue, Statut)
        VALUES (@ID_Livre, @ID_Adherent, @Maintenant, @Date_Retour_Prévue, N'قيد الإعارة');

        COMMIT TRANSACTION;
        RETURN 1;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
        RETURN -3;
    END CATCH
END;
GO

-- ============================================================================
-- 10. Exemple de données (établissement + catégories + rangement) en arabe
-- ============================================================================

-- Exemple : ثانوية (lycée) — à adapter avec les vraies infos
INSERT INTO Etablissement (Raison_Sociale, Type_Etablissement, Adresse, Telephone, Fax, Email, Site_Web)
VALUES (N'ثانوية الأمير عبد القادر', N'ثانوية', N'شارع الاستقلال، المدية', '025000000', '025000001', 'contact@exemple-lycee.dz', 'www.exemple-lycee.dz');
GO

INSERT INTO Categories (Nom_Categorie) VALUES
    (N'تاريخ'), (N'علوم'), (N'طب'), (N'رياضيات'), (N'كيمياء');
GO

-- Ex: Rang 'A', Étage 4 => تاريخ (comme "تاريخ الجزائر")
INSERT INTO Emplacements (Rang, Etage, ID_Categorie)
SELECT 'A', 4, ID_Categorie FROM Categories WHERE Nom_Categorie = N'تاريخ';
GO