$script = 'C:\Users\admin-c606401\Documents\inventario\iniciar_inventario.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`"" `
    -WorkingDirectory (Split-Path $script)
$trigger = New-ScheduledTaskTrigger -AtStartup
$trigger.Delay = 'PT1M'
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName 'Inventario' -Action $action -Trigger $trigger -Principal $principal -Settings $settings






--------
Pruébala sin reiniciar con Start-ScheduledTask -TaskName Inventario. Luego revisa que ambos puertos estén escuchando con Get-NetTCPConnection -LocalPort 8002,5174 -State Listen, y si algo falla mira los archivos en logs\