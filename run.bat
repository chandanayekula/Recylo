@echo off
title WasteLoop Launcher
cls

echo ===================================================
echo               WASTELOOP APP LAUNCHER
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Backend Server (Flask:5000)...
start "WasteLoop Backend" /D "%~dp0backend" cmd /k "python app.py"

echo [2/3] Starting Frontend Server (Vite:5173)...
start "WasteLoop Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo [3/3] Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ===================================================
echo  WasteLoop is running!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://127.0.0.1:5000
echo.
echo  To stop the servers, close the separate terminal windows.
echo ===================================================
echo.
pause
