/**
 * ReCountdown utils —— 倒计时核心计算
 *
 * 把「目标时间(ms) → 剩余 ms → 文本格式 → 颜色」串好，各 layout 直接消费。
 */

import type { CountdownColor, CountdownColorThresholds, CountdownFormat, CountdownUnit } from "./types";

/** 单位到 ms 的转换 */
const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** 默认补零 */
export function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/**
 * 解析 endTime（目标时间戳）
 * @param seconds 秒数（从 value/duration prop 翻译）
 * @param now 开始时间戳
 * @returns 目标时间戳（ms）
 */
export function resolveEndTime(seconds?: number, now = Date.now()): number {
  if (!seconds || isNaN(seconds)) return 0;
  return now + Math.ceil(seconds * 1000);
}

/**
 * 剩余 ms（绝对时间差）
 */
export function remainingMs(endTime: number): number {
  return Math.max(0, endTime - Date.now());
}

/** ms 转文本（H:M:S） */
export function toHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** ms 转文本（M:S），秒数小于 60 时不补小时 */
export function toMS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${pad(seconds)}`;
}

/**
 * 格式化为短提示（"xx秒" / "xx分" / "xx小时"）
 */
export function toShortText(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}小时`;
  if (minutes) return `${minutes}分`;
  return `${seconds}秒`;
}

/**
 * @returns 是否在 15 秒内（预警颜色）
 */
export function isUrgent(ms: number): boolean {
  return ms <= 15_000;
}

/**
 * @returns 是否已完成
 */
export function isFinished(ms: number): boolean {
  return ms <= 0;
}

/**
 * 给定一个列表，返回按任务 ID 分组的剩余表
 */
export function taskRemaining(tasks: Array<{ id: string; remaining: number }>): Map<string, number> {
  const map = new Map<string, number>();
  tasks.forEach((t) => map.set(t.id, t.remaining));
  return map;
}

/**
 * 每个单位占的文本宽度
 */
const UNIT_WIDTH: Record<CountdownUnit, number> = { d: 2, h: 2, m: 2, s: 2 };

/** 单位 → 显示标签 */
export const UNIT_LABELS: Record<CountdownUnit, string> = { d: "天", h: "时", m: "分", s: "秒" };

/**
 * 按设置的时间（总时长）挑要显示的单位
 *
 *  <= 60s 只读秒；60s~1h 读分秒；1h~1d 读时/分/秒；> 1d 读天/时/分/秒。
 *  这样 60 秒的倒计时内环就不再是 HH:MM:SS，而是 `00`~`60`。
 *
 * @param totalMs 总时长（ms）
 * @returns 已选中的单位列表（从大到小）
 */
export function pickUnits(totalMs: number): CountdownUnit[] {
  const seconds = Math.floor(totalMs / 1000);
  if (seconds <= 60) return ["s"];
  if (seconds < 3600) return ["m", "s"];
  if (seconds < 86400) return ["h", "m", "s"];
  return ["d", "h", "m", "s"];
}

/**
 * format prop 的值 → 要显示的单位
 *
 *  与 pickUnits 的不同：固定格式（hms / ms / s）无视总时长，短提示（short）退回 auto。
 */
export function relevantUnits(totalMs: number, format: CountdownFormat = "auto"): CountdownUnit[] {
  if (format === "hms") return ["h", "m", "s"];
  if (format === "ms") return ["m", "s"];
  if (format === "s") return ["s"];
  return pickUnits(totalMs);
}

/**
 * 剩余 ms 拆成单位值
 *
 * @param ms 剩余 ms
 * @returns 各单位的值
 */
export function timeValues(ms: number): Record<CountdownUnit, number> {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  return {
    d: Math.floor(totalSeconds / 86400),
    h: Math.floor((totalSeconds % 86400) / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

/**
 * 每个单位在 total 下的量级（环/方格进度分母），
 * 让倒计时 "10 分" 的 "分" 环从 100% 掉到 0%（而不是按照 60 分算的 10%）。
 *
 * 秒环按 60 秒的周期跳动（秒针），分/时/天环按总时长的占比跳动（总进度）：
 *
 *   5 分倒计时：分环 = 剩余分 / 5；未达整分时按 60 分算。
 *   1.5 分倒计时：分环 = 剩余分 / 1.5（如 1:00 → 67%）。
 *
 * @param totalMs 总时长
 * @param unit 单位
 * @returns 该单位应的最大数值（永远 >= 1）
 */
export function unitTotal(totalMs: number, unit: CountdownUnit): number {
  switch (unit) {
    case "s":
      return 60;
    case "m":
      return Math.max(1, totalMs / 60_000);
    case "h":
      return Math.max(1, totalMs / 3_600_000);
    case "d":
      return Math.max(1, totalMs / 86_400_000);
  }
}

/**
 * 把 units 按单位文本拼起来（环形布局 / 文本显示专用）
 *
 *   ["s"]            -> "45"
 *   ["m", "s"]       -> "00:45"
 *   ["h", "m", "s"]  -> "01:00:45"
 *   ["d", "h", "m", "s"] -> "1天 01:00:45"
 *
 * @param ms 剩余 ms
 * @param units 要显示的单位
 * @param format 文本格式
 * @returns 拼接后的文本
 */
export function formatRemaining(ms: number, units: CountdownUnit[], format: CountdownFormat = "auto"): string {
  if (format === "short") {
    return toShortText(ms);
  }
  const digits = timeValues(ms);
  const parts = units.map((u) => {
    const v = digits[u];
    if (u === "d") return `${v}天`;
    return pad(v, UNIT_WIDTH[u]);
  });
  if (parts.length > 1 && parts[0].endsWith("天")) {
    return `${parts[0]} ${parts.slice(1).join(":")}`;
  }
  return parts.join(":");
}

/**
 * 每个单位的独立文本（时钟布局专用：每个单元显示各自单位的值）
 *
 * @param ms 剩余 ms
 * @param units 单位
 * @returns 对应单位的文本数组（已补零）
 */
export function unitTexts(ms: number, units: CountdownUnit[]): string[] {
  const digits = timeValues(ms);
  return units.map((u) => pad(digits[u], UNIT_WIDTH[u]));
}

/**
 * 按剩余比例取配置的颜色
 *
 * 比例 = remaining / total，从大到小检查，落一档就取一档（方便业务只配一个 danger）：
 *   ratio >= 0.6 → success（绿色）
 *   ratio >= 0.3 → warning（黄色）
 *   ratio <  0.3 → danger（红色）
 *
 * colors 按档位名取（success/warning/danger），配件档不回流到其它档。
 *
 * @param ms 剩余 ms
 * @param config 颜色阈值配置
 * @param totalMs 总时长
 * @param fallback 不满足阈值或没提供总时长时的保留色
 * @returns 档位（如 "success"）
 */
export function resolveColor(
  ms: number,
  config: CountdownColorThresholds | undefined,
  totalMs: number,
  fallback: CountdownColor = "primary"
): CountdownColor {
  if (!config || !totalMs || totalMs <= 0) return fallback;
  const ratio = Math.min(1, Math.max(0, ms / totalMs));
  const tier: CountdownColor = ratio >= (config.success ?? 0.6) ? "success"
    : ratio >= (config.warning ?? 0.3) ? "warning"
    : "danger";
  return config.colors?.[tier] ?? tier;
}
