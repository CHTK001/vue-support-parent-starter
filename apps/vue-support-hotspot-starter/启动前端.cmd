@echo off
chcp 65001 >nul
echo ========================================
echo    启动 Hotspot 前端开发服务器
echo ========================================
echo.
echo 正在启动开发服务器...
echo 请稍候...
echo.

cd /d "%~dp0"
pnpm dev

pause
