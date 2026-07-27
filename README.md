# Gestion Bibliothèque

Application web de gestion de bibliothèque connectée à **SQL Server** et au schéma défini dans `biblio.sql`.

## Fonctionnalités

- **Tableau de bord** : statistiques (livres, exemplaires, adhérents, emprunts, retards)
- **Livres** : ajout, modification, suppression du catalogue
- **Adhérents** : gestion des membres (Actif / Inactif / Suspendu)
- **Emprunts** : enregistrement via la procédure stockée `sp_EnregistrerEmprunt` (30 jours), retour des livres

## Prérequis

- [Node.js](https://nodejs.org/) 18+
- SQL Server avec la base `GestionBibliotheque` (script `biblio.sql`)

## Installation de la base de données

Si la base n'existe pas encore :

```powershell
sqlcmd -S localhost -E -C -i "biblio.sql"
```

## Lancement

```powershell
cd "D:\Gestion Bibliothèque"
npm install
npm run seed    # optionnel : données de démonstration
npm start
```

Ouvrir **http://localhost:3000** dans le navigateur.

## Configuration

Copier `.env.example` vers `.env` et adapter si nécessaire :

| Variable | Description |
|----------|-------------|
| `DB_SERVER` | Serveur SQL (défaut : `localhost`) |
| `DB_DATABASE` | Nom de la base (`GestionBibliotheque`) |
| `DB_USER` / `DB_PASSWORD` | Authentification SQL (vide = Windows) |
| `DB_DRIVER` | Pilote ODBC (défaut : `ODBC Driver 17 for SQL Server`) |
| `DB_TRUST_CERT` | `true` pour accepter le certificat serveur |
| `PORT` | Port HTTP (défaut : `3000`) |

## Structure

```
├── biblio.sql          # Schéma SQL Server
├── server.js           # Serveur Express
├── config/db.js        # Connexion SQL Server
├── routes/             # API REST
├── public/             # Interface web
└── scripts/seed.js     # Données de démo
```
