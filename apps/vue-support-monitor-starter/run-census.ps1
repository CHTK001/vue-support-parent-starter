$app = 'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter'
Set-Location $app
Start-Process -FilePath 'node' -ArgumentList 'scripts/serve-dist.mjs','8850','http://192.168.50.198:8112' -WorkingDirectory $app -WindowStyle Hidden
for ($i=1; $i -le 20; $i++) {
    $c = curl.exe --noproxy '*' -sS --max-time 4 -o NUL -w '%{http_code}' http://127.0.0.1:8850/ 2>$null
    if ($c -eq '200') { break }
    Start-Sleep -Seconds 2
}
Write-Output "8850=$c"
$env:MS_E2E_BASE_URL = 'http://127.0.0.1:8850'
$env:E2E_LOGIN_USERNAME = 'admin'
$env:E2E_LOGIN_PASSWORD = 'admin123'
taskkill /F /IM chrome-headless-shell.exe 2>$null | Out-Null
npx playwright test --config playwright.accept.config.ts zz-host-census --retries=1 --reporter=list 2>&1 | Select-Object -Last 26
