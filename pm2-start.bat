@echo off
chcp 65001 >nul
title TASK TAB - PM2 Start

echo ============================================
echo   🚀 TASK TAB - PM2 START
echo ============================================
echo.

cd backend

:: Verifier .env.production
if not exist .env.production (
    echo ⚠️ .env.production non trouve
    pause
    exit /b 1
)

:: Demarrer avec PM2
pm2 start server.js --name task-tab --env production
pm2 save
pm2 status

echo.
echo ✅ Serveur demarre avec PM2
echo 📊 PM2 status : pm2 status
echo 📋 PM2 logs : pm2 logs task-tab
echo.

pause