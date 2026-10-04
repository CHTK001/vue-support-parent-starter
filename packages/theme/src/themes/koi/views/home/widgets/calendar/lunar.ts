/**
 * 农历（夏历）换算核心
 *
 * <p>数据来源：1900—2100 年农历压缩表 {@link LUNAR_INFO}，每年 1 个 16 位整数，
 * 位含义为业界通用约定：</p>
 * <ul>
 *   <li>bits 4..15（掩码 {@code 0x10} ~ {@code 0x8000}）：正月至十二月的大小，
 *       该位为 {@code 0} → 该月 29 天，为 {@code 1} → 30 天；</li>
 *   <li>bits 0..3（掩码 {@code 0x0f}）：闰月月份（1—12），{@code 0} 表示当年无闰月；</li>
 *   <li>bit 16（掩码 {@code 0x10000}）：闰月大小，{@code 1} → 闰月 30 天，{@code 0} → 29 天。</li>
 * </ul>
 *
 * <p>纪元锚点：公历 <b>1900-01-31</b> 为农历 1900 年正月初一，因此「与纪元的自然日差」
 * 就是逐日累加的月份偏移量。</p>
 *
 * <p>农历只在「区间内」可信。超出 {@link LUNAR_MIN_YEAR} / {@link LUNAR_MAX_YEAR}
 * 的日期一律返回 {@code null}，由调用方降级为只展示公历 —— 宁可少显示，
 * 也不显示错误的农历。</p>
 */

/** 农历数据表起始年（与表下标 {@code 0} 对应） */
export const LUNAR_MIN_YEAR = 1900;

/** 农历数据表结束年（含） */
export const LUNAR_MAX_YEAR = 2100;

/** 纪元日：公历 1900-01-31 = 农历 1900 年正月初一 */
const EPOCH_UTC = Date.UTC(1900, 0, 31);

/**
 * 1900—2100 年农历压缩表。
 *
 * <p>每 10 个一行，行尾注释为该行首项对应的公历年份。</p>
 */
const LUNAR_INFO: readonly number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090
  0x0d520, // 2100
];

/** 农历月的中文序数名（十一月称「冬月」、十二月称「腊月」） */
const MONTH_NAMES: readonly string[] = [
  "正月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "冬月", "腊月",
];

/** 农历日的十位中文（初一…初十） */
const DAY_TENS: readonly string[] = ["初", "十", "廿", "卅"];

/** 农历日的个位中文（子丑…） */
const DAY_UNITS: readonly string[] = [
  "十", "一", "二", "三", "四", "五", "六", "七", "八", "九",
];

/** 天干（用于干支纪年） */
const HEAVENLY_STEMS: readonly string[] = [
  "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸",
];

/** 地支 */
const EARTHLY_BRANCHES: readonly string[] = [
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
];

/** 生肖（按地支顺序；1900 年庚子为鼠年，故下标 0 对应「鼠」） */
const ZODIACS: readonly string[] = [
  "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪",
];

/** 农历日期 */
export interface LunarDate {
  /** 农历年（如 2026） */
  year: number;
  /** 农历月（1—12） */
  month: number;
  /** 农历日（1—30） */
  day: number;
  /** 是否闰月 */
  isLeap: boolean;
  /** 所属农历月的总天数（29 / 30） */
  monthDays: number;
  /** 月份中文名，闰月自带「闰」前缀（如「闰四月」） */
  monthName: string;
  /** 日期中文名（如「十三」） */
  dayName: string;
  /** 生肖（如「马」） */
  zodiac: string;
  /** 干支纪年（如「丙午」） */
  ganzhi: string;
  /** 该农历年的总天数 */
  yearDays: number;
}

/**
 * 取农历年压缩数据。
 *
 * @param year 农历年
 * @returns 压缩表条目；超出数据范围返回 {@code 0}
 */
function info(year: number): number {
  const idx = year - LUNAR_MIN_YEAR;
  if (idx < 0 || idx >= LUNAR_INFO.length) return 0;
  return LUNAR_INFO[idx];
}

/**
 * 某农历年闰哪个月。
 *
 * @param year 农历年
 * @returns 闰月月份（1—12）；无闰月返回 {@code 0}
 */
export function leapMonth(year: number): number {
  return info(year) & 0x0f;
}

/**
 * 闰月天数。
 *
 * @param year 农历年
 * @returns 29 或 30；无闰月返回 {@code 0}
 */
export function leapMonthDays(year: number): number {
  if (!leapMonth(year)) return 0;
  return info(year) & 0x10000 ? 30 : 29;
}

/**
 * 农历某月（不含闰月）的天数。
 *
 * @param year 农历年
 * @param month 农历月（1—12）
 * @returns 29 或 30；参数非法时返回 {@code 0}
 */
export function monthDays(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  return info(year) & (0x10000 >> month) ? 30 : 29;
}

/**
 * 农历某年的总天数（12 个月 + 可能的闰月）。
 *
 * @param year 农历年
 * @returns 该年天数（354 / 355 / 383 / 384 / 385）
 */
export function lunarYearDays(year: number): number {
  let sum = 348; // 12 个月各按 29 天起算
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
    if (info(year) & bit) sum += 1;
  }
  return sum + leapMonthDays(year);
}

/**
 * 取农历年首日（正月初一）距纪元的自然日偏移量。
 *
 * @param year 农历年
 * @returns 偏移天数；year 早于 {@link LUNAR_MIN_YEAR} 返回 {@code -1}
 */
function yearStartOffset(year: number): number {
  let offset = 0;
  for (let y = LUNAR_MIN_YEAR; y < year; y += 1) {
    offset += lunarYearDays(y);
  }
  return offset;
}

/**
 * 公历日期转农历。
 *
 * <p>只用「本地日期的年月日」构造 UTC 时刻做差，因此<b>与时区无关</b>：
 * 不存在「东八区凌晨转成 UTC 后退一天」的经典错误。</p>
 *
 * @param date 公历日期（只读取其年月日）
 * @returns 农历日期；超出 1900—2100 范围返回 {@code null}
 */
export function solarToLunar(date: Date): LunarDate | null {
  const y = date.getFullYear();
  if (y < LUNAR_MIN_YEAR || y > LUNAR_MAX_YEAR) return null;

  const target = Date.UTC(y, date.getMonth(), date.getDate());
  const diff = Math.round((target - EPOCH_UTC) / 86_400_000);

  // diff 可能落在上一年年末（农历年尾长于公历年首日），先定位年份再逐月扣减
  let year = LUNAR_MIN_YEAR;
  let remaining = diff;
  while (remaining < 0 && year > LUNAR_MIN_YEAR) {
    year -= 1;
    remaining += lunarYearDays(year);
  }
  let offset = yearStartOffset(year);
  while (true) {
    const total = lunarYearDays(year);
    if (remaining < offset + total) break;
    if (year >= LUNAR_MAX_YEAR) return null;
    year += 1;
    offset += total;
  }

  const dayOfYear = remaining - offset;
  const leap = leapMonth(year);
  let month = 1;
  let isLeap = false;
  let used = 0;

  while (month <= 12) {
    const days = monthDays(year, month);
    if (used + days > dayOfYear) break;
    used += days;
    // 闰月排在对应月份之后
    if (month === leap && used <= dayOfYear) {
      const ldays = leapMonthDays(year);
      if (used + ldays > dayOfYear) {
        isLeap = true;
        break;
      }
      used += ldays;
    }
    month += 1;
  }

  const mdays = isLeap ? leapMonthDays(year) : monthDays(year, month);
  const day = dayOfYear - used + 1;

  return {
    year,
    month,
    day,
    isLeap,
    monthDays: mdays,
    monthName: (isLeap ? "闰" : "") + MONTH_NAMES[month - 1],
    dayName: formatLunarDayNumber(day),
    zodiac: ZODIACS[(year - 4) % 12],
    ganzhi: HEAVENLY_STEMS[(year - 4) % 10] + EARTHLY_BRANCHES[(year - 4) % 12],
    yearDays: lunarYearDays(year),
  };
}

/**
 * 农历日数字转中文（如 1 → 「初一」，13 → 「十三」，20 → 「二十」，30 → 「三十」）。
 *
 * @param day 农历日（1—30）
 * @returns 中文日名；参数非法时返回空串
 */
export function formatLunarDayNumber(day: number): string {
  if (day < 1 || day > 30) return "";
  if (day === 10) return "初十";
  if (day === 20) return "二十";
  if (day === 30) return "三十";
  return DAY_TENS[Math.floor(day / 10)] + DAY_UNITS[day % 10];
}

/**
 * 农历日期的短文本。
 *
 * <p>初一显示月名（如「八月」），其余显示日名（如「十三」）—— 这是中文日历的通行做法，
 * 因为「初一」本身信息量等于零。</p>
 *
 * @param lunar 农历日期；传 {@code null} 返回空串
 * @returns 如「八月」「八月十三」
 */
export function lunarShortText(lunar: LunarDate | null): string {
  if (!lunar) return "";
  return lunar.day === 1 ? lunar.monthName : lunar.dayName;
}

/**
 * 农历日期的完整文本。
 *
 * @param lunar 农历日期；传 {@code null} 返回空串
 * @returns 如「丙午年 八月十三」
 */
export function lunarFullText(lunar: LunarDate | null): string {
  if (!lunar) return "";
  return `${lunar.ganzhi}年 ${lunar.monthName}${lunar.dayName}`;
}

/**
 * 求某农历年的除夕（正月初一的前一天）。
 *
 * <p><b>注意</b>：除夕总是落在<b>春节之前</b>的公历日（1 月下旬或 2 月上旬），
 * 而不是「该农历年的最后一天」。例如 2025 年的除夕是 2025-01-28，
 * 它属于农历甲辰年腊月，而 2025 年的正月初一要到 2025-01-29 才到 ——
 * 农历年与公历年相差约一个月，直接用「该年最后一天」当除夕会算到 2026-02-16。</p>
 *
 * @param year 农历年（该年的春节）
 * @returns 除夕对应的公历日期；超出数据范围返回 {@code null}
 */
export function lunarNewYearEve(year: number): Date | null {
  if (year < LUNAR_MIN_YEAR || year > LUNAR_MAX_YEAR) return null;
  const offset = yearStartOffset(year) - 1;
  return new Date(EPOCH_UTC + offset * 86_400_000);
}

/**
 * 求某农历年的正月初一（春节）。
 *
 * @param year 农历年
 * @returns 春节对应的公历日期；超出数据范围返回 {@code null}
 */
export function lunarNewYear(year: number): Date | null {
  if (year < LUNAR_MIN_YEAR || year > LUNAR_MAX_YEAR) return null;
  const offset = yearStartOffset(year);
  return new Date(EPOCH_UTC + offset * 86_400_000);
}