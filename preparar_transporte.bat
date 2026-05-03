@echo off
echo ==================================================
echo   FINNANCIAL - PREPARAR PARA TRANSPORTE
echo ==================================================
echo.
echo Este script ira remover arquivos temporarios e pesados
echo para que voce possa copiar a pasta do projeto sem erros.
echo.

set /p confirma="Deseja continuar? (S/N): "
if /i "%confirma%" neq "S" goto fim

echo.
echo [+] Removendo node_modules do Backend...
if exist "finnancial-api\node_modules" rd /s /q "finnancial-api\node_modules"

echo [+] Removendo node_modules do Frontend...
if exist "finnancial-web\node_modules" rd /s /q "finnancial-web\node_modules"

echo [+] Removendo pastas de build do Frontend...
if exist "finnancial-web\dist" rd /s /q "finnancial-web\dist"
if exist "finnancial-web\dist-electron" rd /s /q "finnancial-web\dist-electron"
if exist "finnancial-web\release" rd /s /q "finnancial-web\release"

echo [+] Removendo arquivos de lock redundantes...
if exist "package-lock.json" del /f /q "package-lock.json"
if exist "finnancial-api\package-lock.json" del /f /q "finnancial-api\package-lock.json"
if exist "finnancial-web\package-lock.json" del /f /q "finnancial-web\package-lock.json"

echo.
echo ==================================================
echo   LIMPEZA CONCLUIDA COM SUCESSO!
echo ==================================================
echo Agora voce pode copiar a pasta 'Finnancial' compactada
echo para outro computador ou pendrive.
echo.
pause

:fim
exit
