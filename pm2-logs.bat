@echo off
chcp 65001 >nul
title TASK TAB - PM2 Logs

echo ============================================
echo   📋 TASK TAB - PM2 LOGS
echo ============================================
echo.

pm2 logs task-tab

pause