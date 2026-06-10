Write-Host "--- INICIANDO PROCESSO DE ATUALIZACAO E BUILD ---" -ForegroundColor Cyan
# node bump-version.js

# 1. Parar processos
Write-Host "Limpando processos..." -ForegroundColor Yellow
Stop-Process -Name "ZenTriq" -ErrorAction SilentlyContinue
Stop-Process -Name "electron" -ErrorAction SilentlyContinue
taskkill /F /IM node.exe /T 2>$null
taskkill /F /IM nodemon.exe /T 2>$null
taskkill /F /IM ZenTriq.exe /T 2>$null
taskkill /F /IM servidor-interno.exe /T 2>$null
Start-Sleep -Seconds 2

# 2. Limpar artefatos antigos da raiz da API
Write-Host "Limpando artefatos antigos..." -ForegroundColor Yellow
cd zentriq-api
Remove-Item "schema.prisma" -Force -ErrorAction SilentlyContinue
Remove-Item "query_engine-windows.dll.node" -Force -ErrorAction SilentlyContinue
Remove-Item "servidor-interno.exe" -Force -ErrorAction SilentlyContinue

# 3. Gerar Prisma Client atualizado
Write-Host "Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "Falha ao gerar Prisma" -ForegroundColor Red; exit 1 }

# 4. Compilar Backend (pkg)
Write-Host "Compilando Backend (pkg)..." -ForegroundColor Yellow
pnpm run pkg
if ($LASTEXITCODE -ne 0) { Write-Host "Falha no pkg" -ForegroundColor Red; exit 1 }

# 5. Copiar Schema do diretório correto
Write-Host "Copiando schema.prisma..." -ForegroundColor Yellow
Copy-Item "prisma\schema.prisma" "." -Force

# 6. Copiar o Query Engine CORRETO (do pnpm, ~21 MB)
Write-Host "Localizando query engine correto do pnpm..." -ForegroundColor Yellow
$engines = Get-ChildItem -Path "node_modules\.pnpm" -Recurse -Filter "query_engine-windows.dll.node" | Sort-Object Length -Descending
$correctEngine = $engines | Select-Object -First 1
if ($correctEngine) {
    Copy-Item $correctEngine.FullName "." -Force
    Write-Host "Query engine copiado: $($correctEngine.FullName) ($($correctEngine.Length) bytes)" -ForegroundColor Green
} else {
    Write-Host "ERRO CRITICO: query_engine-windows.dll.node nao encontrado!" -ForegroundColor Red
    exit 1
}

# 7. Validar tamanhos antes de prosseguir
$engineSize = (Get-Item "query_engine-windows.dll.node").Length
Write-Host "Tamanho do query engine na raiz: $engineSize bytes" -ForegroundColor Cyan
if ($engineSize -lt 20000000) {
    Write-Host "AVISO: Query engine parece ser a versao antiga ($engineSize < 20MB)!" -ForegroundColor Red
    exit 1
}

# 8. Build Frontend e Electron
Write-Host "Compilando Frontend e Gerando Instalador..." -ForegroundColor Yellow
cd ..\zentriq-web
pnpm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Falha no build Vite" -ForegroundColor Red; exit 1 }

npx electron-builder
if ($LASTEXITCODE -ne 0) { Write-Host "Falha no electron-builder" -ForegroundColor Red; exit 1 }

# 9. Validação final
Write-Host ""
Write-Host "=== VALIDACAO FINAL ===" -ForegroundColor Cyan
$installerPath = Get-ChildItem -Path "release" -Filter "ZenTriq Setup*.exe" | Where-Object { $_.Name -notmatch "uninstaller|blockmap" } | Select-Object -First 1
if ($installerPath) {
    Write-Host "Instalador: $($installerPath.Name) ($([math]::Round($installerPath.Length / 1MB, 1)) MB)" -ForegroundColor Green
} else {
    Write-Host "ERRO: Instalador nao encontrado!" -ForegroundColor Red
}

$backendEngine = Get-Item "..\zentriq-api\query_engine-windows.dll.node"
Write-Host "Query Engine empacotado: $($backendEngine.Length) bytes" -ForegroundColor Green

Write-Host ""
Write-Host "--- BUILD CONCLUIDO COM SUCESSO! ---" -ForegroundColor Green
Write-Host "Instalador gerado em: zentriq-web\release" -ForegroundColor Cyan
