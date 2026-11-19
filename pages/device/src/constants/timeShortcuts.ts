/**
 * 时间区间快捷项（设备模块统一口径）。
 *
 * <p>告警中心 / 同步记录原先各自维护一份本地 RANGE_SHORTCUTS，五个记录页
 * （告警 / 同步 / 门禁 / 事件 / 考勤 / 传感器 / 过车）口径不一，这里抽成共享常量：
 * el-date-picker 的 datetimerange 与 ReSearch 的 daterange 筛选（attrs 透传）
 * 都直接吃这一份。</p>
 *
 * <p>value 返回「起止 Date」，与展示格式无关：datetimerange 配
 * value-format="YYYY-MM-DD HH:mm:ss"，daterange 配 value-format="YYYY-MM-DD"，
 * 同一份快捷项两边通用。</p>
 *
 * @author CH
 * @since 4.0.0.62
 */

/** 一个快捷项：文案 + 起止时间计算器（与 el-date-picker shortcuts 契约一致） */
export interface TimeShortcut {
  text: string
  value: () => [Date, Date]
}

/** 记录页通用快捷项：就近时段最常用 */
export const TIME_SHORTCUTS: TimeShortcut[] = [
  { text: '近 1 小时', value: () => [new Date(Date.now() - 3600 * 1000), new Date()] },
  { text: '近 24 小时', value: () => [new Date(Date.now() - 24 * 3600 * 1000), new Date()] },
  { text: '近 7 天', value: () => [new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()] },
]
