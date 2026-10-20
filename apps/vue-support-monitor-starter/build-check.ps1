Set-Location 'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter'
$env:NODE_OPTIONS = '--max-old-space-size=4096'
npx vite build --config vite.build.config.mts 2>&1 | Select-Object -Last 4
Write-Output "BUILD_EXIT:$LASTEXITCODE"
