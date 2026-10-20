# Isolate the 8848 static service onto its own dist copy.
#
# Why: this workspace is shared; other sessions run `vite build` on the same app,
# and Vite clears the output directory at the start of every build. When that
# happens the files served by 8848 vanish and the server answers 404 (even for /).
# Serving from a private copy (default: dist-8848) decouples 8848 from those builds.
#
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\serve-8848-isolated.ps1
#        (re-run after any build to refresh the copy, or use -SyncOnly)
param(
  [string]$Src = "dist",
  [string]$Dst = "dist-8848",
  [int]$Port = 8848,
  [string]$Api = "http://192.168.50.198:8112",
  [switch]$SyncOnly
)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root $Src
$dst = Join-Path $root $Dst

if (-not (Test-Path (Join-Path $src "index.html"))) { throw "source dist has no index.html: $src" }
New-Item -ItemType Directory -Force -Path $dst | Out-Null
robocopy $src $dst /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
Write-Host "synced: $src -> $dst"
if ($SyncOnly) { exit 0 }

# stop existing keepalive / serve-dist for this port
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like "*serve-dist-keepalive.mjs*$Port*" -or $_.CommandLine -like "*serve-dist.mjs*$Port*" } |
  ForEach-Object { Write-Host ("stop pid=" + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

# start the keepalive with DIST_DIR pointing at the private copy
$env:DIST_DIR = $dst
Start-Process -FilePath "node" -ArgumentList "scripts/serve-dist-keepalive.mjs", "$Port", "$Api" -WorkingDirectory $root -WindowStyle Hidden
Start-Sleep -Seconds 3
try {
  $code = (Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 6).StatusCode
  Write-Host "$Port serving from $dst (HTTP $code)"
} catch {
  Write-Host "$Port check failed: $($_.Exception.Message)"
}
