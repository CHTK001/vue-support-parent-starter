/**
 * 后台下发的节假日数据（覆盖层）
 *
 * <p>后台 {@code GET /v2/holiday/get?year=} 按<b>日期逐行</b>返回
 * {@code { date, name, isHoliday }}（{@code isHoliday=1} 休息、{@code 0} 补班），
 * 一段 7 天的假期就是 7 行同名记录。本模块负责把这些行归一成一个按日期键索引的覆盖层。</p>
 *
 * <p><b>与本地表的关系</b>：后台是管理员可维护的事实来源，因此<b>只覆盖它给出的那些日期</b>，
 * 其余日期仍走 {@link ./statutory} 的内置表与推算。这样后台只下发一年也不会让其余年份变空 ——
 * 拿掉覆盖层（{@link clearRemoteHolidays}）即完全退回本地行为。</p>
 *
 * <p>本模块<b>不依赖任何运行时设施</b>（无 http、无 Vue），
 * 便于独立核验；取数与装配由 widget 层接线（core 不反向依赖 theme）。</p>
 */
import { isDateKey } from "./dateKey";

/** 后台下发的一条节假日记录（归一后） */
export interface RemoteHoliday {
  /** {@code YYYY-MM-DD} */
  key: string;
  /** 节日名 */
  name: string;
  /** true = 休息，false = 补班上班 */
  isHoliday: boolean;
}

/** 日期键 → 记录 */
const byDate = new Map<string, RemoteHoliday>();

/** 已有数据的年份集合 */
const years = new Set<number>();

/** 最近一次写入时的原始行数（面板据此显示「已同步 N 条」） */
let lastCount = 0;

/**
 * 用后台数据覆盖某一年。
 *
 * <p><b>整年替换</b>而非增量合并：后台是权威来源，若某一年此前下发过 30 行、
 * 现在只下发 10 行，说明后台删了 20 条，增量合并会让已删除的日期继续显示放假 ——
 * 那是「日历说有假、后台说没有」的最坏情形。</p>
 *
 * @param year 公历年
 * @param list 该年的全部记录（日期重复时以最后一条为准）
 * @returns 实际收录的条数（跳过日期非法或名称为空的行）
 */
export function setRemoteHolidays(year: number, list: readonly RemoteHoliday[]): number {
  // 先清掉该年旧数据，避免残留已删除的日期
  for (const key of [...byDate.keys()]) {
    if (key.startsWith(`${year}-`)) byDate.delete(key);
  }
  let count = 0;
  for (const item of list) {
    if (!isDateKey(item.key) || !item.name?.trim()) continue;
    byDate.set(item.key, { key: item.key, name: item.name.trim(), isHoliday: !!item.isHoliday });
    count += 1;
  }
  years.add(year);
  lastCount = count;
  return count;
}

/**
 * 某天是否有后台记录。
 *
 * @param key {@code YYYY-MM-DD}
 * @returns 命中返回记录；否则 {@code null}
 */
export function getRemoteHoliday(key: string): RemoteHoliday | null {
  return byDate.get(key) ?? null;
}

/**
 * 某年是否已有后台数据。
 *
 * @param year 公历年
 * @returns 有返回 {@code true}
 */
export function hasRemoteHolidays(year: number): boolean {
  return years.has(year);
}

/**
 * 取某年后台下发的全部记录，按日期升序。
 *
 * @param year 公历年
 * @returns 该年的记录；无数据返回空数组
 */
export function getRemoteHolidays(year: number): readonly RemoteHoliday[] {
  const prefix = `${year}-`;
  return [...byDate.values()].filter((h) => h.key.startsWith(prefix)).sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * 最近一次同步收录的条数。
 *
 * @returns 条数；从未同步过返回 0
 */
export function remoteHolidayCount(): number {
  return lastCount;
}

/** 清除全部后台数据（退回纯本地计算） */
export function clearRemoteHolidays(): void {
  byDate.clear();
  years.clear();
  lastCount = 0;
}

/**
 * 把后台返回的原始行归一成 {@link RemoteHoliday}。
 *
 * <p>容错要点：</p>
 * <ul>
 *   <li>{@code date} 可能是 {@code "2026-10-01"}，也可能是数组形态的
 *       {@code "2026-10-01T00:00:00"}（Jackson 对 {@code LocalDate} 的默认序列化），
 *       一律截到日；</li>
 *   <li>{@code isHoliday} 后端是 {@code Boolean}，但也可能是 {@code 1/0} 或字符串
 *       {@code "true"}，统一按「非 0 且非 "0"/"false" 即为休息」处理；</li>
 *   <li>日期缺失或非法直接丢弃 —— 猜不出日期的行对日历毫无意义。</li>
 * </ul>
 *
 * @param rows 后台返回的原始数组
 * @returns 归一后的记录（顺序与入参一致）
 */
export function normalizeRemoteHolidays(rows: readonly unknown[]): RemoteHoliday[] {
  const out: RemoteHoliday[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const rawDate = r.sysHolidayDate ?? r.date;
    if (typeof rawDate !== "string") continue;
    // 截到日（兼容 "2026-10-01T00:00:00"）后必须再校验格式。
    // 不能交给 new Date 解析再取字段：解析失败得到 Invalid Date，
    // 取出来的会是 "NaN-NaN-NaN" —— 永远匹配不上任何真实日期，
    // 却仍占着覆盖层的一条记录与计数，比直接丢弃更难排查。
    const key = rawDate.trim().slice(0, 10);
    if (!isDateKey(key)) continue;
    const name = String(r.sysHolidayName ?? r.name ?? "").trim();
    if (!name) continue;
    out.push({ key, name, isHoliday: toBool(r.sysHolidayIsHoliday ?? r.isHoliday) });
  }
  return out;
}

/**
 * 后端布尔字段的宽松解析。
 *
 * @param v 原始值（布尔 / 数字 / 字符串 / 空）
 * @returns 非 0 且非 {@code "false"} / {@code "0"} 视为 {@code true}
 */
function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s !== "" && s !== "0" && s !== "false";
  }
  return false;
}