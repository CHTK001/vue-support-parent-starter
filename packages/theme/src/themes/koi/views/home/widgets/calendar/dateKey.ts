/**
 * 日期键（{@code YYYY-MM-DD}）工具
 *
 * <p>全仓统一用「本地时区的日历日」作主键，而不是 UTC 时刻或时间戳 ——
 * 日历要回答的是「今天几号」，而不是「现在几点」。所有换算都在本地日期上做，
 * 因此运行在东八区之外的机器上结果同样正确。</p>
 *
 * <p>抽成独立模块是为了让 {@link ./lunar}、{@link ./solarTerms}、{@link ./statutory}、
 * {@link ./dayInfo} 共用同一套实现 —— 四处各写一份改一处必然漏三处。</p>
 */

/** 日期键格式校验 */
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 两位补零。
 *
 * @param n 数值
 * @returns 不足两位时前面补 {@code 0} 的字符串
 */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Date → 日期键（按其本地年月日）。
 *
 * @param d 日期
 * @returns {@code YYYY-MM-DD}
 */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * 日期键加一天。
 *
 * <p>走 {@link Date} 构造而非手工进位，闰年与月末都不需要特判。</p>
 *
 * @param key {@code YYYY-MM-DD}
 * @returns 次日的日期键
 */
export function nextDateKey(key: string): string {
  return addDateKeyDays(key, 1);
}

/**
 * 日期键加 n 天（n 可为负）。
 *
 * @param key {@code YYYY-MM-DD}
 * @param days 偏移天数
 * @returns 偏移后的日期键
 */
export function addDateKeyDays(key: string, days: number): string {
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(5, 7));
  const d = Number(key.slice(8, 10));
  return toDateKey(new Date(y, m - 1, d + days));
}

/**
 * 日期键 → 本地 Date。
 *
 * @param key {@code YYYY-MM-DD}
 * @returns 本地零点时刻的 Date
 */
export function fromDateKey(key: string): Date {
  return new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));
}

/**
 * 日期键是否合法。
 *
 * @param key 待校验字符串
 * @returns 形如 {@code YYYY-MM-DD} 返回 {@code true}
 */
export function isDateKey(key: string): boolean {
  return DATE_KEY_RE.test(key);
}

/**
 * 两个日期键相差的天数（{@code b - a}）。
 *
 * @param a 起 {@code YYYY-MM-DD}
 * @param b 止 {@code YYYY-MM-DD}
 * @returns 天数差；入参非法返回 {@code NaN}
 */
export function diffDays(a: string, b: string): number {
  const ta = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
  const tb = Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10)));
  return Math.round((tb - ta) / 86_400_000);
}

/** 星期中文短名，索引与 {@link Date.getDay} 对齐 */
export const WEEKDAY_NAMES: readonly string[] = ["日", "一", "二", "三", "四", "五", "六"];