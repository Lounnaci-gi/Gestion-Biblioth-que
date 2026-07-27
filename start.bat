@echo off
cd /d "%~dp0"
cls
echo Démarrage de la bibliothèque...
start http://localhost:3000
npm start
pause
