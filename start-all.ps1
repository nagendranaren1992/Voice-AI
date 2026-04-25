param(
  [string]$ProjectRoot = "D:\Voice-AI",
  [switch]$SkipDbSetup,
  [switch]$TryDockerPostgres
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectRoot

if (-not (Test-Path ".env")) {
  throw ".env not found in $ProjectRoot"
}

Write-Host "Project: $ProjectRoot" -ForegroundColor Cyan

# Clean previous jobs/processes from this project stack.
Get-Job -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if ($TryDockerPostgres) {
  try {
    docker compose up -d postgres | Out-Null
    Write-Host "PostgreSQL container started (or already running)." -ForegroundColor Green
  } catch {
    Write-Host "Docker postgres startup failed. Falling back to local postgres check." -ForegroundColor Yellow
  }
}

# Wait for local PostgreSQL.
$dbReady = $false
for ($i = 0; $i -lt 20; $i++) {
  if ((Test-NetConnection -ComputerName "localhost" -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded) {
    $dbReady = $true
    break
  }
  Start-Sleep -Seconds 1
}

Write-Host "Prisma setup..." -ForegroundColor Yellow
npm run db:generate

if (-not $SkipDbSetup) {
  if ($dbReady) {
    # Non-interactive flow; avoids migration name prompts.
    npx prisma migrate deploy
    npx prisma db push
    npm run db:seed
  } else {
    Write-Host "Skipping DB sync/seed: PostgreSQL not reachable at localhost:5432." -ForegroundColor Yellow
  }
}

# Use system Python launcher for reliability on Windows.
py -m pip install --upgrade pip | Out-Null
py -m pip install -r "services/stt/requirements.txt" | Out-Null

$null = Start-Job -Name "stt" -ScriptBlock {
  param($root)
  Set-Location $root
  py -m uvicorn services.stt.main:app --host 0.0.0.0 --port 8000
} -ArgumentList $ProjectRoot

$null = Start-Job -Name "api" -ScriptBlock {
  param($root)
  Set-Location $root
  npm run dev:api
} -ArgumentList $ProjectRoot

$null = Start-Job -Name "web" -ScriptBlock {
  param($root)
  Set-Location $root
  npm run dev:web
} -ArgumentList $ProjectRoot

Write-Host "Started jobs: stt, api, web" -ForegroundColor Green
Write-Host "Web: http://localhost:4200/voice-test"
Write-Host "API: http://localhost:3000/health"
Write-Host "STT: http://localhost:8000/health"
Write-Host ""
Write-Host "Press Ctrl+C to stop log streaming. Jobs keep running." -ForegroundColor DarkYellow
Write-Host "Run '.\stop-all.ps1' to stop all services." -ForegroundColor DarkYellow

while ($true) {
  foreach ($name in "stt", "api", "web") {
    $job = Get-Job -Name $name -ErrorAction SilentlyContinue
    if ($null -ne $job) {
      $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
      if ($output) {
        $output | ForEach-Object { Write-Host "[$name] $_" }
      }
      if ($job.State -in @("Failed", "Stopped", "Completed")) {
        Write-Host "[$name] job state: $($job.State)" -ForegroundColor Yellow
      }
    }
  }
  Start-Sleep -Milliseconds 800
}