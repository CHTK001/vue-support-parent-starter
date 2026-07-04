@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
cd /d D:\ch\project\vue-support-parent-starter\apps\vue-support-doc-starter
start /b cmd /c "cd .. && npx vite --host 0.0.0.0 --port 5173"
timeout /t 3
cargo tauri dev
