/**
 * 节日数据表
 *
 * <p>按「日序规则」分类存储，避免把节日写成一长串具体日期 ——
 * 那样每年都要手工补一遍，补漏的必然漏。</p>
 * <ul>
 *   <li>{@link SOLAR_FESTIVALS}：公历固定日（3 月 8 日妇女节这类不随农历走的）</li>
 *   <li>{@link LUNAR_FESTIVALS}：农历固定月日（春节、端午、中秋这类）</li>
 *   <li>{@link WEEK_FESTIVALS}：「某月第 N 个星期 X」（母亲节、父亲节、感恩节）</li>
 *   <li>除夕：腊月最后一天，规则特殊，单独处理</li>
 *   <li>二十四节气：由 {@link ./solarTerms} 按太阳黄经推算，不属于本表</li>
 * </ul>
 *
 * <p>法定节假日与调休上班日不在这里，见 {@link ./statutory}。</p>
 */

/** 节日类别 */
export type FestivalKind =
  /** 法定节假日（元旦 / 春节 / 清明 / 劳动节 / 端午 / 中秋 / 国庆） */
  | "statutory"
  /** 农历传统节日 */
  | "lunar"
  /** 公历节日 */
  | "solar"
  /** 「第 N 个星期 X」型节日 */
  | "week"
  /** 二十四节气 */
  | "term"
  /** 纪念日 */
  | "memorial"
  /** 其他／通俗节日 */
  | "other";

/**
 * 节日重要级别。
 *
 * <p>决定日历格子里节日名的字号与颜色权重：1 级用主色突出（春节、国庆），
 * 2 级次之（中秋、元宵），3 级弱化（植树节、世界读书日），避免整月格子全是花花绿绿。</p>
 */
export type FestivalLevel = 1 | 2 | 3;

/** 节日条目 */
export interface Festival {
  /** 节日名（全称，悬浮提示与节日面板用） */
  name: string;
  /**
   * 日历格子里的短名。
   *
   * <p>格子宽度由 Element Plus 的表格<b>自动分配</b>（{@code td} 没有宽度规则，
   * {@code --el-calendar-cell-width} 管的是<b>高度</b>），随 widget 实际渲染宽度变化，
   * 因此不能指望 11 个字的「抗美援朝出国作战纪念日」一定放得下 —— 窄一点就只剩省略号。
   * 需要短名的条目给出简称，全称仍在悬浮提示与面板里完整可见。</p>
   */
  short?: string;
  /** 类别 */
  kind: FestivalKind;
  /** 重要级别 */
  level: FestivalLevel;
}

/**
 * 公历固定日节日。
 *
 * <p>元组为 {@code [日期, 全称, 类别, 级别, 短名?]}，短名只给放不下全称的条目。</p>
 * <p>键为 {@code MM-DD}，值可能是<b>多个</b>节日 —— 3 月 12 日既是植树节又是
 * 孙中山先生逝世纪念日，7 月 1 日既是建党纪念日又是香港回归纪念日。
 * 早先这里用 {@code Map<string, Festival>}，同一天只能存一个，
 * 后注册的那个会把前一个挤掉，所以改成数组。</p>
 */
const SOLAR_TABLE: ReadonlyArray<readonly [string, string, FestivalKind, FestivalLevel, string?]> = [
  ["01-01", "元旦", "statutory", 1],
  ["01-10", "警察节", "memorial", 3],
  ["02-14", "情人节", "other", 3],
  ["03-05", "学雷锋纪念日", "memorial", 3],
  ["03-08", "妇女节", "other", 2],
  // 植树节与孙中山先生逝世纪念日同为 3 月 12 日（后者是法定纪念日）。
  // 两者都登记，级别相同 → 格子显示先登记的植树节，悬浮提示里两个名字都在。
  ["03-12", "植树节", "other", 3],
  ["03-12", "孙中山逝世纪念日", "memorial", 3, "中山纪念"],
  ["03-15", "消费者权益日", "other", 3],
  ["04-01", "愚人节", "other", 3],
  ["04-22", "地球日", "other", 3],
  ["04-23", "世界读书日", "other", 3],
  ["05-01", "劳动节", "statutory", 1],
  ["05-04", "青年节", "memorial", 2],
  ["05-12", "防灾减灾日", "memorial", 3],
  ["06-01", "儿童节", "other", 2],
  // 同为 7 月 1 日：建党纪念日与香港特别行政区回归纪念日。
  ["07-01", "建党节", "memorial", 2],
  ["07-01", "香港回归纪念日", "memorial", 3, "香港回归"],
  ["08-01", "建军节", "memorial", 2],
  ["09-03", "抗战胜利纪念日", "memorial", 2, "抗战胜利"],
  ["09-10", "教师节", "other", 3],
  ["09-18", "九一八纪念日", "memorial", 3, "九一八"],
  // 2014-08-31 十二届全国人大常委会第十次会议决定设立
  ["09-30", "烈士纪念日", "memorial", 2, "烈士纪念"],
  ["10-01", "国庆节", "statutory", 1],
  // 2020-10-26 十三届全国人大常委会第二十一次会议决定设立
  ["10-19", "抗美援朝出国作战纪念日", "memorial", 3, "抗美援朝"],
  // 2025-10-24 十四届全国人大常委会第十八次会议决定设立
  ["10-25", "台湾光复纪念日", "memorial", 3],
  ["10-31", "万圣夜", "other", 3],
  ["11-01", "万圣节", "other", 3],
  ["11-11", "双十一", "other", 3],
  // 2014-11-01 十二届全国人大常委会第十一次会议决定设立
  ["12-04", "国家宪法日", "memorial", 3, "宪法日"],
  // 2014-02-27 十二届全国人大常委会第七次会议决定设立
  ["12-13", "国家公祭日", "memorial", 3],
  ["12-20", "澳门回归纪念日", "memorial", 3, "澳门回归"],
  ["12-24", "平安夜", "other", 3],
  ["12-25", "圣诞节", "other", 3],
];

/** 公历固定日节日表（{@code MM-DD} → 该日的全部节日） */
export const SOLAR_FESTIVALS: ReadonlyMap<string, readonly Festival[]> = (() => {
  const grouped = new Map<string, Festival[]>();
  for (const [md, name, kind, level, short] of SOLAR_TABLE) {
    const list = grouped.get(md);
    const item: Festival = short ? { name, short, kind, level } : { name, kind, level };
    if (list) list.push(item);
    else grouped.set(md, [item]);
  }
  return grouped;
})();

/**
 * 农历固定月日节日。
 *
 * <p>键为 {@code M-D}（不补零）。<b>不含闰月</b> —— 闰月不参与节令判定，
 * 如闰五月的十五不是中秋。</p>
 */
const LUNAR_TABLE: ReadonlyArray<readonly [number, number, string, FestivalLevel]> = [
  [1, 1, "春节", 1],
  [1, 15, "元宵节", 2],
  [2, 2, "龙抬头", 3],
  [3, 3, "上巳节", 3],
  [5, 5, "端午节", 1],
  [7, 7, "七夕节", 2],
  [7, 15, "中元节", 3],
  [8, 15, "中秋节", 1],
  [9, 9, "重阳节", 2],
  [10, 1, "寒衣节", 3],
  [12, 8, "腊八节", 3],
  [12, 23, "小年", 2],
];

/** 农历固定月日节日表（{@code M-D} → 节日） */
export const LUNAR_FESTIVALS: ReadonlyMap<string, Festival> = new Map(
  LUNAR_TABLE.map(([m, d, name, level]) => [`${m}-${d}`, { name, kind: "lunar", level }]),
);

/**
 * 「某月第 N 个星期 X」型节日。
 *
 * <p>{@link nth} 从 1 开始。若当月不存在第 N 个星期 X（如 2 月只有 4 个周一），
 * 查询时自然查不到，不会误判。</p>
 */
export interface WeekFestivalDef {
  /** 节日名 */
  name: string;
  /** 公历月（1—12） */
  month: number;
  /** 第几个（1 起） */
  nth: number;
  /** 星期几，0 = 周日，与 {@link Date.getDay} 一致 */
  weekday: number;
  /** 重要级别 */
  level: FestivalLevel;
}

/** 「第 N 个星期 X」型节日表 */
export const WEEK_FESTIVALS: readonly WeekFestivalDef[] = [
  { name: "母亲节", month: 5, nth: 2, weekday: 0, level: 2 },
  { name: "父亲节", month: 6, nth: 3, weekday: 0, level: 2 },
  { name: "感恩节", month: 11, nth: 4, weekday: 4, level: 3 },
];