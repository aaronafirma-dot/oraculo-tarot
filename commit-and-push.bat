@echo off
REM ============================================================
REM  Limpia archivos huerfanos de Firebase Hosting (si existen)
REM  y hace commit + push de todos los cambios pendientes.
REM  Mensaje: revert a popup + limpieza de config de Firebase Hosting.
REM ============================================================

cd /d "%~dp0"

echo.
echo == Limpiando archivos de Firebase Hosting (si existen)...
if exist "firebase.json" (
    del /f /q "firebase.json"
    echo    eliminado: firebase.json
)
if exist ".firebaserc" (
    del /f /q ".firebaserc"
    echo    eliminado: .firebaserc
)
if exist "firebase-public" (
    rmdir /s /q "firebase-public"
    echo    eliminado: firebase-public\
)
if exist "deploy-firebase-hosting.bat" (
    del /f /q "deploy-firebase-hosting.bat"
    echo    eliminado: deploy-firebase-hosting.bat
)

echo.
echo == Estado actual:
git status --short

echo.
echo == Agregando cambios...
git add -A

echo.
echo == Creando commit...
git commit -m "revert(auth): back to signInWithPopup; remove unused Firebase Hosting config"
if errorlevel 1 (
    echo.
    echo *** No habia nada que commitear, o hubo un error. ***
    pause
    exit /b 1
)

echo.
echo == Subiendo a GitHub...
git push origin main
if errorlevel 1 goto :error

echo.
echo ============================================================
echo  Cambios subidos. Vercel deberia redeploy automaticamente.
echo  Repo: https://github.com/aaronafirma-dot/oraculo-tarot
echo ============================================================
pause
exit /b 0

:error
echo.
echo *** Hubo un error al hacer push. Revisa el mensaje de arriba. ***
pause
exit /b 1
