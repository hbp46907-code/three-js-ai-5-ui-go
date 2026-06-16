@echo off
cd /d "%~dp0"

set "NODE_EXE=C:\Users\AIGC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "LOG_FILE=%~dp0update-works-result.txt"

echo Update works manifest > "%LOG_FILE%"
echo ------------------------------------------------------------ >> "%LOG_FILE%"
echo Time: %date% %time% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

echo.
echo Update works manifest
echo ------------------------------------------------------------
echo Scanning works folder...
echo.

if not exist "%NODE_EXE%" (
  echo Node not found:
  echo %NODE_EXE%
  echo Node not found: %NODE_EXE% >> "%LOG_FILE%"
  echo.
  echo Result file:
  echo %LOG_FILE%
  pause
  exit /b 1
)

"%NODE_EXE%" "%~dp0scripts\generate-works-manifest.cjs" >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
  echo Update failed. See result file:
  echo %LOG_FILE%
  echo Update failed. >> "%LOG_FILE%"
  echo.
  pause
  exit /b 1
)

echo Current counts:
echo Current counts: >> "%LOG_FILE%"
"%NODE_EXE%" -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('works-manifest.json','utf8')); for (const [name,items] of Object.entries(data)) console.log('- ' + name + ': ' + items.length);" > "%TEMP%\works-count.txt"
type "%TEMP%\works-count.txt"
type "%TEMP%\works-count.txt" >> "%LOG_FILE%"

echo.
echo Done.
echo Generated:
echo - works-manifest.json
echo - js\works-data.js
echo.
echo Result file:
echo %LOG_FILE%
echo.
pause
