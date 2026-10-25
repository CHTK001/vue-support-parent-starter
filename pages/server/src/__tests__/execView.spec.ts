/**
 * 批量作业展示层单测。
 *
 * <p>这一层算的是「这次任务什么时候会触发」「命令长什么样」「执行结果几分成功」。
 * 其中最容易错的是时间轴位置：算偏一格，界面不会报错，只会让人以为凌晨三点
 * 没有任务，而实际上压着五个。</p>
 */
import { describe, expect, it } from 'vitest'
import {
  EMPTY_EXEC_FILTERS,
  countJobs,
  filterJobs,
  hourHistogram,
  jobTypeCode,
  logStatusText,
  logTypeText,
  parseHostIds,
  runStats,
  toJobView,
  toJobViews,
  triggerTicks,
  type JobRow,
  type LogRow,
} from '../views/exec/execView'

/**
 * 造一行后端任务
 *
 * @param patch 覆盖字段
 */
function row(patch: Partial<JobRow> = {}): JobRow {
  return {
    id: 1,
    msExecJobName: '每日清理临时文件',
    msExecJobType: 'CRON',
    msExecJobCron: '0 0 3 * * ?',
    msExecJobCommand: 'rm -rf /tmp/*',
    msExecJobHostIds: '[1,2]',
    msExecJobTimeout: 60,
    msExecJobEnabled: 1,
    msExecJobRemark: '凌晨跑',
    msExecJobLastRunTime: '2026-10-23T03:00:00',
    msExecJobNextRunTime: '2026-10-24T03:00:00',
    ...patch,
  }
}

/**
 * 造一行执行日志
 *
 * @param patch 覆盖字段
 */
function log(patch: Partial<LogRow> = {}): LogRow {
  return {
    id: 1,
    msExecLogType: 'COMMAND',
    msExecLogHostName: 'web-01',
    msExecLogStatus: 'SUCCESS',
    msExecLogCostMs: 120,
    ...patch,
  }
}

describe('parseHostIds', () => {
  it('正常数组', () => {
    expect(parseHostIds('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('空值给空数组', () => {
    expect(parseHostIds('')).toEqual([])
    expect(parseHostIds(null)).toEqual([])
  })

  it('坏 JSON 也给空数组（这一页只需展示，不该让整行渲染出乱码）', () => {
    expect(parseHostIds('{oops')).toEqual([])
    expect(parseHostIds('{"a":1}')).toEqual([])
  })

  it('丢掉非数字项', () => {
    expect(parseHostIds('[1,"x",3]')).toEqual([1, 3])
  })
})

describe('jobTypeCode', () => {
  it('NONE 是脚本，其余都是定时', () => {
    expect(jobTypeCode('NONE')).toBe('NONE')
    expect(jobTypeCode('none')).toBe('NONE')
    expect(jobTypeCode('CRON')).toBe('CRON')
  })

  it('空值按定时处理 —— 反过来会把一个会自己跑的任务说成「仅手动」', () => {
    expect(jobTypeCode('')).toBe('CRON')
    expect(jobTypeCode(null)).toBe('CRON')
    expect(jobTypeCode(undefined)).toBe('CRON')
  })
})

describe('toJobView', () => {
  it('下次运行时刻、日期键与 24 小时轴位置', () => {
    const view = toJobView(row(), {})
    expect(view.nextRunText).toBe('2026-10-24 03:00')
    expect(view.nextDayKey).toBe('2026-10-24')
    expect(view.nextHour).toBe(3)
    expect(view.nextPercent).toBeCloseTo((3 / 24) * 100, 5)
  })

  it('脚本任务没有 cron 也没有下次运行', () => {
    const view = toJobView(row({ msExecJobType: 'NONE', msExecJobCron: '', msExecJobNextRunTime: '' }), {})
    expect(view.typeLabel).toBe('脚本')
    expect(view.cron).toBe('')
    expect(view.cronText).toBe('—')
    expect(view.nextRunText).toBe('—')
    expect(view.nextHour).toBeNull()
    expect(view.nextPercent).toBeNull()
  })

  it('定时任务保留 cron 原文', () => {
    const view = toJobView(row({ msExecJobCron: '0 */5 * * * ?' }), {})
    expect(view.cron).toBe('0 */5 * * * ?')
    expect(view.cronText).toBe('0 */5 * * * ?')
  })

  it('cron 为空时展示破折号而不是空白', () => {
    expect(toJobView(row({ msExecJobCron: '' }), {}).cronText).toBe('—')
  })

  it('多行命令只取首行做副行', () => {
    const view = toJobView(row({ msExecJobCommand: 'cd /srv\nrm -rf tmp\n' }), {})
    expect(view.commandFirstLine).toBe('cd /srv')
    expect(view.command).toBe('cd /srv\nrm -rf tmp')
  })

  it('主机名取自台账，查不到用 #id', () => {
    const view = toJobView(row({ msExecJobHostIds: '[1,99]' }), { 1: 'web-01' })
    expect(view.hostNames).toEqual(['web-01', '#99'])
    expect(view.hostCount).toBe(2)
    expect(view.hostText).toBe('web-01, #99')
  })

  it('没有主机时说「未指定主机」', () => {
    expect(toJobView(row({ msExecJobHostIds: '' }), {}).hostText).toBe('未指定主机')
  })

  it('启用状态', () => {
    expect(toJobView(row({ msExecJobEnabled: 1 }), {}).enabledText).toBe('启用')
    expect(toJobView(row({ msExecJobEnabled: 0 }), {}).enabledText).toBe('停用')
    expect(toJobView(row({ msExecJobEnabled: 0 }), {}).enabled).toBe(false)
  })

  it('没有名称时给「未命名任务」', () => {
    expect(toJobView(row({ msExecJobName: '  ' }), {}).name).toBe('未命名任务')
  })

  it('null / undefined 集合给空数组', () => {
    expect(toJobViews(null, {})).toEqual([])
    expect(toJobViews(undefined, {})).toEqual([])
  })
})

describe('filterJobs', () => {
  const views = toJobViews(
    [
      row({ id: 1, msExecJobName: '清理临时文件', msExecJobType: 'CRON', msExecJobCommand: 'rm -rf /tmp/*', msExecJobHostIds: '[1]', msExecJobEnabled: 1 }),
      row({ id: 2, msExecJobName: '同步备份', msExecJobType: 'CRON', msExecJobCommand: 'rsync -a /data /backup', msExecJobHostIds: '[2]', msExecJobEnabled: 0 }),
      row({ id: 3, msExecJobName: '手动巡检', msExecJobType: 'NONE', msExecJobCommand: 'cat /proc/loadavg', msExecJobHostIds: '[1]', msExecJobEnabled: 1 }),
    ],
    { 1: 'web-01', 2: 'db-01' },
  )

  it('空条件不筛', () => {
    expect(filterJobs(views, { ...EMPTY_EXEC_FILTERS })).toHaveLength(3)
  })

  it('按类型', () => {
    expect(filterJobs(views, { ...EMPTY_EXEC_FILTERS, type: 'NONE' }).map(v => v.id)).toEqual([3])
  })

  it('按启用状态', () => {
    expect(filterJobs(views, { ...EMPTY_EXEC_FILTERS, enabled: 'on' }).map(v => v.id)).toEqual([1, 3])
    expect(filterJobs(views, { ...EMPTY_EXEC_FILTERS, enabled: 'off' }).map(v => v.id)).toEqual([2])
  })

  it('关键字命中命令 —— 用户找的常是「那个跑 rsync 的任务」', () => {
    expect(filterJobs(views, { ...EMPTY_EXEC_FILTERS, keyword: 'rsync' }).map(v => v.id)).toEqual([2])
  })

  it('关键字命中名称与主机名', () => {
    expect(filterJobs(views, { ...EMPTY_EXEC_FILTERS, keyword: '巡检' }).map(v => v.id)).toEqual([3])
    expect(filterJobs(views, { ...EMPTY_EXEC_FILTERS, keyword: 'db-01' }).map(v => v.id)).toEqual([2])
  })

  it('条件叠加是「与」', () => {
    expect(filterJobs(views, { keyword: '清理', type: 'CRON', enabled: 'on' }).map(v => v.id)).toEqual([1])
    expect(filterJobs(views, { keyword: '清理', type: 'NONE', enabled: 'on' })).toEqual([])
  })
})

describe('countJobs', () => {
  it('总数 / 定时 / 脚本 / 启用 / 停用', () => {
    const views = toJobViews(
      [
        row({ id: 1, msExecJobType: 'CRON', msExecJobEnabled: 1 }),
        row({ id: 2, msExecJobType: 'NONE', msExecJobEnabled: 0 }),
        row({ id: 3, msExecJobType: 'CRON', msExecJobEnabled: 1 }),
      ],
      {},
    )
    expect(countJobs(views)).toEqual({ total: 3, cron: 2, script: 1, enabled: 2, disabled: 1 })
  })

  it('空集合全为 0', () => {
    expect(countJobs([])).toEqual({ total: 0, cron: 0, script: 0, enabled: 0, disabled: 0 })
  })
})

describe('triggerTicks', () => {
  it('按小时定位，03:00 落在 12.5%', () => {
    const ticks = triggerTicks(toJobViews([row({ msExecJobNextRunTime: '2026-10-24T03:00:00' })], {}))
    expect(ticks).toHaveLength(1)
    expect(ticks[0]!.leftPercent).toBeCloseTo(12.5, 5)
    expect(ticks[0]!.top).toBe(4)
  })

  it('同一时刻的任务分道，不叠在一根条上', () => {
    const ticks = triggerTicks(
      toJobViews(
        [
          row({ id: 1, msExecJobNextRunTime: '2026-10-24T03:00:00' }),
          row({ id: 2, msExecJobNextRunTime: '2026-10-24T03:00:00' }),
        ],
        {},
      ),
    )
    expect(ticks.map(t => t.lane)).toEqual([0, 1])
    expect(ticks[0]!.top).not.toBe(ticks[1]!.top)
  })

  it('隔得够远的任务共用一道', () => {
    const ticks = triggerTicks(
      toJobViews(
        [
          row({ id: 1, msExecJobNextRunTime: '2026-10-24T03:00:00' }),
          row({ id: 2, msExecJobNextRunTime: '2026-10-24T15:00:00' }),
        ],
        {},
      ),
    )
    expect(ticks.map(t => t.lane)).toEqual([0, 0])
  })

  it('脚本任务不进时间轴 —— 它没有下次触发，画上去等于凭空造一个时刻', () => {
    const ticks = triggerTicks(
      toJobViews(
        [
          row({ id: 1, msExecJobType: 'NONE', msExecJobNextRunTime: '' }),
          row({ id: 2, msExecJobNextRunTime: '2026-10-24T03:00:00' }),
        ],
        {},
      ),
    )
    expect(ticks.map(t => t.id)).toEqual([2])
  })

  it('结果按时间先后排序，布局稳定可复现', () => {
    const ticks = triggerTicks(
      toJobViews(
        [
          row({ id: 1, msExecJobNextRunTime: '2026-10-24T20:00:00' }),
          row({ id: 2, msExecJobNextRunTime: '2026-10-24T05:00:00' }),
        ],
        {},
      ),
    )
    expect(ticks.map(t => t.id)).toEqual([2, 1])
  })

  it('带下次运行文本，供悬停查看', () => {
    const ticks = triggerTicks(toJobViews([row()], {}))
    expect(ticks[0]!.nextRunText).toBe('2026-10-24 03:00')
  })
})

describe('hourHistogram', () => {
  it('固定 24 个桶', () => {
    expect(hourHistogram([])).toHaveLength(24)
  })

  it('按小时归档', () => {
    const buckets = hourHistogram(
      toJobViews(
        [
          row({ id: 1, msExecJobNextRunTime: '2026-10-24T03:00:00' }),
          row({ id: 2, msExecJobNextRunTime: '2026-10-24T03:30:00' }),
          row({ id: 3, msExecJobNextRunTime: '2026-10-24T15:00:00' }),
        ],
        {},
      ),
    )
    expect(buckets[3]!.count).toBe(2)
    expect(buckets[15]!.count).toBe(1)
    expect(buckets.reduce((n, b) => n + b.count, 0)).toBe(3)
  })

  it('脚本任务不占桶', () => {
    const buckets = hourHistogram(toJobViews([row({ msExecJobType: 'NONE', msExecJobNextRunTime: '' })], {}))
    expect(buckets.reduce((n, b) => n + b.count, 0)).toBe(0)
  })

  it('空集合的坐标轴仍然完整（24 个标签都在）', () => {
    expect(hourHistogram([]).map(b => b.hour)).toEqual(Array.from({ length: 24 }, (_, i) => i))
  })
})

describe('runStats', () => {
  it('成功 / 失败 / 成功率', () => {
    const stats = runStats([log({ id: 1 }), log({ id: 2 }), log({ id: 3, msExecLogStatus: 'FAILED' })])
    expect(stats.total).toBe(3)
    expect(stats.success).toBe(2)
    expect(stats.failed).toBe(1)
    expect(stats.successRate).toBe(67)
  })

  it('平均与最长耗时', () => {
    const stats = runStats([log({ id: 1, msExecLogCostMs: 100 }), log({ id: 2, msExecLogCostMs: 300 })])
    expect(stats.avgCostMs).toBe(200)
    expect(stats.maxCostMs).toBe(300)
  })

  it('空结果全为 0（不让页面除以 NaN）', () => {
    expect(runStats([])).toEqual({ total: 0, success: 0, failed: 0, successRate: 0, avgCostMs: 0, maxCostMs: 0 })
    expect(runStats(null)).toEqual({ total: 0, success: 0, failed: 0, successRate: 0, avgCostMs: 0, maxCostMs: 0 })
  })
})

describe('logStatusText / logTypeText', () => {
  it('状态中文', () => {
    expect(logStatusText('SUCCESS')).toBe('成功')
    expect(logStatusText('FAILED')).toBe('失败')
    expect(logStatusText('')).toBe('失败')
  })

  it('类型中文，未知类型给原值', () => {
    expect(logTypeText('COMMAND')).toBe('命令')
    expect(logTypeText('FILE')).toBe('文件')
    expect(logTypeText('JOB')).toBe('计划任务')
    expect(logTypeText('SSH')).toBe('SSH')
    expect(logTypeText('')).toBe('—')
  })
})
