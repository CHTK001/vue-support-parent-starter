/**
 * 日历节日信息聚合层
 *
 * <p>UI 侧只需从这里取数据，不要再去直接调 {@link ./lunar} / {@link ./solarTerms}：
 * 这些来源必须<b>一起</b>聚合才能保证一致 —— 比如「国庆节放假区间内的每一天」与
 * 「10 月 1 日的节日名」若由两处分别计算，格子与面板就可能显示不一致。</p>
 *
 * <p>推荐入口是 {@link getDayInfo}。</p>
 */
export {
  festivalDisplayText,
  getDayInfo,
  getMonthDayInfos,
  getUpcomingItems,
  invalidateDayCache,
  isLunarAvailable,
} from "./dayInfo";
export type { DayInfo, UpcomingItem } from "./dayInfo";

export {
  LUNAR_MAX_YEAR,
  LUNAR_MIN_YEAR,
  solarToLunar,
  lunarShortText,
  lunarFullText,
  leapMonth,
  leapMonthDays,
  monthDays,
  lunarYearDays,
  lunarNewYear,
  lunarNewYearEve,
  formatLunarDayNumber,
} from "./lunar";
export type { LunarDate } from "./lunar";

export { SOLAR_TERM_NAMES, getSolarTerm, getSolarTermDate, getYearSolarTerms } from "./solarTerms";

export { SOLAR_FESTIVALS, LUNAR_FESTIVALS, WEEK_FESTIVALS } from "./festivals";
export type { Festival, FestivalKind, FestivalLevel, WeekFestivalDef } from "./festivals";

export {
  LAST_PUBLISHED_YEAR,
  PUBLISHED_YEARS,
  findNextHoliday,
  getMainFestivalDay,
  getMakeupWorkday,
  getStatutoryPeriod,
  getStatutoryPeriods,
  isStatutoryPublished,
} from "./statutory";
export type { StatutoryPeriod } from "./statutory";

export {
  clearRemoteHolidays,
  getRemoteHoliday,
  getRemoteHolidays,
  hasRemoteHolidays,
  normalizeRemoteHolidays,
  remoteHolidayCount,
  setRemoteHolidays,
} from "./remoteHolidays";
export type { RemoteHoliday } from "./remoteHolidays";

export {
  WEEKDAY_NAMES,
  addDateKeyDays,
  diffDays,
  fromDateKey,
  isDateKey,
  nextDateKey,
  pad2,
  toDateKey,
} from "./dateKey";