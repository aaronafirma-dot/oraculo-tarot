@echo off
REM ============================================================
REM  Conecta el repo local con GitHub y sube los archivos.
REM  Si es la primera vez, Windows abrira un navegador para que
REM  inicies sesion en GitHub (usa tu cuenta de Google).
REM ============================================================

cd /d "%~dp0"

set REMOTE_URL=https://github.com/aaronafirma-dot/oraculo-tarot.git

echo.
echo == Verificando que existe un commit...
git rev-parse --verify HEAD >nul 2>&1
if errorlevel 1 (
    echo *** No hay commits todavia. Ejecuta primero setup-git.bat ***
    pause
    exit /b 1
)

echo.
echo == Configurando remote 'origin'...
git remote remove origin >nul 2>&1
git remote add origin %REMOTE_URL%
if errorlevel 1 goto :error

echo.
echo == Asegurando rama 'main'...
git branch -M main

echo.
echo == Subiendo a GitHub (puede abrirse una ventana de login)...
git push -u origin main
if errorlevel 1 goto :error

echo.
echo ============================================================
echo  Subida completa. Tu repo esta en:
echo    https://github.com/aaronafirma-dot/oraculo-tarot
echo ============================================================
pause
exit /b 0

:error
echo.
echo *** Hubo un error. Revisa el mensaje de arriba. ***
pause
exit /b 1
