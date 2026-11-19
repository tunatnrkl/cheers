@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo GTA Dublaj kuruluyor...
python -m venv .venv || (echo Python bulunamadi. python.org'dan Python 3.11+ kurun. & pause & exit /b 1)
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\pip install -r requirements.txt || (echo Kurulum basarisiz. & pause & exit /b 1)
echo.
echo Kurulum tamam. Ses cihazlariniz:
.venv\Scripts\python -m dublaj --cihazlar
echo config.toml dosyasini duzenleyip baslat.bat ile calistirin.
pause
