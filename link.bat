@echo off
echo current path:%~dp0
set param=%1
echo param1: %1

    set param=%1
    set dp=%~dp0%
    set strcat=%dp%%param%\node_modules %dp%node_modules
    mklink /d %strcat%

