@echo off
REM ============================================================
REM  Hace commit y push de los cambios pendientes.
REM  Mensaje: deshabilitar PayPal tras el primer click con "Procesando...".
REM ============================================================

cd /d "%~dp0"

echo.
echo == Estado actual:
git status --short

echo.
echo == Agregando cambios...
git add -A

echo.
echo == Creando commit...
git commit -m "feat(paypal): disable button after first click; show 'Procesando...' until cancel/approve/error"
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
