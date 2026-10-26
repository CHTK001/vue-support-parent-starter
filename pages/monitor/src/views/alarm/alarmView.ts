/**
 * 告警中心的展示层口径 —— 纯数据与纯函数，无 Vue、无请求。
 *
 * <p>为什么单独一层：告警中心要摆五个方向（工单台 / 仪表 / 节奏 / 主机柜 / 卡片墙），
 * 五个方向看的是同一批事件，但各自需要的派生量完全不同 —— 工单台要「按级别排好的行」，
 * 仪表要「24 小时分桶」，节奏要「落在一天里的第几分钟」，主机柜要「按主机聚合」，
 * 卡片墙要「当前值相对阈值的比例」。这些换算若各写在各方向的模板里，
 * 同一件事会长出五份口径（比如级别兜底一个写 P3 一个写 P4），
 * 那正是这次重构要消灭的东西。</p>
 *
 * <p>边界：本文件只认 {@code AlarmEvent} 这一种输入，输出全是可显示的标量。
 * 排序、分组、几何换算都留在这里，模板只做摆放。</p>
 */
import type { AlarmEvent } from '../../api/monitorApi'

/** 告警级别标识 */
export type AlarmLevelId = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'

/** 级别对应的色档：bad 危险 / warn 警告 / ok 正常 / mute 弱化 */
export type AlarmTone = 'bad' | 'warn' | 'ok' | 'mute'

/** 告警状态标识 */
export type AlarmStatusId = 'new' | 'processed' | 'false' | 'other'

/** 级别元数据 */
export interface AlarmLevelMeta {
  /** 级别标识 */
  id: AlarmLevelId
  /** 中文级别名（严重 / 高 / 中 / 低 / 信息） */
  label: string
  /** 响应承诺（立即响应 / 30 分钟 / 当班处理 / 计划内 / 通知） */
  sla: string
  /** 色档 */
  tone: AlarmTone
}

/**
 * 五个级别，顺序即严重度顺序。
 *
 * <p>顺序有意为之：颜色从 danger 渐到 placeholder，读的人不看字也能顺着色阶
 * 判断「哪一头是要命的」。P4 用 mute 而不是绿色 —— 绿色在告警语境里是
 * 「已恢复」，用在一个「信息级告警」上会误导。</p>
 */
export const ALARM_LEVELS: readonly AlarmLevelId[] = ['P0', 'P1', 'P2', 'P3', 'P4']

/** 级别元数据表 */
export const LEVEL_META: Record<AlarmLevelId, AlarmLevelMeta> = {
  P0: { id: 'P0', label: '严重', sla: '立即响应', tone: 'bad' },
  P1: { id: 'P1', label: '高', sla: '30 分钟', tone: 'bad' },
  P2: { id: 'P2', label: '中', sla: '当班处理', tone: 'warn' },
  P3: { id: 'P3', label: '低', sla: '计划内', tone: 'ok' },
  P4: { id: 'P4', label: '信息', sla: '通知', tone: 'mute' },
}

/** 状态元数据 */
export const STATUS_META: Record<AlarmStatusId, { label: string; tone: AlarmTone }> = {
  new: { label: '未处理', tone: 'bad' },
  processed: { label: '已处理', tone: 'ok' },
  false: { label: '误报', tone: 'mute' },
  other: { label: '—', tone: 'mute' },
}

/**
 * 指标名 → 中文名。
 *
 * <p>后端存的是 {@code cpu_usage} 这种机器名。表里直接显示机器名不是不行，
 * 但「CPU 使用率 96 / 90」比「cpu_usage 96 / 90」快一个数量级 ——
 * 这一页的核心动作是「一眼看出哪台机器什么指标出事了」。
 * 表里没有的指标原样显示：宁可露出机器名，也不能猜错中文名。</p>
 */
const METRIC_LABELS: Record<string, string> = {
  cpu_usage: 'CPU 使用率',
  memory_usage: '内存使用率',
  disk_usage: '磁盘使用率',
  jvm_usage: 'JVM 堆使用率',
  load_avg: '系统负载',
  net_in: '入站流量',
  net_out: '出站流量',
  swap_usage: '交换区使用率',
  process_count: '进程数',
  tcp_conn: 'TCP 连接数',
}

/**
 * 指标中文名
 *
 * @param name 后端指标名
 */
export function metricLabel(name: string): string {
  const key = String(name ?? '').trim()
  return METRIC_LABELS[key] ?? key
}

/**
 * 级别归一化：非法值兜底 P3。
 *
 * <p>与 {@code monitorApi.alarmLevel} 保持同一口径 —— 这里是那份规则在
 * 展示层的唯一副本，页面不再各自写一遍正则。</p>
 *
 * @param raw 原始级别
 */
export function levelOf(raw: unknown): AlarmLevelId {
  const lv = String(raw ?? '').toUpperCase()
  return /^P[0-4]$/.test(lv) ? (lv as AlarmLevelId) : 'P3'
}

/**
 * 状态归一化
 *
 * @param raw 原始状态
 */
export function statusOf(raw: unknown): AlarmStatusId {
  const s = String(raw ?? '').toUpperCase()
  if (s === 'NEW') return 'new'
  if (s === 'PROCESSED') return 'processed'
  if (s === 'FALSE' || s === 'FALSE_ALARM') return 'false'
  return 'other'
}

/**
 * 解析后端时间串（{@code 2026-10-26 15:22:41}）。
 *
 * <p>不用 {@code new Date(text)}：Safari 对带空格的格式解析结果不稳定，
 * 而这里的结果直接决定「落在轴上的哪个位置」，错一小时就是错一小时。</p>
 *
 * @param value 时间串
 */
export function parseAlarmTime(value: unknown): Date | null {
  if (!value) return null
  const text = String(value).trim().replace('T', ' ')
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/.exec(text)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const hour = Number(m[4] ?? 0)
  const minute = Number(m[5] ?? 0)
  const second = Number(m[6] ?? 0)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (hour > 23 || minute > 59 || second > 59) return null
  const d = new Date(year, month - 1, day, hour, minute, second)
  // 2 月 31 日会被 Date 顺延到 3 月，这里把它判成无效而不是静默改日期
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return d
}

/**
 * 两位补零
 *
 * @param n 数字
 */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 阈值在阈值条上的位置（百分比）。
 *
 * <p>70% 不是随手取的：右侧留出的 30% 正好够显示「超出阈值三成」，
 * 而现实里的告警很少超过阈值一倍以上。超过一倍的仍然按满格显示 ——
 * 条子画出去只会被裁掉，不如让它停在满格。
 */
export const THRESHOLD_AT = 70

/** 一天里的展示行 */
export interface AlarmView {  /** 事件 id */
  id: number
  /** 监控目标（后端就叫 monitorName，页面按「主机」理解） */
  host: string
  /** 主机键（分组用；空主机名归到「未命名目标」） */
  hostKey: string
  /** 指标机器名 */
  metric: string
  /** 指标中文名 */
  metricText: string
  /** 级别 */
  level: AlarmLevelId
  /** 级别中文名 */
  levelText: string
  /** 响应承诺 */
  sla: string
  /** 级别色档 */
  tone: AlarmTone
  /** 当前值 */
  value: number
  /** 阈值 */
  threshold: number
  /** 当前值 / 阈值（未截断，用于文案） */
  ratio: number
  /** 阈值条填充宽度百分比（0~100，阈值刻度见 {@link THRESHOLD_AT}） */
  gaugePercent: number
  /** 是否越过阈值 */
  over: boolean
  /** 「当前值 / 阈值」文案 */
  valueText: string
  /** 状态 */
  status: AlarmStatusId
  /** 状态文案 */
  statusText: string
  /** 状态色档 */
  statusTone: AlarmTone
  /** 触发时刻（毫秒；解析失败为 0） */
  at: number
  /** 一天里的第几分钟（0~1439）；解析失败为 -1 */
  minute: number
  /** 时刻文案：当天只给 {@code 15:22}，跨天补成 {@code 10-25 15:22} */
  timeText: string
  /** 完整时刻文案 {@code 2026-10-26 15:22:41} */
  atFullText: string
}

/**
 * 日期键
 *
 * @param d 日期
 */
function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * 时刻文案。
 *
 * <p>当天只写时分，跨天补上日期。只写时分的话，昨天 22:11 和今天 22:11
 * 在表里长得一模一样 —— 而「这是今天的还是昨天的」恰恰是告警页最要紧的一条信息，
 * 也是「这波是不是已经过去了」的唯一线索。</p>
 *
 * @param at       触发时刻；null 表示解析失败
 * @param todayKey 今天的日期键
 */
function timeTextOf(at: Date | null, todayKey: string): string {
  if (!at) return '—'
  const clock = `${pad2(at.getHours())}:${pad2(at.getMinutes())}`
  return dayKeyOf(at) === todayKey ? clock : `${pad2(at.getMonth() + 1)}-${pad2(at.getDate())} ${clock}`
}

/**
 * 后端事件 → 展示行
 *
 * @param rows 后端事件
 * @param now  用来判断「是不是当天」的时刻；测试里传固定值，页面用当前时刻
 */
export function toAlarmViews(
  rows: readonly AlarmEvent[] | null | undefined,
  now: Date = new Date(),
): AlarmView[] {
  const out: AlarmView[] = []
  const todayKey = dayKeyOf(now)
  for (const row of rows ?? []) {
    const level = levelOf(row.msMonitorAlarmEventLevel)
    const meta = LEVEL_META[level]
    const status = statusOf(row.msMonitorAlarmEventStatus)
    const value = Number(row.msMonitorAlarmEventAlarmValue) || 0
    const threshold = Number(row.msMonitorAlarmEventThreshold) || 0
    const ratio = threshold > 0 ? value / threshold : 0
    const at = parseAlarmTime(row.msMonitorAlarmEventTriggerTime)
    const host = String(row.msMonitorAlarmEventMonitorName ?? '').trim()
    out.push({
      id: Number(row.id),
      host: host || '未命名目标',
      hostKey: host || '未命名目标',
      metric: String(row.msMonitorAlarmEventMetricName ?? ''),
      metricText: metricLabel(row.msMonitorAlarmEventMetricName),
      level,
      levelText: meta.label,
      sla: meta.sla,
      tone: meta.tone,
      value,
      threshold,
      ratio,
      // 阈值刻度放在 70% 处：真按「阈值 = 100%」画，满格那一下等于没说 ——
      // 条子到顶才知道越线，越线之后涨多少也看不出来。留出右侧 30%，
      // 溢出多少一眼可见，而刻度线本身就把「阈值在哪」标出来了。
      gaugePercent: Math.max(0, Math.min(100, Math.round(ratio * THRESHOLD_AT))),
      over: threshold > 0 && value >= threshold,
      valueText: `${value} / ${threshold}`,
      status,
      statusText: STATUS_META[status].label,
      statusTone: STATUS_META[status].tone,
      at: at ? at.getTime() : 0,
      minute: at ? at.getHours() * 60 + at.getMinutes() : -1,
      timeText: timeTextOf(at, todayKey),
      atFullText: at ? String(row.msMonitorAlarmEventTriggerTime ?? '').slice(0, 19) : '—',
    })
  }
  return out
}

/**
 * 级别计数
 *
 * @param views 展示行
 */
export function countByLevel(views: readonly AlarmView[]): Record<AlarmLevelId, number> {
  const counts: Record<AlarmLevelId, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 }
  for (const v of views) counts[v.level]++
  return counts
}

/**
 * 状态计数
 *
 * @param views 展示行
 */
export function countByStatus(views: readonly AlarmView[]): Record<AlarmStatusId, number> {
  const counts: Record<AlarmStatusId, number> = { new: 0, processed: 0, false: 0, other: 0 }
  for (const v of views) counts[v.status]++
  return counts
}

/** 全页汇总口径 */
export interface AlarmSummary {
  /** 事件总数 */
  total: number
  /** 未处理 */
  unhandled: number
  /** 已处理 */
  processed: number
  /** 误报 */
  falseAlarm: number
  /** 涉及主机数 */
  hosts: number
  /** 涉及指标数 */
  metrics: number
  /** 最严重的级别（无数据时为空串） */
  worstLevel: AlarmLevelId | ''
}

/**
 * 汇总
 *
 * @param views 展示行
 */
export function summarize(views: readonly AlarmView[]): AlarmSummary {
  const status = countByStatus(views)
  const hosts = new Set<string>()
  const metrics = new Set<string>()
  let worst: AlarmLevelId | '' = ''
  for (const v of views) {
    hosts.add(v.hostKey)
    metrics.add(v.metric)
    if (!worst || ALARM_LEVELS.indexOf(v.level) < ALARM_LEVELS.indexOf(worst)) worst = v.level
  }
  return {
    total: views.length,
    unhandled: status.new,
    processed: status.processed,
    falseAlarm: status.false,
    hosts: hosts.size,
    metrics: metrics.size,
    worstLevel: worst,
  }
}

/** 筛选模型 */
export interface AlarmFilters {
  /** 关键字：主机 / 指标 */
  keyword: string
  /** 级别；空串为全部 */
  level: string
  /** 状态档；空串为全部，{@code new} 只看未处理 */
  status: string
  /**
   * 小时（{@code 0}~{@code 23}）；空串为全部。
   *
   * <p>只由趋势图上的柱子写入 —— 柱子上写的就是「几点」，点它就该把明细收到那个小时，
   * 否则那张图只是装饰。跨天时按「几点」筛而不是「哪天几点」：
   * 值班想知道的是「每天这个时候是不是都这样」。</p>
   */
  hour: string
}

/** 空筛选 */
export const EMPTY_ALARM_FILTERS: AlarmFilters = {
  keyword: '',
  level: '',
  status: '',
  hour: '',
}

/**
 * 筛选 + 排序。
 *
 * <p>排序口径：未处理在前，其次按级别严重度，再按时间倒序。
 * 「先处理要命的」是这一页唯一的价值判断，因此它写在排序里而不是让用户点表头 ——
 * 一个还需要点两次才能找出「现在该干什么」的告警页，值班时是不会被打开的。</p>
 *
 * @param views   展示行
 * @param filters 筛选条件
 */
export function filterAlarms(views: readonly AlarmView[], filters: AlarmFilters): AlarmView[] {
  const kw = filters.keyword.trim().toLowerCase()
  const level = filters.level.trim().toUpperCase()
  const status = filters.status.trim().toLowerCase()
  const hour = filters.hour.trim() === '' ? -1 : Number(filters.hour)
  const list = views.filter(v => {
    if (level && v.level !== level) return false
    if (status) {
      if (status === 'new' && v.status !== 'new') return false
      if (status === 'processed' && v.status !== 'processed') return false
      if (status === 'false' && v.status !== 'false') return false
    }
    // 时间解析失败的行走不进任何小时：它连「几点」都不知道，塞进某一格里就是编数据
    if (hour >= 0 && Math.floor(v.minute / 60) !== hour) return false
    if (!kw) return true
    return `${v.host} ${v.metric} ${v.metricText}`.toLowerCase().includes(kw)
  })
  return [...list].sort((a, b) => {
    const unhandledA = a.status === 'new' ? 0 : 1
    const unhandledB = b.status === 'new' ? 0 : 1
    if (unhandledA !== unhandledB) return unhandledA - unhandledB
    const levelA = ALARM_LEVELS.indexOf(a.level)
    const levelB = ALARM_LEVELS.indexOf(b.level)
    if (levelA !== levelB) return levelA - levelB
    return b.at - a.at
  })
}

/** 趋势桶 */
export interface TrendBucket {
  /** 桶标签（{@code 09} 表示 09 点） */
  label: string
  /** 该桶的告警条数 */
  count: number
  /** 柱高百分比（0~100） */
  percent: number
  /** 是否落在「最近一小时」 */
  recent: boolean
}

/**
 * 把后端趋势点摊成固定长度的桶。
 *
 * <p>后端返回的是「有数据的小时」，且时间串格式不定（{@code 2026-10-26 09:00:00}
 * 或 {@code 09:00}）。这里统一按「取时间串里的小时数」对齐到 24 格，
 * 缺的格子补 0 —— 一张断断续续的柱状图比没有图更容易误读。</p>
 *
 * @param points 后端趋势点
 * @param hours  桶数（默认 24）
 */
export function trendBuckets(
  points: ReadonlyArray<{ time: string; count: number }> | null | undefined,
  hours = 24,
): TrendBucket[] {
  const buckets: TrendBucket[] = Array.from({ length: hours }, (_, i) => ({
    label: pad2(i),
    count: 0,
    percent: 0,
    recent: false,
  }))
  for (const p of points ?? []) {
    const text = String(p?.time ?? '')
    const m = /(\d{1,2})(?::\d{2})?(?::\d{2})?\s*$/.exec(text) ?? /(\d{1,2})/.exec(text)
    if (!m) continue
    const hour = Number(m[1])
    if (!Number.isFinite(hour) || hour < 0 || hour >= hours) continue
    buckets[hour]!.count += Number(p.count) || 0
  }
  const max = buckets.reduce((m, b) => Math.max(m, b.count), 0)
  const lastHour = new Date().getHours()
  for (const b of buckets) {
    b.percent = max > 0 ? Math.round((b.count / max) * 100) : 0
    b.recent = Number(b.label) === lastHour
  }
  return buckets
}

/**
 * 趋势接口不可用时，用已拉到的告警自己分桶。
 *
 * <p>口径与 {@link trendBuckets} 一致（按小时），差别只是数据来源：
 * 只有页面已拉到的事件，所以它显示的是「列表里这些告警的形状」，
 * 而不是全库的形状。函数名与注释都说明这一点，免得以后有人拿它当全量统计。</p>
 *
 * @param views 展示行
 * @param hours 桶数
 */
export function trendFromViews(views: readonly AlarmView[], hours = 24): TrendBucket[] {
  const buckets: TrendBucket[] = Array.from({ length: hours }, (_, i) => ({
    label: pad2(i),
    count: 0,
    percent: 0,
    recent: false,
  }))
  for (const v of views) {
    if (v.minute < 0) continue
    const hour = Math.floor(v.minute / 60)
    if (hour >= hours) continue
    buckets[hour]!.count++
  }
  const max = buckets.reduce((m, b) => Math.max(m, b.count), 0)
  const lastHour = new Date().getHours()
  for (const b of buckets) {
    b.percent = max > 0 ? Math.round((b.count / max) * 100) : 0
    b.recent = Number(b.label) === lastHour
  }
  return buckets
}

/**
 * 级别分布（仪表方向的横条）
 *
 * @param views 展示行
 */
export function levelDistribution(views: readonly AlarmView[]): Array<{
  level: AlarmLevelId
  label: string
  sla: string
  tone: AlarmTone
  count: number
  percent: number
}> {
  const counts = countByLevel(views)
  const total = Math.max(1, views.length)
  return ALARM_LEVELS.map(level => ({
    level,
    label: LEVEL_META[level].label,
    sla: LEVEL_META[level].sla,
    tone: LEVEL_META[level].tone,
    count: counts[level],
    percent: Math.round((counts[level] / total) * 100),
  }))
}
