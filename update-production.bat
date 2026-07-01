@echo off
chcp 65001 >nul
title TASK TAB - Mise a jour Production

echo ============================================
echo   🔄 TASK TAB - MISE A JOUR PRODUCTION
echo ============================================
echo.

:: Arreter le serveur
echo [1/5] Arret du serveur...
echo Appuyez sur Ctrl+C dans le terminal du serveur
timeout /t 3 /nobreak >nul
echo.

:: Sauvegarder les fichiers uploads
echo [2/5] Sauvegarde des fichiers uploads...
if exist backend\uploads (
    if not exist backup\uploads mkdir backup\uploads
    xcopy /E /I /Y backend\uploads backup\uploads
    echo ✅ Fichiers uploads sauvegardes
)
echo.

:: Mise a jour du code
echo [3/5] Mise a jour du code...
git pull
if %errorlevel% neq 0 (
    echo ⚠️ Git non disponible ou pas de depot
    echo 📦 Utilisation des fichiers locaux
) else (
    echo ✅ Code mis a jour
)
echo.

:: Reconstruire
echo [4/5] Recompilation...
call deploy.bat
echo.

:: Redemarrer
echo [5/5] Redemarrage du serveur...
start start-production.bat
echo.

echo ============================================
echo   ✅ MISE A JOUR TERMINEE
echo ============================================

pause