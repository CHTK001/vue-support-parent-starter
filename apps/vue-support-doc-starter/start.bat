@echo off
echo === Setting up MSVC environment ===
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64

echo === Setting PATH ===
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

echo === Installing tauri-cli ===
cargo install tauri-cli --locked 2>nul

echo === Starting app ===
cd /d D:\ch\project\vue-support-parent-starter\apps\vue-support-doc-starter
cargo tauri dev
