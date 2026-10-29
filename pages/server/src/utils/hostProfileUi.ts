/**
 * 主机画像分区的展示口径 —— 把后端各分区 VO 的原始字段翻译成「等级 / 文案 / 颜色」。
 *
 * <p>画像被拆成 7 个独立页签（磁盘 / 进程 / 服务 / 监听端口 / 网络 / 环境变量 / 防火墙），
 * 每个分区有自己的呈现形态，但「什么算告警、状态词怎么归一、盘符怎么取」这类判断必须
 * 只有一份实现，否则同一个 90% 的磁盘在磁盘页是红的、在别处是灰的。</p>
 *
 * <p>本模块只做纯函数计算，不持有状态、不发请求，便于单测与复用。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */

import { processBrandIcon } from "./processBrand";
import { processGlyph } from "./processIcon";

/** 语义等级：ok 正常 / warn 偏高 / bad 危险 / mute 无意义或未采集 */
export type Tone = "" | "ok" | "warn" | "bad" | "mute";

/** 安全转数字，非有限值一律 0 */
export function numOf(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** 一位小数；拿不到数字时给占位符 */
export function fmt1(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : "—";
}

/** 使用率裁剪到 0-100，供条形 / 环形宽度使用 */
export function clampPct(v: unknown): number {
  const n = numOf(v);
  return Math.max(0, Math.min(100, n));
}

/* ==================== 磁盘 ==================== */

/**
 * 磁盘使用率：优先用「已用 / 总量」现算，避免通道只给 usage 而总量为 0 时算出 0%。
 * 两者都拿不到时回落后端 usage 字段。
 */
export function diskUsageOf(r: Record<string, any>): number {
  const total = numOf(r?.totalGb);
  if (total > 0) return clampPct(numOf(r?.usedGb) / total * 100);
  return clampPct(r?.usage);
}

/** 盘符：Windows 名称里可能夹着「本地固定磁盘 (C:)」，必须任意位置匹配 */
export function diskLetterOf(r: Record<string, any>): string {
  const text = String(r?.name ?? r?.mount ?? "");
  const m = text.match(/([A-Za-z]):/);
  if (m) return `${m[1].toUpperCase()}:`;
  return String(r?.mount ?? text).slice(0, 2) || "—";
}

/** 文件管理器要打开的根路径：Windows 是盘符根，类 Unix 是挂载点 */
export function diskRootOf(r: Record<string, any>): string {
  const letter = diskLetterOf(r);
  if (/^[A-Za-z]:$/.test(letter)) return `${letter}\\`;
  return String(r?.mount || r?.name || "/");
}

/** 磁盘等级：≥90% 危险，≥75% 偏高 */
export function diskTone(usage: number): Tone {
  if (usage >= 90) return "bad";
  if (usage >= 75) return "warn";
  return "";
}

/** 剩余空间是否已不足一成（与等级口径分开：小容量盘 80% 也可能只剩几 GB） */
export function diskTight(r: Record<string, any>): boolean {
  const total = numOf(r?.totalGb);
  if (total <= 0) return false;
  return numOf(r?.availGb) / total < 0.1;
}

/* ==================== 主机网络 ==================== */

/**
 * 标准 IPv4 字面（每段 0-255），专用于从逗号/空格/换行拼接的报文中挑出 IP；
 * 同一字段里可能还夹着 IPv6 地址
 */
const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
/** 轻薄版 IPv6 字面（同一字段里可能夹着 IPv6 地址） */
const IPV6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

/**
 * 把后端存的内网 IP 拆成列表。
 *
 * <p>Agent/SSH 探测时代码只取第一个 IP 落库（如 `hostname -I | awk '{print $1}'`），
 * 但历史存量数据、HTTP 采集重载、CSV 导入等场景可能把多个 IP 用
 * 逗号 / 空格 / 换行 拼在一个字段里。这里只做纯函数拆分，不碰数据库。</p>
 *
 * @param v 后端字段 `serverHostPrivateIp`
 */
export function privateIpRowsOf(v: string | null | undefined): string[] {
  if (!v) return [];
  return String(v)
    .split(/[,\s\n]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => IPV4.test(s) || IPV6.test(s));
}

/**
 * 内网 IP 文本：全部 IP 一行一个，一个没有时返回空串。
 *
 * @param v 后端字段 `serverHostPrivateIp`
 */
export function privateIpTextOf(v: string | null | undefined): string {
  return privateIpRowsOf(v).join('\n');
}

/* ==================== 进程 / 服务 ==================== */

/** 进程等级：CPU ≥85% 或内存 ≥4GB 危险；≥50% 或 ≥1GB 偏高。Idle(pid=0) 不参与判定 */
export function processTone(r: Record<string, any>): Tone {
  if (numOf(r?.pid) === 0) return "";
  const cpu = numOf(r?.cpu);
  const mem = numOf(r?.memory);
  if (cpu >= 85 || mem >= 4096) return "bad";
  if (cpu >= 50 || mem >= 1024) return "warn";
  return "";
}

/** 服务是否处于未运行态（决定给「启动」还是「停止 / 重启」） */
export function serviceRunning(r: Record<string, any>): boolean {
  const s = String(r?.state ?? "").trim().toLowerCase();
  if (!s) return false;
  return s === "running" || s === "active" || s === "started" || s === "online";
}

/** 任意状态词归一成等级：running/listen/up/allow 正常，stopped/deny/down 危险，其余待定 */
export function stateTone(state: unknown): Tone {
  const s = String(state ?? "").trim().toLowerCase();
  if (!s || s === "-" || s === "—") return "mute";
  if (s === "running" || s === "active" || s === "listen" || s === "listening"
    || s === "up" || s === "allow" || s === "allowed" || s === "open" || s === "established") return "ok";
  if (s === "stopped" || s === "inactive" || s === "dead" || s === "deny" || s === "denied"
    || s === "down" || s === "failed" || s === "error" || s === "closed") return "bad";
  if (s === "disabled" || s === "manual" || s === "unknown" || s === "paused") return "mute";
  return "warn";
}

/**
 * 端口是否处于监听：监听 / 运行视为开放，其余视为关闭。
 * 空值返回 null，表示通道没给状态，页面上不该画成「关闭」误导人。
 */
export function portOpen(state: unknown): boolean | null {
  const s = String(state ?? "").trim().toLowerCase();
  if (!s || s === "-" || s === "—") return null;
  const openWords = ["listen", "listening", "open", "running", "active", "established"];
  return openWords.some(w => s === w || s.includes(w));
}

/* ==================== 进程图标 ==================== */

/** 常见进程品牌色（关键字命中即取，未命中按名称哈希兜底色） */
const PROCESS_BRAND: Array<[RegExp, string]> = [
  [/java|javaw|corretto|graal/i, "#b07219"],
  [/chrome/i, "#4285f4"],
  [/msedge|^edge/i, "#0ea5e9"],
  [/firefox/i, "#e64a19"],
  [/feishu|lark/i, "#3370ff"],
  [/doubao/i, "#4f46e5"],
  [/powershell|pwsh|cmd|conhost|windowsterminal/i, "#2b6cb0"],
  [/nginx/i, "#2e9d54"],
  [/node|npm|pnpm|yarn/i, "#3c873a"],
  [/python|py/i, "#3776ab"],
  [/mysqld|mariadb/i, "#00758f"],
  [/redis/i, "#d82c20"],
  [/postgres/i, "#336791"],
  [/explorer/i, "#f0a020"],
  [/docker|containerd/i, "#0db7ed"],
  [/sshd|ssh/i, "#5f6b7a"],
  [/system|svchost|services|smss|csrss|wininit/i, "#7a869a"],
];

/** 名称 → 首字母 + 品牌色（哈希兜底，保证任何名字都有稳定颜色） */
export function logoOf(name: unknown): { letter: string; color: string } {
  const n = String(name ?? "");
  for (const [re, color] of PROCESS_BRAND) {
    if (re.test(n)) return { letter: n.charAt(0).toUpperCase() || "?", color };
  }
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return { letter: n.charAt(0).toUpperCase() || "?", color: `hsl(${h % 360} 48% 46%)` };
}

/** 服务头像：运行中取品牌色，已停止置灰 */
export function serviceLogo(r: Record<string, any>): { letter: string; color: string } {
  const base = logoOf(r?.name);
  return serviceRunning(r) ? base : { letter: base.letter, color: "#b6bcc7" };
}

/**
 * 前置图标的统一口径：
 *  1) 进程 / 运行中的服务命中官方品牌 → 彩色 Logo（衬白色块）；
 *  2) 否则「品牌色块 + 单色线性图形」；
 *  3) 再否则「品牌色块 + 首字母」。已停止的服务不显示彩色 Logo。
 */
export function leadTileOf(
  section: "processes" | "services",
  r: Record<string, any>,
): { brand: string; bg: string; glyph: string; letter: string } {
  const running = section === "services" ? serviceRunning(r) : true;
  const brand = running ? processBrandIcon(r?.name) : "";
  if (brand) return { brand, bg: "", glyph: "", letter: "" };
  const logo = section === "processes" ? logoOf(r?.name) : serviceLogo(r);
  return { brand: "", bg: logo.color, glyph: processGlyph(r?.name), letter: logo.letter };
}

/* ==================== 数值文案 ==================== */

/** 容量：GB 一位小数，超大容量换算成 TB 便于扫读 */
export function fmtCapacity(gb: unknown): string {
  const n = numOf(gb);
  if (n >= 1024) return `${(n / 1024).toFixed(2)} TB`;
  return `${Math.round(n * 10) / 10} GB`;
}

/** 内存：MB 一位小数，≥1024 换算 GB */
export function fmtMemory(mb: unknown): string {
  const n = numOf(mb);
  if (n >= 1024) return `${(n / 1024).toFixed(1)} GB`;
  return `${Math.round(n * 10) / 10} MB`;
}
