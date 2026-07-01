@echo off
chcp 65001 >nul
title TASK TAB - PM2 Stop

echo ============================================
echo   🛑 TASK TAB - PM2 STOP
echo ============================================
echo.

pm2 stop task-tab
pm2 delete task-tab
pm2 status

echo.
echo ✅ Serveur arrete
echo.

pause