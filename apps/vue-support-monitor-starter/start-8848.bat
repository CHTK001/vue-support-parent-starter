@echo off
cd /d D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter
set MS_API_TARGET=http://124.221.230.112:8080
set MS_SOCKET_TARGET=http://127.0.0.1:29181
call npx vite --port 8848 > D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter\vite-8848.log 2>&1
