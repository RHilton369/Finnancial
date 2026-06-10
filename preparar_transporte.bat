@echo off
echo ==================================================
echo   ZENTRIQ - PREPARAR PARA TRANSPORTE
echo ==================================================
echo.
echo Este script ira remover arquivos temporarios e pesados
echo para que voce possa copiar a pasta do projeto sem erros.
echo.

set /p confirma="Deseja continuar? (S/N): "
if /i "%confirma%" neq "S" goto fim

echo.
echo [+] Removendo node_modules do Backend...
if exist "zentriq-api\node_modules" rd /s /q "zentriq-api\node_modules"

echo [+] Removendo node_modules do Frontend...
if exist "zentriq-web\node_modules" rd /s /q "zentriq-web\node_modules"

echo [+] Removendo pastas de build do Frontend...
if exist "zentriq-web\dist" rd /s /q "zentriq-web\dist"
if exist "zentriq-web\dist-electron" rd /s /q "zentriq-web\dist-electron"
if exist "zentriq-web\release" rd /s /q "zentriq-web\release"

echo [+] Removendo arquivos de lock redundantes...
if exist "package-lock.json" del /f /q "package-lock.json"
if exist "zentriq-api\package-lock.json" del /f /q "zentriq-api\package-lock.json"
if exist "zentriq-web\package-lock.json" del /f /q "zentriq-web\package-lock.json"

echo.
echo ==================================================
echo   LIMPEZA CONCLUIDA COM SUCESSO!
echo ==================================================
echo Agora voce pode copiar a pasta 'ZenTriq' compactada
echo para outro computador ou pendrive.
echo.
pause

:fim
exit
