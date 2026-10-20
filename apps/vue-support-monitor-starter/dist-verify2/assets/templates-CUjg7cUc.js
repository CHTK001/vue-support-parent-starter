//#region ../../packages/ui/src/components/ReCommand/templates.ts
/** 正则元字符：与后端 selfSafePattern 的转义集合保持一致 */
var REGEX_META = "\\+*?()[]{}|^$.";
/**
* 生成「自安全」的主入口匹配模式。
*
* 首字符写成字符类（`smoke.jar` → `[s]moke\.jar`），
* 否则 `pgrep -f` / `Get-CimInstance` 会把**执行该脚本的 shell 自身**也匹配进去，
* 导致停止脚本自杀、状态脚本永远报 running。
*
* 与后端 `ProjectScripts#selfSafePattern` 逐行等价：先去目录部分，
* 再对正则元字符逐个反斜杠转义（`.` 必须转义，否则 `smoke.jar` 会连带匹配
* `smokeXjar` 这类无关进程），最后把首字符包成字符类。
*
* @param entry 主入口名（可含路径，只取文件名部分）
* @returns 自安全匹配模式；入口为空时返回空串
*/
function selfSafePattern(entry) {
	const trimmed = (entry || "").trim();
	if (!trimmed) return "";
	const slash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
	const name = slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
	if (!name) return "";
	let escaped = "";
	for (const ch of name) {
		if (REGEX_META.includes(ch)) escaped += "\\";
		escaped += ch;
	}
	const first = escaped.charAt(0);
	if (/[0-9A-Za-z]/.test(first)) return `[${first}]${escaped.slice(1)}`;
	return escaped;
}
/**
* Linux 下通用的 PID 方式停止片段（java/node/python/二进制共用思路）。
* kill 只发 SIGTERM，JVM/运行时需优雅退出；10 秒内未退出升级为 SIGKILL，
* 否则「重启」会与旧进程抢 jar 与端口。
*
* 末尾的兜底段不可省：只按 app.pid 停止在 pid 陈旧（回滚还原备份不会更新 pid、
* 异常中断会留下未更新的 pid）时**完全失效**，残留进程会一直占着端口，
* 使后续启动 bind 失败 —— 实测出现过三个同类进程并存。
* 兜底按 /proc/<pid>/cwd 限定为本项目目录，避免误杀「主入口同名但属于别的项目」的进程。
*/
var LINUX_PID_STOP = `if [ -f app.pid ]; then
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
# <<< ORPHAN_REAPER`;
/**
* Linux PID 状态片段：内置启动模板都会写 app.pid，故**只以 app.pid 为准**。
*
* 这里刻意**不**加 `pgrep -f <主入口>` 兜底分支：状态脚本的命令行本身就含主入口路径，
* `pgrep -f` 会把执行脚本的 shell 自身也匹配进去，导致永远报 running。
* 原先那个 `pgrep -f ... | grep -qv "^$$\\$"` 的写法并不能修正 —— 双引号里 `$$`
* 展开成 shell 的 pid、`\$` 是字面量 `$`，拼出来的模式是 `^<pid>$`，
* 而 pgrep 输出的是裸 pid 行，永远匹配不上，过滤等于没写。
* 与后端 `ProjectScripts` 的 Linux status 模板保持一致。
*/
var LINUX_PID_STATUS = `if [ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null; then
  echo running
else
  echo stopped
fi`;
/**
* Linux 启动脚本首行：显式 cd 到项目目录并以 ';' 收尾。
* 调用方会拼接 `mkdir -p X && cd 'X' && `，而 `&&` 优先级高于 `&`：
* 若首行以 `&` 结尾，整条 && 链会被整体后台化 → cd 只在子 shell 生效（app.pid 写错目录），
* 且后台链持有 SSH channel 的 stdout，exec 永远等不到 EOF 而超时（退出码 -1）。
* 首行以 ';' 收尾可切断该链，只让 nohup 行被后台化。
*/
var LINUX_ENTER = `cd '__PATH__' 2>/dev/null || true;
`;
var LINUX_TEMPLATES = [
	{
		id: "linux-springboot",
		name: "SpringBoot 单体 (java -jar)",
		desc: "后台运行 jar，PID 写入 app.pid，含 prod profile",
		os: "linux",
		types: ["springboot"],
		needEntry: true,
		start: `${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ --spring.profiles.active=prod __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		stop: LINUX_PID_STOP,
		restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ --spring.profiles.active=prod __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		status: LINUX_PID_STATUS
	},
	{
		id: "linux-fatjar",
		name: "FatJar (java -jar)",
		desc: "后台运行通用 jar，PID 写入 app.pid（不带 profile）",
		os: "linux",
		types: ["fatjar", "springboot"],
		needEntry: true,
		start: `${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		stop: LINUX_PID_STOP,
		restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		status: LINUX_PID_STATUS
	},
	{
		id: "linux-binary",
		name: "可执行二进制 (分离式)",
		desc: "直接后台运行主入口二进制，PID 写入 app.pid",
		os: "linux",
		types: ["separated"],
		needEntry: true,
		start: `${LINUX_ENTER}chmod +x __ENTRY__;
nohup ./__ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		stop: LINUX_PID_STOP,
		restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}chmod +x __ENTRY__;
nohup ./__ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		status: LINUX_PID_STATUS
	},
	{
		id: "linux-shell",
		name: "自带脚本 (start.sh/stop.sh)",
		desc: "调用项目自带的 start.sh / stop.sh / restart.sh",
		os: "linux",
		types: ["separated", "*"],
		needEntry: false,
		start: `chmod +x *.sh
./start.sh`,
		stop: `chmod +x *.sh
./stop.sh`,
		restart: `chmod +x *.sh
./restart.sh`,
		status: `[ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null && echo running || echo stopped`
	},
	{
		id: "linux-node",
		name: "Node 应用",
		desc: "后台运行 node 主入口（如 app.js），PID 写入 app.pid",
		os: "linux",
		types: ["separated", "*"],
		needEntry: true,
		start: `${LINUX_ENTER}nohup node __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		stop: LINUX_PID_STOP,
		restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup node __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		status: LINUX_PID_STATUS
	},
	{
		id: "linux-static-nginx",
		name: "静态页面 (Nginx 托管)",
		desc: "使用本机 Nginx 托管静态站点；状态/停止只认本项目 logs/nginx.pid，避免误杀/误报其它项目的 nginx",
		os: "linux",
		types: ["static", "nginx"],
		needEntry: false,
		start: `nginx`,
		stop: `nginx -s stop 2>/dev/null
if [ -f logs/nginx.pid ]; then kill $(cat logs/nginx.pid) 2>/dev/null; rm -f logs/nginx.pid; fi`,
		restart: `if [ -f logs/nginx.pid ] && kill -0 $(cat logs/nginx.pid) 2>/dev/null; then
  nginx -s reload
else
  nginx
fi`,
		status: `if [ -f logs/nginx.pid ] && kill -0 $(cat logs/nginx.pid) 2>/dev/null; then
  echo running
else
  echo stopped
fi`
	},
	{
		id: "linux-static-python",
		name: "静态页面 (Python http.server)",
		desc: "无需 Nginx，python3 内置 HTTP 服务监听 80 端口",
		os: "linux",
		types: ["static"],
		needEntry: false,
		start: `${LINUX_ENTER}nohup python3 -m http.server 80 __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		stop: LINUX_PID_STOP,
		restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup python3 -m http.server 80 __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		status: LINUX_PID_STATUS
	},
	{
		id: "linux-python",
		name: "Python 应用",
		desc: "后台运行 python3 主入口（如 main.py / app.py），PID 写入 app.pid",
		os: "linux",
		types: ["separated", "*"],
		needEntry: true,
		start: `${LINUX_ENTER}nohup python3 __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		stop: LINUX_PID_STOP,
		restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup python3 __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
		status: `pgrep -f 'python3 __ENTRY__' >/dev/null 2>&1 && echo running || echo stopped`
	},
	{
		id: "linux-docker-compose",
		name: "Docker Compose 编排",
		desc: "docker compose 管理（up -d / down / restart）",
		os: "linux",
		types: ["*"],
		needEntry: false,
		start: `docker compose up -d`,
		stop: `docker compose down`,
		restart: `docker compose restart`,
		status: `docker compose ps --status running --quiet | grep -q . && echo running || echo stopped`
	},
	{
		id: "linux-systemd",
		name: "systemd 服务",
		desc: "通过 systemctl 管理（需已注册同名服务，需要 root）",
		os: "linux",
		types: ["*"],
		needEntry: false,
		start: `systemctl start __APPNAME__`,
		stop: `systemctl stop __APPNAME__`,
		restart: `systemctl restart __APPNAME__`,
		status: `systemctl is-active __APPNAME__`
	}
];
/**
* Windows 停止片段主体（不含 exit）：
* 重启 = 主体 + sleep + 启动；独立停止脚本再补 exit 0。
* 注意：不要把 exit 0 放进主体，否则「重启」脚本会在停止后就退出，启动步永不执行。
*
* 末尾的 CIM 兜底与 Linux 同理：app.pid 陈旧或丢失时只按 pid 停止完全失效。
* Windows 上没有等价于 /proc/<pid>/cwd 的廉价手段，故按命令行匹配；
* 为不误伤主入口同名的其它项目，模式走自安全字符类（首字符字符类），
* 并排除当前 PowerShell 自身（`-ne $PID`）—— 用 `-like` 通配会误伤且匹配不可控。
* 普通用户执行 Get-CimInstance 可能被拒，故整体 try/catch：CIM 不可用时静默跳过，
* 不影响按 app.pid 停止这条主路径。
*/
var WIN_PID_STOP_BODY = `$ErrorActionPreference = 'SilentlyContinue'
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
# <<< ORPHAN_REAPER`;
var WIN_PID_STOP = `${WIN_PID_STOP_BODY}
exit 0`;
/**
* Windows 状态脚本：仅以 app.pid 为准
* （SSH 会话内 WMI 枚举常被拒，故不做命令行匹配）
*/
var WIN_STATUS = `if (Test-Path 'app.pid') { if (Get-Process -Id (Get-Content 'app.pid') -ErrorAction SilentlyContinue) { 'running' } else { 'stopped' } } else { 'stopped' }`;
/**
* Windows 下经 WMI Win32_Process.Create 启动，脱离 WinRM/SSH 作业
* （会话命令结束时作业被回收，作业内的进程会被一并结束）。
* 返回的 ProcessId 为 cmd 外壳，停止时 taskkill /T 连子进程一并结束。
* stdout/err 由 cmd 重定向到日志文件。
*
* WMI 失败时回退 Start-Process：主机安全产品会拦截「经 WMI 创建进程」
* （实测 cmd.exe 返回 ReturnValue=2、java.exe 创建后秒死），
* 而 Start-Process 正常且能跨会话存活。仅在 WMI 失败时走这条，
* 健康主机行为完全不变。
*/
var winLaunch = (exe, buildArgs) => `$all = ${buildArgs}
$argLine = $all -join ' '
$inner = '${exe} ' + $argLine + ' __LOGOP__ "__LOG__" 2>&1'
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
Write-Output $r.ProcessId`;
var WINDOWS_TEMPLATES = [
	{
		id: "win-springboot",
		name: "SpringBoot / FatJar (java -jar)",
		desc: "隐藏窗口运行 jar，按命令行匹配停止进程",
		os: "windows",
		types: ["springboot", "fatjar"],
		needEntry: true,
		start: winLaunch("java", `@($JvmArgs) + @('-jar','"__ENTRY__"') + @($AppArgs)`),
		stop: WIN_PID_STOP,
		restart: `${WIN_PID_STOP_BODY}
Start-Sleep -Seconds 2
${winLaunch("java", `@($JvmArgs) + @('-jar','"__ENTRY__"') + @($AppArgs)`)}`,
		status: WIN_STATUS
	},
	{
		id: "win-ps1",
		name: "自带脚本 (start.ps1/stop.ps1)",
		desc: "调用项目自带的 PowerShell 脚本",
		os: "windows",
		types: ["separated", "*"],
		needEntry: false,
		start: `.\start.ps1`,
		stop: `.\stop.ps1`,
		restart: `.\restart.ps1`,
		status: `if (Get-Process | Where-Object { $_.ProcessName -like '*__APPNAME__*' }) { 'running' } else { 'stopped' }`
	},
	{
		id: "win-node",
		name: "Node 应用",
		desc: "隐藏窗口运行 node 主入口，按命令行匹配停止",
		os: "windows",
		types: ["separated", "*"],
		needEntry: true,
		start: winLaunch("node", `@('"__ENTRY__"') + @(__ARGS__)`),
		stop: WIN_PID_STOP,
		restart: `${WIN_PID_STOP_BODY}
Start-Sleep -Seconds 2
${winLaunch("node", `@('"__ENTRY__"') + @(__ARGS__)`)}`,
		status: WIN_STATUS
	},
	{
		id: "win-nginx",
		name: "静态页面 / Nginx",
		desc: "在项目目录下经 WMI 脱离会话启动 nginx，按 app.pid 停止/判状态",
		os: "windows",
		types: ["static", "nginx"],
		needEntry: false,
		start: `$cmd = 'cmd /c nginx.exe __LOGOP__ "__LOG__" 2>&1'
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd; CurrentDirectory = '__PATH__' }
if ($r.ReturnValue -ne 0) { throw ('启动失败 Win32_Process.Create code=' + $r.ReturnValue) }
$r.ProcessId | Out-File -FilePath 'app.pid' -Encoding ascii
Write-Output $r.ProcessId`,
		stop: WIN_PID_STOP,
		restart: `${WIN_PID_STOP_BODY}
Start-Sleep -Seconds 2
$cmd = 'cmd /c nginx.exe __LOGOP__ "__LOG__" 2>&1'
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd; CurrentDirectory = '__PATH__' }
if ($r.ReturnValue -ne 0) { throw ('启动失败 Win32_Process.Create code=' + $r.ReturnValue) }
$r.ProcessId | Out-File -FilePath 'app.pid' -Encoding ascii
Write-Output $r.ProcessId`,
		status: WIN_STATUS
	},
	{
		id: "win-python",
		name: "Python 应用",
		desc: "隐藏窗口运行 python 主入口，按命令行匹配停止",
		os: "windows",
		types: ["separated", "*"],
		needEntry: true,
		start: winLaunch("python", `@('"__ENTRY__"') + @(__ARGS__)`),
		stop: WIN_PID_STOP,
		restart: `${WIN_PID_STOP_BODY}
Start-Sleep -Seconds 2
${winLaunch("python", `@('"__ENTRY__"') + @(__ARGS__)`)}`,
		status: WIN_STATUS
	},
	{
		id: "win-docker-compose",
		name: "Docker Compose 编排",
		desc: "docker compose 管理（up -d / down / restart）",
		os: "windows",
		types: ["*"],
		needEntry: false,
		start: `docker compose up -d`,
		stop: `docker compose down`,
		restart: `docker compose restart`,
		status: `if (docker compose ps --status running --quiet) { 'running' } else { 'stopped' }`
	},
	{
		id: "win-svc",
		name: "Windows 服务",
		desc: "通过服务名管理（需已注册同名服务）",
		os: "windows",
		types: ["*"],
		needEntry: false,
		start: `Start-Service -Name '__APPNAME__'`,
		stop: `Stop-Service -Name '__APPNAME__'`,
		restart: `Restart-Service -Name '__APPNAME__' -Force`,
		status: `(Get-Service -Name '__APPNAME__').Status`
	}
];
var ALL_TEMPLATES = [...LINUX_TEMPLATES, ...WINDOWS_TEMPLATES];
/**
* 列出适用于指定操作系统与项目类型的模板
* @param os 操作系统
* @param projectType 当前项目类型（可为空，此时仅返回通用模板）
*/
function listTemplates(os, projectType) {
	return ALL_TEMPLATES.filter((t) => {
		if (t.os !== os) return false;
		return t.types.includes(projectType) || t.types.includes("*");
	});
}
/**
* 由日志地址推导日志文件路径：
* - 为空 → app.log
* - 以分隔符结尾、或无扩展名（视为目录）→ 目录/app.log
* - 否则视为文件原样返回
*/
function resolveLogFile(log) {
	const value = (log || "").trim();
	if (!value) return "app.log";
	const looksLikeDir = /[\\/]$/.test(value) || !/\.[a-zA-Z0-9]+$/.test(value);
	const sep = value.includes("\\") && !value.includes("/") ? "\\" : "/";
	return looksLikeDir ? `${value.replace(/[\\/]+$/, "")}${sep}app.log` : value;
}
/**
* 用上下文填充模板，返回三段命令
*/
function fillTemplate(tpl, ctx) {
	const entry = (ctx.entry || "").trim();
	if (tpl.needEntry && !entry) throw new Error("请先填写「主入口名称」（如 user-service.jar）");
	const replacements = {
		__ENTRY__: entry,
		__LOG__: resolveLogFile(ctx.log),
		__PATH__: (ctx.path || "").trim(),
		__APPNAME__: (ctx.appName || "app").trim(),
		__LOGOP__: ctx.logOp || ">",
		__SELFPATTERN__: selfSafePattern(entry)
	};
	const apply = (src) => {
		const stripped = src.replace(/__ENTRY__|__LOG__|__PATH__|__APPNAME__|__LOGOP__|__SELFPATTERN__/g, (m) => replacements[m] ?? m).replace(/^# (>>>|<<<) ORPHAN_REAPER$\n?/gm, "");
		if (replacements.__SELFPATTERN__) return stripped;
		return stripped.replace(/[^\n]*# >>> ORPHAN_REAPER\n[\s\S]*?# <<< ORPHAN_REAPER\n?/g, "");
	};
	return {
		start: apply(tpl.start),
		stop: apply(tpl.stop),
		restart: apply(tpl.restart),
		status: tpl.status ? apply(tpl.status) : ""
	};
}
//#endregion
export { listTemplates as n, fillTemplate as t };
