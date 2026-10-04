/**
 * 法定节假日与调休上班日
 *
 * <p><b>数据可信度分层</b> —— 这是本模块最要紧的设计：</p>
 * <ol>
 *   <li><b>已公布</b>（{@link PUBLISHED_YEARS}）：国务院办公厅逐年发文明确放假区间与
 *       调休上班日，{@code StatutoryPeriod.provisional} 为 {@code false}，可直接上屏；</li>
 *   <li><b>未公布</b>：年份既不在已公布表内、又晚于最后一次通告的年份。
 *       国务院办公厅通常在<b>前一年 11 月</b>发布次年安排，因此当年 1—10 月的数据
 *       在 11 月前是「已公布」，11—12 月则尚未公布。</li>
 * </ol>
 *
 * <p>未公布的年份只按《全国年节及纪念日放假办法》<b>推算法定假日当天</b>，
 * <b>不编造调休上班日</b> —— 调休完全取决于当年双休日的排布，无据可推。
 * 宁可少标一个「班」，也不能让用户按错的日子请假上班。
 * 推算结果 {@code provisional === true}，UI 需据此弱化展示。</p>
 */
import {
  addDateKeyDays,
  fromDateKey,
  isDateKey,
  nextDateKey,
  toDateKey,
} from "./dateKey";
import { solarToLunar, lunarNewYear, lunarNewYearEve } from "./lunar";
import { getSolarTermDate } from "./solarTerms";

/** 一段法定放假区间 */
export interface StatutoryPeriod {
  /** 节日名（如「国庆节、中秋节」） */
  name: string;
  /** 放假首日 {@code YYYY-MM-DD} */
  start: string;
  /** 放假末日（含） {@code YYYY-MM-DD} */
  end: string;
  /** 调休上班日（原本是双休日但要上班） */
  workdays: readonly string[];
  /** 是否为按《放假办法》推算而非官方公布 */
  provisional: boolean;
}

/**
 * 官方公布的放假安排。
 *
 * <p>逐年取自中国政府网《国务院办公厅关于 X 年部分节假日安排的通知》原文。</p>
 */
const PUBLISHED: Readonly<Record<number, readonly StatutoryPeriod[]>> = {
  // 国办发明电〔2024〕12号，2024-11-12 发布
  2025: [
    { name: "元旦", start: "2025-01-01", end: "2025-01-01", workdays: [], provisional: false },
    {
      name: "春节",
      start: "2025-01-28",
      end: "2025-02-04",
      workdays: ["2025-01-26", "2025-02-08"],
      provisional: false,
    },
    { name: "清明节", start: "2025-04-04", end: "2025-04-06", workdays: [], provisional: false },
    {
      name: "劳动节",
      start: "2025-05-01",
      end: "2025-05-05",
      workdays: ["2025-04-27"],
      provisional: false,
    },
    { name: "端午节", start: "2025-05-31", end: "2025-06-02", workdays: [], provisional: false },
    {
      name: "国庆节、中秋节",
      start: "2025-10-01",
      end: "2025-10-08",
      workdays: ["2025-09-28", "2025-10-11"],
      provisional: false,
    },
  ],
  // 国办发明电〔2025〕7号，2025-11-04 发布
  2026: [
    {
      name: "元旦",
      start: "2026-01-01",
      end: "2026-01-03",
      workdays: ["2026-01-04"],
      provisional: false,
    },
    {
      name: "春节",
      start: "2026-02-15",
      end: "2026-02-23",
      workdays: ["2026-02-14", "2026-02-28"],
      provisional: false,
    },
    { name: "清明节", start: "2026-04-04", end: "2026-04-06", workdays: [], provisional: false },
    {
      name: "劳动节",
      start: "2026-05-01",
      end: "2026-05-05",
      workdays: ["2026-05-09"],
      provisional: false,
    },
    { name: "端午节", start: "2026-06-19", end: "2026-06-21", workdays: [], provisional: false },
    { name: "中秋节", start: "2026-09-25", end: "2026-09-27", workdays: [], provisional: false },
    {
      name: "国庆节",
      start: "2026-10-01",
      end: "2026-10-07",
      workdays: ["2026-09-20", "2026-10-10"],
      provisional: false,
    },
  ],
};

/** 已有官方数据的年份 */
export const PUBLISHED_YEARS: readonly number[] = Object.keys(PUBLISHED)
  .map(Number)
  .sort((a, b) => a - b);

/**
 * 最后一次官方通告所覆盖的公历年。
 *
 * <p>国务院办公厅在 11 月发布次年安排，故截止到本表最大年份为止都算「已公布」；
 * 再往后的年份只能推算。</p>
 */
export const LAST_PUBLISHED_YEAR = PUBLISHED_YEARS[PUBLISHED_YEARS.length - 1];

/**
 * 按《全国年节及纪念日放假办法》（2024-11 修订，2025 年起施行）推算的法定假日。
 *
 * <p>依据：元旦 1 天、春节 4 天（除夕、正月初一至初三）、清明 1 天、劳动节 2 天、
 * 端午 1 天、中秋 1 天、国庆 3 天，合计 13 天。
 * <b>调休上班日一律留空</b>，见文件头说明。</p>
 *
 * @param year 公历年
 * @returns 推算的放假区间；农历换算失败时返回已知的部分
 */
function derivePeriods(year: number): StatutoryPeriod[] {
  const out: StatutoryPeriod[] = [];
  const push = (name: string, start: string | null, days: number): void => {
    if (!start || !isDateKey(start)) return;
    out.push({
      name,
      start,
      end: addDateKeyDays(start, days - 1),
      workdays: [],
      provisional: true,
    });
  };

  push("元旦", `${year}-01-01`, 1);
  const eve = lunarNewYearEve(year);
  push("春节", eve ? toDateKey(eve) : null, 4);
  const qingming = getSolarTermDate(year, "清明");
  push("清明节", qingming, 1);
  push("劳动节", `${year}-05-01`, 2);
  // 端午、中秋落在农历日，逐年求首次出现的那一天
  push("端午节", firstLunarDayOfYear(year, 5, 5), 1);
  push("中秋节", firstLunarDayOfYear(year, 8, 15), 1);
  push("国庆节", `${year}-10-01`, 3);
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * 求某公历年内，指定农历月日首次出现的那一天。
 *
 * <p>端午（农历五月初五）与中秋（八月十五）在公历上必定落在 1—12 月内，
 * 因此扫描「今年 1 月 1 日起 370 天」必然命中。</p>
 *
 * @param year 公历年
 * @param month 农历月
 * @param day 农历日
 * @returns 日期键；农历数据不可用时返回 {@code null}
 */
function firstLunarDayOfYear(year: number, month: number, day: number): string | null {
  const start = `${year}-01-01`;
  for (let i = 0; i < 370; i += 1) {
    const local = fromDateKey(addDateKeyDays(start, i));
    const lunar = solarToLunar(local);
    if (lunar && !lunar.isLeap && lunar.month === month && lunar.day === day) {
      return toDateKey(local);
    }
  }
  return null;
}

/** 按年缓存 */
const yearCache = new Map<number, readonly StatutoryPeriod[]>();

/**
 * 取某公历年的全部法定放假区间。
 *
 * <p>同一年度只算一次。返回的数组按放假开始日升序。</p>
 *
 * @param year 公历年
 * @returns 该年放假区间；官方未公布时 {@code provisional} 为 {@code true} 且
 *          {@code workdays} 为空
 */
export function getStatutoryPeriods(year: number): readonly StatutoryPeriod[] {
  const cached = yearCache.get(year);
  if (cached) return cached;
  const list = year <= LAST_PUBLISHED_YEAR ? (PUBLISHED[year] ?? []) : derivePeriods(year);
  yearCache.set(year, list);
  return list;
}

/**
 * 该年放假安排是否已由官方公布。
 *
 * @param year 公历年
 * @returns 已公布返回 {@code true}
 */
export function isStatutoryPublished(year: number): boolean {
  return year <= LAST_PUBLISHED_YEAR;
}

/** 某日命中的放假区间（按日期键索引） */
interface PeriodIndex {
  /** 日期键 → 所在区间 */
  byDate: Map<string, StatutoryPeriod>;
  /** 调休上班日 → 所属节日 */
  workdayOf: Map<string, string>;
}

const indexCache = new Map<number, PeriodIndex>();

/**
 * 某年放假区间的日期索引。
 *
 * @param year 公历年
 * @returns 日期键到区间的映射，以及调休上班日映射
 */
function indexOfYear(year: number): PeriodIndex {
  const cached = indexCache.get(year);
  if (cached) return cached;
  const byDate = new Map<string, StatutoryPeriod>();
  const workdayOf = new Map<string, string>();
  for (const p of getStatutoryPeriods(year)) {
    let cur = p.start;
    // 防御：区间意外反向时不死循环
    for (let guard = 0; guard < 40 && cur <= p.end; guard += 1) {
      byDate.set(cur, p);
      cur = nextDateKey(cur);
    }
    for (const w of p.workdays) {
      if (isDateKey(w)) workdayOf.set(w, p.name);
    }
  }
  const idx: PeriodIndex = { byDate, workdayOf };
  indexCache.set(year, idx);
  return idx;
}

/**
 * 查某天是否落在法定放假区间内。
 *
 * @param dateKey {@code YYYY-MM-DD}
 * @returns 命中的放假区间；不在区间内返回 {@code null}
 */
export function getStatutoryPeriod(dateKey: string): StatutoryPeriod | null {
  const year = Number(dateKey.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  return indexOfYear(year).byDate.get(dateKey) ?? null;
}

/**
 * 查某天是否为调休上班日。
 *
 * @param dateKey {@code YYYY-MM-DD}
 * @returns 所属节日名；非调休上班日返回 {@code null}
 */
export function getMakeupWorkday(dateKey: string): string | null {
  const year = Number(dateKey.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  return indexOfYear(year).workdayOf.get(dateKey) ?? null;
}

/**
 * 某法定节日在某公历年的主节日日（如国庆节的 10 月 1 日）。
 *
 * <p>用于在格子里显示节日名，而不是只显示「第 3 天」。</p>
 *
 * @param dateKey {@code YYYY-MM-DD}
 * @param periodName 节日名
 * @returns 主节日日的日期键；未找到返回 {@code null}
 */
export function getMainFestivalDay(dateKey: string, periodName: string): string | null {
  const year = Number(dateKey.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  const hit = getStatutoryPeriod(dateKey);
  if (!hit || hit.name !== periodName) return null;
  // 名称里可能并列两个节（如「国庆节、中秋节」）。主节日日取节假日本身：
  // 国庆固定 10-1，中秋按农历八月十五求，其余按固定日期或节气
  if (periodName.includes("中秋") && !periodName.includes("国庆")) {
    return firstLunarDayOfYear(year, 8, 15);
  }
  if (periodName.includes("国庆")) return `${year}-10-01`;
  if (periodName.includes("元旦")) return `${year}-01-01`;
  if (periodName.includes("春节")) {
    const ny = lunarNewYear(year);
    return ny ? toDateKey(ny) : null;
  }
  if (periodName.includes("清明")) return getSolarTermDate(year, "清明");
  if (periodName.includes("劳动节")) return `${year}-05-01`;
  if (periodName.includes("端午")) return firstLunarDayOfYear(year, 5, 5);
  return hit.start;
}

/**
 * 求「当前或即将到来」的法定放假区间。
 *
 * <p>逐日推进并以 {@code horizonDays} 为界，因此：</p>
 * <ul>
 *   <li>今天就在假期中 → 立即返回该区间（含元旦 / 春节横跨年末的情况，
 *       按「从起始年 + 1、+2 三年」展开不会漏）；</li>
 *   <li>超出期限 → 返回 {@code null}，而不是返回一个明年才有的区间把「还有多久」算错。</li>
 * </ul>
 *
 * @param fromDateKey 从哪天起算（含）
 * @param horizonDays 最多向后找多少天
 * @returns 命中的区间；期限内没有则返回 {@code null}
 */
export function findNextHoliday(fromDateKey: string, horizonDays = 400): StatutoryPeriod | null {
  let cursor = fromDateKey;
  for (let i = 0; i <= horizonDays; i += 1) {
    const hit = getStatutoryPeriod(cursor);
    if (hit) return hit;
    cursor = addDateKeyDays(cursor, 1);
  }
  return null;
}