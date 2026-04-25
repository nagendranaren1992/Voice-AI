Get-Job -ErrorAction SilentlyContinue | Stop-Job -PassThru | Remove-Job -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Stopped all jobs and Node processes."