import { describe, expect, it } from 'vitest'
import {
  EMPTY_SESSION_FILTERS,
  assignLanes,
  bandGeometry,
  bucketByProtocol,
  countByStatus,
  filterSessions,
  formatDuration,
  formatTime,
  hourOfDay,
  medianDuration,
  parseTime,
  protocolTone,
  statusText,
  toSessionView,
  toSessionViews,
  type SessionFilters,
  type SessionRow,
} from '../views/session/sessionView'

/**
 * 会话审计展示层单测。
 *
 * 这一层是五个画布的共同事实来源：同一批会话在「工单台」和「卡片墙」里
 * 必须显示同一个时长、同一个状态文案、同一套空值兜底。任何一处口径走偏，
 * 用户切一次画布就会看到同一件事的两种说法。
 */

/** 造一行会话，只覆盖用例关心的字段 */
function row(patch: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 1,
    msTerminalSessionProtocol: 'SSH',
    msTerminalSessionStatus: 'CLOSED',
    msTerminalSessionHostName: 'prod-web-01',
    msTerminalSessionUser: 'root',
    msTerminalSessionClientIp: '10.20.4.31',
    msTerminalSessionConnectTime: '2026-10-24 09:12:04',
    msTerminalSessionCloseTime: '2026-10-24 11:48:22',
    ...patch,
  }
}

/** 固定「当前时刻」，让进行中会话的时长可断言 */
const NOW = new Date(2026, 9, 24, 12, 0, 0)

/** 造筛选条件 */
function filters(patch: Partial<SessionFilters> = {}): SessionFilters {
  return { ...EMPTY_SESSION_FILTERS, ...patch }
}

describe('parseTime', () => {
  it('吃 ISO 形态（带 T）', () => {
    expect(parseTime('2026-10-24T09:12:04')?.getHours()).toBe(9)
  })

  it('吃空格形态（Safari 上需先把 - 换成 /）', () => {
    expect(parseTime('2026-10-24 09:12:04')?.getHours()).toBe(9)
  })

  it('只给日期也能解析', () => {
    const d = parseTime('2026-10-24')
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(9)
  })

  it('空值 / 空串 / 非法串返回 null，不返回 Invalid Date', () => {
    expect(parseTime(null)).toBeNull()
    expect(parseTime(undefined)).toBeNull()
    expect(parseTime('')).toBeNull()
    expect(parseTime('   ')).toBeNull()
    expect(parseTime('not-a-date')).toBeNull()
  })
})

describe('formatTime', () => {
  it('已是 yyyy-MM-dd HH:mm:ss 形态时原样返回（不重排时区）', () => {
    expect(formatTime('2026-10-24 09:12:04')).toBe('2026-10-24 09:12:04')
  })

  it('带毫秒/时区的形态被裁到秒', () => {
    expect(formatTime('2026-10-24 09:12:04.123')).toBe('2026-10-24 09:12:04')
  })

  it('ISO 形态转成同形态', () => {
    expect(formatTime('2026-10-24T09:12:04')).toBe('2026-10-24 09:12:04')
  })

  it('空值显示破折号', () => {
    expect(formatTime(undefined)).toBe('—')
    expect(formatTime('')).toBe('—')
  })

  it('无法解析时回吐原串，不吞掉后端给的信息', () => {
    expect(formatTime('昨天下午')).toBe('昨天下午')
  })
})

describe('formatDuration', () => {
  it('不足一分钟给秒', () => {
    expect(formatDuration(42_000)).toBe('42s')
  })

  it('不足一小时给分钟', () => {
    expect(formatDuration(27 * 60_000)).toBe('27m')
  })

  it('小时 + 分钟', () => {
    expect(formatDuration(2 * 3_600_000 + 36 * 60_000)).toBe('2h36m')
  })

  it('整小时不拖 0m', () => {
    expect(formatDuration(3 * 3_600_000)).toBe('3h')
  })

  it('超过一天用 d + h', () => {
    expect(formatDuration(27 * 3_600_000)).toBe('1d3h')
    expect(formatDuration(48 * 3_600_000)).toBe('2d')
  })

  it('0 给 0s（不是破折号：真的持续了 0 秒）', () => {
    expect(formatDuration(0)).toBe('0s')
  })

  it('负数 / 非法 / 空值给破折号', () => {
    expect(formatDuration(-1)).toBe('—')
    expect(formatDuration(Number.NaN)).toBe('—')
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(undefined)).toBe('—')
  })
})

describe('hourOfDay', () => {
  it('给出含小数的当天位置', () => {
    expect(hourOfDay(new Date(2026, 9, 24, 9, 30, 0))).toBeCloseTo(9.5, 5)
    expect(hourOfDay(new Date(2026, 9, 24, 0, 0, 0))).toBe(0)
  })

  it('null 进 null 出', () => {
    expect(hourOfDay(null)).toBeNull()
  })
})

describe('protocolTone / statusText', () => {
  it('三种已知协议各有色档，大小写不敏感', () => {
    expect(protocolTone('ssh')).toBe('ssh')
    expect(protocolTone('RDP')).toBe('rdp')
    expect(protocolTone(' Vnc ')).toBe('vnc')
  })

  it('未知协议归 other，不冒充已知协议的配色', () => {
    expect(protocolTone('telnet')).toBe('other')
    expect(protocolTone(undefined)).toBe('other')
    expect(protocolTone('')).toBe('other')
  })

  it('状态中文', () => {
    expect(statusText('OPEN')).toBe('进行中')
    expect(statusText('CLOSED')).toBe('已结束')
    expect(statusText('WEIRD')).toBe('WEIRD')
    expect(statusText(undefined)).toBe('—')
  })
})

describe('toSessionView', () => {
  it('已结束会话的时长按起止算', () => {
    const v = toSessionView(row(), {}, NOW)
    // 11:48:22 - 09:12:04 = 2h36m18s
    expect(v.durationText).toBe('2h36m')
    expect(v.isOpen).toBe(false)
    expect(v.closeText).toBe('2026-10-24 11:48:22')
  })

  it('进行中会话的时长算到 now，关闭时间显示破折号', () => {
    const v = toSessionView(
      row({ msTerminalSessionStatus: 'OPEN', msTerminalSessionCloseTime: undefined }),
      {},
      NOW,
    )
    // 12:00:00 - 09:12:04 = 2h47m56s
    expect(v.durationText).toBe('2h47m')
    expect(v.isOpen).toBe(true)
    expect(v.closeText).toBe('—')
  })

  it('主机名兜底顺序：后端字段 > 台账名 > 破折号', () => {
    expect(toSessionView(row({ msTerminalSessionHostName: 'a' }), { 1: 'b' }, NOW).host).toBe('a')
    expect(
      toSessionView(row({ msTerminalSessionHostName: '', msTerminalSessionHostId: 7 }), { 7: 'ledger' }, NOW).host,
    ).toBe('ledger')
    expect(toSessionView(row({ msTerminalSessionHostName: '' }), {}, NOW).host).toBe('—')
  })

  it('缺失的用户 / IP 兜成破折号，不显示 undefined', () => {
    const v = toSessionView(row({ msTerminalSessionUser: '', msTerminalSessionClientIp: undefined }), {}, NOW)
    expect(v.user).toBe('—')
    expect(v.ip).toBe('—')
  })

  it('连接时间无法解析时，时长与时间带位置都是空，而不是 0', () => {
    const v = toSessionView(row({ msTerminalSessionConnectTime: 'bad' }), {}, NOW)
    expect(v.durationMs).toBeNull()
    expect(v.durationText).toBe('—')
    expect(v.startHour).toBeNull()
    expect(v.endHour).toBeNull()
  })

  it('关闭时间早于连接时间（后端时钟回拨）时不给出负时长', () => {
    const v = toSessionView(
      row({ msTerminalSessionConnectTime: '2026-10-24 11:00:00', msTerminalSessionCloseTime: '2026-10-24 09:00:00' }),
      {},
      NOW,
    )
    expect(v.durationMs).toBeNull()
    expect(v.durationText).toBe('—')
  })

  it('协议原值转大写，缺失给破折号', () => {
    expect(toSessionView(row({ msTerminalSessionProtocol: 'rdp' }), {}, NOW).protocol).toBe('RDP')
    expect(toSessionView(row({ msTerminalSessionProtocol: '' }), {}, NOW).protocol).toBe('—')
  })

  it('关闭原因原样带出，缺失给空串（空串才好判真假）', () => {
    expect(toSessionView(row({ msTerminalSessionCloseReason: '超时' }), {}, NOW).closeReason).toBe('超时')
    expect(toSessionView(row(), {}, NOW).closeReason).toBe('')
  })
})

describe('toSessionViews', () => {
  it('空集合与 null 都返回空数组', () => {
    expect(toSessionViews(null, {}, NOW)).toEqual([])
    expect(toSessionViews(undefined, {}, NOW)).toEqual([])
    expect(toSessionViews([], {}, NOW)).toEqual([])
  })

  it('保持后端顺序（后端已按时间倒序，前端不再擅自重排）', () => {
    const views = toSessionViews([row({ id: 3 }), row({ id: 1 }), row({ id: 2 })], {}, NOW)
    expect(views.map(v => v.id)).toEqual([3, 1, 2])
  })
})

describe('countByStatus', () => {
  it('统计全量的三种数', () => {
    const rows = [
      row({ id: 1, msTerminalSessionStatus: 'OPEN' }),
      row({ id: 2, msTerminalSessionStatus: 'CLOSED' }),
      row({ id: 3, msTerminalSessionStatus: 'OPEN' }),
    ]
    expect(countByStatus(rows)).toEqual({ total: 3, open: 2, closed: 1 })
  })

  it('空集合给出全零，不是 undefined', () => {
    expect(countByStatus([])).toEqual({ total: 0, open: 0, closed: 0 })
    expect(countByStatus(null)).toEqual({ total: 0, open: 0, closed: 0 })
  })

  it('未知状态计入 total 但不计入 open/closed，且三者相加等于 total', () => {
    const rows = [row({ id: 1, msTerminalSessionStatus: 'OPEN' }), row({ id: 2, msTerminalSessionStatus: 'WEIRD' })]
    const s = countByStatus(rows)
    expect(s.total).toBe(2)
    expect(s.open + s.closed).toBe(1)
  })
})

describe('filterSessions', () => {
  const rows = [
    row({ id: 1, msTerminalSessionHostName: 'prod-web-01', msTerminalSessionProtocol: 'SSH', msTerminalSessionClientIp: '10.20.4.31', msTerminalSessionStatus: 'OPEN' }),
    row({ id: 2, msTerminalSessionHostName: 'db-master', msTerminalSessionProtocol: 'SSH', msTerminalSessionClientIp: '10.20.4.12', msTerminalSessionStatus: 'CLOSED' }),
    row({ id: 3, msTerminalSessionHostName: 'win-ad-02', msTerminalSessionProtocol: 'RDP', msTerminalSessionClientIp: '10.20.9.77', msTerminalSessionStatus: 'CLOSED' }),
  ]

  it('空条件全部命中', () => {
    expect(filterSessions(rows, filters(), {})).toHaveLength(3)
  })

  it('按状态筛', () => {
    expect(filterSessions(rows, filters({ status: 'OPEN' }), {}).map(r => r.id)).toEqual([1])
  })

  it('协议筛选大小写不敏感', () => {
    expect(filterSessions(rows, filters({ protocol: 'rdp' }), {}).map(r => r.id)).toEqual([3])
  })

  it('IP 是子串匹配', () => {
    expect(filterSessions(rows, filters({ ip: '10.20.4' }), {}).map(r => r.id)).toEqual([1, 2])
  })

  it('关键字命中主机名 / 用户 / IP', () => {
    expect(filterSessions(rows, filters({ keyword: 'db-' }), {}).map(r => r.id)).toEqual([2])
    expect(filterSessions(rows, filters({ keyword: 'ROOT' }), {}).map(r => r.id)).toEqual([1, 2, 3])
    expect(filterSessions(rows, filters({ keyword: '9.77' }), {}).map(r => r.id)).toEqual([3])
  })

  it('关键字也命中主机台账名（后端没填主机名时用户仍能搜到）', () => {
    const withEmptyHost = [row({ id: 9, msTerminalSessionHostId: 42, msTerminalSessionHostName: '' })]
    expect(filterSessions(withEmptyHost, filters({ keyword: '台账机' }), { 42: '台账机-01' })).toHaveLength(1)
  })

  it('多个条件同时生效（与关系）', () => {
    expect(filterSessions(rows, filters({ protocol: 'SSH', status: 'CLOSED' }), {}).map(r => r.id)).toEqual([2])
  })

  it('关键字前后空白被忽略', () => {
    expect(filterSessions(rows, filters({ keyword: '  db-master  ' }), {}).map(r => r.id)).toEqual([2])
  })

  it('null / undefined 行集合返回空数组', () => {
    expect(filterSessions(null, filters(), {})).toEqual([])
    expect(filterSessions(undefined, filters(), {})).toEqual([])
  })

  it('时段桶按开始时刻筛选，与图表归桶口径一致', () => {
    const hourly = [
      row({ id: 1, msTerminalSessionConnectTime: '2026-10-24 07:59:00' }),
      row({ id: 2, msTerminalSessionConnectTime: '2026-10-24 08:00:00' }),
      row({ id: 3, msTerminalSessionConnectTime: '2026-10-24 11:59:00' }),
      row({ id: 4, msTerminalSessionConnectTime: '2026-10-24 12:00:00' }),
    ]
    expect(filterSessions(hourly, filters({ hourBucket: 8 }), {}).map(r => r.id)).toEqual([2, 3])
    // 07:59 属于 04-08 桶，不属于 00-04
    expect(filterSessions(hourly, filters({ hourBucket: 4 }), {}).map(r => r.id)).toEqual([1])
    expect(filterSessions(hourly, filters({ hourBucket: 0 }), {})).toEqual([])
    expect(filterSessions(hourly, filters({ hourBucket: 12 }), {}).map(r => r.id)).toEqual([4])
  })

  it('hourBucket 为 null 时不限时段（默认全通过）', () => {
    expect(filterSessions(rows, filters({ hourBucket: null }), {})).toHaveLength(3)
  })

  it('时段筛选下，连接时间不可解析的行被排除（无法判断属于哪个桶）', () => {
    const mixed = [row({ id: 1, msTerminalSessionConnectTime: 'bad' }), row({ id: 2 })]
    expect(filterSessions(mixed, filters({ hourBucket: 8 }), {}).map(r => r.id)).toEqual([2])
  })

  it('时段与状态可叠加', () => {
    const mix = [
      row({ id: 1, msTerminalSessionStatus: 'OPEN', msTerminalSessionConnectTime: '2026-10-24 09:00:00' }),
      row({ id: 2, msTerminalSessionStatus: 'CLOSED', msTerminalSessionConnectTime: '2026-10-24 09:00:00' }),
    ]
    expect(filterSessions(mix, filters({ hourBucket: 8, status: 'OPEN' }), {}).map(r => r.id)).toEqual([1])
  })
})

describe('bucketByProtocol', () => {
  it('按开始时刻归桶，桶标签带补零', () => {
    const views = toSessionViews(
      [
        row({ id: 1, msTerminalSessionConnectTime: '2026-10-24 01:10:00', msTerminalSessionProtocol: 'SSH' }),
        row({ id: 2, msTerminalSessionConnectTime: '2026-10-24 05:10:00', msTerminalSessionProtocol: 'RDP' }),
      ],
      {},
      NOW,
    )
    const buckets = bucketByProtocol(views, 4)
    expect(buckets).toHaveLength(6)
    expect(buckets[0]!.label).toBe('00-04')
    expect(buckets[0]!.counts.ssh).toBe(1)
    expect(buckets[1]!.counts.rdp).toBe(1)
  })

  it('各桶 total 相加等于可定位会话数 —— 长会话不会被重复计入多个桶', () => {
    const views = toSessionViews(
      [
        // 跨桶：09:00 开始，横跨到 15:00
        row({ id: 1, msTerminalSessionConnectTime: '2026-10-24 09:00:00', msTerminalSessionCloseTime: '2026-10-24 15:00:00' }),
        row({ id: 2, msTerminalSessionConnectTime: '2026-10-24 10:00:00', msTerminalSessionCloseTime: '2026-10-24 10:30:00' }),
      ],
      {},
      NOW,
    )
    const sum = bucketByProtocol(views, 4).reduce((n, b) => n + b.total, 0)
    expect(sum).toBe(2)
  })

  it('开始时间不可知的会话不参与分桶，也不产生空桶噪声', () => {
    const views = toSessionViews(
      [row({ id: 1, msTerminalSessionConnectTime: 'bad' }), row({ id: 2 })],
      {},
      NOW,
    )
    const sum = bucketByProtocol(views, 4).reduce((n, b) => n + b.total, 0)
    expect(sum).toBe(1)
  })

  it('23 点的会话落进最后一个桶（不被挤出数组）', () => {
    const views = toSessionViews([row({ id: 1, msTerminalSessionConnectTime: '2026-10-24 23:59:00' })], {}, NOW)
    const buckets = bucketByProtocol(views, 4)
    expect(buckets[buckets.length - 1]!.total).toBe(1)
    expect(buckets[buckets.length - 1]!.label).toBe('20-24')
  })

  it('未知协议计入 total 与 other，仍满足相加关系', () => {
    const views = toSessionViews([row({ id: 1, msTerminalSessionProtocol: 'TELNET' })], {}, NOW)
    const b = bucketByProtocol(views, 4)[2]!
    expect(b.total).toBe(1)
    expect(b.counts.other).toBe(1)
  })

  it('桶宽度非法时回落到 4 小时，不产生空数组', () => {
    expect(bucketByProtocol([], 0)).toHaveLength(6)
    expect(bucketByProtocol([], -3)).toHaveLength(6)
  })

  it('空集合给出全零桶（画布仍能画出坐标轴，而不是空白）', () => {
    const buckets = bucketByProtocol([], 4)
    expect(buckets.every(b => b.total === 0)).toBe(true)
  })
})

describe('medianDuration', () => {
  it('奇数个取中间', () => {
    const views = toSessionViews(
      [
        row({ id: 1, msTerminalSessionConnectTime: '2026-10-24 09:00:00', msTerminalSessionCloseTime: '2026-10-24 09:10:00' }),
        row({ id: 2, msTerminalSessionConnectTime: '2026-10-24 09:00:00', msTerminalSessionCloseTime: '2026-10-24 09:30:00' }),
        row({ id: 3, msTerminalSessionConnectTime: '2026-10-24 09:00:00', msTerminalSessionCloseTime: '2026-10-24 10:00:00' }),
      ],
      {},
      NOW,
    )
    expect(medianDuration(views)).toBe(30 * 60_000)
  })

  it('偶数个取中间两个的均值', () => {
    const views = toSessionViews(
      [
        row({ id: 1, msTerminalSessionConnectTime: '2026-10-24 09:00:00', msTerminalSessionCloseTime: '2026-10-24 09:10:00' }),
        row({ id: 2, msTerminalSessionConnectTime: '2026-10-24 09:00:00', msTerminalSessionCloseTime: '2026-10-24 09:30:00' }),
      ],
      {},
      NOW,
    )
    expect(medianDuration(views)).toBe(20 * 60_000)
  })

  it('不受极端长会话拖动（与均值的关键差异）', () => {
    const views = toSessionViews(
      [
        row({ id: 1, msTerminalSessionConnectTime: '2026-10-24 09:00:00', msTerminalSessionCloseTime: '2026-10-24 09:10:00' }),
        row({ id: 2, msTerminalSessionConnectTime: '2026-10-24 09:00:00', msTerminalSessionCloseTime: '2026-10-24 09:12:00' }),
        row({ id: 3, msTerminalSessionConnectTime: '2026-10-20 09:00:00', msTerminalSessionCloseTime: '2026-10-24 09:00:00' }),
      ],
      {},
      NOW,
    )
    // 三个时长排序后是 10m / 12m / 4d，中位数取中间的 12m；
    // 若用均值会被那条 4 天的会话拉到 32 小时以上，完全失去参考价值。
    expect(medianDuration(views)).toBe(12 * 60_000)
  })

  it('没有可算时长时返回 null，而不是 0', () => {
    expect(medianDuration([])).toBeNull()
    expect(medianDuration(toSessionViews([row({ id: 1, msTerminalSessionConnectTime: 'bad' })], {}, NOW))).toBeNull()
  })
})

describe('assignLanes', () => {
  it('同协议依次下沉，不同协议各自从顶道开始', () => {
    const views = toSessionViews(
      [
        row({ id: 1, msTerminalSessionProtocol: 'SSH' }),
        row({ id: 2, msTerminalSessionProtocol: 'SSH' }),
        row({ id: 3, msTerminalSessionProtocol: 'RDP' }),
      ],
      {},
      NOW,
    )
    const lanes = assignLanes(views, 13)
    expect(lanes.map(l => l.top)).toEqual([0, 13, 0])
  })

  it('没有可用起止时间的会话被排除（不画到轴上）', () => {
    const views = toSessionViews(
      [row({ id: 1 }), row({ id: 2, msTerminalSessionConnectTime: 'bad' })],
      {},
      NOW,
    )
    expect(assignLanes(views)).toHaveLength(1)
  })
})

describe('bandGeometry', () => {
  it('整日轴上按比例定位', () => {
    const g = bandGeometry({ ...toSessionView(row(), {}, NOW), startHour: 6, endHour: 12 } )
    expect(g?.leftPercent).toBeCloseTo(25, 5)
    expect(g?.widthPercent).toBeCloseTo(25, 5)
  })

  it('超出轴范围的部分被裁掉', () => {
    const g = bandGeometry({ ...toSessionView(row(), {}, NOW), startHour: -2, endHour: 3 } )
    expect(g?.leftPercent).toBe(0)
    expect(g?.widthPercent).toBeCloseTo((3 / 24) * 100, 5)
  })

  it('极短会话给最小可见宽度，否则在整日轴上会消失', () => {
    const g = bandGeometry({ ...toSessionView(row(), {}, NOW), startHour: 10, endHour: 10.0001 } )
    expect(g?.widthPercent).toBe(0.35)
  })

  it('起止缺失或轴长为 0 时返回 null', () => {
    expect(bandGeometry({ ...toSessionView(row(), {}, NOW), startHour: null } )).toBeNull()
    expect(bandGeometry({ ...toSessionView(row(), {}, NOW), startHour: 6, endHour: 12 } , 5, 5)).toBeNull()
  })
})
