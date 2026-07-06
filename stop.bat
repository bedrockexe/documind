@echo off
cd /d "%~dp0"
echo Stopping DocuMind...
docker compose down
echo Done.
pause