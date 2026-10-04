/**
 * 日历「一天」的统一视图
 *
 * <p>把农历、节气、节日、法定放假调休聚合成一个对象，供日历格子与节日面板直接渲染。
 * 之所以要有这一层：这些来源各自独立计算（农历查表、节气解方程、节日查表、
 * 放假查区间），若让每个 UI 调用点各算一遍，同一个格子会出现「格子说放假、
 * 面板说不放假」这类不一致。</p>
 *
 * <p>结果按日期键缓存，日历翻月时同一批格子只算一次。</p>
 */
import { addDateKeyDays, diffDays, fromDateKey, pad2 as pad, toDateKey } from "./dateKey";
import {
  LUNAR_MAX_YEAR,
  LUNAR_MIN_YEAR,
  solarToLunar,
  lunarShortText,
  type LunarDate,
} from "./lunar";
import { getSolarTerm } from "./solarTerms";
import {
  LUNAR_FESTIVALS,
  SOLAR_FESTIVALS,
  WEEK_FESTIVALS,
  type Festival,
} from "./festivals";
import {
  getMakeupWorkday,
  getMainFestivalDay,
  getStatutoryPeriod,
  isStatutoryPublished,
  type StatutoryPeriod,
} from "./statutory";
import { getRemoteHoliday } from "./remoteHolidays";

/** 一天的综合信息 */
export interface DayInfo {
  /** {@code YYYY-MM-DD} */
  key: string;
  /** 公历年 */
  year: number;
  /** 公历月（1—12） */
  month: number;
  /** 公历日 */
  day: number;
  /** 星期几，0 = 周日 */
  weekday: number;
  /** 是否今天 */
  isToday: boolean;
  /** 是否为周末（不考虑调休） */
  isWeekend: boolean;
  /** 农历日期；超出数据范围为 {@code null} */
  lunar: LunarDate | null;
  /** 农历短文本（初一显示月名）；无农历数据为空串 */
  lunarText: string;
  /** 节气名；当天不是节气为 {@code null} */
  term: string | null;
  /** 当天全部节日，按重要级别升序 */
  festivals: readonly Festival[];
  /** 主节日名（展示用），无节日为空串 */
  festivalText: string;
  /** 命中的法定放假区间；不在区间内为 {@code null} */
  period: StatutoryPeriod | null;
  /** 该放假安排是否为推算值（官方未公布） */
  provisional: boolean;
  /** 是否放假（法定放假区间内，或周末且非调休上班） */
  isRest: boolean;
  /** 是否为调休上班日 */
  isMakeupWork: boolean;
  /** 休/班状态标记，供格子右上角小角标 */
  badge: "" | "休" | "班";
  /** 该日信息来自后台下发（而非内置表 / 推算） */
  fromRemote: boolean;
}

/** 日期键 → 公历各字段（缓存，避免重复 split / new Date） */
const fieldCache = new Map<string, { y: number; m: number; d: number; w: number; today: string }>();
const dayCache = new Map<string, DayInfo>();

/** 缓存上限：日历最多翻到前后一两年，超出即淘汰最旧项，防止长期使用无界增长 */
const CACHE_LIMIT = 4000;

/**
 * 取日期键的公历字段。
 *
 * @param key {@code YYYY-MM-DD}
 * @returns 年 / 月 / 日 / 星期 / 今日键
 */
function fieldsOf(key: string) {
  const hit = fieldCache.get(key);
  if (hit) return hit;
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(5, 7));
  const d = Number(key.slice(8, 10));
  const w = fromDateKey(key).getDay();
  const rec = { y, m, d, w, today: toDateKey(new Date()) };
  fieldCache.set(key, rec);
  return rec;
}

/**
 * 判断某农历日是否为除夕（腊月最后一天）。
 *
 * @param key {@code YYYY-MM-DD}
 * @param lunar 该日的农历信息
 * @returns 是除夕返回 {@code true}
 */
function isChuxi(key: string, lunar: LunarDate | null): boolean {
  if (!lunar || lunar.isLeap || lunar.month !== 12) return false;
  return lunar.day === lunar.monthDays;
}

/**
 * 求「某月第 N 个星期 X」型节日在该日是否命中。
 *
 * @param key {@code YYYY-MM-DD}
 * @param y 公历年
 * @param m 公历月
 * @param w 星期几
 * @returns 命中的节日；无则返回 {@code null}
 */
function matchWeekFestival(key: string, y: number, m: number, w: number): Festival | null {
  for (const def of WEEK_FESTIVALS) {
    if (def.month !== m || def.weekday !== w) continue;
    // 1 号是星期几 → 第一个目标星期是几号
    const first = new Date(y, m - 1, 1).getDay();
    const offset = (def.weekday - first + 7) % 7;
    const day = 1 + offset + (def.nth - 1) * 7;
    if (day > new Date(y, m, 0).getDate()) continue; // 当月没有第 N 个
    if (`${y}-${pad(m)}-${pad(day)}` === key) {
      return { name: def.name, kind: "week", level: def.level };
    }
  }
  return null;
}

/**
 * 某一天各类节日在格子里的展示优先级：数字越小越靠前。
 *
 * <p>法定节假日压过一切 —— 春节当天的「情人节」不该抢格子里的那一行。</p>
 * <p>{@code memorial} 与 {@code other} 同级，由 {@link Festival.level} 决胜：
 * 同一天既是植树节又是孙中山逝世纪念日时，二者级别相同，
 * 按登记先后（植树节在前）展示前者，另一个名字仍出现在悬浮提示与面板里。</p>
 */
const KIND_RANK: Record<Festival["kind"], number> = {
  statutory: 0,
  lunar: 1,
  solar: 1,
  week: 2,
  memorial: 3,
  other: 3,
  term: 4,
};

/**
 * 汇总某一天的全部信息。
 *
 * @param key {@code YYYY-MM-DD}
 * @returns 该日的综合信息
 */
export function getDayInfo(key: string): DayInfo {
  const hit = dayCache.get(key);
  if (hit) return hit;

  const f = fieldsOf(key);
  const lunar = solarToLunar(new Date(f.y, f.m - 1, f.d));
  const term = getSolarTerm(key);
  // 后台有记录时以后台为准（管理员可维护的事实来源），否则用内置表 / 推算
  const remote = getRemoteHoliday(key);
  const period = remote ? null : getStatutoryPeriod(key);
  const makeup = remote ? null : getMakeupWorkday(key);

  const list: Festival[] = [];
  const chuxi = isChuxi(key, lunar);

  // 0) 后台下发的记录。两种取值都用 statutory 类别，使后台配置压过
  //    农历/公历节日（管理员可以把任意一天设为假日，如公司年会）；
  //    level 区分展示权重：休息日比补班日更需要在格子里突出。
  if (remote) {
    list.push({ name: remote.name, kind: "statutory", level: remote.isHoliday ? 1 : 2 });
  } else if (makeup) {
    // 调休上班日：把所属节日名带出来。
    // 不带的话格子上只剩一个「班」角标，用户看不出是哪几个节日在调休 ——
    // 而这恰恰是安排年假时唯一需要看的信息。
    list.push({ name: makeup, kind: "statutory", level: 2 });
  } else if (period) {
    // 法定节假日：区间内的每一天都带上节日名，
    // 但主节日日用官方口径（如国庆 10-1），其余日沿用同一名称。
    // 除夕单独成名 —— 它是春节里唯一有独立称呼的一天，
    // 让整段假期都显示「春节」会把除夕这个信息抹掉。
    const main = getMainFestivalDay(key, period.name);
    list.push({
      name: chuxi ? "除夕" : period.name,
      kind: "statutory",
      level: chuxi || main === key ? 1 : 2,
    });
  }

  // 2) 公历固定日（同一 MM-DD 可能有多个，如 3-12 植树节 + 孙中山逝世纪念日）
  for (const solarHit of SOLAR_FESTIVALS.get(key.slice(5)) ?? []) {
    list.push(solarHit);
  }

  // 3) 农历固定月日（不含闰月）
  if (lunar && !lunar.isLeap) {
    const lunarHit = LUNAR_FESTIVALS.get(`${lunar.month}-${lunar.day}`);
    if (lunarHit) list.push(lunarHit);
  }

  // 4) 除夕（腊月最后一天，规则特殊）。
  //    法定放假区间内的除夕已在步骤 1 命名，此处只补「不是假期的那一天」
  if (chuxi && !period) {
    list.push({ name: "除夕", kind: "lunar", level: 2 });
  }

  // 5) 第 N 个星期 X
  const weekHit = matchWeekFestival(key, f.y, f.m, f.w);
  if (weekHit) list.push(weekHit);

  // 6) 节气
  if (term) list.push({ name: term, kind: "term", level: 3 });

  list.sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.level - b.level);

  // 7) 同名去重。
  //    法定区间与公历表会重复命中同一名称（10 月 1 日既是国庆区间首日、
  //    也在公历节日表里），不去重就会在格子里显示两遍「国庆节」，
  //    在节日面板里变成两条一模一样的记录。
  const seen = new Set<string>();
  const festivals = list.filter((f) => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });

  const isWeekend = f.w === 0 || f.w === 6;
  // 后台记录直接决定休息与否，且优先于周末判定 ——
  // 后台把某个周六标成补班，或把某个周三标成假日，都应按后台走
  const isMakeupWork = remote ? !remote.isHoliday : makeup !== null;
  const isRest = remote ? remote.isHoliday : isMakeupWork ? false : period !== null || isWeekend;

  const info: DayInfo = {
    key,
    year: f.y,
    month: f.m,
    day: f.d,
    weekday: f.w,
    isToday: key === f.today,
    isWeekend,
    lunar,
    lunarText: lunarShortText(lunar),
    term,
    festivals,
    festivalText: festivals.length ? festivals[0].name : "",
    period,
    // 后台数据不算「推算」：它是管理员确认过的
    provisional: remote ? false : period ? period.provisional : !isStatutoryPublished(f.y),
    isRest,
    isMakeupWork,
    badge: isMakeupWork ? "班" : isRest && (period !== null || remote) ? "休" : "",
    // 标记该日由后台下发，UI 可据此显示「数据来源：后台」
    fromRemote: remote !== null,
  };

  if (dayCache.size >= CACHE_LIMIT) {
    // Map 按插入序迭代，删掉最早插入的 10% 再写入
    let drop = Math.floor(CACHE_LIMIT / 10);
    for (const k of dayCache.keys()) {
      if (drop-- <= 0) break;
      dayCache.delete(k);
    }
  }
  dayCache.set(key, info);
  return info;
}

/**
 * 农历是否可用。
 *
 * @param year 公历年
 * @returns 在 {@link LUNAR_MIN_YEAR}—{@link LUNAR_MAX_YEAR} 之间返回 {@code true}
 */
export function isLunarAvailable(year: number): boolean {
  return year >= LUNAR_MIN_YEAR && year <= LUNAR_MAX_YEAR;
}

/**
 * 取某月全部日期的信息。
 *
 * @param year 公历年
 * @param month 公历月（1—12）
 * @returns 长度等于当月天数的数组，下标 0 对应 1 号
 */
export function getMonthDayInfos(year: number, month: number): DayInfo[] {
  const total = new Date(year, month, 0).getDate();
  const out: DayInfo[] = [];
  for (let d = 1; d <= total; d += 1) {
    out.push(getDayInfo(`${year}-${pad(month)}-${pad(d)}`));
  }
  return out;
}

/** 即将到来的节日 / 假期的扁平条目 */
export interface UpcomingItem {
  /** 起始日 {@code YYYY-MM-DD}（假期取放假首日） */
  key: string;
  /** 名称 */
  name: string;
  /** 距今天数；负数表示已开始（假期进行中） */
  days: number;
  /** 持续天数（单日节日为 1） */
  spanDays: number;
  /** 是否正在进行中 */
  ongoing: boolean;
  /** 类别 */
  kind: Festival["kind"] | "makeup";
  /** 是否放假 */
  isRest: boolean;
  /** 是否为按《放假办法》推算而非官方公布 */
  provisional: boolean;
  /** 重要级别 */
  level: Festival["level"];
}

/**
 * 节日的格子短名。
 *
 * <p>日历格子的宽度由表格自动分配（Element Plus 的 {@code td} 无宽度规则），
 * 放不下的条目返回 {@link Festival.short} 简称；没有简称则原样返回。
 * 全称始终保留在 {@link Festival.name}，由悬浮提示与节日面板展示。</p>
 *
 * @param f 节日条目
 * @returns 用于格子那一行的文本
 */
export function festivalDisplayText(f: Festival | undefined): string {
  if (!f) return "";
  return f.short ?? f.name;
}

/**
 * 取从某天起未来若干天的节日与假期。
 *
 * <p>两处刻意的收敛，否则列表会被噪声淹没：</p>
 * <ul>
 *   <li><b>整段假期折成一条</b>：国庆 7 天若逐日列，就是 7 行一模一样的「国庆节」。
 *       用户要问的是「哪天开始放、能连休几天」，不是「10 月 4 日是什么节」；</li>
 *   <li><b>只收 1—2 级节日</b>：「消费者权益日」这类 3 级条目会把列表刷满。</li>
 * </ul>
 *
 * @param fromDateKey 起始日期（含）
 * @param days 向前看的天数
 * @returns 按开始日升序的条目
 */
export function getUpcomingItems(fromDateKey: string, days = 120): UpcomingItem[] {
  const out: UpcomingItem[] = [];
  const emitted = new Set<StatutoryPeriod>();
  let cursor = fromDateKey;

  for (let i = 0; i < days; i += 1) {
    const info = getDayInfo(cursor);

    // 假期整段折成一条：后台下发的是逐日记录，需按「同名 + 连续」归并，
    // 否则国庆 7 天会变成 7 行「国庆节」
    if (info.isRest && info.fromRemote) {
      const name = info.festivalText;
      let last = i;
      let cursorEnd = cursor;
      while (last + 1 < days) {
        const nxt = getDayInfo(addDateKeyDays(cursorEnd, 1));
        if (!nxt.isRest || !nxt.fromRemote || nxt.festivalText !== name) break;
        last += 1;
        cursorEnd = addDateKeyDays(cursorEnd, 1);
      }
      out.push({
        key: cursor,
        name,
        days: i,
        spanDays: last - i + 1,
        ongoing: false,
        kind: "statutory",
        isRest: true,
        provisional: false,
        level: 1,
      });
      // 跳过整段，避免逐日重复输出
      cursor = addDateKeyDays(cursorEnd, 1);
      i += last - i;
      continue;
    }

    // 本地法定假期区间：整段只出一条
    if (info.period && !emitted.has(info.period)) {
      emitted.add(info.period);
      out.push({
        key: info.period.start,
        name: info.period.name,
        days: diffDays(fromDateKey, info.period.start),
        spanDays: diffDays(info.period.start, info.period.end) + 1,
        ongoing: info.period.start < fromDateKey && info.period.end >= fromDateKey,
        kind: "statutory",
        isRest: true,
        provisional: info.period.provisional,
        level: 1,
      });
    }

    // 调休上班日：单日条目，名字取所属节日
    if (info.isMakeupWork) {
      out.push({
        key: cursor,
        name: `${info.festivalText || "法定节假日"} 调休上班`,
        days: i,
        spanDays: 1,
        ongoing: false,
        kind: "makeup",
        isRest: false,
        provisional: info.provisional,
        level: 2,
      });
    } else if (!info.period && !info.fromRemote) {
      // 假期区间内不再逐日列节日（已由上面那条代表）
      const primary = info.festivals.find((f) => f.level <= 2);
      if (primary) {
        out.push({
          key: cursor,
          name: primary.name,
          days: i,
          spanDays: 1,
          ongoing: false,
          kind: primary.kind,
          isRest: info.isRest,
          provisional: false,
          level: primary.level,
        });
      }
    }
    cursor = addDateKeyDays(cursor, 1);
  }
  return out;
}

/**
 * 清空缓存。
 *
 * <p>跨零点时调用，否则「今天」的高亮会停在昨天。</p>
 */
export function invalidateDayCache(): void {
  fieldCache.clear();
  dayCache.clear();
}