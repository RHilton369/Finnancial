$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.IO.Path]::Combine([Environment]::GetFolderPath("Desktop"), "FinanZen.lnk")
$Shortcut = $WshShell.CreateShortcut($DesktopPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"d:\Arquivos_Obsidian\FinanZen\FinanZen.vbs`""
$Shortcut.WorkingDirectory = "d:\Arquivos_Obsidian\FinanZen"
$Shortcut.IconLocation = "d:\Arquivos_Obsidian\FinanZen\favicon.ico"
$Shortcut.Description = "Iniciar Sistema FinanZen"
$Shortcut.Save()

Write-Host "✅ Atalho criado com sucesso na sua Área de Trabalho!" -ForegroundColor Green
