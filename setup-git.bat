@echo off
REM ============================================================
REM  Inicializa git en el proyecto oraculo-tarot y hace el
REM  primer commit. Ejecutar este archivo haciendo doble clic
REM  o desde una terminal CMD/PowerShell en esta carpeta.
REM ============================================================

cd /d "%~dp0"

echo.
echo == Limpiando .git anterior si existe...
if exist ".git" rmdir /s /q ".git"

echo.
echo == Inicializando repositorio...
git init -b main
if errorlevel 1 goto :error

echo.
echo == Configurando usuario (solo este repo)...
git config user.email "aaron.afirma@gmail.com"
git config user.name "Aaron"

echo.
echo == Agregando archivos...
git add -A

echo.
echo == Creando primer commit...
git commit -m "Initial commit: oraculo-tarot"
if errorlevel 1 goto :error

echo.
echo ============================================================
echo  Listo. Ahora:
echo   1) Ve a https://github.com/new
echo   2) Crea un repositorio llamado: oraculo-tarot
echo      (deja todo en blanco - sin README, sin .gitignore, sin license)
echo   3) Copia la URL HTTPS que te muestra GitHub
echo      (algo como: https://github.com/TU_USUARIO/oraculo-tarot.git)
echo   4) Pegale esa URL a Claude para continuar.
echo ============================================================
pause
exit /b 0

:error
echo.
echo *** Hubo un error. Revisa el mensaje de arriba. ***
pause
exit /b 1
