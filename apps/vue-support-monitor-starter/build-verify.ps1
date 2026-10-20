Set-Location 'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter'
$env:NODE_OPTIONS = '--max-old-space-size=4096'
$out = npx vite build --config vite.build.config.mts 2>&1 | Out-String
Set-Content -LiteralPath 'C:\Users\Administrator\AppData\Local\Temp\opencode\vite-build.log' -Value $out -Encoding UTF8
Write-Output "BUILD_EXIT:$LASTEXITCODE"
