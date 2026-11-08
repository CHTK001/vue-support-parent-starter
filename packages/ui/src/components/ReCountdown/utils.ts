/**
 * ReCountdown utils —— 倒计时核心计算
 *
 * 把「目标时间(ms) → 剩余 ms → 文本格式」串好，各 layout 直接消费。
 */

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

/**
 * ms 转文本（H:M:S）
 */
export function toHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * ms 转文本（M:S），秒数小于 60 时不补小时
 */
export function toMS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${pad(seconds)}`;
}

/**
 * 格式化为 "xx秒" / "xx分" / ".xx"（短提示）
 */
export function toShortText(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}秒`;
  return toMS(ms);
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
