@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 汽车赛·世纪 RACE 2026
if not exist node_modules (
  echo [RACE 2026] 首次启动，正在安装依赖...
  call npm install
  if errorlevel 1 goto fail
)
echo [RACE 2026] 正在构建最新版本...
call npm run build
if errorlevel 1 goto fail
echo [RACE 2026] 启动游戏并自动打开浏览器（关闭此窗口即退出服务）...
call npm run preview -- --host 127.0.0.1 --port 5173 --open
if errorlevel 1 goto fail
exit /b 0
:fail
echo.
echo [RACE 2026] 启动失败，请查看上方报错信息。
pause
exit /b 1
