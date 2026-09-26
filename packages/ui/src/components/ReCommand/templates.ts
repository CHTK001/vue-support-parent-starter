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
*   __LOGOP__   日志重定向操作符（> 清空 / >> 追加）
 */

export type OsKind = 'linux' | 'windows';

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
fi`;

/**
 * Linux PID 状态片段：内置启动模板都会写 app.pid，故以 app.pid 为准。
 * 仅在无 app.pid 时才按主入口 pgrep，且排除当前 shell 自身
 * （脚本命令行同样含主入口路径，直接 pgrep -f 会误报 running）。
 */
const LINUX_PID_STATUS = (entry: string) => `if [ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null; then
  echo running
elif [ -n '${entry}' ] && pgrep -f '${entry}' 2>/dev/null | grep -qv "^$$\\$"; then
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
    status: LINUX_PID_STATUS('__ENTRY__'),
  },
  {
    id: 'linux-fatjar',
    name: 'FatJar (java -jar)',
    desc: '后台运行通用 jar，PID 写入 app.pid（不带 profile）',
    os: 'linux',
    types: ['fatjar', 'springboot'],
    needEntry: true,
    start: `${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
${LINUX_ENTER}nohup java __JVMARGS__ -jar __ENTRY__ __ARGS__ __LOGOP__ __LOG__ 2>&1 &
echo $! > app.pid`,
    status: LINUX_PID_STATUS('__ENTRY__'),
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
    status: LINUX_PID_STATUS('__ENTRY__'),
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
    status: LINUX_PID_STATUS('node __ENTRY__'),
  },
  {
    id: 'linux-static-nginx',
    name: '静态页面 (Nginx 托管)',
    desc: '使用本机 Nginx 托管静态站点；状态/停止只认本项目 logs/nginx.pid，避免误杀/误报其它项目的 nginx',
    os: 'linux',
    types: ['static', 'nginx'],
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
    status: LINUX_PID_STATUS('http.server 80'),
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
 */
const WIN_PID_STOP_BODY = `$ErrorActionPreference = 'SilentlyContinue'
if (Test-Path 'app.pid') { Get-Content 'app.pid' | ForEach-Object { & taskkill.exe /PID $_ /T /F | Out-Null }; Remove-Item 'app.pid' -Force }`;

const WIN_PID_STOP = `${WIN_PID_STOP_BODY}
exit 0`;

/**
 * Windows 状态脚本：仅以 app.pid 为准
 * （SSH 会话内 WMI 枚举常被拒，故不做命令行匹配）
 */
const WIN_STATUS = `if (Test-Path 'app.pid') { if (Get-Process -Id (Get-Content 'app.pid') -ErrorAction SilentlyContinue) { 'running' } else { 'stopped' } } else { 'stopped' }`;

/**
 * Windows 下经 WMI Win32_Process.Create 启动，脱离 WinRM 作业（WinRM 命令结束时
 * Start-Process 产生的进程会被作业回收）。返回的 ProcessId 为 cmd 外壳，停止时
 * taskkill /T 连子进程一并结束。stdout/err 由 cmd 重定向到日志文件。
 */
const winLaunch = (exe: string, buildArgs: string): string => `$all = ${buildArgs}
$argLine = $all -join ' '
$cmdLine = 'cmd /c "' + '${exe} ' + $argLine + ' __LOGOP__ "__LOG__" 2>&1' + '"'
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmdLine; CurrentDirectory = '__PATH__' }
if ($r.ReturnValue -ne 0) { throw ('启动失败 Win32_Process.Create code=' + $r.ReturnValue) }
$r.ProcessId | Out-File -FilePath 'app.pid' -Encoding ascii
Write-Output $r.ProcessId`;

const WINDOWS_TEMPLATES: CommandTemplate[] = [
  {
    id: 'win-springboot',
    name: 'SpringBoot / FatJar (java -jar)',
    desc: '隐藏窗口运行 jar，按命令行匹配停止进程',
    os: 'windows',
    types: ['springboot', 'fatjar'],
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
  };
  const apply = (src: string) =>
    src.replace(/__ENTRY__|__LOG__|__PATH__|__APPNAME__|__LOGOP__/g, (m) => replacements[m] ?? m);
  return {
    start: apply(tpl.start),
    stop: apply(tpl.stop),
    restart: apply(tpl.restart),
    status: tpl.status ? apply(tpl.status) : '',
  };
}
