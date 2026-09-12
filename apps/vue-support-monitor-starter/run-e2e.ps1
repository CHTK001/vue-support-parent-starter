$ErrorActionPreference = "Continue"
$be = "D:\ch\project\spring-support-parent-starter\spring-support-monitor-starter"
$fe = "D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter"
$java = "C:\Program Files\Amazon Corretto\jdk25.0.3_9\bin\java.exe"

Write-Output "=== [1/6] cleanup ==="
Get-CimInstance Win32_Process -Filter "Name='java.exe'" | Where-Object { $_.CommandLine -match "MonitorApplication|spring-support-monitor-starter-4" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match "vite" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 4

Write-Output "=== [2/6] start backend ==="
Remove-Item "$be\backend-one.log" -ErrorAction SilentlyContinue
Start-Process -FilePath $java -ArgumentList @("-cp","target/classes;target/dependency/*","com.chua.starter.monitor.support.MonitorApplication","--server.port=8081") -WorkingDirectory $be -RedirectStandardOutput "$be\backend-one.log" -RedirectStandardError "$be\backend-one-err.log" -PassThru -WindowStyle Hidden | Select-Object Id

$beReady = $false
for ($i=0; $i -lt 14; $i++) {
  Start-Sleep -Seconds 8
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:8081/ms/project" -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200) { $beReady = $true; Write-Output ("backend ready after " + (($i+1)*8) + "s"); break }
  } catch {}
}
if (-not $beReady) {
  Write-Output "BACKEND NOT READY - last log:"
  Get-Content "$be\backend-one.log" -Tail 8 -ErrorAction SilentlyContinue | ForEach-Object { $_ -replace "`e\[[0-9;]*m","" }
  Get-Content "$be\backend-one-err.log" -Tail 8 -ErrorAction SilentlyContinue | ForEach-Object { $_ -replace "`e\[[0-9;]*m","" }
  exit 1
}

Write-Output "=== [3/6] start frontend ==="
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","cd /d $fe && pnpm exec vite --port 8848 --strictPort >> dev-one.log 2>&1" -WindowStyle Hidden -PassThru | Out-Null

$feReady = $false
for ($i=0; $i -lt 10; $i++) {
  Start-Sleep -Seconds 4
  $c = Get-NetTCPConnection -LocalPort 8848 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) { $feReady = $true; Write-Output ("frontend up after " + (($i+1)*4) + "s"); break }
}
if (-not $feReady) { Write-Output "FRONTEND NOT READY"; exit 1 }
Start-Sleep -Seconds 3

Write-Output "=== [4/6] verify proxy ==="
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:8848/ms/project" -UseBasicParsing -TimeoutSec 10
  Write-Output ("proxy /ms/project: " + $r.StatusCode + " -> " + $r.Content.Substring(0,[Math]::Min(40,$r.Content.Length)))
} catch { Write-Output ("proxy ERR: " + $_.Exception.Message) }

Write-Output "=== [5/6] verify index ==="
try {
  $r2 = Invoke-WebRequest -Uri "http://127.0.0.1:8848/" -UseBasicParsing -TimeoutSec 10
  Write-Output ("index: " + $r2.StatusCode)
} catch { Write-Output ("index ERR: " + $_.Exception.Message) }

Write-Output "=== [6/6] run playwright ==="
Push-Location $fe
& "D:\ch\project\vue-support-parent-starter\node_modules\.bin\playwright.cmd" test tests/e2e/project.spec.ts --reporter=list 2>&1 | Select-Object -Last 18
Pop-Location
Write-Output "=== DONE ==="