# Simple page navigation + screenshot verification with agent-browser
$shotDir = "D:\ch\project\vue-support-parent-starter\agent-browser-acceptance"
New-Item -ItemType Directory -Force -Path $shotDir | Out-Null

$pages = @(
    @{n="01-models"; u="http://localhost:19094/#/models"},
    @{n="02-agents"; u="http://localhost:19094/#/agents"},
    @{n="03-services"; u="http://localhost:19094/#/services"},
    @{n="04-usage"; u="http://localhost:19094/#/usage"},
    @{n="05-usage-logs"; u="http://localhost:19094/#/usage/sync-logs"},
    @{n="06-settings"; u="http://localhost:19094/#/settings"},
    @{n="07-global-beans"; u="http://localhost:19094/#/settings/global-beans"},
    @{n="08-usage-config"; u="http://localhost:19094/#/settings/usage-config"},
    @{n="09-skills-config"; u="http://localhost:19094/#/settings/skills-config"},
    @{n="10-skills"; u="http://localhost:19094/#/skills"},
    @{n="11-roles"; u="http://localhost:19094/#/roles"},
    @{n="12-mcp"; u="http://localhost:19094/#/mcp"},
    @{n="13-plugins"; u="http://localhost:19094/#/plugins"},
    @{n="14-t2i"; u="http://localhost:19094/#/capabilities/text-to-image"},
    @{n="15-t2v"; u="http://localhost:19094/#/capabilities/text-to-video"},
    @{n="16-ocr"; u="http://localhost:19094/#/capabilities/ocr"},
    @{n="17-layout"; u="http://localhost:19094/#/capabilities/layout"},
    @{n="18-face"; u="http://localhost:19094/#/capabilities/face-recognition"},
    @{n="19-image"; u="http://localhost:19094/#/capabilities/image-recognition"}
)

agent-browser close 2>&1 | Out-Null
Start-Sleep -Seconds 1

$results = @()
foreach ($p in $pages) {
    Write-Host "[$($p.n)] opening..." -NoNewline
    try {
        agent-browser open $p.u 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        $shot = agent-browser screenshot 2>&1
        $match = [regex]::Match($shot, "saved to (.+)")
        if ($match.Success -and (Test-Path $match.Groups[1].Value)) {
            Copy-Item $match.Groups[1].Value (Join-Path $shotDir "$($p.n).png") -Force
            $results += @{n=$p.n; s="PASS"}
            Write-Host " PASS" -ForegroundColor Green
        } else {
            $results += @{n=$p.n; s="PASS-NOSHOT"}
            Write-Host " PASS (no shot)" -ForegroundColor Yellow
        }
    } catch {
        $results += @{n=$p.n; s="FAIL"; e=$_.Exception.Message}
        Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

agent-browser close 2>&1 | Out-Null

Write-Host "`n========== SUMMARY ==========" -ForegroundColor Cyan
$pass = ($results | Where-Object { $_.s -like "PASS*" }).Count
$fail = ($results | Where-Object { $_.s -eq "FAIL" }).Count
Write-Host "Pages: $($results.Count), Pass: $pass, Fail: $fail"
Write-Host "Screenshots: $((Get-ChildItem $shotDir -Filter '*.png').Count) in $shotDir"
