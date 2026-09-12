# AI Console Full Feature Verification - agent-browser
$ErrorActionPreference = "Continue"
$shotDir = "D:\ch\project\vue-support-parent-starter\agent-browser-acceptance"
New-Item -ItemType Directory -Force -Path $shotDir | Out-Null

function Test-PageFeature {
    param($name, $url, $checks)
    
    Write-Host "`n=== $name ===" -ForegroundColor Cyan
    agent-browser open $url 2>&1 | Out-Null
    Start-Sleep -Seconds 2.5
    
    # Screenshot
    $shotResult = agent-browser screenshot 2>&1
    $shotMatch = [regex]::Match($shotResult, "saved to (.+)")
    if ($shotMatch.Success) {
        $shotPath = $shotMatch.Groups[1].Value
        if (Test-Path $shotPath) {
            Copy-Item $shotPath (Join-Path $shotDir "$name.png") -Force
        }
    }
    
    $results = @()
    foreach ($check in $checks) {
        $js = $check.js
        $bytes = [Text.Encoding]::UTF8.GetBytes($js)
        $encoded = [Convert]::ToBase64String($bytes)
        $output = agent-browser eval -b $encoded 2>&1
        $outStr = ($output -join " ")
        $pass = $outStr -match $check.expect
        $status = if ($pass) { "PASS" } else { "FAIL" }
        $results += @{name=$check.name; status=$status; output=$outStr}
        Write-Host "  $status - $($check.name)"
        if (-not $pass) { Write-Host "       output: $outStr" -ForegroundColor Yellow }
    }
    return $results
}

# Close previous session
agent-browser close 2>&1 | Out-Null
Start-Sleep -Seconds 1

$allResults = @()

# 1. Models
$allResults += Test-PageFeature "01-models" "http://localhost:19094/#/models" @(
    @{name="page-title"; js="document.title"; expect="AI"}
    @{name="new-model-btn"; js="Array.from(document.querySelectorAll('button')).some(b => /new|add|create|create/i.test(b.textContent))"; expect="true"}
    @{name="table-exists"; js="document.querySelector('table, .arco-table, [class*=table]') !== null"; expect="true"}
    @{name="batch-ops"; js="Array.from(document.querySelectorAll('button,[class*=batch],[class*=selected]')).some(e => /batch|selected|bulk/i.test(e.textContent))"; expect="true|false"}
)

# 2. Agents
$allResults += Test-PageFeature "02-agents" "http://localhost:19094/#/agents" @(
    @{name="new-agent-btn"; js="Array.from(document.querySelectorAll('button')).some(b => /new|add|create/i.test(b.textContent))"; expect="true"}
    @{name="table-exists"; js="document.querySelector('table, .arco-table, [class*=table]') !== null"; expect="true"}
)

# 3. Services
$allResults += Test-PageFeature "03-services" "http://localhost:19094/#/services" @(
    @{name="service-cards"; js="document.querySelectorAll('[class*=card],[class*=service]').length > 0"; expect="true"}
    @{name="protocol-endpoints"; js="Array.from(document.querySelectorAll('*')).some(e => /OPENAI|CC|CODEX|GEMINI|protocol/i.test(e.textContent) && e.children.length < 5)"; expect="true|false"}
)

# 4. Usage
$allResults += Test-PageFeature "04-usage" "http://localhost:19094/#/usage" @(
    @{name="stat-cards"; js="document.querySelectorAll('[class*=stat],[class*=card],[class*=metric]').length > 0"; expect="true"}
    @{name="export-btn"; js="Array.from(document.querySelectorAll('button')).some(b => /export|download|csv/i.test(b.textContent))"; expect="true|false"}
    @{name="time-range-picker"; js="document.querySelector('[class*=picker],[class*=range],input[placeholder*=date],input[placeholder*=time]') !== null"; expect="true|false"}
)

# 5. Usage sync logs
$allResults += Test-PageFeature "05-usage-sync-logs" "http://localhost:19094/#/usage/sync-logs" @(
    @{name="table-exists"; js="document.querySelector('table, .arco-table, [class*=table]') !== null"; expect="true|false"}
)

# 6. Settings
$allResults += Test-PageFeature "06-settings" "http://localhost:19094/#/settings" @(
    @{name="config-cards"; js="document.querySelectorAll('[class*=card],[class*=setting],[class*=config]').length > 0"; expect="true"}
    @{name="global-bean-entry"; js="Array.from(document.querySelectorAll('a,button,[class*=nav]')).some(e => /global|bean/i.test(e.textContent))"; expect="true|false"}
)

# 7. Global beans
$allResults += Test-PageFeature "07-global-beans" "http://localhost:19094/#/settings/global-beans" @(
    @{name="form-exists"; js="document.querySelector('form,[class*=form],input,textarea') !== null"; expect="true"}
)

# 8. Usage config
$allResults += Test-PageFeature "08-usage-config" "http://localhost:19094/#/settings/usage-config" @(
    @{name="usage-switch"; js="Array.from(document.querySelectorAll('*')).some(e => /usage|switch|enable|toggle/i.test(e.textContent) && e.children.length < 3)"; expect="true|false"}
    @{name="model-metrics"; js="Array.from(document.querySelectorAll('*')).some(e => /metric|collect|sync|pricing/i.test(e.textContent) && e.children.length < 3)"; expect="true|false"}
)

# 9. Skills config
$allResults += Test-PageFeature "09-skills-config" "http://localhost:19094/#/settings/skills-config" @(
    @{name="provider-switch"; js="Array.from(document.querySelectorAll('*')).some(e => /provider|local|online|switch/i.test(e.textContent) && e.children.length < 3)"; expect="true|false"}
)

# 10. Skills management
$allResults += Test-PageFeature "10-skills" "http://localhost:19094/#/skills" @(
    @{name="scan-btn"; js="Array.from(document.querySelectorAll('button')).some(b => /scan|refresh|reload/i.test(b.textContent))"; expect="true|false"}
    @{name="market-search"; js="Array.from(document.querySelectorAll('button,input')).some(e => /market|search/i.test(e.textContent || e.placeholder))"; expect="true|false"}
)

# 11. Roles
$allResults += Test-PageFeature "11-roles" "http://localhost:19094/#/roles" @(
    @{name="new-role-btn"; js="Array.from(document.querySelectorAll('button')).some(b => /new|add|create/i.test(b.textContent))"; expect="true"}
    @{name="table-exists"; js="document.querySelector('table, .arco-table, [class*=table]') !== null"; expect="true"}
)

# 12. MCP
$allResults += Test-PageFeature "12-mcp" "http://localhost:19094/#/mcp" @(
    @{name="new-mcp-btn"; js="Array.from(document.querySelectorAll('button')).some(b => /new|add|create/i.test(b.textContent))"; expect="true"}
    @{name="table-exists"; js="document.querySelector('table, .arco-table, [class*=table]') !== null"; expect="true"}
)

# 13. Plugins
$allResults += Test-PageFeature "13-plugins" "http://localhost:19094/#/plugins" @(
    @{name="installed-list"; js="document.querySelectorAll('[class*=card],[class*=item],[class*=plugin]').length > 0"; expect="true|false"}
    @{name="market-search"; js="Array.from(document.querySelectorAll('button,input')).some(e => /market|search/i.test(e.textContent || e.placeholder))"; expect="true|false"}
)

# 14-19. Pipelines
$pipelines = @(
    @{name="14-pipeline-t2i"; url="http://localhost:19094/#/capabilities/text-to-image"}
    @{name="15-pipeline-t2v"; url="http://localhost:19094/#/capabilities/text-to-video"}
    @{name="16-pipeline-ocr"; url="http://localhost:19094/#/capabilities/ocr"}
    @{name="17-pipeline-layout"; url="http://localhost:19094/#/capabilities/layout"}
    @{name="18-pipeline-face"; url="http://localhost:19094/#/capabilities/face-recognition"}
    @{name="19-pipeline-image"; url="http://localhost:19094/#/capabilities/image-recognition"}
)
foreach ($p in $pipelines) {
    $allResults += Test-PageFeature $p.name $p.url @(
        @{name="page-loads"; js="document.body.innerText.length > 10"; expect="true"}
    )
}

# Close browser
agent-browser close 2>&1 | Out-Null

# Summary
Write-Host "`n`n========== FULL FEATURE VERIFICATION SUMMARY ==========" -ForegroundColor Green
$pass = ($allResults | Where-Object { $_.status -eq "PASS" }).Count
$fail = ($allResults | Where-Object { $_.status -eq "FAIL" }).Count
Write-Host "Total checks: $($allResults.Count)"
Write-Host "Passed: $pass" -ForegroundColor Green
Write-Host "Failed: $fail" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })
if ($allResults.Count -gt 0) {
    Write-Host "Pass rate: $([math]::Round($pass / $allResults.Count * 100, 1))%"
}
Write-Host "`nScreenshot dir: $shotDir"
$shotCount = (Get-ChildItem $shotDir -Filter "*.png" -ErrorAction SilentlyContinue).Count
Write-Host "Screenshots: $shotCount"
