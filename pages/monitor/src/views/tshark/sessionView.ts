/**
 * 抓包 / 导入会话 —— 行数据到展示数据的映射（纯函数，无 Vue 依赖）
 *
 * <p>「抓包分析」与「PCAP 分析」两页看的是同一类数据（一次抓包或一次导入就是一个会话），
 * 只是来源不同、动作不同。它们的列表此前各写了一份取数逻辑：一页算时长用起止时间、
 * 另一页直接用后端字段，同一份会话在两页里会显示成两个时长。本层把它们收成一份，
 * 顺带把「会话落在哪一天、一昼夜的哪个位置」算成可以直接画的值。</p>
 *
 * <p>时间解析规则与 `pages/server` 的 shared/datetime 一致；两个页面模块之间不跨包引用，
 * 所以这里保留一份实现而不是共享 —— 一旦出现第三处，就该把它提到 `@repo/utils`。</p>
 *
 * @author CH
 * @since 4.0.0
 */

/** 本层用到的会话字段（只取展示需要的） */
export interface SessionRow {
  id: number
  sessionName?: string | null
  captureInterface?: string | null
  captureStatus?: number | null
  packetCount?: number | null
  startTime?: string | null
  endTime?: string | null
  source?: string | null
  captureDuration?: number | null
  lastError?: string | null
  fileSize?: number | null
  maxSizeMb?: number | null
}

/** 会话状态档 */
export type SessionTone = 'run' | 'stop' | 'err'

/** 画布消费的展示行 */
export interface SessionView {
  /** 会话 id */
  id: number
  /** 会话名（后端可能回退成网卡名） */
  name: string
  /** 网卡原始值 */
  iface: string
  /** 网卡友好名 */
  ifaceText: string
  /** 状态码：1 抓包中 / 2 异常 / 其余已停止 */
  statusCode: number
  /** 状态中文 */
  statusText: string
  /** 状态档 */
  statusTone: SessionTone
  /** 是否进行中 */
  running: boolean
  /** 报文数 */
  packetCount: number
  /** 大小文本 */
  sizeText: string
  /** 大小悬停说明（带上限） */
  sizeTitle: string
  /** 开始时刻 */
  start: Date | null
  /** 结束时刻 */
  end: Date | null
  /** 开始时刻文本 */
  startText: string
  /** 结束时刻文本 */
  endText: string
  /** 时长文本 */
  durationText: string
  /** 开始所在日期键 `YYYY-MM-DD`；不可知为空串 */
  dayKey: string
  /** 开始时刻距当日 0 点的小时数（含小数）；不可知为 null */
  startHour: number | null
  /** 结束时刻距**开始那天** 0 点的小时数（可能超过 24）；不可知为 null */
  endHour: number | null
  /** 「起 → 止」一行文本 */
  rangeText: string
  /** 来源：live / import */
  source: string
  /** 最近一次错误 / 停止说明 */
  lastError: string
  /** 大小上限（MB），0 或空表示不限 */
  maxSizeMb: number
}

/** 筛选条件 */
export interface SessionFilters {
  /** 关键字：会话名 / 网卡 */
  keyword: string
  /** 状态：'' 全部 / 'run' 抓包中 / 'stop' 已停止 / 'err' 异常 */
  status: string
}

/** 空筛选条件 */
export const EMPTY_SESSION_FILTERS: SessionFilters = { keyword: '', status: '' }

/**
 * 解析后端时间。
 *
 * <p>tshark 侧给的是 `yyyy-MM-dd HH:mm:ss`，`new Date()` 对这种写法在部分引擎里
 * 是非法值；手工拆字段再交给 `new Date(y, m, d)` 才稳定。</p>
 *
 * @param value 时间串
 */
export function parseTsharkTime(value?: string | null): Date | null {
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
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return d
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
 * 日期时间文本 `MM-DD HH:mm:ss`（同一天里看会话，年份是噪声）
 *
 * @param d 时刻
 */
export function formatClock(d: Date | null): string {
  if (!d) return '—'
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
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
 * 字节数 → 可读大小
 *
 * @param bytes 字节数
 */
export function formatSize(bytes?: number | null): string {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/**
 * 秒数 → 时长文本
 *
 * @param seconds 秒
 */
export function formatSpan(seconds?: number | null): string {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s <= 0) return '—'
  if (s < 60) return `${Math.round(s)} 秒`
  const min = Math.floor(s / 60)
  const restSec = Math.round(s % 60)
  if (min < 60) return restSec ? `${min} 分 ${restSec} 秒` : `${min} 分`
  const hour = Math.floor(min / 60)
  const restMin = min % 60
  return restMin ? `${hour} 小时 ${restMin} 分` : `${hour} 小时`
}

/**
 * 时长：优先用起止时间算，退化到后端给的秒数。
 *
 * <p>两个页面原先各选了一种口径 —— 一页算起止、一页用字段，于是同一条会话在两页里
 * 可以显示成两个时长。这里统一成「起止优先」，因为停止后后端只落 start/end；
 * 抓包进行中没有 end，才用预设时长。</p>
 *
 * @param start      开始时刻
 * @param end        结束时刻
 * @param fallbackMs 后端给的秒数
 */
export function durationText(start: Date | null, end: Date | null, fallbackMs?: number | null): string {
  if (start && end && end.getTime() >= start.getTime()) {
    return formatSpan((end.getTime() - start.getTime()) / 1000)
  }
  return formatSpan(fallbackMs)
}

/**
 * 状态归一。
 *
 * @param code 后端状态码
 */
export function statusOf(code?: number | null): { code: number; text: string; tone: SessionTone } {
  const c = Number(code)
  if (c === 1) return { code: 1, text: '抓包中', tone: 'run' }
  if (c === 2) return { code: 2, text: '异常', tone: 'err' }
  return { code: 0, text: '已停止', tone: 'stop' }
}

/**
 * 单行映射。
 *
 * @param row         后端行
 * @param ifaceLabel  网卡友好名解析（由页面按 tshark -D 的结果提供）
 */
export function toSessionView(
  row: SessionRow,
  ifaceLabel: (value?: string | null) => string,
): SessionView {
  const start = parseTsharkTime(row.startTime)
  const end = parseTsharkTime(row.endTime)
  const status = statusOf(row.captureStatus)
  const packetCount = Number(row.packetCount ?? 0) || 0
  const sizeText = formatSize(row.fileSize)
  const maxSizeMb = Number(row.maxSizeMb ?? 0) || 0
  const dayStart = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()) : null

  return {
    id: row.id,
    name: String(row.sessionName ?? '').trim() || `会话 ${row.id}`,
    iface: String(row.captureInterface ?? ''),
    ifaceText: ifaceLabel(row.captureInterface),
    statusCode: status.code,
    statusText: status.text,
    statusTone: status.tone,
    running: status.code === 1,
    packetCount,
    sizeText,
    sizeTitle:
      maxSizeMb > 0 ? `已写入 ${sizeText}，上限 ${maxSizeMb} MB` : `已写入 ${sizeText}，未设上限`,
    start,
    end,
    startText: start ? formatClock(start) : '—',
    endText: end ? formatClock(end) : '—',
    durationText: durationText(start, end, row.captureDuration),
    dayKey: dayKeyOf(start),
    startHour: start && dayStart ? (start.getTime() - dayStart.getTime()) / 3_600_000 : null,
    endHour: end && dayStart ? (end.getTime() - dayStart.getTime()) / 3_600_000 : null,
    rangeText: start ? `${formatClock(start)}${end ? ` → ${formatClock(end)}` : ' → 进行中'}` : '—',
    source: String(row.source ?? ''),
    lastError: String(row.lastError ?? '').trim(),
    maxSizeMb,
  }
}

/**
 * 批量映射。
 *
 * @param rows        后端行
 * @param ifaceLabel  网卡友好名解析
 */
export function toSessionViews(
  rows: readonly SessionRow[] | null | undefined,
  ifaceLabel: (value?: string | null) => string,
): SessionView[] {
  return (rows ?? []).map(row => toSessionView(row, ifaceLabel))
}

/**
 * 关键字 + 状态筛选。
 *
 * @param views   展示行
 * @param filters 条件
 */
export function filterSessions(views: readonly SessionView[], filters: SessionFilters): SessionView[] {
  const kw = filters.keyword.trim().toLowerCase()
  const status = filters.status.trim()
  return views.filter(v => {
    if (status === 'run' && v.statusCode !== 1) return false
    // 「已停止」不含异常：三个页签是并列的，异常会话若同时出现在「已停止」里，
    // 页签上的计数（1）就会和列表长度（2）对不上，用户会以为筛选坏了
    if (status === 'stop' && (v.statusCode === 1 || v.statusCode === 2)) return false
    if (status === 'err' && v.statusCode !== 2) return false
    if (!kw) return true
    return `${v.name} ${v.iface} ${v.ifaceText}`.toLowerCase().includes(kw)
  })
}

/** 会话计数 */
export interface SessionCounts {
  /** 总数 */
  total: number
  /** 抓包中 */
  running: number
  /** 已停止 */
  stopped: number
  /** 异常 */
  error: number
  /** 报文累计 */
  packets: number
}

/**
 * 计数。
 *
 * @param views 展示行
 */
export function countSessions(views: readonly SessionView[]): SessionCounts {
  let running = 0
  let error = 0
  let packets = 0
  for (const v of views) {
    if (v.statusCode === 1) running++
    else if (v.statusCode === 2) error++
    packets += v.packetCount
  }
  return {
    total: views.length,
    running,
    stopped: views.length - running - error,
    error,
    packets,
  }
}

/**
 * 落盘总量（需要原始字节数，单独算，避免展示行里塞一个只用于求和的字段）
 *
 * @param rows 后端行
 */
export function totalBytes(rows: readonly SessionRow[] | null | undefined): number {
  return (rows ?? []).reduce((sum, r) => sum + (Number(r.fileSize) || 0), 0)
}

/** 24 小时轴上的一次抓包 */
export interface SessionTick {
  /** 会话 id */
  id: number
  /** 会话名 */
  name: string
  /** 轴上的位置百分比 */
  leftPercent: number
  /** 所在道 */
  lane: number
  /** 像素偏移 */
  top: number
  /** 状态中文 */
  statusText: string
  /** 状态档 */
  statusTone: SessionTone
  /** 时间范围文本 */
  rangeText: string
}

/**
 * 把某一天的会话摊到 24 小时轴上。
 *
 * <p>用起点做定位而不是画成「起止区间」：抓包会话通常只有几十秒，按真实比例画出来
 * 是 0.05% 宽的一根线，既看不见也点不中。用户在这一格里问的是「今天什么时候抓过、
 * 抓了多久」，前者由位置回答，后者由右边的时长列回答，不必挤在同一根条上。</p>
 *
 * @param views    展示行（调用方已按日期筛过）
 * @param laneStep 每道高度（px）
 */
export function sessionTicks(views: readonly SessionView[], laneStep = 13): SessionTick[] {
  const usable = views
    .filter(v => v.startHour !== null)
    .slice()
    .sort((a, b) => (a.startHour ?? 0) - (b.startHour ?? 0) || a.id - b.id)

  const laneEnds: number[] = []
  const out: SessionTick[] = []
  /** 一根标记在轴上预留的宽度（百分比），用于分道判断 */
  const TICK_SPAN = 2.2

  for (const view of usable) {
    const left = ((view.startHour as number) / 24) * 100
    let lane = laneEnds.findIndex(end => end + 0.6 <= left)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(left + TICK_SPAN)
    } else {
      laneEnds[lane] = left + TICK_SPAN
    }
    out.push({
      id: view.id,
      name: view.name,
      leftPercent: left,
      lane,
      top: lane * laneStep + 4,
      statusText: view.statusText,
      statusTone: view.statusTone,
      rangeText: view.rangeText,
    })
  }
  return out
}

/**
 * 数据里出现过的日期键，升序。
 *
 * @param views 展示行
 */
export function sessionDays(views: readonly SessionView[]): Array<{ dayKey: string; count: number }> {
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
 * 日期键的短标签 `MM-DD`
 *
 * @param dayKey `YYYY-MM-DD`
 */
export function dayLabel(dayKey: string): string {
  return dayKey.length === 10 ? dayKey.slice(5) : dayKey
}
