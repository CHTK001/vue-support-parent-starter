Set-Location 'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter'
$err = npx vue-tsc --noEmit 2>&1
$filtered = $err | Select-String -Pattern 'HostProfileView|HostDetailView|HostFileManager|monitorApi|zip\.ts'
if ($filtered) { $filtered | ForEach-Object { $_.Line } }
Write-Output "VUE_EXIT:$LASTEXITCODE"
