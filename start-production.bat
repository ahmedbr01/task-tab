@echo off
chcp 65001 >nul
title TASK TAB - Serveur Production

echo ============================================
echo   🚀 TASK TAB - DEMARRAGE PRODUCTION
echo ============================================
echo.

:: Verifier le fichier .env.production
echo [1/3] Verification du fichier .env.production...
cd backend
if not exist .env.production (
    echo ⚠️ Fichier .env.production non trouve !
    echo Creation d'un fichier par defaut...
    (
        echo PORT=5000
        echo NODE_ENV=production
        echo DB_HOST=localhost
        echo DB_PORT=3306
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_NAME=task_tab_db
        echo JWT_SECRET=task_tab_production_secret_2026
        echo JWT_EXPIRES_IN=7d
        echo MAX_FILE_SIZE=5242880
        echo LOG_LEVEL=error
    ) > .env.production
    echo ✅ Fichier .env.production cree
) else (
    echo ✅ Fichier .env.production trouve
)
echo.

:: Verifier les dependances
echo [2/3] Verification des dependances...
if not exist node_modules (
    echo 📦 Installation des dependances...
    call npm install --production --no-fund --no-audit
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation
        pause
        exit /b 1
    )
    echo ✅ Dependances installees
) else (
    echo ✅ Dependances deja installees
)
echo.

:: Demarrer le serveur
echo [3/3] Demarrage du serveur...
echo.

echo ============================================
echo   ✅ SERVEUR DEMARRE AVEC SUCCES
echo ============================================
echo.
echo 🌐 Serveur : http://localhost:5000
echo 📊 Mode : PRODUCTION
echo.
echo 💡 Pour arreter le serveur : Ctrl+C
echo.
echo ============================================

node server.js

pause