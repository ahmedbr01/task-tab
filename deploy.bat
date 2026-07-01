@echo off
chcp 65001 >nul
title TASK TAB - Déploiement Windows

echo ============================================
echo   🚀 TASK TAB - DÉPLOIEMENT PRODUCTION
echo ============================================
echo.

:: Vérifier Node.js
echo [1/5] Vérification de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installe !
    echo 📥 Telechargez Node.js sur https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js est installe
node --version
echo.

:: Backend
echo [2/5] Installation des dependances BACKEND...
cd backend
if %errorlevel% neq 0 (
    echo ❌ Dossier backend non trouve !
    pause
    exit /b 1
)

call npm install --production --no-fund --no-audit
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dependances backend
    pause
    exit /b 1
)
echo ✅ Dependances backend installees
echo.

:: Frontend
echo [3/5] Installation des dependances FRONTEND...
cd ..\frontend
if %errorlevel% neq 0 (
    echo ❌ Dossier frontend non trouve !
    pause
    exit /b 1
)

call npm install --no-fund --no-audit
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dependances frontend
    pause
    exit /b 1
)
echo ✅ Dependances frontend installees
echo.

:: Compiler frontend
echo [4/5] Compilation du frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la compilation
    pause
    exit /b 1
)
echo ✅ Frontend compile avec succes
echo.

:: Creer dossier uploads
echo [5/5] Preparation du dossier uploads...
cd ..\backend
if not exist uploads mkdir uploads
echo ✅ Dossier uploads pret
echo.

echo ============================================
echo   ✅ DEPLOIEMENT TERMINE AVEC SUCCES !
echo ============================================
echo.
echo 🌐 Demarrer le serveur avec :
echo    cd backend ^& npm start
echo.
echo Ou en mode developpement :
echo    cd backend ^& npm run dev
echo    cd frontend ^& npm run dev
echo.
pause