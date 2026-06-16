@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo Opening AI Galaxy website directly...
echo This mode does not need http://127.0.0.1:4173.
echo.

start "" "%~dp0index.html"
