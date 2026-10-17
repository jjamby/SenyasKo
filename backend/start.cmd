@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Backend environment missing. See backend\README.md for setup.
  exit /b 1
)
".venv\Scripts\python.exe" -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload

