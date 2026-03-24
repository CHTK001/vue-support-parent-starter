@echo off
setlocal

set "APP_DIR=H:\workspace\2\vue-support-parent-starter\apps\vue-support-monitor-starter"
set "LOG_DIR=H:\workspace\2\logs"
set "OUT_LOG=%LOG_DIR%\vue-monitor-dev.log"
set "ERR_LOG=%LOG_DIR%\vue-monitor-dev.err.log"
set "PNPM_CMD=H:\nodejs\node_global\pnpm.cmd"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
start "" /b cmd /c "cd /d %APP_DIR% && ^"%PNPM_CMD%^" dev -- --host 127.0.0.1 --port 8860 1>^"%OUT_LOG%^" 2>^"%ERR_LOG%^""

endlocal
