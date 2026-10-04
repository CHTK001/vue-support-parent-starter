/**
 * 二十四节气换算
 *
 * <p>节气按<b>太阳视黄经</b>定义：太阳黄经每过 15° 为一个节气，序列为
 * 小寒 285° → 大寒 300° → 立春 315° → …… → 冬至 270°（即 -90°）。
 * 本模块用 Meeus《Astronomical Algorithms》的低精度太阳位置公式求出黄经，
 * 再二分法求过零点，因此不依赖「平气」近似，年代漂移极小。</p>
 *
 * <p>节气时刻按<b>北京时间（东八区）</b>归属日期 —— 这是国内历书的通行口径。
 * 换算只做一次经度平移后读取 UTC 字段，不经过本地时区，
 * 因此运行在东八区之外的机器上结果也一致。</p>
 */

import { pad2 } from "./dateKey";

/** 北京时区偏移（毫秒） */
const BEIJING_OFFSET_MS = 8 * 3600_000;

/** 儒略日 epoch（1970-01-01T00:00:00Z 对应的 JD） */
const JD_EPOCH_OFFSET = 2440587.5;

/** 节气名，索引 0 为小寒（黄经 285°），每项递增 15° */
export const SOLAR_TERM_NAMES: readonly string[] = [
  "小寒", "大寒", "立春", "雨水", "惊蛰", "春分",
  "清明", "谷雨", "立夏", "小满", "芒种", "夏至",
  "小暑", "大暑", "立秋", "处暑", "白露", "秋分",
  "寒露", "霜降", "立冬", "小雪", "大雪", "冬至",
];

/** 「某年某月第几个星期几」型节日用的星期序号（与 {@link Date.getDay} 一致） */
const MS_PER_DAY = 86_400_000;

/**
 * 计算给定儒略日时刻的太阳视黄经（度，可能大于 360）。
 *
 * <p>返回未取模的值，便于调用方直接做「目标黄经 − 当前黄经」的差值迭代。</p>
 *
 * @param jd 儒略日（UTC 基准）
 * @returns 太阳视黄经，单位度
 */
function apparentSolarLongitude(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  // 几何平黄经
  const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  // 平近点角
  const m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const mr = (m * Math.PI) / 180;
  // 中心差
  const c =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(mr) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * mr) +
    0.000289 * Math.sin(3 * mr);
  const trueLong = l0 + c;
  // 章动与光行差修正
  const omega = ((125.04 - 1934.136 * t) * Math.PI) / 180;
  return trueLong - 0.00569 - 0.00478 * Math.sin(omega);
}

/**
 * 儒略日转北京时间日期键。
 *
 * @param jd 儒略日（UTC 基准）
 * @returns {@code YYYY-MM-DD}（北京时间）
 */
function jdToBeijingDateKey(jd: number): string {
  const ms = (jd - JD_EPOCH_OFFSET) * MS_PER_DAY + BEIJING_OFFSET_MS;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** 日期键转儒略日（该日北京时间 00:00 对应的 JD） */
function dateKeyToJd(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY + JD_EPOCH_OFFSET - BEIJING_OFFSET_MS / MS_PER_DAY;
}

/**
 * 求「目标黄经还差多少度」。
 *
 * <p>归一到 {@code (-180, 180]} 是必需的：黄经在 0°/360° 处会回绕，
 * 直接比较 {@code target - lon} 会让 359.9° 与 0.1° 得出完全相反的符号，
 * 二分法随之发散。归一后「差值为正」严格等价于「目标时刻还没到」。</p>
 *
 * @param jd 儒略日
 * @param target 目标黄经（度）
 * @returns 目标黄经减去当前黄经，归一到 {@code (-180, 180)}
 */
function deltaToTarget(jd: number, target: number): number {
  const diff = target - apparentSolarLongitude(jd);
  return (((diff % 360) + 540) % 360) - 180;
}

/**
 * 求某年某节气的儒略日时刻。
 *
 * @param year 公历年
 * @param index 节气索引（0 = 小寒，23 = 冬至）
 * @returns 该节气交点的儒略日；索引非法返回 {@code NaN}
 */
function termJd(year: number, index: number): number {
  if (index < 0 || index >= SOLAR_TERM_NAMES.length) return NaN;
  // 目标黄经：小寒 285° 起，每项 +15°
  const target = 285 + 15 * index;
  // 初值：小寒约在 1 月 5 日，节气间隔均值 = 一个回归年 / 24。
  // 该初值与真值相差不超过 1 天，足够让 ±3 天的二分区间单调查到目标。
  const approx = dateKeyToJd(`${year}-01-05`) + index * (365.2422 / 24);

  let lo = approx - 3;
  let hi = approx + 3;
  // 太阳黄经随时间单调递增，deltaToTarget 单调递减，二分必然收敛
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (deltaToTarget(mid, target) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 一年的 24 项缓存：年份 → 24 个节气的日期键 */
const termCache = new Map<number, string[]>();

/**
 * 取某公历年的全部节气日期。
 *
 * <p>同一个年份只算一次，重复调用直接命中缓存。</p>
 *
 * @param year 公历年
 * @returns 长度 24 的日期键数组，下标与 {@link SOLAR_TERM_NAMES} 对齐
 */
export function getYearSolarTerms(year: number): readonly string[] {
  const cached = termCache.get(year);
  if (cached) return cached;
  const list: string[] = [];
  for (let i = 0; i < SOLAR_TERM_NAMES.length; i += 1) {
    const jd = termJd(year, i);
    list.push(Number.isNaN(jd) ? "" : jdToBeijingDateKey(jd));
  }
  termCache.set(year, list);
  return list;
}

/**
 * 查某一天是否为节气，以及节气名。
 *
 * @param dateKey {@code YYYY-MM-DD}
 * @returns 节气名；当天不是节气返回 {@code null}
 */
export function getSolarTerm(dateKey: string): string | null {
  const year = Number(dateKey.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  // 小寒通常落在 1 月初，故同时查相邻两年的表 —— 跨年边界（如 1 月 5 日的小寒）
  // 与公历年不完全对齐，只查本年会在跨年时漏掉
  const idx = [...getYearSolarTerms(year), ...getYearSolarTerms(year + 1)].indexOf(dateKey);
  if (idx < 0) return null;
  return SOLAR_TERM_NAMES[idx % SOLAR_TERM_NAMES.length];
}

/**
 * 求某年某个节气的日期键。
 *
 * @param year 公历年
 * @param name 节气名（如「清明」）
 * @returns {@code YYYY-MM-DD}；节气名不合法返回 {@code null}
 */
export function getSolarTermDate(year: number, name: string): string | null {
  const idx = SOLAR_TERM_NAMES.indexOf(name);
  if (idx < 0) return null;
  return getYearSolarTerms(year)[idx] ?? null;
}