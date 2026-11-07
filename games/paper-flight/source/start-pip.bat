@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 22 or newer is required.
  echo Install it from https://nodejs.org/ then double-click this file again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies from package-lock.json...
  call npm ci
  if errorlevel 1 (
    echo npm ci failed.
    pause
    exit /b 1
  )
)

echo.
echo Pip will open at http://127.0.0.1:43123 on this computer.
echo Leave this window open while you play. Closing it stops the server.
echo.

start "" cmd /c "ping -n 4 127.0.0.1 >nul & start http://127.0.0.1:43123/"
call npm run dev
if errorlevel 1 pause
endlocal
