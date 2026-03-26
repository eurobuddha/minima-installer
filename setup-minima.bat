@echo off
setlocal enabledelayedexpansion
title Minima Node Installer
color 0F

echo.
echo   * Minima Node Installer
echo   ---------------------------------
echo.

REM ---- Check for Java ----

echo   Checking for Java...
where java >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| find "version"') do set "JAVA_VER=%%~v"
    echo   [92m+[0m Java found: version !JAVA_VER!
) else (
    echo   [93m![0m Java is not installed.
    echo.
    echo   Minima needs Java to run. We'll open the download page for you.
    echo   Install Java, then run this file again.
    echo.
    echo   Recommended: Adoptium ^(Eclipse Temurin^) - free and open source
    echo.
    start https://adoptium.net
    pause
    exit /b 1
)

REM ---- Check for Git ----

echo   Checking for Git...
where git >nul 2>nul
if %errorlevel% equ 0 (
    echo   [92m+[0m Git found.
) else (
    echo   [93m![0m Git is not installed. Installing via winget...
    where winget >nul 2>nul
    if !errorlevel! equ 0 (
        winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
        echo   [92m+[0m Git installed. You may need to restart this script.
        REM Refresh PATH
        set "PATH=%PATH%;C:\Program Files\Git\cmd"
    ) else (
        echo   [91mx[0m Could not install Git automatically.
        echo   Please install Git from https://git-scm.com and run this file again.
        echo.
        start https://git-scm.com
        pause
        exit /b 1
    )
)

REM ---- Check/Install Node.js ----

echo   Checking for Node.js...
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version') do set "NODE_VER=%%v"
    echo   [92m+[0m Node.js found: !NODE_VER!
) else (
    echo   [93m![0m Node.js is not installed. Installing...
    where winget >nul 2>nul
    if !errorlevel! equ 0 (
        echo   Installing Node.js via winget...
        winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
        REM Refresh PATH for node
        set "PATH=%PATH%;C:\Program Files\nodejs"
        where node >nul 2>nul
        if !errorlevel! equ 0 (
            echo   [92m+[0m Node.js installed.
        ) else (
            echo   [91mx[0m Node.js installation completed but not found in PATH.
            echo   Please close this window, open a new one, and run this file again.
            pause
            exit /b 1
        )
    ) else (
        echo   [91mx[0m Could not install Node.js automatically.
        echo   Please install Node.js from https://nodejs.org and run this file again.
        echo.
        start https://nodejs.org
        pause
        exit /b 1
    )
)

REM ---- Download/Update Minima Installer ----

echo.
echo   Setting up Minima Installer...

set "INSTALL_DIR=%USERPROFILE%\.minima-installer-tool"

if exist "%INSTALL_DIR%\package.json" (
    echo   [92m+[0m Minima Installer already downloaded.
    echo   Checking for updates...
    cd /d "%INSTALL_DIR%"
    git pull --ff-only 2>nul
) else (
    echo   Downloading from GitHub...
    git clone https://github.com/eurobuddha/minima-installer.git "%INSTALL_DIR%"
    if !errorlevel! neq 0 (
        echo   [91mx[0m Failed to download. Check your internet connection and try again.
        pause
        exit /b 1
    )
    echo   [92m+[0m Downloaded.
)

cd /d "%INSTALL_DIR%"

REM ---- Install Node dependencies ----

echo   Installing dependencies...
if exist "node_modules" (
    echo   [92m+[0m Dependencies already installed.
) else (
    call npm install --silent 2>nul
    echo   [92m+[0m Dependencies installed.
)

REM ---- Launch the wizard ----

echo.
echo   [92mOpening the Minima setup wizard in your browser...[0m
echo   If it doesn't open automatically, go to: http://localhost:8787
echo.
echo   You can close this window after the installer finishes.
echo.

node bin\cli.js
