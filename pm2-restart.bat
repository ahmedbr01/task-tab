@echo off
chcp 65001 >nul
title TASK TAB - PM2 Restart

echo ============================================
echo   🔄 TASK TAB - PM2 RESTART
echo ============================================
echo.

pm2 restart task-tab
pm2 status

echo.
echo ✅ Serveur redemarre
echo.

pause