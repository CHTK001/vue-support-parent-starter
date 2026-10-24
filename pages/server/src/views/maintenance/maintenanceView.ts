/**
 * 维护计划 —— 行数据到展示数据的映射（纯函数，无 Vue 依赖）
 *
 * <p>这一页的数据本质是**区间**：一个计划就是「从某刻到某刻，对这几台主机做这件事」。
 * 重构前它被排成一张平表，于是读者要在脑子里把「开始时间 / 结束时间」两列换算成
 * 一根线段，才能回答「这几个窗口有没有撞车」「下周哪天有空档」—— 换算成本全压在读者身上。
 * 本层把区间算成可以直接画的几何，五个方向都能用。</p>
 *
 * @author CH
 * @since 4.0.0
 */

/** 后端维护计划行 */
export interface PlanRow {
  id: number
  planName?: string
  planType?: string
  startTime?: string
  endTime?: string
  targetHostIds?: string
  status?: string
  description?: string
}

/** 计划类型取值 */
export type PlanTypeTone = 'maintenance' | 'upgrade' | 'backup' | 'reboot' | 'other'

/** 计划状态取值 */
export type PlanStatusTone = 'pending' | 'running' | 'completed' | 'cancelled' | 'other'

/** 窗口相对当前时刻的处境 */
export type PlanWindowState = 'upcoming' | 'active' | 'past' | 'unknown'

/** 画布消费的展示行 */
export interface PlanView {
  id: number
  /** 计划名 */
  name: string
  /** 类型代码（后端原值，用于筛选取值） */
  typeCode: string
  /** 类型中文 */
  typeLabel: string
  /** 类型配色档 */
  typeTone: PlanTypeTone
  /** 状态代码（后端原值） */
  statusCode: string
  /** 状态中文 */
  statusLabel: string
  /** 状态配色档 */
  statusTone: PlanStatusTone
  /** 开始时刻；不可解析为 null */
  start: Date | null
  /** 结束时刻；不可解析为 null */
  end: Date | null
  /** 开始时戳（用于分道与排序）；不可解析为 NaN */
  startMs: number
  /** 结束时戳；不可解析为 NaN */
  endMs: number
  /** 开始时刻文本 `YYYY-MM-DD HH:mm` */
  startText: string
  /** 结束时刻文本 */
  endText: string
  /** 窗口时长（毫秒）；不可知为 null */
  durationMs: number | null
  /** 窗口时长中文 */
  durationText: string
  /** 目标主机 id 列表 */
  hostIds: number[]
  /** 目标主机名列表（`#id` 表示台账里查不到） */
  hostNames: string[]
  /** 目标主机展示文本 */
  hostText: string
  /** 开始时刻所在的日期键 `YYYY-MM-DD`；不可解析为 '' */
  dayKey: string
  /** 开始时刻距当日 0 点的小时数（含小数）；不可解析为 null */
  startHour: number | null
  /** 窗口相对现在的处境 */
  windowState: PlanWindowState
  /** 描述 */
  description: string
}

/** 筛选条件 */
export interface PlanFilters {
  /** 关键字：计划名 / 描述 / 主机名 */
  keyword: string
  /** 类型代码；空串表示全部 */
  type: string
  /** 状态代码；空串表示全部 */
  status: string
}

/** 空筛选条件 */
export const EMPTY_PLAN_FILTERS: PlanFilters = { keyword: '', type: '', status: '' }

/** 计划类型中文与配色 */
export const PLAN_TYPES: ReadonlyArray<{ value: string; label: string; tone: PlanTypeTone }> = [
  { value: 'MAINTENANCE', label: '维护', tone: 'maintenance' },
  { value: 'UPGRADE', label: '升级', tone: 'upgrade' },
  { value: 'BACKUP', label: '备份', tone: 'backup' },
  { value: 'REBOOT', label: '重启', tone: 'reboot' },
]

/** 计划状态中文与配色 */
export const PLAN_STATUS: ReadonlyArray<{ value: string; label: string; tone: PlanStatusTone }> = [
  { value: 'PENDING', label: '待执行', tone: 'pending' },
  { value: 'RUNNING', label: '执行中', tone: 'running' },
  { value: 'COMPLETED', label: '已完成', tone: 'completed' },
  { value: 'CANCELLED', label: '已取消', tone: 'cancelled' },
]

/**
 * 解析后端时间。
 *
 * <p>后端给的是 `YYYY-MM-DDTHH:mm:ss`（表单 value-format）与 `YYYY-MM-DD HH:mm:ss`
 * 两种写法，README 与既有数据里都出现过。手工拆字段再交给 Date：
 * `new Date('2026-10-24T09:00:00')` 在浏览器里按本地时区解，但
 * `new Date('2026-10-24 09:00:00')` 在部分引擎里会被当成非法值，两种写法行为不一致，
 * 而这一页所有判断（是否进行中、画在哪一格）都依赖本地时刻。</p>
 *
 * @param value 后端时间串
 */
export function parsePlanTime(value?: string | null): Date | null {
  if (!value) return null
  const text = String(value).trim().replace('T', ' ')
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/.exec(text)
  if (!m) {
    // 兜底交给引擎：像 ISO 带时区的写法（2026-10-24T09:00:00Z）只能靠它
    const fallback = new Date(text)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  const d = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4] ?? 0),
    Number(m[5] ?? 0),
    Number(m[6] ?? 0),
  )
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * 补零
 *
 * @param n 数字
 */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 日期时间文本 `YYYY-MM-DD HH:mm`。
 *
 * @param d 时刻
 */
export function formatPlanTime(d: Date | null): string {
  if (!d) return '—'
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/**
 * 时长文本。
 *
 * <p>分档刻意是「天 / 小时 / 分钟」而不是「共 180 分钟」：维护窗口的规模差异很大
 * （重启 5 分钟、升级 3 小时、迁移 2 天），统一换算成分钟会让后两者难以一眼估量。</p>
 *
 * @param ms 毫秒；null 表示不可知
 */
export function formatSpan(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 0) return '—'
  const min = Math.round(ms / 60_000)
  if (min < 1) return '不到 1 分钟'
  if (min < 60) return `${min} 分钟`
  const hours = Math.floor(min / 60)
  const restMin = min % 60
  if (hours < 24) return restMin ? `${hours} 小时 ${restMin} 分` : `${hours} 小时`
  const days = Math.floor(hours / 24)
  const restHour = hours % 24
  return restHour ? `${days} 天 ${restHour} 小时` : `${days} 天`
}

/**
 * 日期键 `YYYY-MM-DD`
 *
 * @param d 时刻
 */
export function dayKeyOf(d: Date | null): string {
  if (!d) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * 目标主机 id 解析。
 *
 * <p>后端把 id 数组存成 JSON 字符串。解析失败时不是「没有主机」，而是「这份数据坏了」——
 * 两者在界面上必须区分，所以这里给 null 让调用方保留原始文本，而不是静默变成空列表。</p>
 *
 * @param raw JSON 字符串
 */
export function parseHostIds(raw?: string | null): number[] | null {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(String(raw))
    if (!Array.isArray(parsed)) return null
    return parsed.map(v => Number(v)).filter(n => Number.isFinite(n))
  } catch {
    return null
  }
}

/**
 * 单行映射。
 *
 * @param row     后端行
 * @param hostMap 主机台账 id → 名称
 * @param now     当前时刻，用于判定窗口处境
 */
export function toPlanView(
  row: PlanRow,
  hostMap: Record<number, string>,
  now: Date,
): PlanView {
  const start = parsePlanTime(row.startTime)
  const end = parsePlanTime(row.endTime)
  const typeCode = String(row.planType ?? '')
  const statusCode = String(row.status ?? '')
  const typeMeta = PLAN_TYPES.find(t => t.value === typeCode)
  const statusMeta = PLAN_STATUS.find(s => s.value === statusCode)

  const parsedIds = parseHostIds(row.targetHostIds)
  const hostIds = parsedIds ?? []
  const hostNames = hostIds.map(id => hostMap[id] ?? `#${id}`)
  const hostText = parsedIds === null ? String(row.targetHostIds ?? '') : hostNames.join(', ')

  const durationMs = start && end ? end.getTime() - start.getTime() : null

  let windowState: PlanWindowState = 'unknown'
  if (start && end) {
    if (now.getTime() < start.getTime()) windowState = 'upcoming'
    else if (now.getTime() > end.getTime()) windowState = 'past'
    else windowState = 'active'
  }

  const dayStart = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()) : null

  return {
    id: row.id,
    name: String(row.planName ?? '').trim() || '未命名计划',
    typeCode,
    typeLabel: typeMeta?.label ?? (typeCode || '未分类'),
    typeTone: typeMeta?.tone ?? 'other',
    statusCode,
    statusLabel: statusMeta?.label ?? (statusCode || '未知'),
    statusTone: statusMeta?.tone ?? 'other',
    start,
    end,
    startMs: start ? start.getTime() : Number.NaN,
    endMs: end ? end.getTime() : Number.NaN,
    startText: formatPlanTime(start),
    endText: formatPlanTime(end),
    durationMs,
    durationText: formatSpan(durationMs),
    hostIds,
    hostNames,
    hostText: hostText || '未指定主机',
    dayKey: dayKeyOf(start),
    startHour: start && dayStart ? (start.getTime() - dayStart.getTime()) / 3_600_000 : null,
    windowState,
    description: String(row.description ?? '').trim(),
  }
}

/**
 * 批量映射。
 *
 * @param rows    后端行
 * @param hostMap 主机台账
 * @param now     当前时刻
 */
export function toPlanViews(
  rows: readonly PlanRow[] | null | undefined,
  hostMap: Record<number, string>,
  now: Date,
): PlanView[] {
  return (rows ?? []).map(row => toPlanView(row, hostMap, now))
}

/**
 * 关键字 + 类型 + 状态筛选。
 *
 * @param views   展示行
 * @param filters 条件
 */
export function filterPlans(views: readonly PlanView[], filters: PlanFilters): PlanView[] {
  const kw = filters.keyword.trim().toLowerCase()
  const type = filters.type.trim()
  const status = filters.status.trim()
  return views.filter(v => {
    if (type && v.typeCode !== type) return false
    if (status && v.statusCode !== status) return false
    if (!kw) return true
    return (
      v.name.toLowerCase().includes(kw) ||
      v.description.toLowerCase().includes(kw) ||
      v.hostText.toLowerCase().includes(kw)
    )
  })
}

/** 状态计数 */
export interface PlanCounts {
  /** 总数 */
  total: number
  /** 各状态计数 */
  byStatus: Record<string, number>
}

/**
 * 按状态计数。
 *
 * <p>未知状态也单独计一格：后端将来加了新状态时，页签上的数字必须仍然与行数对得上，
 * 否则用户会看到「全部 12、四个页签加起来 10」。</p>
 *
 * @param views 展示行
 */
export function countPlans(views: readonly PlanView[]): PlanCounts {
  const byStatus: Record<string, number> = {}
  for (const v of views) byStatus[v.statusCode] = (byStatus[v.statusCode] ?? 0) + 1
  return { total: views.length, byStatus }
}

/**
 * 计划在「开始日」这条 24 小时轴上的几何。
 *
 * <p>跨天窗口按当天截断到 24 点：把 3 天的窗口画成 72 小时宽会溢出轴外，
 * 而读者在这一格里想知道的只是「今天这一段占了几个小时」。真实总时长另由
 * {@link PlanView.durationText} 给出，不与图形混为一谈。</p>
 *
 * @param view 展示行
 */
export function planGeometry(view: PlanView): { leftPercent: number; widthPercent: number } | null {
  if (view.startHour === null || !view.end || !view.start) return null
  const dayStart = new Date(view.start.getFullYear(), view.start.getMonth(), view.start.getDate())
  const endHours = (view.end.getTime() - dayStart.getTime()) / 3_600_000
  if (!Number.isFinite(endHours)) return null
  const from = Math.max(view.startHour, 0)
  const to = Math.min(endHours, 24)
  if (to <= from) return null
  const left = (from / 24) * 100
  // 下限 0.4%：一个 5 分钟的重启窗口在 24 小时轴上是 0.35%，按真实比例会细到看不见
  const width = Math.max(((to - from) / 24) * 100, 0.4)
  return { leftPercent: Math.min(left, 99.6), widthPercent: Math.min(width, 100 - left) }
}

/**
 * 分道：把同一时间段重叠的计划放到不同的道里，避免条块互相压住。
 *
 * <p>按开始时刻排序后贪心放入「最早空出来的那一道」。这不是最优解（最优需要区间图着色），
 * 但对「一天里十几条计划」的规模，贪心的道数与最优一致，且顺序稳定 ——
 * 用户每次打开看到的布局都一样，不会因为刷新一次就跳位。</p>
 *
 * @param views      展示行（只处理时间可解析的）
 * @param laneHeight 每道高度（px）
 */
export function assignLanes(
  views: readonly PlanView[],
  laneHeight = 13,
): Array<{ view: PlanView; top: number }> {
  const usable = views
    .filter(v => Number.isFinite(v.startMs) && Number.isFinite(v.endMs))
    .slice()
    .sort((a, b) => a.startMs - b.startMs || a.id - b.id)

  /** 每道当前的最晚结束时刻 */
  const laneEnds: number[] = []
  const result: Array<{ view: PlanView; top: number }> = []

  for (const view of usable) {
    let lane = laneEnds.findIndex(end => end <= view.startMs)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(view.endMs)
    } else {
      laneEnds[lane] = view.endMs
    }
    result.push({ view, top: lane * laneHeight })
  }

  return result
}

/**
 * 数据里出现过的日期键，升序。
 *
 * @param views 展示行
 */
export function planDays(views: readonly PlanView[]): Array<{ dayKey: string; count: number }> {
  const map = new Map<string, number>()
  for (const v of views) {
    if (!v.dayKey) continue
    map.set(v.dayKey, (map.get(v.dayKey) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([dayKey, count]) => ({ dayKey, count }))
}

/**
 * 日期键的中文短标签 `MM-DD`
 *
 * @param dayKey `YYYY-MM-DD`
 */
export function dayLabel(dayKey: string): string {
  return dayKey.length === 10 ? dayKey.slice(5) : dayKey
}

/**
 * 按类型分布，用于「仪表」方向的图表。
 *
 * @param views 展示行
 */
export function typeBuckets(views: readonly PlanView[]): Array<{ label: string; tone: PlanTypeTone; count: number }> {
  const buckets = PLAN_TYPES.map(t => ({
    label: t.label,
    tone: t.tone,
    count: views.filter(v => v.typeCode === t.value).length,
  }))
  const other = views.filter(v => !PLAN_TYPES.some(t => t.value === v.typeCode)).length
  if (other > 0) buckets.push({ label: '其它', tone: 'other' as PlanTypeTone, count: other })
  return buckets
}
