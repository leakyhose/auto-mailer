@echo off
echo Starting Auto Mailer...
echo.

echo [1/2] Starting backend on http://localhost:8000
start "Auto Mailer - Backend" cmd /c "cd /d "%~dp0backend" && python -m venv venv 2>nul && call venv\Scripts\activate && pip install -r requirements.txt -q && python run.py"

echo [2/2] Starting frontend on http://localhost:5173
start "Auto Mailer - Frontend" cmd /c "cd /d "%~dp0frontend" && npm install --silent && npm run dev"

echo.
echo Both servers starting. Open http://localhost:5173 in your browser.
echo Close this window when done.
pause
