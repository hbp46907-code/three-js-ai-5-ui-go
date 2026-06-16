@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo Opening QIU photo sphere directly...
echo This version does not need 127.0.0.1 preview server.
echo.

start "" "%~dp0qiu-sphere.html"
