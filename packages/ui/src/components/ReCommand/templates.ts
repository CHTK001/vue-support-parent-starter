/**
 * ReCommand 内置命令模板
 *
 * 按「操作系统 + 项目类型」提供预置的启动/停止/重启命令，
 * 结合上下文（主入口 / 日志 / 路径 / 应用名）一键生成。
 *
 * 占位符（fillTemplate 时替换）：
 *   __ENTRY__   主入口名称（jar 文件名 / 二进制名 / 启动 js 等）
 *   __LOG__     日志文件路径（由日志地址推导，缺省 app.log）
 *   __PATH__    项目地址
 *   __APPNAME__ 应用名（用于 systemd 服务名等，取项目名）
*   __LOGOP__        日志重定向操作符（> 清空 / >> 追加）
 *   __SELFPATTERN__  主入口名的自安全匹配模式（见 selfSafePattern），仅停止段兜底用
 *
 * 本文件是后端 `com.chua.starter.server.support.util.ProjectScripts` 的前端镜像，
 * 改任何一侧都必须同步另一侧。原因：后端 `ReleaseServiceImpl#applyDefaultScripts`
 * 只在脚本字段**为空**时才填默认值（`if (isBlank(project.getStopScript()))`），
 * 而本表单总是填好并提交非空脚本 —— 也就是说 **UI 建的项目实际用的是这里的模板**，
 * 后端的同名修复对它不生效。两侧漂移会直接表现为「同一版本、不同建单方式、
 * 停止与启动行为不一样」。
 */

export type OsKind = 'linux' | 'windows';

/** 正则元字符：与后端 selfSafePattern 的转义集合保持一致 */
const REGEX_META = '\\+*?()[]{}|^$.';

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
export function selfSafePattern(entry: string): string {
  const trimmed = (entry || '').trim();
  if (!trimmed) {
    return '';
  }
  const slash = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  const name = slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
  if (!name) {
    return '';
  }
  let escaped = '';
  for (const ch of name) {
    if (REGEX_META.includes(ch)) {
      escaped += '\\';
    }
    escaped += ch;
  }
  const first = escaped.charAt(0);
  if (/[0-9A-Za-z]/.test(first)) {
    return `[${first}]${escaped.slice(1)}`;
  }
  return escaped;
}

export interface CommandTemplate {
  /** 模板唯一标识 */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板说明 */
  desc: string;
  /** 目标操作系统 */
  os: OsKind;
  /** 适用项目类型；'*' 表示通用 */
  types: string[];
  /** 是否依赖主入口名称 */
  needEntry: boolean;
  /** 启动脚本 */
  start: string;
  /** 停止脚本 */
  stop: string;
  /** 重启脚本 */
  restart: string;
  /** 状态脚本（输出 running / stopped），可选 */
  status?: string;
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
const LINUX_PID_STOP = `if [ -f app.pid ]; then
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
const LINUX_PID_STATUS = `if [ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null; then
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
const LINUX_ENTER = `cd '__PATH__' 2>/dev/null || true;
`;

/**
 * Linux 下 Nginx 的控制前缀。
 *
 * 必须显式给出 `-p`（前缀目录=项目目录）与 `-c conf/nginx.conf`：
 * nginx 裸启动会使用编译期前缀（Debian 为 /usr/share/nginx），读到的是系统配置，
 * 会抢占系统端口并且 pid 不落在项目目录，表现为「项目状态永远 stopped、端口却被占用」。
 * 与后端 {@code ProjectScripts#builtinLinux} 的 static/nginx 分支保持一致。
 */
const NGINX_CTL = `nginx -p '__PATH__' -c conf/nginx.conf`;

/**
 * 读取本项目 nginx master pid：先读 logs/nginx.pid（陈旧 pid 视为无效），
 * 再按前缀找回真实 master。模式用 `[m]aster` 字符类，避免 pgrep -f 匹配到执行脚本的 shell 自身。
 */
const NGINX_READ_PID = `pid=$(cat logs/nginx.pid 2>/dev/null || true)
if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then pid=""; fi
if [ -z "$pid" ]; then pid=$(pgrep -f 'nginx: [m]aster process nginx -p __PATH__' 2>/dev/null | head -1); fi`;

/** Linux nginx 停止片段（先抓 worker 再停 master，避免留下占用端口的孤儿 worker） */
const LINUX_NGINX_STOP = `${NGINX_READ_PID}
if [ -n "$pid" ]; then
  kids=$(pgrep -P $pid 2>/dev/null)
  ${NGINX_CTL} -s stop 2>/dev/null || true
  i=0
  while kill -0 $pid 2>/dev/null && [ $i -lt 5 ]; do
    sleep 1
    i=$((i + 1))
  done
  kill -9 $pid 2>/dev/null
  if [ -n "$kids" ]; then kill -9 $kids 2>/dev/null; fi
fi
rm -f logs/nginx.pid`;

/** Linux nginx 启动片段：先补齐前缀所需目录，再显式指向前缀启动 */
const LINUX_NGINX_START = `mkdir -p logs temp/client_body_temp temp/proxy_temp temp/fastcgi_temp temp/uwsgi_temp temp/scgi_temp
${NGINX_CTL} > /dev/null 2>&1 < /dev/null`;

/** 给多行脚本统一加缩进（重启脚本里嵌套停止/启动段时用） */
function indentBlock(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line) => (line ? prefix + line : line))
    .join('\n');
}

// ==================== Linux 模板 ====================

const LINUX_TEMPLATES: CommandTemplate[] = [
  {
    id: 'linux-springboot',
    name: 'SpringBoot 单体 (java -jar)',
    desc: '后台运行 jar，PID 写入 app.pid，含 prod profile',
    os: 'linux',
    types: ['springboot'],
    needEntry: true,
    start: `${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ --spring.profiles.active=prod __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ --spring.profiles.active=prod __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    status: LINUX_PID_STATUS,
  },
  {
    id: 'linux-fatjar',
    name: 'FatJar (java -jar)',
    desc: '后台运行通用 jar，PID 写入 app.pid（不带 profile）',
    os: 'linux',
    types: ['fatjar', 'springboot', 'git'],
    needEntry: true,
    start: `${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    status: LINUX_PID_STATUS,
  },
  {
    id: 'linux-binary',
    name: '可执行二进制 (分离式)',
    desc: '直接后台运行主入口二进制，PID 写入 app.pid',
    os: 'linux',
    types: ['separated'],
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
    status: LINUX_PID_STATUS,
  },
  {
    id: 'linux-shell',
    name: '自带脚本 (start.sh/stop.sh)',
    desc: '调用项目自带的 start.sh / stop.sh / restart.sh',
    os: 'linux',
    types: ['separated', '*'],
    needEntry: false,
    start: `chmod +x *.sh
./start.sh`,
    stop: `chmod +x *.sh
./stop.sh`,
    restart: `chmod +x *.sh
./restart.sh`,
    status: `[ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null && echo running || echo stopped`,
  },
  {
    id: 'linux-node',
    name: 'Node 应用',
    desc: '后台运行 node 主入口（如 app.js），PID 写入 app.pid',
    os: 'linux',
    types: ['separated', '*'],
    needEntry: true,
    start: `${LINUX_ENTER}nohup node __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup node __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    status: LINUX_PID_STATUS,
  },
  {
    id: 'linux-static-nginx',
    name: '静态页面 / Nginx（项目目录内独立托管）',
    desc: '以项目目录为 nginx 前缀、conf/nginx.conf 为配置启动；状态/停止只认本项目 logs/nginx.pid',
    os: 'linux',
    types: ['static', 'nginx'],
    needEntry: false,
    start: LINUX_NGINX_START,
    stop: LINUX_NGINX_STOP,
    restart: `${NGINX_READ_PID}
if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
  ${NGINX_CTL} -s reload > /dev/null 2>&1
else
${indentBlock(LINUX_NGINX_STOP, '  ')}
  sleep 2
${indentBlock(LINUX_NGINX_START, '  ')}
fi`,
    status: `${NGINX_READ_PID}
if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
  echo running
else
  echo stopped
fi`,
  },
  {
    id: 'linux-static-python',
    name: '静态页面 (Python http.server)',
    desc: '无需 Nginx，python3 内置 HTTP 服务监听 80 端口',
    os: 'linux',
    types: ['static'],
    needEntry: false,
    start: `${LINUX_ENTER}nohup python3 -m http.server 80 __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup python3 -m http.server 80 __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    status: LINUX_PID_STATUS,
  },
  {
    id: 'linux-python',
    name: 'Python 应用',
    desc: '后台运行 python3 主入口（如 main.py / app.py），PID 写入 app.pid',
    os: 'linux',
    types: ['separated', '*'],
    needEntry: true,
    start: `${LINUX_ENTER}nohup python3 __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup python3 __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    status: `pgrep -f 'python3 __ENTRY__' >/dev/null 2>&1 && echo running || echo stopped`,
  },
  {
    // 模型项目只管理模型文件，没有常驻进程：仍给出可保存的四段脚本，
    // 避免「选了模型类型却拿到 ./start.sh 这种与项目毫无关系的模板」。
    id: 'linux-model',
    name: '模型仓库（无进程，仅文件管理）',
    desc: '模型项目只投放模型文件，启动/停止仅输出提示，状态固定为 stopped',
    os: 'linux',
    types: ['model'],
    needEntry: false,
    start: `${LINUX_ENTER}echo "Model repository - no process to start"`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_ENTER}echo "Model repository - no process to restart"`,
    status: LINUX_PID_STATUS,
  },
  {
    id: 'linux-docker-compose',
    name: 'Docker Compose 编排',
    desc: 'docker compose 管理（up -d / down / restart）',
    os: 'linux',
    types: ['*'],
    needEntry: false,
    start: `docker compose up -d`,
    stop: `docker compose down`,
    restart: `docker compose restart`,
    status: `docker compose ps --status running --quiet | grep -q . && echo running || echo stopped`,
  },
  {
    id: 'linux-systemd',
    name: 'systemd 服务',
    desc: '通过 systemctl 管理（需已注册同名服务，需要 root）',
    os: 'linux',
    types: ['*'],
    needEntry: false,
    start: `systemctl start __APPNAME__`,
    stop: `systemctl stop __APPNAME__`,
    restart: `systemctl restart __APPNAME__`,
    status: `systemctl is-active __APPNAME__`,
  },
];

// ==================== Windows 模板 ====================

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
const WIN_PID_STOP_BODY = `$ErrorActionPreference = 'SilentlyContinue'
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

const WIN_PID_STOP = `${WIN_PID_STOP_BODY}
exit 0`;

/**
 * Windows 状态脚本：仅以 app.pid 为准
 * （SSH 会话内 WMI 枚举常被拒，故不做命令行匹配）
 */
const WIN_STATUS = `if (Test-Path 'app.pid') { if (Get-Process -Id (Get-Content 'app.pid') -ErrorAction SilentlyContinue) { 'running' } else { 'stopped' } } else { 'stopped' }`;

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
const winLaunch = (exe: string, buildArgs: string): string => `$all = ${buildArgs}
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

const WINDOWS_TEMPLATES: CommandTemplate[] = [
  {
    id: 'win-springboot',
    name: 'SpringBoot / FatJar (java -jar)',
    desc: '隐藏窗口运行 jar，按命令行匹配停止进程',
    os: 'windows',
    types: ['springboot', 'fatjar', 'git'],
    needEntry: true,
    start: winLaunch('java', `@($JvmArgs) + @('-jar','"__ENTRY__"') + @($AppArgs)`),
    stop: WIN_PID_STOP,
    restart: `${WIN_PID_STOP_BODY}
Start-Sleep -Seconds 2
${winLaunch('java', `@($JvmArgs) + @('-jar','"__ENTRY__"') + @($AppArgs)`)}`,
    status: WIN_STATUS,
  },
  {
    id: 'win-ps1',
    name: '自带脚本 (start.ps1/stop.ps1)',
    desc: '调用项目自带的 PowerShell 脚本',
    os: 'windows',
    types: ['separated', '*'],
    needEntry: false,
    start: `.\start.ps1`,
    stop: `.\stop.ps1`,
    restart: `.\restart.ps1`,
    status: `if (Get-Process | Where-Object { $_.ProcessName -like '*__APPNAME__*' }) { 'running' } else { 'stopped' }`,
  },
  {
    id: 'win-node',
    name: 'Node 应用',
    desc: '隐藏窗口运行 node 主入口，按命令行匹配停止',
    os: 'windows',
    types: ['separated', '*'],
    needEntry: true,
    start: winLaunch('node', `@('"__ENTRY__"') + @(__ARGS__)`),
    stop: WIN_PID_STOP,
    restart: `${WIN_PID_STOP_BODY}
Start-Sleep -Seconds 2
${winLaunch('node', `@('"__ENTRY__"') + @(__ARGS__)`)}`,
    status: WIN_STATUS,
  },
  {
    id: 'win-nginx',
    name: '静态页面 / Nginx',
    desc: '在项目目录下经 WMI 脱离会话启动 nginx，按 app.pid 停止/判状态',
    os: 'windows',
    types: ['static', 'nginx'],
    needEntry: false,
    // 与其他类型一致：WMI 脱离会话启动（Start-Process/start 起的进程会随 SSH 会话被回收），
    // cmd 托管 nginx 主子进程并把 cmd pid 写入 app.pid，停止/状态按 app.pid（taskkill /T 连带 nginx）
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
    status: WIN_STATUS,
  },
  {
    id: 'win-python',
    name: 'Python 应用',
    desc: '隐藏窗口运行 python 主入口，按命令行匹配停止',
    os: 'windows',
    types: ['separated', '*'],
    needEntry: true,
    start: winLaunch('python', `@('"__ENTRY__"') + @(__ARGS__)`),
    stop: WIN_PID_STOP,
    restart: `${WIN_PID_STOP_BODY}
Start-Sleep -Seconds 2
${winLaunch('python', `@('"__ENTRY__"') + @(__ARGS__)`)}`,
    status: WIN_STATUS,
  },
  {
    id: 'win-docker-compose',
    name: 'Docker Compose 编排',
    desc: 'docker compose 管理（up -d / down / restart）',
    os: 'windows',
    types: ['*'],
    needEntry: false,
    start: `docker compose up -d`,
    stop: `docker compose down`,
    restart: `docker compose restart`,
    status: `if (docker compose ps --status running --quiet) { 'running' } else { 'stopped' }`,
  },
  {
    id: 'win-svc',
    name: 'Windows 服务',
    desc: '通过服务名管理（需已注册同名服务）',
    os: 'windows',
    types: ['*'],
    needEntry: false,
    start: `Start-Service -Name '__APPNAME__'`,
    stop: `Stop-Service -Name '__APPNAME__'`,
    restart: `Restart-Service -Name '__APPNAME__' -Force`,
    status: `(Get-Service -Name '__APPNAME__').Status`,
  },
  {
    // 模型项目没有常驻进程，仍需四段脚本可保存（与 linux-model 对称）
    id: 'win-model',
    name: '模型仓库（无进程，仅文件管理）',
    desc: '模型项目只投放模型文件，启动/停止仅输出提示，状态固定为 stopped',
    os: 'windows',
    types: ['model'],
    needEntry: false,
    start: `Write-Output 'Model repository - no process to start'`,
    stop: `Write-Output 'Model repository - no process to stop'`,
    restart: `Write-Output 'Model repository - no process to restart'`,
    status: `'stopped'`,
  },
];

const ALL_TEMPLATES: CommandTemplate[] = [...LINUX_TEMPLATES, ...WINDOWS_TEMPLATES];

/**
 * 列出适用于指定操作系统与项目类型的模板
 * @param os 操作系统
 * @param projectType 当前项目类型（可为空，此时仅返回通用模板）
 */
export function listTemplates(os: OsKind, projectType: string): CommandTemplate[] {
  return ALL_TEMPLATES.filter((t) => {
    if (t.os !== os) {
      return false;
    }
    return t.types.includes(projectType) || t.types.includes('*');
  });
}

/**
 * 按「OS + 项目类型」挑选最贴切的模板。
 *
 * <p>优先级：精确匹配该类型 → `*` 通用模板 → 列表第一个。
 * 之前各处直接取 {@code listTemplates(...)[0]}，而通用模板在数组里排在前面，
 * 于是「模型」这类没有专属模板的类型会拿到 `./start.sh`（与项目毫无关系）。
 * 现在每一种项目类型都有专属模板，并且挑选结果不再依赖数组顺序。</p>
 *
 * @param os 操作系统
 * @param projectType 项目类型
 * @returns 最佳模板；无任何候选时返回 undefined
 */
export function bestTemplate(os: OsKind, projectType: string): CommandTemplate | undefined {
  const list = listTemplates(os, projectType);
  const exact = list.find((t) => t.types.includes(projectType));
  if (exact) {
    return exact;
  }
  return list.find((t) => t.types.includes('*')) ?? list[0];
}

export interface FillContext {
  /** 主入口名称 */
  entry?: string;
  /** 日志地址（文件或目录） */
  log?: string;
  /** 项目地址 */
  path?: string;
  /** 应用名 */
  appName?: string;
  /** 日志重定向操作符：'>' 清空重写（默认）；'>>' 追加保留 */
  logOp?: string;
}

/**
 * 由日志地址推导日志文件路径：
 * - 为空 → app.log
 * - 以分隔符结尾、或无扩展名（视为目录）→ 目录/app.log
 * - 否则视为文件原样返回
 */
function resolveLogFile(log: string | undefined): string {
  const value = (log || '').trim();
  if (!value) {
    return 'app.log';
  }
  const looksLikeDir = /[\\/]$/.test(value) || !/\.[a-zA-Z0-9]+$/.test(value);
  const sep = value.includes('\\') && !value.includes('/') ? '\\' : '/';
  return looksLikeDir ? `${value.replace(/[\\/]+$/, '')}${sep}app.log` : value;
}

/**
 * 用上下文填充模板，返回三段命令
 */
export function fillTemplate(tpl: CommandTemplate, ctx: FillContext) {
  const entry = (ctx.entry || '').trim();
  if (tpl.needEntry && !entry) {
    throw new Error('请先填写「主入口名称」（如 user-service.jar）');
  }
  const replacements: Record<string, string> = {
    __ENTRY__: entry,
    __LOG__: resolveLogFile(ctx.log),
    __PATH__: (ctx.path || '').trim(),
    __APPNAME__: (ctx.appName || 'app').trim(),
    __LOGOP__: ctx.logOp || '>',
    __SELFPATTERN__: selfSafePattern(entry),
  };
  const apply = (src: string) => {
    const filled = src.replace(
      /__ENTRY__|__LOG__|__PATH__|__APPNAME__|__LOGOP__|__SELFPATTERN__/g,
      (m) => replacements[m] ?? m,
    );
    // 哨兵只是本文件的填充期标记，不能出现在最终下发的脚本里（后端产物里没有）。
    const stripped = filled.replace(/^# (>>>|<<<) ORPHAN_REAPER$\n?/gm, '');
    // 入口为空（needEntry=false 且调用方未给 entry）时必须整段剔除孤儿兜底：
    //   - PowerShell 侧 `-match ''` 会匹配**每一个**进程，兜底段会 taskkill 全机；
    //   - pgrep -f '' 同样匹配全部进程。
    // 后端 selfSafePattern 在入口为空时返回空、并直接不生成该段（见 ProjectScripts
    // #linuxOrphanReaper / #winOrphanReaper），这里必须保持同样语义，不能只替空串。
    if (replacements.__SELFPATTERN__) {
      return stripped;
    }
    return stripped.replace(/[^\n]*# >>> ORPHAN_REAPER\n[\s\S]*?# <<< ORPHAN_REAPER\n?/g, '');
  };
  return {
    start: apply(tpl.start),
    stop: apply(tpl.stop),
    restart: apply(tpl.restart),
    status: tpl.status ? apply(tpl.status) : '',
  };
}
