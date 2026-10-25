/**
 * 批量作业 —— 行数据到展示数据的映射（纯函数，无 Vue 依赖）
 *
 * <p>这一页有两个数据面：**任务定义**（什么时候跑、跑什么命令、跑在哪几台机器上）
 * 和**执行结果**（这次跑成功没有、耗时多少、报了什么错）。重构前两者挤在一张平表里，
 * 而且「下次运行」只是一个原始时间戳列 —— 读者要自己看出「凌晨 3 点这一堆任务全挤在
 * 一起了」。</p>
 *
 * <p>本层把「任务什么时候会触发」算成一天 24 小时轴上可以直接画的位置，
 * 五个方向都能用；执行结果则算成成功率与耗时，供仪表方向使用。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { dayKeyOf, formatDateTime, hourOfDay, hourToPercent, parseDateTime } from '../shared/datetime'

/** 后端计划任务行 */
export interface JobRow {
  id: number
  msExecJobName?: string
  msExecJobType?: string
  msExecJobCron?: string
  msExecJobCommand?: string
  msExecJobHostIds?: string
  msExecJobTimeout?: number
  msExecJobEnabled?: number
  msExecJobRemark?: string
  msExecJobLastRunTime?: string
  msExecJobNextRunTime?: string
}

/** 后端执行日志行 */
export interface LogRow {
  id: number
  msExecLogType?: string
  msExecLogHostName?: string
  msExecLogCommand?: string
  msExecLogStatus?: string
  msExecLogExitCode?: number
  msExecLogError?: string
  msExecLogCostMs?: number
  msExecLogOutput?: string
  msExecLogEndTime?: string
}

/** 任务类型 */
export type JobTypeCode = 'CRON' | 'NONE'

/** 画布消费的展示行 */
export interface JobView {
  /** 任务 id */
  id: number
  /** 任务名 */
  name: string
  /** 类型代码 */
  typeCode: JobTypeCode
  /** 类型中文（定时 / 脚本） */
  typeLabel: string
  /** cron 表达式（脚本任务为空串） */
  cron: string
  /** cron 展示文本（脚本任务给破折号） */
  cronText: string
  /** 命令全文 */
  command: string
  /** 命令首行（表格里只放得下一行） */
  commandFirstLine: string
  /** 目标主机 id */
  hostIds: number[]
  /** 目标主机名（`#id` 表示台账查不到） */
  hostNames: string[]
  /** 目标主机展示文本 */
  hostText: string
  /** 目标主机数量 */
  hostCount: number
  /** 超时秒数 */
  timeoutSec: number
  /** 是否启用 */
  enabled: boolean
  /** 启用状态中文 */
  enabledText: string
  /** 备注 */
  remark: string
  /** 上次运行时刻 */
  lastRun: Date | null
  /** 上次运行文本 */
  lastRunText: string
  /** 下次运行时刻 */
  nextRun: Date | null
  /** 下次运行文本 */
  nextRunText: string
  /** 下次运行所在日期键；不可知为空串 */
  nextDayKey: string
  /** 下次运行距当日 0 点的小时数；脚本任务为 null */
  nextHour: number | null
  /** 下次运行在 24 小时轴上的百分比位置；不可知为 null */
  nextPercent: number | null
}

/** 筛选条件 */
export interface ExecFilters {
  /** 关键字：名称 / 命令 / 主机名 */
  keyword: string
  /** 类型代码；空串表示全部 */
  type: string
  /** 启用状态：'' 全部 / 'on' 启用 / 'off' 停用 */
  enabled: string
}

/** 空筛选条件 */
export const EMPTY_EXEC_FILTERS: ExecFilters = { keyword: '', type: '', enabled: '' }

/** 任务类型中文 */
export const JOB_TYPES: ReadonlyArray<{ value: JobTypeCode; label: string }> = [
  { value: 'CRON', label: '定时' },
  { value: 'NONE', label: '脚本' },
]

/** 执行日志类型中文 */
export const LOG_TYPE_LABEL: Record<string, string> = {
  COMMAND: '命令',
  FILE: '文件',
  JOB: '计划任务',
}

/**
 * 目标主机 id 集合解析。
 *
 * <p>坏 JSON 给空数组：这一页的主机列表只用于展示与「同类型主机」过滤，
 * 不像维护计划那样要原样回显原值 —— 一条坏数据不该让整行渲染出乱码。</p>
 *
 * @param raw JSON 字符串
 */
export function parseHostIds(raw?: string | null): number[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(String(raw))
    if (!Array.isArray(parsed)) return []
    return parsed.map(v => Number(v)).filter(n => Number.isFinite(n))
  } catch {
    return []
  }
}

/**
 * 任务类型代码归一。
 *
 * <p>后端历史上把脚本任务写成 `NONE`，也出现过空值。空值按定时处理而不是按脚本：
 * 定时任务有 cron、会自己跑，把它误判成脚本只是少一次展示；反过来误判成定时会让
 * 一个永不触发的任务看起来「在跑」。</p>
 *
 * @param raw 原始类型
 */
export function jobTypeCode(raw?: string | null): JobTypeCode {
  return String(raw ?? '').toUpperCase() === 'NONE' ? 'NONE' : 'CRON'
}

/**
 * 单行映射。
 *
 * @param row     后端行
 * @param hostMap 主机台账 id → 名称
 */
export function toJobView(row: JobRow, hostMap: Record<number, string>): JobView {
  const typeCode = jobTypeCode(row.msExecJobType)
  const hostIds = parseHostIds(row.msExecJobHostIds)
  const hostNames = hostIds.map(id => hostMap[id] ?? `#${id}`)
  const nextRun = parseDateTime(row.msExecJobNextRunTime)
  const lastRun = parseDateTime(row.msExecJobLastRunTime)
  const nextHour = hourOfDay(nextRun)
  const command = String(row.msExecJobCommand ?? '').trim()

  return {
    id: row.id,
    name: String(row.msExecJobName ?? '').trim() || '未命名任务',
    typeCode,
    typeLabel: typeCode === 'NONE' ? '脚本' : '定时',
    cron: typeCode === 'NONE' ? '' : String(row.msExecJobCron ?? ''),
    cronText: typeCode === 'NONE' ? '—' : String(row.msExecJobCron ?? '') || '—',
    command,
    commandFirstLine: command.split(/\r?\n/)[0]?.trim() ?? '',
    hostIds,
    hostNames,
    hostText: hostNames.length ? hostNames.join(', ') : '未指定主机',
    hostCount: hostIds.length,
    timeoutSec: Number(row.msExecJobTimeout ?? 0),
    enabled: Number(row.msExecJobEnabled ?? 0) === 1,
    enabledText: Number(row.msExecJobEnabled ?? 0) === 1 ? '启用' : '停用',
    remark: String(row.msExecJobRemark ?? '').trim(),
    lastRun,
    lastRunText: formatDateTime(lastRun),
    nextRun,
    nextRunText: formatDateTime(nextRun),
    nextDayKey: dayKeyOf(nextRun),
    nextHour,
    nextPercent: nextHour === null ? null : hourToPercent(nextHour),
  }
}

/**
 * 批量映射。
 *
 * @param rows    后端行
 * @param hostMap 主机台账
 */
export function toJobViews(
  rows: readonly JobRow[] | null | undefined,
  hostMap: Record<number, string>,
): JobView[] {
  return (rows ?? []).map(row => toJobView(row, hostMap))
}

/**
 * 关键字 + 类型 + 启用状态筛选。
 *
 * @param views   展示行
 * @param filters 条件
 */
export function filterJobs(views: readonly JobView[], filters: ExecFilters): JobView[] {
  const kw = filters.keyword.trim().toLowerCase()
  const type = filters.type.trim()
  const enabled = filters.enabled.trim()
  return views.filter(v => {
    if (type && v.typeCode !== type) return false
    if (enabled === 'on' && !v.enabled) return false
    if (enabled === 'off' && v.enabled) return false
    if (!kw) return true
    // 命令全文参与匹配：用户找的往往是「那个跑 rsync 的任务」，不记得任务名
    return (
      v.name.toLowerCase().includes(kw) ||
      v.command.toLowerCase().includes(kw) ||
      v.hostText.toLowerCase().includes(kw) ||
      v.remark.toLowerCase().includes(kw)
    )
  })
}

/** 任务计数 */
export interface JobCounts {
  /** 总数 */
  total: number
  /** 定时任务数 */
  cron: number
  /** 脚本任务数 */
  script: number
  /** 启用数 */
  enabled: number
  /** 停用数 */
  disabled: number
}

/**
 * 计数。
 *
 * @param views 展示行
 */
export function countJobs(views: readonly JobView[]): JobCounts {
  let cron = 0
  let enabled = 0
  for (const v of views) {
    if (v.typeCode === 'CRON') cron++
    if (v.enabled) enabled++
  }
  return {
    total: views.length,
    cron,
    script: views.length - cron,
    enabled,
    disabled: views.length - enabled,
  }
}

/** 24 小时轴上的一次触发 */
export interface TriggerTick {
  /** 任务 id */
  id: number
  /** 任务名 */
  name: string
  /** 24 小时轴上的位置百分比 */
  leftPercent: number
  /** 所在道 */
  lane: number
  /** 所在道的像素偏移（含条高留白） */
  top: number
  /** 类型中文 */
  typeLabel: string
  /** 下次运行文本 */
  nextRunText: string
}

/**
 * 把任务的下次触发时刻摊到一天 24 小时轴上。
 *
 * <p>用「下次运行时刻」而不是 cron 表达式本身去推算：cron 是规则，下一次触发才是
 * 事实，而用户在这一格里想看的正是「接下来这一昼夜谁先跑、谁撞在一起」。</p>
 *
 * <p>脚本任务（无下次运行）不参与 —— 它们只在手动执行时发生，画到轴上等于凭空
 * 造出一个触发时刻。这类任务的数量由页面另行说明。</p>
 *
 * @param views    展示行
 * @param laneStep 每道的高度（px）
 */
export function triggerTicks(views: readonly JobView[], laneStep = 13): TriggerTick[] {
  const usable = views
    .filter(v => v.nextPercent !== null)
    .slice()
    .sort((a, b) => (a.nextPercent ?? 0) - (b.nextPercent ?? 0) || a.id - b.id)

  /** 每道已占用的最右位置（百分比） */
  const laneEnds: number[] = []
  const out: TriggerTick[] = []
  /** 一根条在轴上的最小视觉宽度（百分比），用于分道时预留间隙 */
  const TICK_SPAN = 2.2

  for (const view of usable) {
    const left = view.nextPercent as number
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
      typeLabel: view.typeLabel,
      nextRunText: view.nextRunText,
    })
  }
  return out
}

/**
 * 一天 24 小时的触发数分布。
 *
 * @param views 展示行
 */
export function hourHistogram(views: readonly JobView[]): Array<{ hour: number; count: number }> {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
  for (const v of views) {
    if (v.nextHour === null) continue
    const hour = Math.min(Math.floor(v.nextHour), 23)
    buckets[hour]!.count++
  }
  return buckets
}

/** 一次手动执行的结果统计 */
export interface RunStats {
  /** 主机数 */
  total: number
  /** 成功数 */
  success: number
  /** 失败数 */
  failed: number
  /** 成功率百分比（0~100，无数据为 0） */
  successRate: number
  /** 平均耗时（毫秒，无数据为 0） */
  avgCostMs: number
  /** 最长耗时（毫秒，无数据为 0） */
  maxCostMs: number
}

/**
 * 手动执行结果统计。
 *
 * @param logs 日志行
 */
export function runStats(logs: readonly LogRow[] | null | undefined): RunStats {
  const list = logs ?? []
  const total = list.length
  let success = 0
  let costSum = 0
  let maxCostMs = 0
  for (const l of list) {
    if (String(l.msExecLogStatus ?? '').toUpperCase() === 'SUCCESS') success++
    const cost = Number(l.msExecLogCostMs ?? 0)
    if (Number.isFinite(cost) && cost > 0) {
      costSum += cost
      maxCostMs = Math.max(maxCostMs, cost)
    }
  }
  return {
    total,
    success,
    failed: total - success,
    successRate: total ? Math.round((success / total) * 100) : 0,
    avgCostMs: total ? Math.round(costSum / total) : 0,
    maxCostMs,
  }
}

/**
 * 日志状态中文
 *
 * @param status 后端状态
 */
export function logStatusText(status?: string | null): string {
  return String(status ?? '').toUpperCase() === 'SUCCESS' ? '成功' : '失败'
}

/**
 * 日志类型中文
 *
 * @param type 后端类型
 */
export function logTypeText(type?: string | null): string {
  const code = String(type ?? '')
  return LOG_TYPE_LABEL[code] ?? (code || '—')
}
