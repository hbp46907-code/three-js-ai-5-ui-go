@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "NODE_EXE=C:\Users\AIGC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

echo.
echo 更新作品清单
echo ------------------------------------------------------------
echo 正在扫描 works 文件夹中的图片和视频...
echo.

if not exist "%NODE_EXE%" (
  echo 未找到 Codex 自带 Node.js。
  echo 请检查路径：%NODE_EXE%
  echo.
  pause
  exit /b 1
)

"%NODE_EXE%" "%~dp0scripts\generate-works-manifest.cjs"

if errorlevel 1 (
  echo.
  echo 更新失败，请检查 works 文件夹中的文件是否正常。
  pause
  exit /b 1
)

echo.
echo 当前清单数量：
"%NODE_EXE%" -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('works-manifest.json','utf8')); for (const [name,items] of Object.entries(data)) console.log('- ' + name + ': ' + items.length);"

echo.
echo 更新完成。
echo 已同步生成：
echo - works-manifest.json
echo - js\works-data.js
echo.
echo 本地预览请刷新页面；上传网站时记得一起上传 works 文件夹和这两个清单文件。
echo.
pause
