@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==================================================
echo            Starting DocuMind
echo ==================================================
echo.

REM --- 1. Is Docker running? ---
docker info >nul 2>&1
if errorlevel 1 (
    echo  [!] Docker Desktop is not running.
    echo      Open Docker Desktop, wait until it says "running",
    echo      then double-click this file again.
    echo.
    pause
    exit /b 1
)

REM --- 2. Do we have an NVIDIA GPU? ---
set "COMPOSE=docker compose"
nvidia-smi >nul 2>&1
if not errorlevel 1 (
    echo  [+] NVIDIA GPU found - enabling fast mode.
    set "COMPOSE=docker compose -f docker-compose.yml -f docker-compose.gpu.yml"
) else (
    echo  [i] No GPU found - running in portable mode ^(works, just slower^).
)
echo.

REM --- 3. Build and start everything ---
echo  Building and starting containers...
echo  NOTE: the FIRST run downloads Docker images and a 2 GB AI model.
echo        This can take 5-15 minutes. Please be patient.
echo.
%COMPOSE% up -d --build
if errorlevel 1 (
    echo  [i] GPU mode failed - retrying in portable CPU mode...
    docker compose up -d --build
    if errorlevel 1 (
        echo  [!] Could not start. See the messages above.
        pause
        exit /b 1
    )
)

REM --- 4. Wait until DocuMind is ready ---
echo.
echo  Setting up ^(downloading model + indexing documents^)...
echo  This only takes long the first time.
echo.
set /a tries=0
:waitloop
timeout /t 5 /nobreak >nul
curl -s -o nul http://localhost:8000/docs
if not errorlevel 1 goto ready
set /a tries+=1
if !tries! geq 180 (
    echo  [!] Still not ready. It may need more time, or check:
    echo      docker compose logs backend
    pause
    exit /b 1
)
echo    ...still setting up ^(!tries!^)
goto waitloop

:ready
echo.
echo ==================================================
echo    DocuMind is ready!  Opening your browser...
echo ==================================================
start "" http://localhost:3000
echo.
echo  To stop DocuMind later, double-click stop.bat
echo.
pause