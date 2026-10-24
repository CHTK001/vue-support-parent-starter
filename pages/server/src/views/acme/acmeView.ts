/**
 * ACME 证书 —— 行数据到展示数据的映射（纯函数，无 Vue 依赖）
 *
 * <p>这一页真正的信息不是「有哪些证书」，而是「哪几张快到期了」。后端给的是
 * `acmeCertNotAfter` / `acmeCertRenewAt` 两个时刻，重构前界面上只有一列「有效止」
 * 的原始时间戳 —— 读者要自己去和今天相减，才能知道还剩几天。本层把这个减法
 * 以及由它派生的紧迫度、有效期进度、时间轴几何一次算齐。</p>
 *
 * <p>为什么不改后端加一个「剩余天数」字段：剩余天数是**时间的函数**，存进库里
 * 下一刻就过期了；它只能在前端按当前时刻现算。这也意味着这一页需要一个会走的
 * 「现在」，否则页面挂着不动时剩余天数会停住。</p>
 *
 * @author CH
 * @since 4.0.0
 */

/** 本层用到的证书字段（只取展示需要的，避免与接口类型强耦合） */
export interface CertRow {
  acmeCertId?: number
  acmeCertPrimaryDomain?: string
  acmeCertSan?: string
  acmeCertChallengeType?: string
  acmeCertStatus?: string
  acmeCertNotBefore?: string
  acmeCertNotAfter?: string
  acmeCertRenewAt?: string
  acmeCertLastError?: string
}

/** 证书紧迫度 */
export type CertUrgency = 'expired' | 'urgent' | 'soon' | 'ok' | 'unknown'

/** 画布消费的展示行 */
export interface CertView {
  /** 证书 id（后端 acmeCertId） */
  id: number
  /** 主域名 */
  domain: string
  /** SAN 列表 */
  sanList: string[]
  /** SAN 数量（不含主域名） */
  sanCount: number
  /** 验证方式（HTTP-01 / DNS-01） */
  challenge: string
  /** 状态代码（后端原值） */
  statusCode: string
  /** 状态中文 */
  statusLabel: string
  /** 有效起 */
  notBefore: Date | null
  /** 有效止 */
  notAfter: Date | null
  /** 有效起文本 */
  notBeforeText: string
  /** 有效止文本 */
  notAfterText: string
  /** 计划续签时刻文本（后端 acmeCertRenewAt） */
  renewAtText: string
  /** 距到期天数（向下取整；负数表示已过期）。不可知为 null */
  daysLeft: number | null
  /** 剩余天数文本 */
  daysLeftText: string
  /** 紧迫度 */
  urgency: CertUrgency
  /** 紧迫度中文 */
  urgencyLabel: string
  /** 最近一次错误 */
  lastError: string
  /** 有效期内已用百分比 0~100；不可知为 null */
  usedPercent: number | null
}

/** 筛选条件 */
export interface CertFilters {
  /** 主域名 / SAN 关键字 */
  keyword: string
  /** 状态代码；空串表示全部 */
  status: string
}

/** 空筛选条件 */
export const EMPTY_CERT_FILTERS: CertFilters = { keyword: '', status: '' }

/**
 * 后端状态映射。
 *
 * <p>与 `acmeApi.CERT_STATUS_MAP` 同值；此处独立一份是为了让本层不依赖
 * HTTP 栈（单测不必拉起请求层）。未知状态降级为原值 + 中性描色，
 * 因此后端加新状态时这里最多是「配色朴素」，不会显示成空白。</p>
 */
export const CERT_STATUS_MAP: Record<string, { label: string; urgency: CertUrgency }> = {
  pending: { label: '待处理', urgency: 'unknown' },
  validating: { label: '验证中', urgency: 'unknown' },
  valid: { label: '有效', urgency: 'ok' },
  expired: { label: '已过期', urgency: 'expired' },
  revoked: { label: '已吊销', urgency: 'unknown' },
  failed: { label: '失败', urgency: 'unknown' },
}

/** 状态下拉选项（含「全部状态」） */
export const CERT_STATUS_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: '全部状态', value: '' },
  ...Object.entries(CERT_STATUS_MAP).map(([value, meta]) => ({ label: meta.label, value })),
]

/** 紧迫度中文 */
export const URGENCY_LABEL: Record<CertUrgency, string> = {
  expired: '已过期',
  urgent: '7 天内到期',
  soon: '30 天内到期',
  ok: '有效',
  unknown: '时间未知',
}

/** 一天的毫秒数（与共享时间模块同一份） */
import { DAY_MS, formatDate, formatDateTime, pad2, parseDateTime } from '../shared/datetime'

/**
 * 解析证书时间（规则见 {@link parseDateTime}）
 */
export const parseCertTime = parseDateTime

/**
 * 日期文本 `YYYY-MM-DD`（证书有效期只需要到天）
 *
 * @param d 时刻
 */
export const formatCertDay = formatDate

/**
 * 日期文本 `YYYY-MM-DD HH:mm`
 *
 * @param d 时刻
 */
export const formatCertTime = formatDateTime

/**
 * 距到期天数。
 *
 * <p>向下取整而不是四舍五入：剩 3.9 天时说「剩 3 天」是保守的，说「剩 4 天」会让
 * 运维按 4 天排计划。对已过期的用 `Math.trunc`，刚过期几小时显示 0 天，
 * 不会夸大成「已过期 1 天」。</p>
 *
 * @param notAfter 到期时刻
 * @param now      当前时刻
 */
export function daysUntil(notAfter: Date | null, now: Date): number | null {
  if (!notAfter) return null
  const delta = notAfter.getTime() - now.getTime()
  if (delta >= 0) return Math.floor(delta / DAY_MS)
  const truncated = Math.trunc(delta / DAY_MS)
  // Math.trunc(-0.04) 得到 -0，而 Object.is(-0, 0) 为假、模板里也会透出「-0」；
  // 归一成 +0，让「刚过期几小时」就是干干净净的 0
  return truncated === 0 ? 0 : truncated
}

/**
 * 紧迫度。
 *
 * <p>判档用毫秒差而不是天数：`daysLeft` 向下取整后，剩 7 天 23 小时会算成 7 天，
 * 若再用「7 天以内」去判就会把 7.95 天的证书提前报成紧急。用原始差值判档，
 * 天数只用于显示。</p>
 *
 * @param notAfter 到期时刻
 * @param now      当前时刻
 */
export function urgencyOf(notAfter: Date | null, now: Date): CertUrgency {
  if (!notAfter) return 'unknown'
  const delta = notAfter.getTime() - now.getTime()
  if (delta <= 0) return 'expired'
  if (delta <= 7 * DAY_MS) return 'urgent'
  if (delta <= 30 * DAY_MS) return 'soon'
  return 'ok'
}

/**
 * 剩余天数文本。
 *
 * @param days  天数（可为负）
 * @param state 紧迫度，用于「不足 1 天」这类措辞
 */
export function daysLeftText(days: number | null, state: CertUrgency): string {
  if (days === null) return '—'
  if (state === 'expired') return days < 0 ? `已过期 ${-days} 天` : '已过期'
  if (days <= 0) return '不足 1 天'
  return `剩 ${days} 天`
}

/**
 * 单行映射。
 *
 * @param row 后端行
 * @param now 当前时刻
 */
export function toCertView(row: CertRow, now: Date): CertView {
  const notBefore = parseCertTime(row.acmeCertNotBefore)
  const notAfter = parseCertTime(row.acmeCertNotAfter)
  const statusCode = String(row.acmeCertStatus ?? '')
  const meta = CERT_STATUS_MAP[statusCode]
  const daysLeft = daysUntil(notAfter, now)
  // 紧迫度取自到期时刻本身：吊销/已过期的证书不该继续挂着「剩 60 天」的绿色
  const urgency = urgencyOf(notAfter, now)

  const sanList = String(row.acmeCertSan ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  let usedPercent: number | null = null
  if (notBefore && notAfter) {
    const total = notAfter.getTime() - notBefore.getTime()
    if (total > 0) {
      const used = ((now.getTime() - notBefore.getTime()) / total) * 100
      usedPercent = Math.min(Math.max(used, 0), 100)
    }
  }

  return {
    id: Number(row.acmeCertId ?? 0),
    domain: String(row.acmeCertPrimaryDomain ?? '').trim() || '未命名证书',
    sanList,
    sanCount: sanList.length,
    challenge: String(row.acmeCertChallengeType ?? ''),
    statusCode,
    statusLabel: meta?.label ?? (statusCode || '未知'),
    notBefore,
    notAfter,
    notBeforeText: formatCertDay(notBefore),
    notAfterText: formatCertDay(notAfter),
    renewAtText: formatCertTime(parseCertTime(row.acmeCertRenewAt)),
    daysLeft,
    daysLeftText: daysLeftText(daysLeft, urgency),
    urgency,
    urgencyLabel: URGENCY_LABEL[urgency],
    lastError: String(row.acmeCertLastError ?? '').trim(),
    usedPercent,
  }
}

/**
 * 批量映射。
 *
 * @param rows 后端行
 * @param now  当前时刻
 */
export function toCertViews(rows: readonly CertRow[] | null | undefined, now: Date): CertView[] {
  return (rows ?? []).map(row => toCertView(row, now))
}

/**
 * 关键字 + 状态筛选。
 *
 * @param views   展示行
 * @param filters 条件
 */
export function filterCerts(views: readonly CertView[], filters: CertFilters): CertView[] {
  const kw = filters.keyword.trim().toLowerCase()
  const status = filters.status.trim()
  return views.filter(v => {
    if (status && v.statusCode !== status) return false
    if (!kw) return true
    // 主域名与 SAN 都参与匹配：用户常常记得「那张带 api 的证书」，不记得主域名
    return v.domain.toLowerCase().includes(kw) || v.sanList.some(s => s.toLowerCase().includes(kw))
  })
}

/** 紧迫度计数 */
export interface CertCounts {
  /** 总数 */
  total: number
  /** 各状态计数 */
  byStatus: Record<string, number>
  /** 各紧迫度计数 */
  byUrgency: Record<CertUrgency, number>
}

/**
 * 计数。
 *
 * @param views 展示行
 */
export function countCerts(views: readonly CertView[]): CertCounts {
  const byStatus: Record<string, number> = {}
  const byUrgency: Record<CertUrgency, number> = { expired: 0, urgent: 0, soon: 0, ok: 0, unknown: 0 }
  for (const v of views) {
    byStatus[v.statusCode] = (byStatus[v.statusCode] ?? 0) + 1
    byUrgency[v.urgency]++
  }
  return { total: views.length, byStatus, byUrgency }
}

/** 时间轴范围 */
export interface CertAxis {
  /** 轴起点（毫秒） */
  startMs: number
  /** 轴终点（毫秒） */
  endMs: number
}

/**
 * 有效期时间轴的范围：取所有证书的最早生效日与最晚到期日。
 *
 * <p>用「数据自己的范围」而不是固定的最近 90 天：证书的有效期长度不一
 * （90 天 / 1 年 / 更长），固定在 90 天会让一年期证书的条统一顶到轴外。</p>
 *
 * @param views 展示行
 */
export function runwayAxis(views: readonly CertView[]): CertAxis | null {
  let start = Number.POSITIVE_INFINITY
  let end = Number.NEGATIVE_INFINITY
  for (const v of views) {
    if (!v.notBefore || !v.notAfter) continue
    start = Math.min(start, v.notBefore.getTime())
    end = Math.max(end, v.notAfter.getTime())
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
  return { startMs: start, endMs: end }
}

/**
 * 一张证书在时间轴上的几何。
 *
 * @param view 展示行
 * @param axis 轴范围
 */
export function certGeometry(
  view: CertView,
  axis: CertAxis,
): { leftPercent: number; widthPercent: number } | null {
  if (!view.notBefore || !view.notAfter) return null
  const span = axis.endMs - axis.startMs
  if (span <= 0) return null
  const from = view.notBefore.getTime()
  const to = view.notAfter.getTime()
  if (to <= from) return null
  const left = ((from - axis.startMs) / span) * 100
  // 下限 0.6%：有效期极短的证书按真实比例会细到看不见
  const width = Math.max(((to - from) / span) * 100, 0.6)
  return {
    leftPercent: Math.min(Math.max(left, 0), 99.4),
    widthPercent: Math.min(width, 100 - Math.max(left, 0)),
  }
}

/**
 * 轴的刻度文案。
 *
 * @param axis  轴范围
 * @param count 刻度数量（含两端）
 */
export function axisTicks(axis: CertAxis, count = 6): string[] {
  const n = Math.max(count, 2)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const ms = axis.startMs + ((axis.endMs - axis.startMs) * i) / (n - 1)
    const d = new Date(ms)
    out.push(`${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
  }
  return out
}

/**
 * 按紧迫度分组的顺序（越急越前）。
 *
 * <p>固定顺序而不是按数量排序：这一页的分组本身有语义（危险 → 安全），
 * 按数量排会让「已过期」这组因为只有 1 条而沉到最下面。</p>
 */
export const URGENCY_ORDER: readonly CertUrgency[] = ['expired', 'urgent', 'soon', 'ok', 'unknown']

/**
 * 分组（供「档案柜」左栏用）。
 *
 * @param views 展示行
 */
export function groupByUrgency(
  views: readonly CertView[],
): Array<{ key: CertUrgency; label: string; rows: CertView[] }> {
  return URGENCY_ORDER.map(key => ({
    key,
    label: URGENCY_LABEL[key],
    // 组内按剩余天数升序：最急的排最前，而不是后端返回的顺序
    rows: views
      .filter(v => v.urgency === key)
      .slice()
      .sort((a, b) => (a.daysLeft ?? Number.MAX_SAFE_INTEGER) - (b.daysLeft ?? Number.MAX_SAFE_INTEGER)),
  }))
}

/**
 * 紧迫度分布，供「仪表」图表用。
 *
 * @param counts 计数结果
 */
export function urgencyBuckets(
  counts: CertCounts,
): Array<{ key: CertUrgency; label: string; count: number }> {
  return URGENCY_ORDER.map(key => ({ key, label: URGENCY_LABEL[key], count: counts.byUrgency[key] }))
}
