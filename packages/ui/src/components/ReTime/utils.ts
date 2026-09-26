/**
 * ReTime 内部工具：时间格式化 + 中文相对时间
 */
import type { ReTimeFormat, ReTimeValue } from "./types";

/** 把任意输入归一为毫秒时间戳。失败返回 NaN。 */
export function toMs(value: ReTimeValue): number {
  if (value === null || value === undefined || value === "") return NaN;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : NaN;
  }
  if (typeof value === "number") {
    // 秒级时间戳自动升级为毫秒级（< 1e12 视为秒）
    const ms = value < 1e12 ? value * 1000 : value;
    return Number.isFinite(ms) ? ms : NaN;
  }
  if (typeof value === "string") {
    // 纯数字字符串：按数字处理
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return toMs(Number(value));
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

/** 数字前补零 */
function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/** 内部支持的 token */
const TOKEN_RE = /\[([^\]]+)\]|YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|SSS/g;

/**
 * 按 token 格式化日期对象。
 * - YYYY: 4 位年；YY: 2 位年
 * - MM/M: 月（补零/不补零）
 * - DD/D: 日
 * - HH/H: 时（24h）
 * - mm/m: 分
 * - ss/s: 秒
 * - SSS: 毫秒
 * - \[...\]: 转义原样输出
 */
export function formatByPattern(date: Date, pattern: string): string {
  const Y = date.getFullYear();
  const M = date.getMonth() + 1;
  const D = date.getDate();
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ms = date.getMilliseconds();
  return pattern.replace(TOKEN_RE, (_, esc) => {
    if (esc !== undefined) return esc;
    switch (_) {
      case "YYYY":
        return String(Y);
      case "YY":
        return String(Y).slice(-2);
      case "MM":
        return pad(M);
      case "M":
        return String(M);
      case "DD":
        return pad(D);
      case "D":
        return String(D);
      case "HH":
        return pad(h);
      case "H":
        return String(h);
      case "mm":
        return pad(m);
      case "m":
        return String(m);
      case "ss":
        return pad(s);
      case "s":
        return String(s);
      case "SSS":
        return pad(ms, 3);
      default:
        return _;
    }
  });
}

/** 主格式化入口 */
export function formatValue(value: ReTimeValue, format: ReTimeFormat): string {
  const ms = toMs(value);
  if (!Number.isFinite(ms)) return "";
  // 时长类输入是「毫秒数」而不是时间戳：必须在 toMs 之前分流，
  // 否则 800（毫秒）会被当成秒级时间戳放大成 800000。
  if (format === "duration") {
    return formatDuration(value);
  }
  if (format === "ms") {
    return String(Math.round(ms));
  }
  const date = new Date(ms);
  switch (format) {
    case "timestamp":
      return String(ms);
    case "timestamp-s":
      return String(Math.floor(ms / 1000));
    case "iso":
      return date.toISOString();
    case "YYYY-MM-DD HH:mm:ss":
    case "YYYY-MM-DD":
    case "HH:mm:ss":
    case "HH:mm":
    case "YYYY/MM/DD":
    case "YYYY/MM/DD HH:mm:ss":
      return formatByPattern(date, format);
    default:
      // 自定义格式串
      return formatByPattern(date, format);
  }
}

/**
 * 中文相对时间：返回 "3 分钟前" / "刚刚" / "2 天后" 等。
 * @param value 目标时间
 * @param base 基准时间（默认 now）
 */
export function relativeTime(value: ReTimeValue, base: number = Date.now()): string {
  const ms = toMs(value);
  if (!Number.isFinite(ms)) return "";
  const diff = ms - base; // 正数=未来，负数=过去
  const abs = Math.abs(diff);
  const future = diff > 0;
  if (abs < 45 * 1000) return "刚刚";
  if (abs < 60 * 1000) return future ? "即将" : "刚刚";
  const units: Array<{ ms: number; single: string; many: string }> = [
    { ms: 365 * 24 * 3600 * 1000, single: "年", many: "年" },
    { ms: 30 * 24 * 3600 * 1000, single: "个月", many: "个月" },
    { ms: 7 * 24 * 3600 * 1000, single: "周", many: "周" },
    { ms: 24 * 3600 * 1000, single: "天", many: "天" },
    { ms: 3600 * 1000, single: "小时", many: "小时" },
    { ms: 60 * 1000, single: "分钟", many: "分钟" },
    { ms: 1000, single: "秒", many: "秒" },
  ];
  for (const u of units) {
    if (abs >= u.ms) {
      const n = Math.floor(abs / u.ms);
      const label = `${n} ${u.many}`;
      return future ? `${label}后` : `${label}前`;
    }
  }
  return "";
}

/**
 * 自动最佳粒度显示时长（毫秒输入）：
 *   800  -> "800 毫秒"
 *   30000 -> "30 秒"
 *   90000 -> "1.5 分钟"
 */
export function formatDuration(value: ReTimeValue): string {
  const raw = typeof value === "number" ? value : toMs(value);
  if (!Number.isFinite(raw)) return "";
  const ms = Math.max(0, raw);
  if (ms < 1000) return `${Math.floor(ms)} 毫秒`;
  const s = ms / 1000;
  if (s < 60) return `${trimNumber(s)} 秒`;
  const m = s / 60;
  if (m < 60) return `${trimNumber(m)} 分钟`;
  const h = m / 60;
  if (h < 24) return `${trimNumber(h)} 小时`;
  const d = h / 24;
  if (d < 30) return `${trimNumber(d)} 天`;
  return `${trimNumber(d / 30)} 个月`;
}

function trimNumber(n: number): string {
  // 保留 2 位有效小数，去掉末尾 0
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}