@echo off
echo Building Auto Mailer .exe...
echo.
cd /d "%~dp0"
cd backend
call venv\Scripts\activate
pip install pyinstaller -q
cd ..
python build.py
echo.
echo Build complete! The .exe is in backend\dist\AutoMailer.exe
pause
