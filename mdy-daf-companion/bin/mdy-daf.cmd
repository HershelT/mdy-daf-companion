@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "PLUGIN_ROOT=%SCRIPT_DIR%.."
node "%PLUGIN_ROOT%\dist\src\cli.js" %*

