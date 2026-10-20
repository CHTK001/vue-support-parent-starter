# ACME delivery acceptance driver (ASCII only; PS 5.1 reads .ps1 as ANSI without BOM).
# Reseeds the 101 acme DB to the controlled baseline before each run, then runs
# acme-delivery-acceptance.mjs. exit=3 means the browser was recycled by the OS
# under memory pressure -> reseed and retry. exit=0 ALL_PASS, exit=2 real FAIL.
# A memory gate waits for enough free RAM before each round (this box is shared).
$ErrorActionPreference = "Continue"
$app = Split-Path $PSScriptRoot -Parent
$runDir = Join-Path $app ".local-run"
if (-not (Test-Path $runDir)) { New-Item -ItemType Directory -Path $runDir | Out-Null }
$seed = "C:\Users\Administrator\AppData\Local\Temp\opencode\acme-101\seed_acme.sql"
$env:PLINK_PW = "qweasd123QWE@"
$plink = "C:\Program Files\PuTTY\plink.exe"
$pscp = "C:\Program Files\PuTTY\pscp.exe"

if (-not $env:MS_APP) { $env:MS_APP = "http://127.0.0.1:8898" }
if (-not $env:MS_E2E_API_LOGIN) { $env:MS_E2E_API_LOGIN = "http://192.168.50.198:8081" }
$env:E2E_LOGIN_USERNAME = "admin"
$env:E2E_LOGIN_PASSWORD = "admin123"

function Get-FreeMB {
  [int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1024)
}

function Reseed {
  & $pscp -batch -pw $env:PLINK_PW $seed root@101.200.205.64:/tmp/seed_acme.sql *> $null
  $r = "mysql -ucollect -p'Collect@2026' acme < /tmp/seed_acme.sql && mysql -ucollect -p'Collect@2026' -N -e 'select count(*) from acme.monitor_acme_account; select count(*) from acme.monitor_acme_certificate; select count(*) from acme.monitor_acme_order;'"
  & $plink -batch -ssh -pw $env:PLINK_PW root@101.200.205.64 $r 2>&1
}

function ClearOrphanBrowsers {
  $all = @{}
  Get-CimInstance Win32_Process -Filter "Name='chrome-headless-shell.exe' OR Name='node.exe' OR Name='chrome.exe'" | ForEach-Object { $all[[int]$_.ProcessId] = $_ }
  foreach ($s in (Get-CimInstance Win32_Process -Filter "Name='chrome-headless-shell.exe'")) {
    if (-not $all.ContainsKey([int]$s.ParentProcessId)) {
      Stop-Process -Id $s.ProcessId -Force -ErrorAction SilentlyContinue
    }
  }
}

# Wait until the box has enough free RAM for the heavy monitor SPA in Chromium.
function Wait-ForMemory {
  param([int]$NeedMB = 2500, [int]$MaxWaitSec = 900)
  $start = Get-Date
  while ($true) {
    $free = Get-FreeMB
    if ($free -ge $NeedMB) { Write-Host "[wrapper] freeMB=$free >= $NeedMB, proceeding"; return $true }
    $elapsed = [int]((Get-Date) - $start).TotalSeconds
    if ($elapsed -ge $MaxWaitSec) { Write-Host "[wrapper] freeMB=$free still < $NeedMB after ${MaxWaitSec}s, proceeding anyway"; return $false }
    Write-Host "[wrapper] freeMB=$free < $NeedMB, waiting for memory... (${elapsed}s)"
    ClearOrphanBrowsers
    Start-Sleep -Seconds 20
  }
}

$max = 12
for ($i = 1; $i -le $max; $i++) {
  Write-Host ""
  Write-Host "===== ACME acceptance round $i/$max ====="
  Wait-ForMemory | Out-Null
  ClearOrphanBrowsers
  Reseed
  $log = Join-Path $runDir "acme-delivery-dist.log"
  Write-Host "----- run acceptance (dist 8898) -----"
  Push-Location $app
  node "scripts\acme-delivery-acceptance.mjs" *> $log
  $code = $LASTEXITCODE
  Pop-Location
  Get-Content $log
  Write-Host ""
  Write-Host "[wrapper] round $i exit=$code"
  if ($code -eq 0) { Write-Host "[wrapper] ALL_PASS"; break }
  if ($code -eq 2) { Write-Host "[wrapper] FAILED (real defect, no retry)"; break }
  if ($code -eq 3) { Write-Host "[wrapper] CRASHED (browser recycled), reseed and retry..."; continue }
  Write-Host "[wrapper] other exit code $code, retry..."
}
