$ErrorActionPreference = 'Stop'
 
$projectRoot = $PSScriptRoot
$backendDirectory = Join-Path $projectRoot 'backend'
$frontendDirectory = Join-Path $projectRoot 'frontend'
$pythonExecutable = Join-Path $projectRoot '.venv\Scripts\python.exe'
$npmCommand = 'C:\Program Files\nodejs\npm.cmd'
$commandProcessor = Join-Path $env:SystemRoot 'System32\cmd.exe'
$logDirectory = Join-Path $projectRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
 
function Test-PortInUse {
    param([int]$Port)
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}
 
if (-not (Test-PortInUse -Port 8002)) {
    Start-Process -FilePath $pythonExecutable `
        -ArgumentList @('manage.py', 'runserver', '0.0.0.0:8002', '--noreload') `
        -WorkingDirectory $backendDirectory -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logDirectory 'backend.log') `
        -RedirectStandardError (Join-Path $logDirectory 'backend.err.log')
}
 
if (-not (Test-PortInUse -Port 5174)) {
    Start-Process -FilePath $commandProcessor `
        -ArgumentList @('/c', "`"$npmCommand`" run dev") `
        -WorkingDirectory $frontendDirectory -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logDirectory 'frontend.log') `
        -RedirectStandardError (Join-Path $logDirectory 'frontend.err.log')
}