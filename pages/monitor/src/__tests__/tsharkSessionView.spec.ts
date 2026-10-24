/**
 * 抓包 / 导入会话展示层单测。
 *
 * <p>这一层算的是「这次抓包落在哪一天、一昼夜的什么位置、持续多久」。两页共用同一份，
 * 所以一旦算错，抓包分析和 PCAP 分析会同时说错话 —— 而且是不报错的那种错：
 * 会话被画到隔壁那天、或者时长少算一个时区。</p>
 */
import { describe, expect, it } from 'vitest'
import {
  EMPTY_SESSION_FILTERS,
  countSessions,
  dayKeyOf,
  dayLabel,
  durationText,
  filterSessions,
  formatClock,
  formatSize,
  formatSpan,
  parseTsharkTime,
  sessionDays,
  sessionTicks,
  statusOf,
  toSessionView,
  toSessionViews,
  totalBytes,
  type SessionRow,
} from '../views/tshark/sessionView'

/**
 * 造一行后端会话
 *
 * @param patch 覆盖字段
 */
function row(patch: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 1,
    sessionName: 'prod 抓包',
    captureInterface: '\\Device\\NPF_{1A2B3C4D-0000-1111-2222-333344445555}',
    captureStatus: 1,
    packetCount: 1280,
    startTime: '2026-10-24 09:30:00',
    endTime: '2026-10-24 09:35:00',
    source: 'live',
    captureDuration: 300,
    lastError: null,
    fileSize: 2048,
    maxSizeMb: 100,
    ...patch,
  }
}

/** 直通网卡名解析 */
const plain = (v?: string | null) => String(v ?? '')

describe('parseTsharkTime', () => {
  it('解析空格分隔写法', () => {
    const d = parseTsharkTime('2026-10-24 09:30:15')
    expect(d?.getHours()).toBe(9)
    expect(d?.getMinutes()).toBe(30)
    expect(d?.getSeconds()).toBe(15)
  })

  it('T 分隔与空格分隔等价', () => {
    expect(parseTsharkTime('2026-10-24T09:30:00')?.getTime()).toBe(
      parseTsharkTime('2026-10-24 09:30:00')?.getTime(),
    )
  })

  it('空值与垃圾值给 null', () => {
    expect(parseTsharkTime('')).toBeNull()
    expect(parseTsharkTime(null)).toBeNull()
    expect(parseTsharkTime('不是时间')).toBeNull()
  })

  it('越界字段给 null，不靠 Date 静默滚动（2026-02-30 不该变成 3 月 2 日）', () => {
    expect(parseTsharkTime('2026-02-30 00:00:00')).toBeNull()
    expect(parseTsharkTime('2026-13-01 00:00:00')).toBeNull()
    expect(parseTsharkTime('2026-10-24 24:00:00')).toBeNull()
  })
})

describe('formatSize', () => {
  it('按量级换单位', () => {
    expect(formatSize(512)).toBe('512 B')
    expect(formatSize(2048)).toBe('2.0 KB')
    expect(formatSize(3 * 1024 * 1024)).toBe('3.0 MB')
    expect(formatSize(2 * 1024 * 1024 * 1024)).toBe('2.00 GB')
  })

  it('0 与空值给破折号（「0 B」会被读成「抓到了空文件」）', () => {
    expect(formatSize(0)).toBe('—')
    expect(formatSize(null)).toBe('—')
    expect(formatSize(undefined)).toBe('—')
  })
})

describe('formatSpan / durationText', () => {
  it('秒 / 分 / 小时三档', () => {
    expect(formatSpan(45)).toBe('45 秒')
    expect(formatSpan(90)).toBe('1 分 30 秒')
    expect(formatSpan(120)).toBe('2 分')
    expect(formatSpan(3600)).toBe('1 小时')
    expect(formatSpan(3900)).toBe('1 小时 5 分')
  })

  it('0 与空值给破折号', () => {
    expect(formatSpan(0)).toBe('—')
    expect(formatSpan(null)).toBe('—')
  })

  it('起止优先于后端字段 —— 两页原先各选一种口径，同一条会话会算出两个时长', () => {
    const start = new Date(2026, 9, 24, 9, 0, 0)
    const end = new Date(2026, 9, 24, 9, 0, 30)
    expect(durationText(start, end, 999)).toBe('30 秒')
  })

  it('没有 end（抓包进行中）才用后端给的时长', () => {
    const start = new Date(2026, 9, 24, 9, 0, 0)
    expect(durationText(start, null, 60)).toBe('1 分')
  })

  it('起止都不可知时给破折号', () => {
    expect(durationText(null, null, null)).toBe('—')
  })
})

describe('statusOf', () => {
  it('三档状态', () => {
    expect(statusOf(1)).toEqual({ code: 1, text: '抓包中', tone: 'run' })
    expect(statusOf(2)).toEqual({ code: 2, text: '异常', tone: 'err' })
    expect(statusOf(0)).toEqual({ code: 0, text: '已停止', tone: 'stop' })
  })

  it('空值与未知值按已停止处理（宁可说它没在跑，也不谎报在跑）', () => {
    expect(statusOf(null).tone).toBe('stop')
    expect(statusOf(7).tone).toBe('stop')
  })
})

describe('toSessionView', () => {
  it('名称回退、网卡解析、大小与悬停说明', () => {
    const view = toSessionView(row({ sessionName: null }), plain)
    expect(view.name).toBe('会话 1')
    expect(view.sizeText).toBe('2.0 KB')
    expect(view.sizeTitle).toContain('上限 100 MB')
  })

  it('时间文本、日期键、一昼夜位置', () => {
    const view = toSessionView(row(), plain)
    expect(view.startText).toBe('10-24 09:30:00')
    expect(view.endText).toBe('10-24 09:35:00')
    expect(view.dayKey).toBe('2026-10-24')
    expect(view.startHour).toBeCloseTo(9.5, 5)
    expect(view.endHour).toBeCloseTo(9 + 35 / 60, 5)
  })

  it('结束时刻跨过午夜时 endHour 超过 24，而不是折回 0', () => {
    const view = toSessionView(
      row({ startTime: '2026-10-24 23:50:00', endTime: '2026-10-25 00:10:00' }),
      plain,
    )
    expect(view.startHour).toBeCloseTo(23 + 50 / 60, 5)
    expect(view.endHour).toBeCloseTo(24 + 10 / 60, 5)
    expect(view.durationText).toBe('20 分')
  })

  it('没有时间的会话不猜一个「现在」', () => {
    const view = toSessionView(row({ startTime: null, endTime: null }), plain)
    expect(view.dayKey).toBe('')
    expect(view.startHour).toBeNull()
    expect(view.endHour).toBeNull()
    expect(view.startText).toBe('—')
    expect(view.rangeText).toBe('—')
  })

  it('进行中的会话把范围显示成「→ 进行中」', () => {
    const view = toSessionView(row({ endTime: null }), plain)
    expect(view.rangeText).toBe('10-24 09:30:00 → 进行中')
  })

  it('报文数缺失按 0（不能让表格出现 NaN）', () => {
    expect(toSessionView(row({ packetCount: null }), plain).packetCount).toBe(0)
  })

  it('批量映射容错空集合', () => {
    expect(toSessionViews(null, plain)).toEqual([])
    expect(toSessionViews([row()], plain)).toHaveLength(1)
  })
})

describe('filterSessions', () => {
  const views = toSessionViews(
    [
      row({ id: 1, sessionName: 'web 抓包', captureInterface: 'Ethernet', captureStatus: 1 }),
      row({ id: 2, sessionName: 'db 抓包', captureInterface: 'WLAN', captureStatus: 0 }),
      row({ id: 3, sessionName: '导入 bom.pcap', captureInterface: null, captureStatus: 2, source: 'import' }),
    ],
    plain,
  )

  it('空条件不筛', () => {
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS })).toHaveLength(3)
  })

  it('按状态页签', () => {
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS, status: 'run' }).map(v => v.id)).toEqual([1])
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS, status: 'stop' }).map(v => v.id)).toEqual([2])
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS, status: 'err' }).map(v => v.id)).toEqual([3])
  })

  it('关键字命中会话名与网卡', () => {
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS, keyword: 'db' }).map(v => v.id)).toEqual([2])
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS, keyword: 'wlan' }).map(v => v.id)).toEqual([2])
  })

  it('条件叠加是「与」', () => {
    expect(filterSessions(views, { keyword: '抓包', status: 'stop' }).map(v => v.id)).toEqual([2])
  })

  it('三个页签互不相交，且长度与计数一致（异常不该同时算「已停止」）', () => {
    const counts = countSessions(views)
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS, status: 'run' })).toHaveLength(counts.running)
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS, status: 'stop' })).toHaveLength(counts.stopped)
    expect(filterSessions(views, { ...EMPTY_SESSION_FILTERS, status: 'err' })).toHaveLength(counts.error)
  })
})

describe('countSessions / totalBytes', () => {
  it('分状态计数与报文累计', () => {
    const views = toSessionViews(
      [
        row({ id: 1, captureStatus: 1, packetCount: 10 }),
        row({ id: 2, captureStatus: 0, packetCount: 5 }),
        row({ id: 3, captureStatus: 2, packetCount: 2 }),
      ],
      plain,
    )
    expect(countSessions(views)).toEqual({ total: 3, running: 1, stopped: 1, error: 1, packets: 17 })
  })

  it('空集合全为 0', () => {
    expect(countSessions([])).toEqual({ total: 0, running: 0, stopped: 0, error: 0, packets: 0 })
  })

  it('落盘总量单独从原始行累加（展示行里不带这个只用于求和的字段）', () => {
    expect(totalBytes([row({ fileSize: 100 }), row({ id: 2, fileSize: 200 })])).toBe(300)
    expect(totalBytes(null)).toBe(0)
  })
})

describe('sessionTicks', () => {
  it('按开始时刻定位，09:30 落在 39.58%', () => {
    const ticks = sessionTicks(toSessionViews([row()], plain))
    expect(ticks).toHaveLength(1)
    expect(ticks[0]!.leftPercent).toBeCloseTo((9.5 / 24) * 100, 5)
    expect(ticks[0]!.top).toBe(4)
  })

  it('同一时刻的会话分道', () => {
    const ticks = sessionTicks(
      toSessionViews([row({ id: 1 }), row({ id: 2 })], plain),
    )
    expect(ticks.map(t => t.lane)).toEqual([0, 1])
  })

  it('隔得远的会话共用一道', () => {
    const ticks = sessionTicks(
      toSessionViews(
        [
          row({ id: 1, startTime: '2026-10-24 09:00:00' }),
          row({ id: 2, startTime: '2026-10-24 21:00:00' }),
        ],
        plain,
      ),
    )
    expect(ticks.map(t => t.lane)).toEqual([0, 0])
  })

  it('没有开始时刻的会话不进轴（画上去等于凭空造一个时刻）', () => {
    const ticks = sessionTicks(toSessionViews([row({ startTime: null })], plain))
    expect(ticks).toEqual([])
  })

  it('按时间先后排序', () => {
    const ticks = sessionTicks(
      toSessionViews(
        [
          row({ id: 1, startTime: '2026-10-24 21:00:00' }),
          row({ id: 2, startTime: '2026-10-24 08:00:00' }),
        ],
        plain,
      ),
    )
    expect(ticks.map(t => t.id)).toEqual([2, 1])
  })

  it('带上状态与范围文本，供悬停查看', () => {
    const tick = sessionTicks(toSessionViews([row()], plain))[0]!
    expect(tick.statusText).toBe('抓包中')
    expect(tick.rangeText).toContain('→')
  })
})

describe('sessionDays / dayLabel / formatClock / dayKeyOf', () => {
  it('按天归档并升序，只算有开始时刻的会话', () => {
    const views = toSessionViews(
      [
        row({ id: 1, startTime: '2026-10-25 10:00:00' }),
        row({ id: 2, startTime: '2026-10-24 10:00:00' }),
        row({ id: 3, startTime: '2026-10-24 18:00:00' }),
        row({ id: 4, startTime: null }),
      ],
      plain,
    )
    expect(sessionDays(views)).toEqual([
      { dayKey: '2026-10-24', count: 2 },
      { dayKey: '2026-10-25', count: 1 },
    ])
  })

  it('短标签取月-日', () => {
    expect(dayLabel('2026-10-24')).toBe('10-24')
    expect(dayLabel('')).toBe('')
  })

  it('时刻文本到秒，补零', () => {
    expect(formatClock(new Date(2026, 0, 5, 7, 8, 9))).toBe('01-05 07:08:09')
    expect(formatClock(null)).toBe('—')
  })

  it('日期键不可知给空串（好让调用方过滤掉，而不是分进「」组）', () => {
    expect(dayKeyOf(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(dayKeyOf(null)).toBe('')
  })
})
