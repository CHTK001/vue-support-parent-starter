Set-Location 'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter'
$env:NODE_OPTIONS = '--max-old-space-size=4096'
cmd /c "npx vite build --config vite.build.config.mts > C:\Users\Administrator\AppData\Local\Temp\opencode\vite-build2.log 2>&1"
Write-Output "BUILD_EXIT:$LASTEXITCODE"