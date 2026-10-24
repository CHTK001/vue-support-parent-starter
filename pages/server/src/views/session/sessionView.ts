/**
 * 会话审计 —— 行数据到展示数据的映射（纯函数，无 Vue 依赖）
 *
 * <p>为什么要单独一层：这一页有 5 个画布（工单台 / 仪表 / 节奏 / 档案柜 / 卡片墙），
 * 它们显示的是同一批会话，只是排法不同。若每个画布各自算一次时长、各自拼一次
 * 「主机为空时怎么兜底」，五个画布迟早会出现「同一个会话在 A 画布显示 2h36m、
 * 在 B 画布显示 2 小时」这类不一致。</p>
 *
 * <p>本层的职责边界：只做格式化的收口与派生字段的计算，不碰筛选条件之外的业务规则。
 * 筛选（{@link filterSessions}）也放在这里——它是「什么算命中」的定义，
 * 与画布无关，放页面里会让五个画布各写一遍。</p>
 *
 * @author CH
 * @since 4.0.0
 */

/** 会话状态筛选取值 */
export type SessionStatusFilter = '' | 'OPEN' | 'CLOSED'

/**
 * 时段桶的宽度（小时）。
 *
 * <p>筛选条件与画布必须用同一个宽度：用户在「仪表」画布上点了 `08-12` 这根柱，
 * 筛选就得按 4 小时切；如果画布画 4 小时、筛选按 3 小时切，点完看到的是另一批数据。</p>
 */
export const SESSION_BUCKET_HOURS = 4

/** 筛选条件（编辑中的表单与已应用的条件共用同一形状） */
export interface SessionFilters {
  /** 关键字：主机名 / 用户 / IP / 主机台账名 */
  keyword: string
  /** 协议，大写；空串表示全部 */
  protocol: string
  /** 客户端 IP 片段 */
  ip: string
  /** 状态；空串表示全部 */
  status: SessionStatusFilter
  /**
   * 时段桶起点（0 / 4 / 8 …）；null 表示不限时段。
   *
   * <p>由「仪表」画布的图表点击产生 —— 图表即筛选器。其它画布不设置它，
   * 但都会尊重它（{@link filterSessions} 统一处理），因此从仪表切到工单台时
   * 筛选不会被悄悄丢掉。</p>
   */
  hourBucket: number | null
}

/** 后端会话行（字段为后端原样） */
export interface SessionRow {
  id: number
  msTerminalSessionHostId?: number
  msTerminalSessionHostName?: string
  msTerminalSessionProtocol: string
  msTerminalSessionUser?: string
  msTerminalSessionClientIp?: string
  msTerminalSessionConnectTime?: string
  msTerminalSessionCloseTime?: string
  msTerminalSessionStatus: string
  msTerminalSessionCloseReason?: string
}

/** 画布消费的展示行：格式已收口，五个画布读同一份 */
export interface SessionView {
  id: number
  /** 主机名；后端没填时用台账名兜底，都没有显示 `—` */
  host: string
  /** 登录用户；空时显示 `—` */
  user: string
  /** 客户端 IP；空时显示 `—` */
  ip: string
  /** 协议（大写原值） */
  protocol: string
  /** 协议色档：ssh / rdp / vnc / other */
  protocolTone: 'ssh' | 'rdp' | 'vnc' | 'other'
  /** 连接时间 `yyyy-MM-dd HH:mm:ss` */
  connectText: string
  /** 关闭时间；进行中显示 `—` */
  closeText: string
  /** 原始状态值 */
  status: string
  /** 状态中文 */
  statusText: string
  /** 是否进行中 */
  isOpen: boolean
  /** 时长毫秒；无法解析时为 null */
  durationMs: number | null
  /** 时长可读文本，如 `2h36m`；无法计算时 `—` */
  durationText: string
  /** 连接时刻在当天的位置（0~24，含小数）；用于时间带，无法解析时 null */
  startHour: number | null
  /** 关闭时刻在当天的位置；进行中取 now */
  endHour: number | null
  /** 关闭原因；无则空串 */
  closeReason: string
}

/** 状态计数 */
export interface SessionStats {
  /** 全部会话数（不受筛选影响） */
  total: number
  /** 进行中 */
  open: number
  /** 已结束 */
  closed: number
}

/** 空筛选条件 */
export const EMPTY_SESSION_FILTERS: SessionFilters = {
  keyword: '',
  protocol: '',
  ip: '',
  status: '',
  hourBucket: null,
}

/**
 * 解析后端时间串。
 *
 * <p>两种形态都要吃：`2026-10-24T09:12:04` 与 `2026-10-24 09:12:04`。
 * 后者在 Safari 上 `new Date()` 会得到 Invalid Date，故先把 `-` 换成 `/`
 * （与 tshark 的 parseTime 同一处理，避免两处口径不同）。</p>
 *
 * @param raw 时间串
 */
export function parseTime(raw?: string | null): Date | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null
  const d = s.includes('T') ? new Date(s) : new Date(s.replace(/-/g, '/'))
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * 统一时间显示 `yyyy-MM-dd HH:mm:ss`。
 *
 * <p>已是该形态就原样返回（避免时区重排），否则格式化。</p>
 *
 * @param raw 时间串
 */
export function formatTime(raw?: string | null): string {
  if (!raw) return '—'
  const s = String(raw).trim()
  if (!s) return '—'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 19)
  const d = parseTime(s)
  if (!d) return s
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

/**
 * 不到两位补零。
 *
 * @param n 数字
 */
export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 时长可读文本。
 *
 * <p>取「两个最高单位」，不堆到秒：审计场景看的是量级，
 * `2h36m` 比 `2小时36分22秒` 好扫，也比 `9360s` 直观。</p>
 *
 * @param ms 毫秒；负数或非法按 null 处理
 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return '—'
  const totalSec = Math.floor(ms / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const totalMin = Math.floor(totalSec / 60)
  if (totalMin < 60) return `${totalMin}m`
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours < 24) return mins > 0 ? `${hours}h${mins}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours > 0 ? `${days}d${restHours}h` : `${days}d`
}

/**
 * 时刻在当天的位置（0~24，含小数）；时间带用。
 *
 * @param d 时间
 */
export function hourOfDay(d: Date | null): number | null {
  if (!d) return null
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
}

/**
 * 协议色档。
 *
 * <p>只认三种已知协议，其余归 other（灰）：以后端新增协议（如 TELNET）时不至于
 * 显示成某个具体协议的配色，读起来像是被误标了。</p>
 *
 * @param protocol 协议原值
 */
export function protocolTone(protocol?: string | null): SessionView['protocolTone'] {
  const v = String(protocol ?? '').trim().toLowerCase()
  if (v === 'ssh') return 'ssh'
  if (v === 'rdp') return 'rdp'
  if (v === 'vnc') return 'vnc'
  return 'other'
}

/**
 * 状态中文。
 *
 * @param status 状态原值
 */
export function statusText(status?: string | null): string {
  if (status === 'OPEN') return '进行中'
  if (status === 'CLOSED') return '已结束'
  return String(status ?? '') || '—'
}

/**
 * 单行映射。
 *
 * @param row     后端行
 * @param hostMap 主机台账 id → 主机名；后端没填主机名时兜底
 * @param now     当前时刻；进行中的会话以它为结束点，注入以便单测
 */
export function toSessionView(
  row: SessionRow,
  hostMap: Record<number, string>,
  now: Date,
): SessionView {
  const host = row.msTerminalSessionHostName || hostMap[row.msTerminalSessionHostId ?? 0] || '—'
  const isOpen = row.msTerminalSessionStatus === 'OPEN'
  const start = parseTime(row.msTerminalSessionConnectTime)
  const end = isOpen ? now : parseTime(row.msTerminalSessionCloseTime)
  const durationMs = start && end && end.getTime() >= start.getTime() ? end.getTime() - start.getTime() : null

  // 起点解析不出来时，整段区间都视为未知（两个都 null）：
  // 只留一个 endHour 会让画布有机会画出「起点未知、终点 11.8h」的条，
  // 那种条看起来像有效数据，其实是半个事实。
  const startHour = hourOfDay(start)
  const endHour = startHour === null ? null : hourOfDay(end)

  return {
    id: row.id,
    host,
    user: row.msTerminalSessionUser || '—',
    ip: row.msTerminalSessionClientIp || '—',
    protocol: String(row.msTerminalSessionProtocol ?? '').toUpperCase() || '—',
    protocolTone: protocolTone(row.msTerminalSessionProtocol),
    connectText: formatTime(row.msTerminalSessionConnectTime),
    closeText: isOpen ? '—' : formatTime(row.msTerminalSessionCloseTime),
    status: String(row.msTerminalSessionStatus ?? ''),
    statusText: statusText(row.msTerminalSessionStatus),
    isOpen,
    durationMs,
    durationText: formatDuration(durationMs),
    startHour,
    endHour,
    closeReason: row.msTerminalSessionCloseReason || '',
  }
}

/**
 * 批量映射。
 *
 * @param rows    后端行
 * @param hostMap 主机台账映射
 * @param now     当前时刻
 */
export function toSessionViews(
  rows: readonly SessionRow[] | null | undefined,
  hostMap: Record<number, string>,
  now: Date,
): SessionView[] {
  return (rows ?? []).map(row => toSessionView(row, hostMap, now))
}

/**
 * 状态计数（全量，不受筛选影响）。
 *
 * <p>页签上的数字必须等于「点进去看到的行数」。因此计数与筛选必须共用
 * 同一套判定：这里对 OPEN / CLOSED 都是**严格相等**，不做「非 OPEN 即 CLOSED」
 * 的推导。否则后端出现第三种状态时，该行会被算进「已结束」徽标，
 * 而点进去（筛选同样严格）却看不到它 —— 徽标与行数对不上。</p>
 *
 * <p>代价是 open + closed 可能小于 total，这是对的：未知状态确实不属于任何一个页签，
 * 它只出现在「全部」里。</p>
 *
 * @param rows 全量行
 */
export function countByStatus(rows: readonly SessionRow[] | null | undefined): SessionStats {
  const list = rows ?? []
  let open = 0
  let closed = 0
  for (const r of list) {
    if (r.msTerminalSessionStatus === 'OPEN') open++
    else if (r.msTerminalSessionStatus === 'CLOSED') closed++
  }
  return { total: list.length, open, closed }
}

/**
 * 是否命中关键字。
 *
 * @param row     后端行
 * @param keyword 已转小写的关键字
 * @param hostMap 主机台账映射（台账名也参与匹配）
 */
function matchKeyword(row: SessionRow, keyword: string, hostMap: Record<number, string>): boolean {
  if (!keyword) return true
  const hay = [
    row.msTerminalSessionHostName,
    row.msTerminalSessionUser,
    row.msTerminalSessionClientIp,
    hostMap[row.msTerminalSessionHostId ?? 0],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(keyword)
}

/**
 * 应用筛选条件。
 *
 * @param rows    全量行
 * @param filters 已应用的条件
 * @param hostMap 主机台账映射
 */
export function filterSessions(
  rows: readonly SessionRow[] | null | undefined,
  filters: SessionFilters,
  hostMap: Record<number, string>,
): SessionRow[] {
  const keyword = filters.keyword.trim().toLowerCase()
  const ip = filters.ip.trim().toLowerCase()
  const protocol = filters.protocol.trim().toUpperCase()
  const bucket = filters.hourBucket

  return (rows ?? []).filter(row => {
    if (filters.status && row.msTerminalSessionStatus !== filters.status) return false
    if (protocol && String(row.msTerminalSessionProtocol ?? '').toUpperCase() !== protocol) return false
    if (ip && !String(row.msTerminalSessionClientIp ?? '').toLowerCase().includes(ip)) return false
    if (bucket !== null && bucket !== undefined) {
      // 时段筛的是「开始时刻落在哪个桶」：与图表按开始时刻归桶的口径一致，
      // 点哪根柱就只会剩下那根柱里的会话。
      const start = parseTime(row.msTerminalSessionConnectTime)
      const hour = hourOfDay(start)
      if (hour === null) return false
      if (hour < bucket || hour >= bucket + SESSION_BUCKET_HOURS) return false
    }
    return matchKeyword(row, keyword, hostMap)
  })
}

/**
 * 一个时段桶内的协议构成。
 *
 * <p>`total` 单独给出来，而不是让画布把 counts 相加：画布要按 `total` 定柱高，
 * 若 counts 里出现了画布不认识的键（将来后端加协议并映射成新 tone），
 * 相加会漏掉它，柱高就与标签对不上。</p>
 */
export interface ProtocolBucket {
  /** 桶标签，如 `00-04` */
  label: string
  /** 桶起点小时 */
  fromHour: number
  /** 桶内会话总数 */
  total: number
  /** 各协议构成 */
  counts: Record<SessionView['protocolTone'], number>
}

/**
 * 按「开始时刻」把会话分进固定宽度的时段桶，并统计各自协议构成。
 *
 * <p>只按开始时刻归桶（不按区间重叠）：一条跨桶的长会话若按重叠算会被记进多个桶，
 * 各桶相加就超过总数，读图的人会以为统计有错。按开始时刻归桶保证「桶内数字加起来
 * 等于总会话数」，代价是长会话只出现在它开始的那个桶里 —— 这个代价在图例里说明。</p>
 *
 * @param views       展示行
 * @param bucketHours 每个桶的小时数，需能整除 24
 */
export function bucketByProtocol(
  views: readonly SessionView[],
  bucketHours = SESSION_BUCKET_HOURS,
): ProtocolBucket[] {
  const size = bucketHours > 0 ? bucketHours : SESSION_BUCKET_HOURS
  const bucketCount = Math.ceil(24 / size)
  const buckets: ProtocolBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const from = i * size
    const to = Math.min(from + size, 24)
    return {
      label: `${pad2(from)}-${pad2(to)}`,
      fromHour: from,
      total: 0,
      counts: { ssh: 0, rdp: 0, vnc: 0, other: 0 },
    }
  })

  for (const view of views) {
    if (view.startHour === null) continue
    const index = Math.min(Math.floor(view.startHour / size), bucketCount - 1)
    const bucket = buckets[index]
    if (!bucket) continue
    bucket.total++
    bucket.counts[view.protocolTone]++
  }

  return buckets
}

/**
 * 时长中位数（毫秒）。
 *
 * <p>用中位数而不是平均：审计里常有一两条挂了一整天的会话，平均数会被它们拉走，
 * 看不出「一次典型会话多久」。</p>
 *
 * @param views 展示行；时长不可知的会被跳过
 */
export function medianDuration(views: readonly SessionView[]): number | null {
  const list = views
    .map(v => v.durationMs)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  if (!list.length) return null
  const mid = Math.floor(list.length / 2)
  return list.length % 2 === 1 ? list[mid]! : Math.round((list[mid - 1]! + list[mid]!) / 2)
}

/**
 * 时间带的分道：按协议分组，同组内依次下沉，避免条块互相压住。
 *
 * <p>不做「最优区间图着色」——那要排序 + 贪心，收益只是少占几十像素高度；
 * 按协议分道足够读，且道的顺序稳定（协议不会因为换一天而换位置）。</p>
 *
 * @param views 展示行
 * @param laneHeight 单道高度（含间距），单位 px
 */
export function assignLanes(views: readonly SessionView[], laneHeight = 13): Array<{ view: SessionView; top: number }> {
  const nextLane: Record<string, number> = {}
  return views
    .filter(v => v.startHour !== null && v.endHour !== null)
    .map(view => {
      const tone = view.protocolTone
      const lane = nextLane[tone] ?? 0
      nextLane[tone] = lane + 1
      return { view, top: lane * laneHeight }
    })
}

/**
 * 时间带里一根条的几何位置（百分比）。
 *
 * @param view 展示行
 * @param dayStartHour 轴起点（默认 0）
 * @param dayEndHour   轴终点（默认 24）
 */
export function bandGeometry(
  view: SessionView,
  dayStartHour = 0,
  dayEndHour = 24,
): { leftPercent: number; widthPercent: number } | null {
  if (view.startHour === null || view.endHour === null) return null
  const span = dayEndHour - dayStartHour
  if (span <= 0) return null
  const start = Math.max(view.startHour, dayStartHour)
  const end = Math.min(view.endHour, dayEndHour)
  if (end < start) return null
  const left = ((start - dayStartHour) / span) * 100
  // 极短会话（几秒）在整日轴上宽度趋近 0，给下限保证还能看见、能点中
  const width = Math.max(((end - start) / span) * 100, 0.35)
  return { leftPercent: left, widthPercent: width }
}
