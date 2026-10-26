/**
 * 告警中心展示层口径的单测。
 *
 * <p>钉的是「页面看到的一切都由这几个纯函数决定」这件事：级别兜底、时间解析、
 * 阈值比例、筛选与排序、分桶。这些一旦跑偏，页面不会报错，
 * 只会让人看到一张顺序莫名其妙的列表 —— 而这种错最难被发现。</p>
 */
import { describe, expect, it } from 'vitest'
import type { AlarmEvent } from '../../../api/monitorApi'
import {
  ALARM_LEVELS,
  EMPTY_ALARM_FILTERS,
  LEVEL_META,
  THRESHOLD_AT,
  countByLevel,
  filterAlarms,
  levelDistribution,
  metricLabel,
  parseAlarmTime,
  statusOf,
  summarize,
  toAlarmViews,
  trendBuckets,
  type AlarmFilters,
} from '../alarmView'

/**
 * 造一条后端事件
 *
 * @param over 覆盖字段
 */
function event(over: Partial<AlarmEvent> = {}): AlarmEvent {
  return {
    id: 1,
    msMonitorAlarmEventMonitorId: 7,
    msMonitorAlarmEventMonitorName: 'web-01',
    msMonitorAlarmEventMetricName: 'cpu_usage',
    msMonitorAlarmEventAlarmValue: 96,
    msMonitorAlarmEventThreshold: 90,
    msMonitorAlarmEventLevel: 'P1',
    msMonitorAlarmEventStatus: 'NEW',
    msMonitorAlarmEventTriggerTime: '2026-10-26 15:22:41',
    ...over,
  }
}

/**
 * 造筛选条件
 *
 * @param over 覆盖字段
 */
function filters(over: Partial<AlarmFilters> = {}): AlarmFilters {
  return { ...EMPTY_ALARM_FILTERS, ...over }
}

describe('parseAlarmTime', () => {
  it('解析带空格的时间串', () => {
    const d = parseAlarmTime('2026-10-26 15:22:41')
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(9)
    expect(d?.getDate()).toBe(26)
    expect(d?.getHours()).toBe(15)
    expect(d?.getMinutes()).toBe(22)
  })

  it('接受 T 分隔与缺秒', () => {
    expect(parseAlarmTime('2026-10-26T15:22')?.getMinutes()).toBe(22)
  })

  it('拒绝不存在的日期而不是顺延', () => {
    expect(parseAlarmTime('2026-02-31 00:00:00')).toBeNull()
    expect(parseAlarmTime('2026-13-01 00:00:00')).toBeNull()
  })

  it('空值与乱码给 null', () => {
    expect(parseAlarmTime('')).toBeNull()
    expect(parseAlarmTime('刚刚')).toBeNull()
    expect(parseAlarmTime(null)).toBeNull()
  })
})

describe('toAlarmViews', () => {
  it('级别非法兜底 P3，状态归一', () => {
    const [view] = toAlarmViews([
      event({ msMonitorAlarmEventLevel: 'P9', msMonitorAlarmEventStatus: 'FALSE_ALARM' }),
    ])
    expect(view!.level).toBe('P3')
    expect(view!.levelText).toBe('低')
    expect(view!.status).toBe('false')
    expect(view!.statusText).toBe('误报')
  })

  it('阈值按 70% 刻度换算', () => {
    const [view] = toAlarmViews([
      event({ msMonitorAlarmEventAlarmValue: 90, msMonitorAlarmEventThreshold: 90 }),
    ])
    expect(view!.gaugePercent).toBe(THRESHOLD_AT)
    expect(view!.over).toBe(true)
  })

  it('超阈值一倍以上封顶 100%', () => {
    const [view] = toAlarmViews([
      event({ msMonitorAlarmEventAlarmValue: 500, msMonitorAlarmEventThreshold: 90 }),
    ])
    expect(view!.gaugePercent).toBe(100)
  })

  it('阈值缺失时不做除法', () => {
    const [view] = toAlarmViews([event({ msMonitorAlarmEventThreshold: 0 })])
    expect(view!.ratio).toBe(0)
    expect(view!.gaugePercent).toBe(0)
    expect(view!.over).toBe(false)
  })

  it('主机名为空时归到「未命名目标」，不丢事件', () => {
    const [view] = toAlarmViews([event({ msMonitorAlarmEventMonitorName: '  ' })])
    expect(view!.host).toBe('未命名目标')
    expect(view!.hostKey).toBe('未命名目标')
  })

  it('时间坏掉时仍然出行，只是没有时刻', () => {
    const [view] = toAlarmViews([event({ msMonitorAlarmEventTriggerTime: '' })])
    expect(view!.at).toBe(0)
    expect(view!.minute).toBe(-1)
    expect(view!.timeText).toBe('—')
    expect(view!.atFullText).toBe('—')
  })

  it('当天只写时分，跨天补上日期', () => {
    const now = new Date(2026, 9, 26, 20, 0)
    const [sameDay, otherDay] = toAlarmViews(
      [
        event({ id: 1, msMonitorAlarmEventTriggerTime: '2026-10-26 15:22:41' }),
        event({ id: 2, msMonitorAlarmEventTriggerTime: '2026-10-25 22:11:00' }),
      ],
      now,
    )
    expect(sameDay!.timeText).toBe('15:22')
    expect(otherDay!.timeText).toBe('10-25 22:11')
  })
})

describe('metricLabel', () => {
  it('已知指标给中文名', () => {
    expect(metricLabel('cpu_usage')).toBe('CPU 使用率')
  })

  it('未知指标原样返回，不猜', () => {
    expect(metricLabel('weird_metric')).toBe('weird_metric')
  })
})

describe('statusOf', () => {
  it('认三种状态', () => {
    expect(statusOf('new')).toBe('new')
    expect(statusOf('PROCESSED')).toBe('processed')
    expect(statusOf('FALSE')).toBe('false')
    expect(statusOf('FALSE_ALARM')).toBe('false')
  })

  it('其它一律 other', () => {
    expect(statusOf('')).toBe('other')
    expect(statusOf('IGNORED')).toBe('other')
  })
})

describe('filterAlarms', () => {
  const rows = toAlarmViews([
    event({ id: 1, msMonitorAlarmEventMonitorName: 'web-01', msMonitorAlarmEventLevel: 'P0' }),
    event({
      id: 2,
      msMonitorAlarmEventMonitorName: 'db-01',
      msMonitorAlarmEventLevel: 'P3',
      msMonitorAlarmEventStatus: 'PROCESSED',
      msMonitorAlarmEventTriggerTime: '2026-10-26 09:05:00',
    }),
    event({
      id: 3,
      msMonitorAlarmEventMonitorName: 'web-01',
      msMonitorAlarmEventLevel: 'P2',
      msMonitorAlarmEventTriggerTime: '2026-10-26 18:00:00',
    }),
  ])

  it('未处理在前，其次按级别，再按时间倒序', () => {
    expect(filterAlarms(rows, filters()).map(v => v.id)).toEqual([1, 3, 2])
  })

  it('按状态档筛', () => {
    expect(filterAlarms(rows, filters({ status: 'processed' })).map(v => v.id)).toEqual([2])
  })

  it('按级别筛', () => {
    expect(filterAlarms(rows, filters({ level: 'P2' })).map(v => v.id)).toEqual([3])
  })

  it('关键字同时搜主机与指标中文名', () => {
    expect(filterAlarms(rows, filters({ keyword: 'db' })).map(v => v.id)).toEqual([2])
    expect(filterAlarms(rows, filters({ keyword: 'CPU' }))).toHaveLength(3)
  })

  it('按小时筛，空串不筛', () => {
    expect(filterAlarms(rows, filters({ hour: '9' })).map(v => v.id)).toEqual([2])
    expect(filterAlarms(rows, filters({ hour: '18' })).map(v => v.id)).toEqual([3])
    expect(filterAlarms(rows, filters({ hour: '' }))).toHaveLength(3)
  })

  it('时间坏掉的行不进任何小时', () => {
    const broken = toAlarmViews([event({ id: 9, msMonitorAlarmEventTriggerTime: '' })])
    expect(filterAlarms(broken, filters({ hour: '15' }))).toHaveLength(0)
  })
})

describe('汇总', () => {
  const rows = toAlarmViews([
    event({ id: 1, msMonitorAlarmEventLevel: 'P0' }),
    event({ id: 2, msMonitorAlarmEventLevel: 'P2', msMonitorAlarmEventStatus: 'PROCESSED' }),
    event({
      id: 3,
      msMonitorAlarmEventLevel: 'P2',
      msMonitorAlarmEventStatus: 'FALSE_ALARM',
      msMonitorAlarmEventMonitorName: 'db-01',
    }),
  ])

  it('状态与级别计数', () => {
    const s = summarize(rows)
    expect(s.total).toBe(3)
    expect(s.unhandled).toBe(1)
    expect(s.processed).toBe(1)
    expect(s.falseAlarm).toBe(1)
    expect(s.hosts).toBe(2)
    expect(s.worstLevel).toBe('P0')
    expect(countByLevel(rows).P2).toBe(2)
  })

  it('级别分布按总数算百分比', () => {
    const dist = levelDistribution(rows)
    expect(dist.map(d => d.level)).toEqual([...ALARM_LEVELS])
    expect(dist[0]!.percent).toBe(33)
    expect(dist[1]!.sla).toBe(LEVEL_META.P1.sla)
  })

  it('没有数据时不给除零', () => {
    const s = summarize([])
    expect(s.total).toBe(0)
    expect(s.worstLevel).toBe('')
    expect(levelDistribution([]).every(d => d.percent === 0)).toBe(true)
  })
})

describe('trendBuckets', () => {
  it('按小时对齐到 24 格，缺的补 0', () => {
    const buckets = trendBuckets([
      { time: '2026-10-26 09:00:00', count: 4 },
      { time: '2026-10-26 09:00:00', count: 2 },
      { time: '2026-10-26 15:00:00', count: 3 },
    ])
    expect(buckets).toHaveLength(24)
    expect(buckets[9]!.count).toBe(6)
    expect(buckets[15]!.count).toBe(3)
    expect(buckets[9]!.percent).toBe(100)
    expect(buckets[0]!.count).toBe(0)
  })

  it('认只有小时的时间串', () => {
    const buckets = trendBuckets([{ time: '07', count: 1 }])
    expect(buckets[7]!.count).toBe(1)
  })

  it('全空时不给除零', () => {
    expect(trendBuckets([]).every(b => b.percent === 0)).toBe(true)
  })
})
