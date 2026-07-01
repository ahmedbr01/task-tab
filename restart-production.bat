@echo off
chcp 65001 >nul
title TASK TAB - Redemarrage Production

echo ============================================
echo   🔄 TASK TAB - REDEMARRAGE PRODUCTION
echo ============================================
echo.

echo [1/2] Arret du serveur...
echo Appuyez sur Ctrl+C dans le terminal du serveur
timeout /t 3 /nobreak >nul

echo [2/2] Demarrage du serveur...
start start-production.bat

echo ✅ Redemarrage lance

pause