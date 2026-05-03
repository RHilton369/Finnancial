# FINNANCIAL - Script de Inicializacao de Desenvolvimento

$projectRoot = $PSScriptRoot
$apiPath = Join-Path $projectRoot "finnancial-api"
$webPath = Join-Path $projectRoot "finnancial-web"
$pnpm = "pnpm.cmd"

Write-Host "--- INICIANDO FINNANCIAL ---"

# Limpa processos
$processes = Get-NetTCPConnection -LocalPort 3001, 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) { 
    Write-Host "Limpando portas 3001/5173..."
    Stop-Process -Id $processes -Force 
}

# Inicia servidores
Write-Host "Iniciando Backend..."
Start-Process -FilePath $pnpm -ArgumentList "run", "dev" -WorkingDirectory $apiPath -WindowStyle Hidden

Write-Host "Iniciando Frontend..."
Start-Process -FilePath $pnpm -ArgumentList "run", "dev" -WorkingDirectory $webPath -WindowStyle Hidden

Write-Host "Concluido! Aguarde o carregamento do app."
Start-Sleep -Seconds 2
