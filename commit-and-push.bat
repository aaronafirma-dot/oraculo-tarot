@echo off
REM ============================================================
REM  Hace commit de los cambios pendientes y sube a GitHub.
REM  Mensaje: combinar useEffect de auth + blindar contra fallo de Firestore.
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
git commit -m "fix(auth): unify redirect/onAuthStateChanged effect; survive Firestore failures"
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
