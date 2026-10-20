@echo off
REM Playwright 全量验收 - 由 Windows Task Scheduler 托管，不受 shell 超时影响
REM 用法：直接双击此 bat 文件，或在 PowerShell 中运行

cd /d D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter

echo [%TIME%] 启动 Playwright 全量验收...
echo 环境: MS_E2E_BASE_URL=http://127.0.0.1:8851
echo 环境: MS_API_TARGET=http://192.168.50.198:8112

set MS_E2E_BASE_URL=http://127.0.0.1:8851
set MS_API_TARGET=http://192.168.50.198:8112

node node_modules\@playwright\test\cli.js test --config playwright.accept.config.ts --timeout 0 --workers 1

echo [%TIME%] Playwright 结束，退出码=%ERRORLEVEL%

REM 读取报告摘要
if exist "D:\ch\project\.tmp\accept-report\report.json" (
    echo === 报告摘要 ===
    findstr /C:"stats" /C:"passed" /C:"failed" "D:\ch\project\.tmp\accept-report\report.json"
)

pause
