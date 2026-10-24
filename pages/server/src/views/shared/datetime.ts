/**
 * 后端时间解析与格式化 —— 收敛到一处。
 *
 * <p>为什么值得单独一个文件：会话审计、维护计划、ACME 证书、批量作业四页都要把
 * 后端时间串变成 `Date`，四份实现就是四个行为。真实踩到的坑已经写在下面
 * {@link parseDateTime} 的注释里：`new Date('2026-10-24 09:00:00')` 在部分引擎里
 * 是非法值，而 `new Date('2026-10-24T09:00:00')` 是合法的 —— 两页若各写一份，
 * 就会出现「这一页的时间轴是空的、那一页正常」这种最难查的差异。</p>
 *
 * @author CH
 * @since 4.0.0
 */

/** 一天的毫秒数 */
export const DAY_MS = 86_400_000

/**
 * 补零到两位
 *
 * @param n 数字
 */
export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 解析后端时间串。
 *
 * <p>接受三种写法：`YYYY-MM-DDTHH:mm:ss`（表单 value-format）、
 * `YYYY-MM-DD HH:mm:ss`（数据库直出）、`YYYY-MM-DD`（只有日期，按 0 点）。
 * 手工拆字段再交给 `new Date(y, m, d)` 而不是直接 `new Date(text)`：
 * 后者对空格分隔的写法在部分引擎里返回 Invalid Date，而这两页所有判断
 * （是否进行中、画在哪一格、还剩几天）都依赖本地时刻。</p>
 *
 * <p>带时区的 ISO 写法（`...Z` / `+08:00`）不在正则覆盖范围内，回落给引擎处理 ——
 * 那种写法本来就自带时区信息，应当由引擎按 ISO 语义解释。</p>
 *
 * @param value 后端时间串
 * @returns 本地时刻；不可解析为 null
 */
export function parseDateTime(value?: string | null): Date | null {
  if (!value) return null
  const text = String(value).trim().replace('T', ' ')
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/.exec(text)
  if (!m) {
    const fallback = new Date(text)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const hour = Number(m[4] ?? 0)
  const minute = Number(m[5] ?? 0)
  const second = Number(m[6] ?? 0)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (hour > 23 || minute > 59 || second > 59) return null

  const d = new Date(year, month - 1, day, hour, minute, second)
  // 回读校验：`new Date(2026, 1, 30)` 不会报错，它会安静地滚到 3 月 2 日 ——
  // 那会让一个「2 月 30 日」的脏数据被画到用户没写过的日子上
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return d
}

/**
 * 日期文本 `YYYY-MM-DD`
 *
 * @param d 时刻
 * @returns 文本；null 给破折号（表格里留空会被读成「这一格坏了」）
 */
export function formatDate(d: Date | null): string {
  if (!d) return '—'
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * 日期时间文本 `YYYY-MM-DD HH:mm`
 *
 * @param d 时刻
 */
export function formatDateTime(d: Date | null): string {
  if (!d) return '—'
  return `${formatDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/**
 * 日期键 `YYYY-MM-DD`（用于按天分组）
 *
 * @param d 时刻
 * @returns 键；不可知给空串
 */
export function dayKeyOf(d: Date | null): string {
  return d ? formatDate(d) : ''
}

/**
 * 时刻距当日 0 点的小时数（含小数）
 *
 * <p>时间轴把一天当成一条 24 小时的轴，所以「画在哪一格」需要的正是这个值。</p>
 *
 * @param d 时刻
 * @returns 小时数；不可知为 null
 */
export function hourOfDay(d: Date | null): number | null {
  if (!d) return null
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
}

/**
 * 小时数 → 24 小时轴上的百分比位置
 *
 * @param hour 小时数（0~24）
 */
export function hourToPercent(hour: number): number {
  const clamped = Math.min(Math.max(hour, 0), 24)
  return (clamped / 24) * 100
}
