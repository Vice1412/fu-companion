@echo off
setlocal
cd /d "%~dp0"

REM Check if antigravity-ide is available in PATH
where antigravity-ide >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "" antigravity-ide "%~dp0"
    exit /b 0
)

REM Check default installation path for Antigravity IDE
if exist "%LOCALAPPDATA%\Programs\Antigravity IDE\bin\antigravity-ide.cmd" (
    start "" "%LOCALAPPDATA%\Programs\Antigravity IDE\bin\antigravity-ide.cmd" "%~dp0"
    exit /b 0
)

if exist "%LOCALAPPDATA%\Programs\Antigravity IDE\Antigravity IDE.exe" (
    start "" "%LOCALAPPDATA%\Programs\Antigravity IDE\Antigravity IDE.exe" "%~dp0"
    exit /b 0
)

REM Check default installation path for Antigravity desktop app
if exist "%LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe" (
    start "" "%LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe" "%~dp0"
    exit /b 0
)

echo [ERROR] Could not find Antigravity executable.
pause
exit /b 1
