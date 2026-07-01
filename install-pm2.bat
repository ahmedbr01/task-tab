@echo off
chcp 65001 >nul
title TASK TAB - Installation PM2

echo ============================================
echo   📦 TASK TAB - INSTALLATION PM2
echo ============================================
echo.

echo [1/2] Installation de PM2 globalement...
call npm install -g pm2
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation
    pause
    exit /b 1
)
echo ✅ PM2 installe
echo.

echo [2/2] Configuration PM2 pour Windows...
pm2 startup
echo.
echo ✅ Configuration terminee
echo.
echo 📋 Commandes PM2 :
echo   pm2 list               - Afficher les processus
echo   pm2 logs task-tab      - Voir les logs
echo   pm2 restart task-tab   - Redemarrer
echo   pm2 stop task-tab      - Arreter
echo   pm2 delete task-tab    - Supprimer
echo.

pause