@echo off
title MCP Manager - Building...
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
cd /d D:\ch\project\vue-support-parent-starter\apps\vue-support-doc-starter
start "MCP Manager" cmd /c "cargo tauri dev"
echo App starting in separate window...
