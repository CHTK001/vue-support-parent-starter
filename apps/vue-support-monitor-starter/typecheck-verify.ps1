Set-Location 'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter'
$env:NODE_OPTIONS = '--max-old-space-size=4096'
cmd /c "npx vue-tsc --noEmit > C:\Users\Administrator\AppData\Local\Temp\opencode\vue-tsc.log 2>&1"
Write-Output "TSC_EXIT:$LASTEXITCODE"