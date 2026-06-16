@echo off
cd /d "%~dp0"

set "NODE_EXE=C:\Users\AIGC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "LOG_FILE=%~dp0update-content-result.txt"

echo Update editable content > "%LOG_FILE%"
echo ------------------------------------------------------------ >> "%LOG_FILE%"
echo Time: %date% %time% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

echo.
echo Update editable content
echo ------------------------------------------------------------
echo Reading content.json...
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

"%NODE_EXE%" -e "const fs=require('fs'); const json=fs.readFileSync('content.json','utf8'); JSON.parse(json); fs.writeFileSync('js/content-data.js', 'window.SITE_CONTENT = ' + json.trim() + '\n', 'utf8'); console.log('Generated js/content-data.js from content.json');" >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
  echo Update failed. Please check content.json format.
  echo Update failed. Please check content.json format. >> "%LOG_FILE%"
  echo.
  echo Result file:
  echo %LOG_FILE%
  pause
  exit /b 1
)

type "%LOG_FILE%"
echo.
echo Done.
echo Refresh the page with Ctrl + F5.
echo.
pause
