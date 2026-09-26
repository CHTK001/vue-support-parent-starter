/**
 * 项目脚本模板
 *
 * 新增/编辑项目时，按「操作系统 + 项目类型」提供预置的启动/停止/重启脚本，
 * 结合主入口名称（mainEntry）一键生成，避免手写大量脚本。
 *
 * 占位符（fillTemplate 时替换）：
 *   __ENTRY__   主入口名称（jar 文件名 / 二进制名 / 启动 js 等）
 *   __LOG__     日志文件路径（由日志地址推导，缺省 app.log）
 *   __PATH__    项目地址
 *   __APPNAME__ 应用名（用于 systemd 服务名等，取项目名）
 */

export type OsKind = 'linux' | 'windows';

export interface ScriptTemplate {
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
}

/** Linux 下通用的 PID 方式停止/启动片段（java/node/二进制共用思路） */
const LINUX_PID_STOP = `if [ -f app.pid ]; then
  kill $(cat app.pid) 2>/dev/null
  rm -f app.pid
fi`;

// ==================== Linux 模板 ====================

const LINUX_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'linux-springboot',
    name: 'SpringBoot 单体 (java -jar)',
    desc: '后台运行 jar，PID 写入 app.pid，含 prod profile',
    os: 'linux',
    types: ['springboot'],
    needEntry: true,
    start: `nohup java -jar __ENTRY__ --spring.profiles.active=prod > __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
nohup java -jar __ENTRY__ --spring.profiles.active=prod > __LOG__ 2>&1 &
echo $! > app.pid`,
  },
  {
    id: 'linux-fatjar',
    name: 'FatJar (java -jar)',
    desc: '后台运行通用 jar，PID 写入 app.pid（不带 profile）',
    os: 'linux',
    types: ['fatjar', 'springboot'],
    needEntry: true,
    start: `nohup java -jar __ENTRY__ > __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
nohup java -jar __ENTRY__ > __LOG__ 2>&1 &
echo $! > app.pid`,
  },
  {
    id: 'linux-binary',
    name: '可执行二进制 (分离式)',
    desc: '直接后台运行主入口二进制，PID 写入 app.pid',
    os: 'linux',
    types: ['separated'],
    needEntry: true,
    start: `chmod +x __ENTRY__
nohup ./__ENTRY__ > __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
chmod +x __ENTRY__
nohup ./__ENTRY__ > __LOG__ 2>&1 &
echo $! > app.pid`,
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
  },
  {
    id: 'linux-node',
    name: 'Node 应用',
    desc: '后台运行 node 主入口（如 app.js），PID 写入 app.pid',
    os: 'linux',
    types: ['separated', '*'],
    needEntry: true,
    start: `nohup node __ENTRY__ > __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
nohup node __ENTRY__ > __LOG__ 2>&1 &
echo $! > app.pid`,
  },
  {
    id: 'linux-static-nginx',
    name: '静态页面 (Nginx 托管)',
    desc: '使用本机 Nginx 托管静态站点',
    os: 'linux',
    types: ['static', 'nginx'],
    needEntry: false,
    start: `nginx`,
    stop: `nginx -s stop`,
    restart: `nginx -s reload`,
  },
  {
    id: 'linux-static-python',
    name: '静态页面 (Python http.server)',
    desc: '无需 Nginx，python3 内置 HTTP 服务监听 80 端口',
    os: 'linux',
    types: ['static'],
    needEntry: false,
    start: `nohup python3 -m http.server 80 > __LOG__ 2>&1 &
echo $! > app.pid`,
    stop: LINUX_PID_STOP,
    restart: `${LINUX_PID_STOP}
sleep 2
nohup python3 -m http.server 80 > __LOG__ 2>&1 &
echo $! > app.pid`,
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
  },
];

// ==================== Windows 模板 ====================

const WIN_PID_STOP = `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*__ENTRY__*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;

const WINDOWS_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'win-springboot',
    name: 'SpringBoot / FatJar (java -jar)',
    desc: '隐藏窗口运行 jar，按命令行匹配停止进程',
    os: 'windows',
    types: ['springboot', 'fatjar'],
    needEntry: true,
    start: `Start-Process -FilePath 'java' -ArgumentList '-jar','__ENTRY__' -WindowStyle Hidden -RedirectStandardOutput '__LOG__'`,
    stop: WIN_PID_STOP,
    restart: `${WIN_PID_STOP}
Start-Sleep -Seconds 2
Start-Process -FilePath 'java' -ArgumentList '-jar','__ENTRY__' -WindowStyle Hidden -RedirectStandardOutput '__LOG__'`,
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
  },
  {
    id: 'win-node',
    name: 'Node 应用',
    desc: '隐藏窗口运行 node 主入口，按命令行匹配停止',
    os: 'windows',
    types: ['separated', '*'],
    needEntry: true,
    start: `Start-Process -FilePath 'node' -ArgumentList '__ENTRY__' -WindowStyle Hidden -RedirectStandardOutput '__LOG__'`,
    stop: `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*__ENTRY__*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`,
    restart: `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*__ENTRY__*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Start-Sleep -Seconds 2
Start-Process -FilePath 'node' -ArgumentList '__ENTRY__' -WindowStyle Hidden -RedirectStandardOutput '__LOG__'`,
  },
  {
    id: 'win-nginx',
    name: '静态页面 / Nginx',
    desc: '在项目目录下启动 nginx，停止/重载',
    os: 'windows',
    types: ['static', 'nginx'],
    needEntry: false,
    start: `Start-Process -FilePath '.\\nginx.exe' -WorkingDirectory '__PATH__' -WindowStyle Hidden`,
    stop: `Set-Location -LiteralPath '__PATH__'
.\nginx.exe -s stop`,
    restart: `Set-Location -LiteralPath '__PATH__'
.\nginx.exe -s reload`,
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
  },
];

const ALL_TEMPLATES: ScriptTemplate[] = [...LINUX_TEMPLATES, ...WINDOWS_TEMPLATES];

/**
 * 列出适用于指定操作系统与项目类型的模板
 * @param os 操作系统
 * @param projectType 当前项目类型（可为空，此时仅返回通用模板）
 */
export function listTemplates(os: OsKind, projectType: string): ScriptTemplate[] {
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
 * 用上下文填充模板，返回三段脚本
 */
export function fillTemplate(tpl: ScriptTemplate, ctx: FillContext) {
  const entry = (ctx.entry || '').trim();
  if (tpl.needEntry && !entry) {
    throw new Error('请先填写「主入口名称」（如 user-service.jar）');
  }
  const replacements: Record<string, string> = {
    __ENTRY__: entry,
    __LOG__: resolveLogFile(ctx.log),
    __PATH__: (ctx.path || '').trim(),
    __APPNAME__: (ctx.appName || 'app').trim(),
  };
  const apply = (src: string) =>
    src.replace(/__ENTRY__|__LOG__|__PATH__|__APPNAME__/g, (m) => replacements[m] ?? m);
  return {
    startScript: apply(tpl.start),
    stopScript: apply(tpl.stop),
    restartScript: apply(tpl.restart),
  };
}
