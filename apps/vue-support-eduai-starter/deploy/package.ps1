# package.ps1 - build + package the eduai FRONTEND deploy bundle (Windows dev machine).
#
# ASCII-only on purpose: PowerShell 5.1 parses a non-ASCII .ps1 using the system ANSI
# code page and can fail before param() is reached. See repo AGENTS.md.
#
# Counterpart of deploy/package.sh. Output: dist/eduai-web.tar.gz containing the built
# static site (index.html, assets/, apps/<appName>/app.yaml, app.example.yaml, loader*.js).
#
# Usage: pwsh -File deploy/package.ps1
[CmdletBinding()]
param(
    [string]$Pnpm = "pnpm"
)

$ErrorActionPreference = "Stop"

$appDir = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $appDir "dist"
$out = Join-Path $dist "eduai-web.tar.gz"
$jarAppName = "vue-support-eduai-starter"

Write-Host "==> build frontend (vue-tsc --noEmit && vite build)"
Push-Location $appDir
try {
    & $Pnpm build
    if ($LASTEXITCODE -ne 0) { throw "frontend build failed (exit=$LASTEXITCODE)" }
} finally {
    Pop-Location
}

if (-not (Test-Path (Join-Path $dist "index.html"))) { throw "build produced no index.html" }
$appYaml = Join-Path $dist "apps\$jarAppName\app.yaml"
if (-not (Test-Path $appYaml)) {
    throw "build produced no apps/$jarAppName/app.yaml (runtime reads config from that path)"
}

Write-Host "==> package"
Remove-Item $out -Force -ErrorAction SilentlyContinue
# Tar straight from dist (no Copy-Item): Copy-Item has been observed to produce all-NUL
# files on this host.
& tar -czf $out -C $dist .
if ($LASTEXITCODE -ne 0) { throw "tar failed (exit=$LASTEXITCODE)" }

$item = Get-Item $out
$sha = (Get-FileHash $out -Algorithm SHA256).Hash.ToLower()
$indexMd5 = (Get-FileHash (Join-Path $dist "index.html") -Algorithm MD5).Hash.ToLower()
$files = (Get-ChildItem $dist -Recurse -File | Measure-Object).Count

Write-Host ("==> done: {0}" -f $out)
Write-Host ("    files={0}  size={1:N1} MB" -f $files, ($item.Length / 1MB))
Write-Host ("    sha256={0}" -f $sha)
Write-Host ("    index.html md5={0}   <-- pass this to deploy/verify.sh on the host" -f $indexMd5)

# Explicit success: the last native command's exit code must not leak into ours
# (a caller scripting this would otherwise see a false failure).
exit 0
