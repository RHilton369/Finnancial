---
description: Reinicia os servidores Backend (3001) e Frontend (5173) do projeto Finnancial
---

Quando o usuário pedir para reiniciar os servidores, siga as etapas abaixo:

// turbo
1. Feche os processos (portas 3001 e 5173):
```powershell
$processes = Get-NetTCPConnection -LocalPort 3001, 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) { Stop-Process -Id $processes -Force; Write-Output "Processos encerrados: $processes" } else { Write-Output "Nenhum processo." }
```

// turbo
2. Inicie o backend:
```powershell
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "D:\Arquivos_Obsidian\Finnancial\finnancial-api" -WindowStyle Hidden
```

// turbo
3. Inicie o frontend:
```powershell
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "D:\Arquivos_Obsidian\Finnancial\finnancial-web" -WindowStyle Hidden
```

4. Verifique as portas via: `Get-NetTCPConnection -LocalPort 3001, 5173 -State Listen` e atualize o `PROJETO.md` se ainda for solicitado pelas regras globais.
