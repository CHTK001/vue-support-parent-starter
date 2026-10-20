# Playwright 全量验收测试
# 输出直接 tee 到日志文件，stdout/stderr 不混进 PowerShell 管道缓冲

$env:MS_E2E_BASE_URL = "http://127.0.0.1:8851"
$env:MS_API_TARGET = "http://192.168.50.198:8112"

$start = Get-Date
$log = "D:\ch\project\.tmp\pw-full-run.log"
$report = "D:\ch\project\.tmp\accept-report\report.json"

Write-Host "=== Playwright 全量验收 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
Write-Host "日志: $log"
Write-Host "报告: $report"

# 用 Start-Process 启动 PowerShell 子进程运行 Playwright，
# stdout/stderr 直接 tee 到日志文件，不经过父进程管道
$pwsh = Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "`$env:MS_E2E_BASE_URL='http://127.0.0.1:8851'; `$env:MS_API_TARGET='http://192.168.50.198:8112';",
    "node node_modules\@playwright\test\cli.js test --config playwright.accept.config.ts --timeout 0 --workers 1 | Tee-Object -FilePath '$log' -Append; exit `$LASTEXITCODE"
  ) `
  -PassThru `
  -NoNewWindow `
  -Wait

$exitCode = $pwsh.ExitCode
$elapsed = (Get-Date) - $start
Write-Host ""
Write-Host "=== Playwright 结束 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
Write-Host "耗时: $($elapsed.ToString('hh\:mm\:ss'))"
Write-Host "退出码: $exitCode"

# 读取 JSON 报告
if (Test-Path $report) {
  try {
    $r = Get-Content $report -Encoding UTF8 | ConvertFrom-Json
    Write-Host ""
    Write-Host "=== 报告汇总 ==="
    Write-Host "总: $($r.stats.total)  通过: $($r.stats.passed)  失败: $($r.stats.failed)  跳过: $($r.stats.skipped)"
    Write-Host "总计时: $($r.stats.totalTime)"
  } catch { Write-Host "[报告解析失败] $_" }
}
exit $exitCode
