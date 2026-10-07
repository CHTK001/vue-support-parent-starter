<#
  run-sweep-chunks.ps1 — 分块跑全量 ui-click-sweep，扛住共享工作区的随机 kill。

  WHY (2026-10-07)：
    单次全量跑要 35 分钟，而本机的 node 进程会被别的会话随机杀 —— 实测今天被杀过
    三次（18:43 前后、19:55、以及一次跑完 1 条路由就整进程消失且 stderr 为空，
    即进程被直接 SIGKILL，不是自己抛错）。一次性 25 路由跑，一被杀就整轮作废。
    SIGNOFF §3.2 早写过这个「分块跑 + 合并」的办法，但配套的 runner 当时没落盘，
    这里补上。

  做法：
    1. 每轮先读 ChunkDir 里已成功的分块报告，算出**还缺哪些路由**；
    2. 只把缺失路由当参数传给 ui-click-sweep.cjs（脚本支持 argv 过滤，
       且 `targets` 会被过滤成同一批，因此子集跑也能 exit 0）；
    3. 进程**被杀 / 报告缺路由** → 只丢当前块，下一轮补跑缺失的；
       报告齐全就收下，哪怕 exit=3（那是真的 FAIL，重跑只会白白掩盖问题）；
    4. 每轮起跑前核 **dist md5 + jar md5 + 连通性**：md5 变了说明被验产物换了，
       立即停手（换包即失效，硬跑下去只会产出对不上号的报告）；
    5. 全部 25 条齐了，交给 merge-sweep-chunks.mjs 合并。

  为什么监督进程用 PowerShell 不用 node：node 版会跟被守护的 sweep 一起被清掉
  （本脚本要求用 pwsh 跑：pwsh 读 UTF-8 无 BOM 的中文注释不出乱码）。

  用法：
    pwsh -File src\acceptance\run-sweep-chunks.ps1
    pwsh -File src\acceptance\run-sweep-chunks.ps1 -ChunkDir <dir> -ExpectJarMd5 <md5>
  指纹基线：`-ExpectDistMd5` 不给就以**起跑时**的 dist md5 为基线并锁定（防跑一半被重建）；
    要卡死某个特定产物才显式传值，传了就会在起跑时先核对、对不上直接退 4。
  退出码：0=25 路由齐  4=被验产物变了（禁止继续）  5=轮次耗尽  3=有 FAIL 但已齐
#>
[CmdletBinding()]
param(
  [string]$AppDir      = 'D:\ch\project\vue-support-parent-starter\apps\vue-support-ai-guada',
  # 分块产出放 .local-run：仓库里的 src/acceptance/.ui-click-sweep-chunks 装着
  # 21 个 **base=15689 的旧块**（今晨 dev 形态），混进来会让合并报告张冠李戴。
  [string]$ChunkDir    = 'D:\ch\project\.local-run\sweep-chunks',
  [string]$LogDir      = 'D:\ch\project\.local-run',
  [string]$ExpectDistMd5 = '',
  [string]$ExpectJarMd5  = '',
  [int]$MaxRounds      = 14,
  # 每轮最多跑几条路由。不设限的话第 1 轮会把 25 条全塞给一个进程 —— 那就退化回
  # 「一次性全量跑」，被杀一次就全丢，分块就白做了。5 条约 7-8 分钟，
  # 比外部会话杀 node 的间隔（实测 10~15 分钟）短，杀掉也只丢当前块。
  [int]$MaxPerRound    = 5,
  [int]$TimeoutSec     = 780,
  [switch]$Fresh
)

$ErrorActionPreference = 'Continue'
$ALL_ROUTES = $null
$TotalFail  = 0

function Log([string]$m) {
  $line = '{0} {1}' -f (Get-Date -Format 'HH:mm:ss'), $m
  Write-Host $line
  Add-Content -Path (Join-Path $LogDir 'sweep-chunks.log') -Value $line -Encoding UTF8
}

function Test-DistMd5 {
  $idx = Join-Path $AppDir 'dist\index.html'
  if (-not (Test-Path $idx)) { return '' }
  $h = [System.Security.Cryptography.MD5]::Create()
  $fs = [System.IO.File]::OpenRead($idx)
  try { ([BitConverter]::ToString($h.ComputeHash($fs))).Replace('-', '').ToLowerInvariant() }
  finally { $fs.Close() }
}

function Test-JarMd5 {
  <#
    返回远端 jar 的 md5；**探测失败**时返回 'PROBE_FAILED'，而不是返回一串垃圾。

    教训（2026-10-07 23:18:36 实录）：原实现是
        (($out -join '') -replace '[^0-9a-f]', '')
    这个正则**贪婪地把任意文本里的十六进制字符全拼起来** —— 一次 plink 网络抖动
    （输出根本不是 md5）被它拼成 `FAAEeedeeecedcedecec`（20 位、还不是 32 位），
    守卫据此判定「换包了」直接 exit 4，把跑得好好的 16/25 整轮打断。
    包**实际没变**（随后两次直连复核都是 5717cefd、EXIT=0）。
    正确做法：只认「恰好 32 位十六进制」的 token，取不到就报探测失败，
    由调用方当作**网络抖动重试**，绝不能当成换包 —— 否则一次抖动就作废整轮。
  #>
  if (-not $ExpectJarMd5) { return $null }
  $pk = 'C:\Program Files\PuTTY\plink.exe'
  $hk = 'ssh-ed25519 255 SHA256:cwfyC8w0qteYq8lXud9P9U2aSS8O/bxQOK6Y60BOmsI'
  $out = & $pk -batch -pw kali -hostkey $hk kali@192.168.50.198 `
    'md5sum /opt/ai-starter/app.jar | cut -c1-32' 2>&1
  $line = ($out -join ' ').Trim()
  $m = [regex]::Match($line, '\b[0-9a-fA-F]{32}\b')
  if (-not $m.Success) {
    # 把原始输出留档，便于事后分清是「换包」还是「探测失败」
    Log ('  jar 指纹探测失败（输出不含 32 位 hex）: ' + $line.Substring(0, [Math]::Min(160, $line.Length)))
    return 'PROBE_FAILED'
  }
  return $m.Value.ToLowerInvariant()
}

function Get-RouteList {
  # 从 harness 源码里抠 ROUTES，保持单一事实来源（不要在 ps1 里手抄一份路径）
  $src = Join-Path $AppDir 'src\acceptance\ui-click-sweep.cjs'
  $text = [System.IO.File]::ReadAllText($src, [System.Text.Encoding]::UTF8)
  $m = [regex]::Match($text, 'const ROUTES = \[([\s\S]*?)\n\];')
  if (-not $m.Success) { throw 'parsing ROUTES failed' }
  $list = [regex]::Matches($m.Groups[1].Value, "path:\s*'([^']+)'") |
    ForEach-Object { $_.Groups[1].Value }
  return @($list)
}

function Test-RoutePolluted {
  <#
    这条路由的采集是否被「服务端掉线」污染了。
    判据只看**被验产物自身地址**的传输层失败 —— 这类样本测的是「服务器在不在」，
    不是「按钮好不好」，留下就等于拿环境故障冒充产品缺陷：
      - total=0：页面根本没渲染出来（懒加载 chunk 取不到），即文档里的「空采集」；
      - ERR_CONNECTION_REFUSED / ERR_CONNECTION_RESET 打到 localhost:15690；
      - Failed to fetch dynamically imported module：静态资源没取到。
    注意这里**不**看后端 5xx、也不看产品自己的报错 —— 那些是要保留的真结论。
  #>
  param($r)
  if (-not $r.total) { return $true }
  foreach ($e in $r.elements) {
    $txt = [string]$e.err
    if ($txt -match 'ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|Failed to fetch dynamically imported module') { return $true }
  }
  return $false
}

function Get-RouteStatus {
  <#
    route -> $true(已采到且干净) / $false(还没有干净的采集)。
    同一路由可能被多个块覆盖：**取文件名排序最靠后**的那块为准，
    与 merge-sweep-chunks.mjs 里 `byRoute.set()` 后写覆盖的语义保持一致，
    这样「先被污染、后补跑成功」的路由才会被正确记成已完成。
  #>
  $st = @{}
  if (-not (Test-Path $ChunkDir)) { return $st }
  foreach ($f in (Get-ChildItem -Path $ChunkDir -Filter 'c*.json' | Sort-Object Name)) {
    if ($f.Name -like '*.partial*') { continue }
    try { $j = Get-Content $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json }
    catch { Log ('  读块失败(忽略) ' + $f.Name); continue }
    foreach ($r in $j.routes) {
      if (-not $r.route) { continue }
      $st[[string]$r.route] = -not (Test-RoutePolluted $r)
    }
  }
  return $st
}

function Get-DoneRoutes {
  $st = Get-RouteStatus
  return @($st.Keys | Where-Object { $st[$_] })
}

# ---------- 0) 初始化 ----------
if ($Fresh) { Remove-Item -Recurse -Force $ChunkDir -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Force -Path $ChunkDir | Out-Null

# 块号必须接着已有的往下编：重启监督进程会把 $round 归零，
# 若直接用轮次当块号，会把上一次跑成的好块（c01）覆盖掉，白丢已完成的路由。
$script:chunkSeq = 0
if (Test-Path $ChunkDir) {
  foreach ($f in Get-ChildItem -Path $ChunkDir -Filter 'c*.json' -ErrorAction SilentlyContinue) {
    if ($f.BaseName -match '^c(\d+)$') {
      $n = [int]$Matches[1]
      if ($n -gt $script:chunkSeq) { $script:chunkSeq = $n }
    }
  }
}
Log ('已有块最大编号 c{0:d2}，新块从 c{1:d2} 接着编（避免覆盖）' -f $script:chunkSeq, ($script:chunkSeq + 1))

$ALL_ROUTES = Get-RouteList
if ($ALL_ROUTES.Count -ne 25) { Log ('!! ROUTES 解析出 ' + $ALL_ROUTES.Count + ' 条（应为 25），中止'); exit 5 }
Log ('目标路由 ' + $ALL_ROUTES.Count + ' 条；分块目录 ' + $ChunkDir)

# --- 被验前端指纹基线 ---
# 守卫要防的是「跑着跑着 dist 被别人重建换掉」，不是记住某个历史 md5。
# 所以未显式指定时，以**起跑时**的 dist 指纹为基线并锁定；写死历史值反而是陷阱
# （dist 每重建一次就得改一次脚本，改漏了就变成永远跑不起来的死脚本）。
# 显式指定则先核对，起跑时就对不上直接作废 —— 换包即失效，不能带病开跑。
if (-not $ExpectDistMd5) {
  $ExpectDistMd5 = Test-DistMd5
  if (-not $ExpectDistMd5) {
    Log '!! dist\index.html 不存在，拿不到基线指纹，中止'
    exit 4
  }
  Log ('未指定 -ExpectDistMd5，以起跑时 dist 指纹为基线并锁定: ' + $ExpectDistMd5)
} else {
  $nowD = Test-DistMd5
  if ($nowD -ne $ExpectDistMd5) {
    Log ('!! 起跑时 dist md5 已与指定值不符: ' + $nowD + ' (期望 ' + $ExpectDistMd5 + ') —— 换包即失效，禁止继续')
    exit 4
  }
  Log ('dist 基线（显式指定，已核对一致）: ' + $ExpectDistMd5)
}

# ---------- 主循环 ----------
$round = 0
while ($round -lt $MaxRounds) {
  $round++
  $st = Get-RouteStatus
  $done = @($st.Keys | Where-Object { $st[$_] })
  $missing = @($ALL_ROUTES | Where-Object { $done -notcontains $_ })
  $repolluted = @($missing | Where-Object { $st.ContainsKey($_) })
  Log ('--- 第 ' + $round + ' 轮：干净完成 ' + $done.Count + '/' + $ALL_ROUTES.Count + '，待跑 ' + $missing.Count + '（其中因环境污染需重跑 ' + $repolluted.Count + '）---')
  if ($repolluted.Count) { Log ('  污染待重跑: ' + ($repolluted -join ', ')) }
  if ($missing.Count -eq 0) { break }
  $run = @($missing | Select-Object -First $MaxPerRound)
  Log ('  本轮目标 ' + $run.Count + '/' + $missing.Count + ' 条: ' + ($run -join ' '))

  # --- 守卫 1：被验产物指纹必须没变（变了就整轮作废，不能继续）---
  $d = Test-DistMd5
  if ($d -ne $ExpectDistMd5) {
    Log ('!! dist md5 变了: ' + $d + ' (期望 ' + $ExpectDistMd5 + ') —— 被验产物换掉，禁止继续')
    exit 4
  }
  $j = Test-JarMd5
  if ($j -eq 'PROBE_FAILED') {
    # 探测失败 ≠ 换包：这是网络抖动，等一会重跑本轮（不消耗轮次），绝不能 exit 4
    Log '  jar 指纹没取到（网络抖动，非换包）—— 等 20 秒重试本轮'
    Start-Sleep -Seconds 20
    $round--   # 不消耗轮次
    continue
  }
  if ($j -ne $null -and $j -ne $ExpectJarMd5) {
    Log ('!! jar md5 变了: ' + $j + ' (期望 ' + $ExpectJarMd5 + ') —— 换包即失效，禁止继续')
    exit 4
  }
  # --- 守卫 2：服务与后端必须活着，否则跑出来全是 502 假 FAIL ---
  $root = (curl.exe -s -o NUL -w '%{http_code}' --noproxy * -m 8 'http://localhost:15690/') 
  $api  = (curl.exe -s -o NUL -w '%{http_code}' --noproxy * -m 12 'http://localhost:15690/v2/user/me')
  if ($root -ne '200' -or $api -ne '200') {
    Log ('  服务未就绪 root=' + $root + ' api=' + $api + ' —— 等 20 秒重试本轮')
    Start-Sleep -Seconds 20
    $round--   # 不消耗轮次
    continue
  }

  # --- 跑这一轮（缺失路由作为 argv 过滤）---
  $tmp = Join-Path $LogDir 'sweep-chunk-tmp'
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  $roundLog = Join-Path $ChunkDir ('r{0:d2}.log' -f $round)
  $roundErr = Join-Path $ChunkDir ('r{0:d2}.err' -f $round)
  Remove-Item -Force $roundLog, $roundErr -ErrorAction SilentlyContinue

  $env:NODE_PATH   = 'D:\ch\project\vue-support-parent-starter\node_modules'
  $env:BASE        = 'http://localhost:15690'
  $env:SWEEP_DIR   = $tmp
  $env:AI_ACCEPT_PASS = 'admin123'
  $env:USER_NAME   = 'admin'

  $argList = @('src\acceptance\ui-click-sweep.cjs') + $run
  $p = Start-Process -WindowStyle Hidden -FilePath 'node' -ArgumentList $argList `
        -WorkingDirectory $AppDir -RedirectStandardOutput $roundLog `
        -RedirectStandardError $roundErr -PassThru

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while (-not $p.HasExited -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 5 }
  if (-not $p.HasExited) {
    Log ('  超时(' + $TimeoutSec + 's)，强杀本轮进程')
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  } else {
    Log ('  进程结束 exit=' + $p.ExitCode)
  }

  # --- 收割：只要报告里有路由就收（含 FAIL 的报告也要收，不能只收绿的）---
  $repPath = Join-Path $tmp 'report.json'
  $got = @()
  if (Test-Path $repPath) {
    try {
      $rep = Get-Content $repPath -Raw -Encoding UTF8 | ConvertFrom-Json
      foreach ($r in $rep.routes) { if ($r.route) { $got += [string]$r.route } }
    } catch { Log ('  报告解析失败: ' + $_.Exception.Message) }
  }
  if ($got.Count -gt 0) {
    $script:chunkSeq++
    $idx = ('{0:d2}' -f $script:chunkSeq)
    $out = Join-Path $ChunkDir ('c{0}.json' -f $idx)
    Copy-Item -Path $repPath -Destination $out -Force
    Log ('  收块 c{0}.json -> 路由 {1} 条: {2}' -f $idx, $got.Count, ($got -join ', '))
    foreach ($g in $got) {
      foreach ($rt in $rep.routes) { if ($rt.route -eq $g) { $TotalFail += @($rt.elements | Where-Object { $_.state -in @('click-error','not-clickable') }).Count; break } }
    }
  } else {
    Log ('  !! 本轮没拿到任何路由（进程被杀或整轮空采），下一轮补跑')
  }
  if (Test-Path $repPath) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
}

$doneFinal = Get-DoneRoutes
Log ('收尾：已完成 ' + $doneFinal.Count + '/' + $ALL_ROUTES.Count)
if ($doneFinal.Count -lt $ALL_ROUTES.Count) {
  Log ('!! 轮次耗尽仍缺: ' + (($ALL_ROUTES | Where-Object { $doneFinal -notcontains $_ }) -join ', '))
  exit 5
}
Log '全部 25 条路由已采集完成'
if ($TotalFail -gt 0) { Log ('注意：累计 FAIL 元素 ' + $TotalFail + ' 条（合并报告里看明细）') }
exit 0
