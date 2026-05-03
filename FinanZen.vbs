Set WshShell = CreateObject("WScript.Shell")

' Função leve para verificar se um processo node está rodando com o nome da pasta
Function IsProcessRunning(cmdPart)
    ' Usamos tasklist /V e findstr para uma busca rápida sem carregar o subsistema WMI
    Dim command
    command = "cmd /c tasklist /FI ""IMAGENAME eq node.exe"" /V | findstr /I """ & cmdPart & """"
    IsProcessRunning = (WshShell.Run(command, 0, True) = 0)
End Function

' Caminho base absoluto (garante que funciona mesmo se chamado de outro lugar)
strPath = "d:\Arquivos_Obsidian\FinanZen"

' 1. Iniciar Backend
If Not IsProcessRunning("backend") Then
    WshShell.Run "cmd /c cd /d " & strPath & "\backend && npm run dev", 0, False
    WScript.Sleep 2000 ' Pequena pausa para não sobrecarregar a CPU na partida
End If

' 2. Iniciar Frontend
If Not IsProcessRunning("frontend") Then
    WshShell.Run "cmd /c cd /d " & strPath & "\frontend && npm run dev", 0, False
    WScript.Sleep 3000
End If

' 3. Aguardar estabilização e abrir o navegador
' Aumentamos ligeiramente para garantir que o Next.js compilou a primeira rota
WScript.Sleep 10000 
WshShell.Run "http://localhost:3000", 1, False

