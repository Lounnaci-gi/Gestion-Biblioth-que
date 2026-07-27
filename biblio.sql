-- ============================================================================
-- SCRIPT : Création et Optimisation de la Base de Données "GestionBibliotheque"
-- Cible  : SQL Server (Optimisé pour un accès natif via Delphi FireDAC)
-- ============================================================================

-- 1. Création de la base de données
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'GestionBibliotheque')
BEGIN
    CREATE DATABASE GestionBibliotheque;
END
GO

USE GestionBibliotheque;
GO
 
-- 2. Table des Livres
CREATE TABLE Livres (
    ID_Livre INT IDENTITY(1,1) PRIMARY KEY,
    Titre NVARCHAR(150) NOT NULL,
    ISBN VARCHAR(20) UNIQUE NOT NULL, -- VARCHAR : Gain de place et indexation rapide pour l'ISBN (pas d'Unicode)
    Auteur NVARCHAR(100) NOT NULL,
    Editeur NVARCHAR(100),
    Annee_Publication INT CHECK (Annee_Publication BETWEEN 1000 AND 2050), -- Correction : Borne fixe au lieu d'une fonction dynamique interdite
    Quantite_Totale INT NOT NULL CHECK (Quantite_Totale > 0),
    Quantite_Disponible INT NOT NULL CHECK (Quantite_Disponible >= 0),
    Date_Creation DATETIME DEFAULT GETDATE(),
    Date_Modification DATETIME DEFAULT GETDATE()
);
GO
-- Note : L'index sur la colonne ISBN est généré automatiquement par la contrainte UNIQUE de SQL Server.
 
-- 3. Table des Adhérents
CREATE TABLE Adherents (
    ID_Adherent INT IDENTITY(1,1) PRIMARY KEY,
    Nom NVARCHAR(50) NOT NULL,
    Prenom NVARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL CHECK (Email LIKE '%@%.%'), -- VARCHAR : Optimisation du stockage de l'index d'authentification
    Telephone VARCHAR(20),
    Date_Adhesion DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    Statut NVARCHAR(20) NOT NULL DEFAULT 'Actif' CHECK (Statut IN ('Actif', 'Inactif', 'Suspendu')),
    Date_Modification DATETIME DEFAULT GETDATE()
);
GO
-- Note : L'index sur la colonne Email est généré automatiquement par sa contrainte UNIQUE.

-- 4. Table des Emprunts
CREATE TABLE Emprunts (
    ID_Emprunt INT IDENTITY(1,1) PRIMARY KEY,
    ID_Livre INT NOT NULL,
    ID_Adherent INT NOT NULL,
    Date_Emprunt DATETIME NOT NULL DEFAULT GETDATE(),
    Date_Retour_Prévue DATETIME NOT NULL,
    Date_Retour_Reelle DATETIME NULL,
    Statut NVARCHAR(20) NOT NULL DEFAULT 'En cours' CHECK (Statut IN ('En cours', 'Rendu', 'Retard')),
    
    -- Sécurité Audit : Interdiction du CASCADE pour protéger l'intégrité de l'historique comptable/statistique
    CONSTRAINT FK_Emprunts_Livres FOREIGN KEY (ID_Livre) REFERENCES Livres(ID_Livre) ON DELETE NO ACTION,
    CONSTRAINT FK_Emprunts_Adherents FOREIGN KEY (ID_Adherent) REFERENCES Adherents(ID_Adherent) ON DELETE NO ACTION,
    CONSTRAINT CK_Dates_Emprunt CHECK (Date_Retour_Prévue >= Date_Emprunt)
);
GO
 
-- Indexation stratégique des clés étrangères (Indispensable pour la rapidité des jointures JOIN)
CREATE INDEX IX_Emprunts_Livre ON Emprunts(ID_Livre);
CREATE INDEX IX_Emprunts_Adherent ON Emprunts(ID_Adherent);
GO
 
-- 5. Procédure stockée transactionnelle pour enregistrer un emprunt
CREATE PROCEDURE sp_EnregistrerEmprunt
    @ID_Livre INT,
    @ID_Adherent INT,
    @Date_Retour_Prévue DATETIME OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Quantite_Disponible INT;
    DECLARE @Statut_Adherent NVARCHAR(20);
    DECLARE @Maintenant DATETIME = GETDATE(); -- Point de référence temporel unique pour verrouiller les écritures simultanées
 
    BEGIN TRY
        -- Isolation stricte : Début de la transaction
        BEGIN TRANSACTION;
 
        -- Étape A : Vérification et verrouillage préventif du livre (UPDLOCK, HOLDLOCK gèrent les accès concurrents Delphi)
        SELECT @Quantite_Disponible = Quantite_Disponible
        FROM Livres WITH (UPDLOCK, HOLDLOCK)
        WHERE ID_Livre = @ID_Livre;
 
        IF @Quantite_Disponible IS NULL OR @Quantite_Disponible <= 0
        BEGIN
            RAISERROR('Le livre demandé n''est pas disponible ou n''existe pas.', 16, 1);
        END
 
        -- Étape B : Vérification du statut de l'adhérent
        SELECT @Statut_Adherent = Statut
        FROM Adherents
        WHERE ID_Adherent = @ID_Adherent;
 
        IF @Statut_Adherent IS NULL OR @Statut_Adherent <> 'Actif'
        BEGIN
            RAISERROR('L''adhérent sélectionné n''est pas actif ou n''existe pas.', 16, 1);
        END
 
        -- Étape C : Calcul du terme d'emprunt (Règle métier : 30 jours)
        SET @Date_Retour_Prévue = DATEADD(DAY, 30, @Maintenant);
 
        -- Étape D : Mise à jour du stock physique
        UPDATE Livres
        SET Quantite_Disponible = Quantite_Disponible - 1,
            Date_Modification = @Maintenant
        WHERE ID_Livre = @ID_Livre;
 
        -- Étape E : Enregistrement de l'emprunt courant
        INSERT INTO Emprunts (ID_Livre, ID_Adherent, Date_Emprunt, Date_Retour_Prévue, Statut)
        VALUES (@ID_Livre, @ID_Adherent, @Maintenant, @Date_Retour_Prévue, 'En cours');
 
        -- Validation définitive des opérations
        COMMIT TRANSACTION;
        RETURN 1; -- Retour succès pour Delphi
 
    END TRY
    BEGIN CATCH
        -- Sécurité transactionnelle : Annulation des écritures en cas de blocage/erreur
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
 
        -- Extraction et propagation du libellé exact de l'erreur vers FireDAC (Delphi)
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
        RETURN -3;
    END CATCH
END;
GO