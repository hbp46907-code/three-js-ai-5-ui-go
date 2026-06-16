@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "NODE_EXE=C:\Users\AIGC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

echo.
echo QIU photo sphere preview
echo ------------------------------------------------------------
echo Keep this window open while previewing the page.
echo URL: http://127.0.0.1:4173/qiu-sphere.html
echo.

if not exist "%NODE_EXE%" (
  echo Bundled Node was not found.
  echo Please update NODE_EXE in this file.
  pause
  exit /b 1
)

start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:4173/qiu-sphere.html'"
"%NODE_EXE%" "%~dp0preview-server.cjs"

pause
