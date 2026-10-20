function e(e){let t=(e||``).trim();if(!t)return``;let n=Math.max(t.lastIndexOf(`/`),t.lastIndexOf(`\\`)),r=n>=0?t.slice(n+1):t;if(!r)return``;let i=``;for(let e of r)`\\+*?()[]{}|^$.`.includes(e)&&(i+=`\\`),i+=e;let a=i.charAt(0);return/[0-9A-Za-z]/.test(a)?`[${a}]${i.slice(1)}`:i}var t=`if [ -f app.pid ]; then
  pid=$(cat app.pid)
  kill $pid 2>/dev/null
  i=0
  while kill -0 $pid 2>/dev/null && [ $i -lt 10 ]; do
    sleep 1
    i=$((i + 1))
  done
  kill -9 $pid 2>/dev/null
  rm -f app.pid
fi
# >>> ORPHAN_REAPER
# 兜底：app.pid 陈旧/丢失时回收本项目残留进程。模式首字符用字符类以免匹配到脚本自身；
# 并限定「工作目录=本项目目录」，避免误杀主入口同名的其它项目。
if [ -d /proc ] && [ -n '__PATH__' ]; then
  for __p in $(pgrep -f '__SELFPATTERN__' 2>/dev/null); do
    [ "$__p" = "$$" ] && continue
    [ "$(readlink /proc/$__p/cwd 2>/dev/null)" = '__PATH__' ] && kill -9 "$__p" 2>/dev/null
  done
else
  pkill -9 -f '__SELFPATTERN__' 2>/dev/null
fi
true
# <<< ORPHAN_REAPER`,n=`if [ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null; then
  echo running
else
  echo stopped
fi`,r=`cd '__PATH__' 2>/dev/null || true;
`,i=[{id:`linux-springboot`,name:`SpringBoot 单体 (java -jar)`,desc:`后台运行 jar，PID 写入 app.pid，含 prod profile`,os:`linux`,types:[`springboot`],needEntry:!0,start:`${r}nohup java __JVMARGS__ -jar __ENTRY__ --spring.profiles.active=prod __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,stop:t,restart:`${t}
sleep 2
${r}nohup java __JVMARGS__ -jar __ENTRY__ --spring.profiles.active=prod __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,status:n},{id:`linux-fatjar`,name:`FatJar (java -jar)`,desc:`后台运行通用 jar，PID 写入 app.pid（不带 profile）`,os:`linux`,types:[`fatjar`,`springboot`],needEntry:!0,start:`${r}nohup java __JVMARGS__ -jar __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,stop:t,restart:`${t}
sleep 2
${r}nohup java __JVMARGS__ -jar __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,status:n},{id:`linux-binary`,name:`可执行二进制 (分离式)`,desc:`直接后台运行主入口二进制，PID 写入 app.pid`,os:`linux`,types:[`separated`],needEntry:!0,start:`${r}chmod +x __ENTRY__;
nohup ./__ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,stop:t,restart:`${t}
sleep 2
${r}chmod +x __ENTRY__;
nohup ./__ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,status:n},{id:`linux-shell`,name:`自带脚本 (start.sh/stop.sh)`,desc:`调用项目自带的 start.sh / stop.sh / restart.sh`,os:`linux`,types:[`separated`,`*`],needEntry:!1,start:`chmod +x *.sh
./start.sh`,stop:`chmod +x *.sh
./stop.sh`,restart:`chmod +x *.sh
./restart.sh`,status:`[ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null && echo running || echo stopped`},{id:`linux-node`,name:`Node 应用`,desc:`后台运行 node 主入口（如 app.js），PID 写入 app.pid`,os:`linux`,types:[`separated`,`*`],needEntry:!0,start:`${r}nohup node __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,stop:t,restart:`${t}
sleep 2
${r}nohup node __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,status:n},{id:`linux-static-nginx`,name:`静态页面 (Nginx 托管)`,desc:`使用本机 Nginx 托管静态站点；状态/停止只认本项目 logs/nginx.pid，避免误杀/误报其它项目的 nginx`,os:`linux`,types:[`static`,`nginx`],needEntry:!1,start:`nginx`,stop:`nginx -s stop 2>/dev/null
if [ -f logs/nginx.pid ]; then kill $(cat logs/nginx.pid) 2>/dev/null; rm -f logs/nginx.pid; fi`,restart:`if [ -f logs/nginx.pid ] && kill -0 $(cat logs/nginx.pid) 2>/dev/null; then
  nginx -s reload
else
  nginx
fi`,status:`if [ -f logs/nginx.pid ] && kill -0 $(cat logs/nginx.pid) 2>/dev/null; then
  echo running
else
  echo stopped
fi`},{id:`linux-static-python`,name:`静态页面 (Python http.server)`,desc:`无需 Nginx，python3 内置 HTTP 服务监听 80 端口`,os:`linux`,types:[`static`],needEntry:!1,start:`${r}nohup python3 -m http.server 80 __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,stop:t,restart:`${t}
sleep 2
${r}nohup python3 -m http.server 80 __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,status:n},{id:`linux-python`,name:`Python 应用`,desc:`后台运行 python3 主入口（如 main.py / app.py），PID 写入 app.pid`,os:`linux`,types:[`separated`,`*`],needEntry:!0,start:`${r}nohup python3 __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,stop:t,restart:`${t}
sleep 2
${r}nohup python3 __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,status:`pgrep -f 'python3 __ENTRY__' >/dev/null 2>&1 && echo running || echo stopped`},{id:`linux-docker-compose`,name:`Docker Compose 编排`,desc:`docker compose 管理（up -d / down / restart）`,os:`linux`,types:[`*`],needEntry:!1,start:`docker compose up -d`,stop:`docker compose down`,restart:`docker compose restart`,status:`docker compose ps --status running --quiet | grep -q . && echo running || echo stopped`},{id:`linux-systemd`,name:`systemd 服务`,desc:`通过 systemctl 管理（需已注册同名服务，需要 root）`,os:`linux`,types:[`*`],needEntry:!1,start:`systemctl start __APPNAME__`,stop:`systemctl stop __APPNAME__`,restart:`systemctl restart __APPNAME__`,status:`systemctl is-active __APPNAME__`}],a=`$ErrorActionPreference = 'SilentlyContinue'
if (Test-Path 'app.pid') { Get-Content 'app.pid' | ForEach-Object { & taskkill.exe /PID $_ /T /F | Out-Null }; Remove-Item 'app.pid' -Force }
# >>> ORPHAN_REAPER
# 兜底：app.pid 陈旧/丢失时按命令行回收本项目残留进程（CIM 不可用时静默跳过）
try {
  $re = '__SELFPATTERN__'
  foreach ($op in (Get-CimInstance Win32_Process -ErrorAction Stop |
      Where-Object { $_.CommandLine -and $_.ProcessId -ne $PID -and $_.CommandLine -match $re })) {
    & taskkill.exe /PID $op.ProcessId /T /F | Out-Null
  }
} catch { }
# <<< ORPHAN_REAPER`,o=`${a}
exit 0`,s=`if (Test-Path 'app.pid') { if (Get-Process -Id (Get-Content 'app.pid') -ErrorAction SilentlyContinue) { 'running' } else { 'stopped' } } else { 'stopped' }`,c=(e,t)=>`$all = ${t}
$argLine = $all -join ' '
$inner = '${e} ' + $argLine + ' __LOGOP__ "__LOG__" 2>&1'
$cmdLine = 'cmd /c ' + $inner
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmdLine; CurrentDirectory = '__PATH__' }
if ($r.ReturnValue -ne 0) {
  $wmiCode = $r.ReturnValue
  $sp = Start-Process -FilePath 'cmd.exe' -ArgumentList ('/c ' + $inner) -WorkingDirectory '__PATH__' -WindowStyle Hidden -PassThru
  $r = [pscustomobject]@{ ReturnValue = 0; ProcessId = $sp.Id }
  Write-Output ('WMI 创建进程被拒(code=' + $wmiCode + ')，已回退 Start-Process pid=' + $sp.Id)
}
if ($r.ReturnValue -ne 0) { throw ('启动失败 Win32_Process.Create code=' + $r.ReturnValue) }
$r.ProcessId | Out-File -FilePath 'app.pid' -Encoding ascii
Write-Output $r.ProcessId`,l=[{id:`win-springboot`,name:`SpringBoot / FatJar (java -jar)`,desc:`隐藏窗口运行 jar，按命令行匹配停止进程`,os:`windows`,types:[`springboot`,`fatjar`],needEntry:!0,start:c(`java`,`@($JvmArgs) + @('-jar','"__ENTRY__"') + @($AppArgs)`),stop:o,restart:`${a}
Start-Sleep -Seconds 2
${c(`java`,`@($JvmArgs) + @('-jar','"__ENTRY__"') + @($AppArgs)`)}`,status:s},{id:`win-ps1`,name:`自带脚本 (start.ps1/stop.ps1)`,desc:`调用项目自带的 PowerShell 脚本`,os:`windows`,types:[`separated`,`*`],needEntry:!1,start:`.start.ps1`,stop:`.stop.ps1`,restart:`.\restart.ps1`,status:`if (Get-Process | Where-Object { $_.ProcessName -like '*__APPNAME__*' }) { 'running' } else { 'stopped' }`},{id:`win-node`,name:`Node 应用`,desc:`隐藏窗口运行 node 主入口，按命令行匹配停止`,os:`windows`,types:[`separated`,`*`],needEntry:!0,start:c(`node`,`@('"__ENTRY__"') + @(__ARGS__)`),stop:o,restart:`${a}
Start-Sleep -Seconds 2
${c(`node`,`@('"__ENTRY__"') + @(__ARGS__)`)}`,status:s},{id:`win-nginx`,name:`静态页面 / Nginx`,desc:`在项目目录下经 WMI 脱离会话启动 nginx，按 app.pid 停止/判状态`,os:`windows`,types:[`static`,`nginx`],needEntry:!1,start:`$cmd = 'cmd /c nginx.exe __LOGOP__ "__LOG__" 2>&1'
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd; CurrentDirectory = '__PATH__' }
if ($r.ReturnValue -ne 0) { throw ('启动失败 Win32_Process.Create code=' + $r.ReturnValue) }
$r.ProcessId | Out-File -FilePath 'app.pid' -Encoding ascii
Write-Output $r.ProcessId`,stop:o,restart:`${a}
Start-Sleep -Seconds 2
$cmd = 'cmd /c nginx.exe __LOGOP__ "__LOG__" 2>&1'
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd; CurrentDirectory = '__PATH__' }
if ($r.ReturnValue -ne 0) { throw ('启动失败 Win32_Process.Create code=' + $r.ReturnValue) }
$r.ProcessId | Out-File -FilePath 'app.pid' -Encoding ascii
Write-Output $r.ProcessId`,status:s},{id:`win-python`,name:`Python 应用`,desc:`隐藏窗口运行 python 主入口，按命令行匹配停止`,os:`windows`,types:[`separated`,`*`],needEntry:!0,start:c(`python`,`@('"__ENTRY__"') + @(__ARGS__)`),stop:o,restart:`${a}
Start-Sleep -Seconds 2
${c(`python`,`@('"__ENTRY__"') + @(__ARGS__)`)}`,status:s},{id:`win-docker-compose`,name:`Docker Compose 编排`,desc:`docker compose 管理（up -d / down / restart）`,os:`windows`,types:[`*`],needEntry:!1,start:`docker compose up -d`,stop:`docker compose down`,restart:`docker compose restart`,status:`if (docker compose ps --status running --quiet) { 'running' } else { 'stopped' }`},{id:`win-svc`,name:`Windows 服务`,desc:`通过服务名管理（需已注册同名服务）`,os:`windows`,types:[`*`],needEntry:!1,start:`Start-Service -Name '__APPNAME__'`,stop:`Stop-Service -Name '__APPNAME__'`,restart:`Restart-Service -Name '__APPNAME__' -Force`,status:`(Get-Service -Name '__APPNAME__').Status`}],u=[...i,...l];function d(e,t){return u.filter(n=>n.os===e?n.types.includes(t)||n.types.includes(`*`):!1)}function f(e){let t=(e||``).trim();if(!t)return`app.log`;let n=/[\\/]$/.test(t)||!/\.[a-zA-Z0-9]+$/.test(t),r=t.includes(`\\`)&&!t.includes(`/`)?`\\`:`/`;return n?`${t.replace(/[\\/]+$/,``)}${r}app.log`:t}function p(t,n){let r=(n.entry||``).trim();if(t.needEntry&&!r)throw Error(`请先填写「主入口名称」（如 user-service.jar）`);let i={__ENTRY__:r,__LOG__:f(n.log),__PATH__:(n.path||``).trim(),__APPNAME__:(n.appName||`app`).trim(),__LOGOP__:n.logOp||`>`,__SELFPATTERN__:e(r)},a=e=>{let t=e.replace(/__ENTRY__|__LOG__|__PATH__|__APPNAME__|__LOGOP__|__SELFPATTERN__/g,e=>i[e]??e).replace(/^# (>>>|<<<) ORPHAN_REAPER$\n?/gm,``);return i.__SELFPATTERN__?t:t.replace(/[^\n]*# >>> ORPHAN_REAPER\n[\s\S]*?# <<< ORPHAN_REAPER\n?/g,``)};return{start:a(t.start),stop:a(t.stop),restart:a(t.restart),status:t.status?a(t.status):``}}export{d as n,p as t};