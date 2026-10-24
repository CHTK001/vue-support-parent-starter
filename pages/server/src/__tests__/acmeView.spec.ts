/**
 * ACME 证书展示层单测。
 *
 * <p>这一层算的是「还剩几天」「有多急」「在时间轴上占哪一段」。都是时间的函数，
 * 所以每个用例都钉死一个「现在」，不依赖机器时钟。算错了界面不会报错，
 * 只会安静地把一张已过期的证书标成绿色。</p>
 */
import { describe, expect, it } from 'vitest'
import {
  CERT_STATUS_OPTIONS,
  EMPTY_CERT_FILTERS,
  URGENCY_LABEL,
  URGENCY_ORDER,
  axisTicks,
  certGeometry,
  countCerts,
  daysLeftText,
  daysUntil,
  filterCerts,
  formatCertDay,
  formatCertTime,
  groupByUrgency,
  parseCertTime,
  runwayAxis,
  toCertView,
  toCertViews,
  urgencyBuckets,
  urgencyOf,
  type CertRow,
} from '../views/acme/acmeView'

/** 固定「现在」：2026-10-24 10:00 本地时间 */
const NOW = new Date(2026, 9, 24, 10, 0, 0)

/**
 * 补零
 *
 * @param n 数字
 */
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 相对 NOW 偏移若干天的后端时间串
 *
 * @param offsetDays 天数（可为负）
 */
function timeAt(offsetDays: number): string {
  const d = new Date(NOW.getTime() + offsetDays * 86_400_000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

/**
 * 造一行后端数据
 *
 * @param patch 覆盖字段
 */
function row(patch: Partial<CertRow> = {}): CertRow {
  return {
    acmeCertId: 1,
    acmeCertPrimaryDomain: 'example.com',
    acmeCertChallengeType: 'DNS-01',
    acmeCertStatus: 'valid',
    acmeCertNotBefore: timeAt(-60),
    acmeCertNotAfter: timeAt(30),
    acmeCertRenewAt: timeAt(20),
    ...patch,
  }
}

describe('parseCertTime', () => {
  it('T 分隔与空格分隔等价', () => {
    expect(parseCertTime('2026-10-24T09:30:00')?.getTime()).toBe(
      parseCertTime('2026-10-24 09:30:00')?.getTime(),
    )
  })

  it('只有日期按 0 点', () => {
    expect(parseCertTime('2026-10-24')?.getHours()).toBe(0)
  })

  it('空值与垃圾值给 null', () => {
    expect(parseCertTime('')).toBeNull()
    expect(parseCertTime(null)).toBeNull()
    expect(parseCertTime('不是时间')).toBeNull()
  })
})

describe('formatCertDay / formatCertTime', () => {
  it('日期只到天', () => {
    expect(formatCertDay(new Date(2026, 0, 5, 7, 8))).toBe('2026-01-05')
  })

  it('时刻到分钟', () => {
    expect(formatCertTime(new Date(2026, 0, 5, 7, 8))).toBe('2026-01-05 07:08')
  })

  it('null 给破折号', () => {
    expect(formatCertDay(null)).toBe('—')
    expect(formatCertTime(null)).toBe('—')
  })
})

describe('daysUntil', () => {
  it('整 30 天', () => {
    expect(daysUntil(new Date(NOW.getTime() + 30 * 86_400_000), NOW)).toBe(30)
  })

  it('不足一天为 0（向下取整，不四舍五入）', () => {
    expect(daysUntil(new Date(NOW.getTime() + 3_600_000), NOW)).toBe(0)
  })

  it('刚过期几小时为 0，不夸大成「已过期 1 天」', () => {
    expect(daysUntil(new Date(NOW.getTime() - 3_600_000), NOW)).toBe(0)
  })

  it('过期两天半显示 -2（截断而不是四舍五入）', () => {
    expect(daysUntil(new Date(NOW.getTime() - 2.5 * 86_400_000), NOW)).toBe(-2)
  })

  it('时间为空给 null', () => {
    expect(daysUntil(null, NOW)).toBeNull()
  })
})

describe('urgencyOf', () => {
  it('已过期', () => {
    expect(urgencyOf(new Date(NOW.getTime() - 1000), NOW)).toBe('expired')
    expect(urgencyOf(new Date(NOW.getTime()), NOW)).toBe('expired')
  })

  it('7 天内为紧急，7 天零 1 小时就落到「30 天内」', () => {
    expect(urgencyOf(new Date(NOW.getTime() + 7 * 86_400_000), NOW)).toBe('urgent')
    expect(urgencyOf(new Date(NOW.getTime() + 7 * 86_400_000 + 3_600_000), NOW)).toBe('soon')
  })

  it('30 天内为「即将到期」，31 天为有效', () => {
    expect(urgencyOf(new Date(NOW.getTime() + 30 * 86_400_000), NOW)).toBe('soon')
    expect(urgencyOf(new Date(NOW.getTime() + 31 * 86_400_000), NOW)).toBe('ok')
  })

  it('时间为空为 unknown（而不是 ok）', () => {
    expect(urgencyOf(null, NOW)).toBe('unknown')
  })
})

describe('daysLeftText', () => {
  it('有效与紧急都用「剩 N 天」', () => {
    expect(daysLeftText(20, 'ok')).toBe('剩 20 天')
    expect(daysLeftText(3, 'urgent')).toBe('剩 3 天')
  })

  it('不足一天', () => {
    expect(daysLeftText(0, 'urgent')).toBe('不足 1 天')
  })

  it('已过期：当天到期不说「已过期 0 天」', () => {
    expect(daysLeftText(0, 'expired')).toBe('已过期')
    expect(daysLeftText(-5, 'expired')).toBe('已过期 5 天')
  })

  it('时间为空给破折号', () => {
    expect(daysLeftText(null, 'unknown')).toBe('—')
  })
})

describe('toCertView', () => {
  it('剩余天数与紧迫度', () => {
    const view = toCertView(row(), NOW)
    expect(view.daysLeft).toBe(30)
    expect(view.urgency).toBe('soon')
    expect(view.daysLeftText).toBe('剩 30 天')
  })

  it('SAN 拆分与计数（带空格与空项）', () => {
    const view = toCertView(row({ acmeCertSan: 'a.com, b.com ,,c.com' }), NOW)
    expect(view.sanList).toEqual(['a.com', 'b.com', 'c.com'])
    expect(view.sanCount).toBe(3)
  })

  it('状态映射与未知状态降级', () => {
    expect(toCertView(row({ acmeCertStatus: 'valid' }), NOW).statusLabel).toBe('有效')
    expect(toCertView(row({ acmeCertStatus: 'expired' }), NOW).statusLabel).toBe('已过期')
    const unknown = toCertView(row({ acmeCertStatus: 'renewing' }), NOW)
    expect(unknown.statusLabel).toBe('renewing')
    expect(unknown.statusCode).toBe('renewing')
  })

  it('主域名为空时给占位，不显示空白标题', () => {
    expect(toCertView(row({ acmeCertPrimaryDomain: '  ' }), NOW).domain).toBe('未命名证书')
  })

  it('有效期已用百分比', () => {
    // 生效 -60 天、到期 +30 天，共 90 天，已过 60 天 → 66.7%
    const view = toCertView(row(), NOW)
    expect(view.usedPercent).toBeCloseTo((60 / 90) * 100, 5)
  })

  it('已过期的已用百分比封顶 100，不会出现 133%', () => {
    const view = toCertView(row({ acmeCertNotBefore: timeAt(-100), acmeCertNotAfter: timeAt(-10) }), NOW)
    expect(view.usedPercent).toBe(100)
  })

  it('时间缺失时已用百分比为 null（而不是 0）', () => {
    expect(toCertView(row({ acmeCertNotBefore: 'bad', acmeCertNotAfter: 'bad' }), NOW).usedPercent).toBeNull()
  })

  it('有效期倒挂时不给出已用百分比（脏数据不该变成一根负进度条）', () => {
    const view = toCertView(row({ acmeCertNotBefore: timeAt(10), acmeCertNotAfter: timeAt(-10) }), NOW)
    expect(view.usedPercent).toBeNull()
  })

  it('错误信息去两侧空白', () => {
    expect(toCertView(row({ acmeCertLastError: '  DNS 记录未生效  ' }), NOW).lastError).toBe('DNS 记录未生效')
  })

  it('null / undefined 集合给空数组', () => {
    expect(toCertViews(null, NOW)).toEqual([])
    expect(toCertViews(undefined, NOW)).toEqual([])
  })
})

describe('filterCerts', () => {
  const views = toCertViews(
    [
      row({ acmeCertId: 1, acmeCertPrimaryDomain: 'api.example.com', acmeCertStatus: 'valid', acmeCertSan: 'api.example.com' }),
      row({ acmeCertId: 2, acmeCertPrimaryDomain: 'www.example.com', acmeCertStatus: 'expired', acmeCertSan: 'www.example.com,cdn.example.com' }),
      row({ acmeCertId: 3, acmeCertPrimaryDomain: 'internal.local', acmeCertStatus: 'valid', acmeCertSan: '' }),
    ],
    NOW,
  )

  it('空条件不筛', () => {
    expect(filterCerts(views, { ...EMPTY_CERT_FILTERS })).toHaveLength(3)
  })

  it('按状态', () => {
    expect(filterCerts(views, { ...EMPTY_CERT_FILTERS, status: 'expired' }).map(v => v.id)).toEqual([2])
  })

  it('关键字命中主域名', () => {
    expect(filterCerts(views, { ...EMPTY_CERT_FILTERS, keyword: 'internal' }).map(v => v.id)).toEqual([3])
  })

  it('关键字命中 SAN —— 用户常常只记得证书里挂的那个子域名', () => {
    expect(filterCerts(views, { ...EMPTY_CERT_FILTERS, keyword: 'cdn' }).map(v => v.id)).toEqual([2])
  })

  it('大小写不敏感', () => {
    expect(filterCerts(views, { ...EMPTY_CERT_FILTERS, keyword: 'INTERNAL' }).map(v => v.id)).toEqual([3])
  })

  it('条件叠加是「与」', () => {
    expect(filterCerts(views, { keyword: 'api', status: 'valid' }).map(v => v.id)).toEqual([1])
    expect(filterCerts(views, { keyword: 'api', status: 'expired' })).toEqual([])
  })
})

describe('countCerts', () => {
  it('按状态与紧迫度分别计数', () => {
    const views = toCertViews(
      [
        row({ acmeCertId: 1, acmeCertStatus: 'valid', acmeCertNotAfter: timeAt(60) }),
        row({ acmeCertId: 2, acmeCertStatus: 'valid', acmeCertNotAfter: timeAt(3) }),
        row({ acmeCertId: 3, acmeCertStatus: 'expired', acmeCertNotAfter: timeAt(-1) }),
      ],
      NOW,
    )
    const counts = countCerts(views)
    expect(counts.total).toBe(3)
    expect(counts.byStatus['valid']).toBe(2)
    expect(counts.byStatus['expired']).toBe(1)
    expect(counts.byUrgency.ok).toBe(1)
    expect(counts.byUrgency.urgent).toBe(1)
    expect(counts.byUrgency.expired).toBe(1)
  })

  it('空集合给出全零，不产生 undefined', () => {
    const counts = countCerts([])
    expect(counts.total).toBe(0)
    expect(counts.byUrgency).toEqual({ expired: 0, urgent: 0, soon: 0, ok: 0, unknown: 0 })
  })
})

describe('runwayAxis', () => {
  it('取最早生效与最晚到期', () => {
    const views = toCertViews(
      [
        row({ acmeCertId: 1, acmeCertNotBefore: timeAt(-60), acmeCertNotAfter: timeAt(30) }),
        row({ acmeCertId: 2, acmeCertNotBefore: timeAt(-10), acmeCertNotAfter: timeAt(80) }),
      ],
      NOW,
    )
    const axis = runwayAxis(views)!
    expect(axis.startMs).toBe(parseCertTime(timeAt(-60))!.getTime())
    expect(axis.endMs).toBe(parseCertTime(timeAt(80))!.getTime())
  })

  it('没有可用时间时给 null（画布据此不画轴）', () => {
    expect(runwayAxis([])).toBeNull()
    expect(runwayAxis(toCertViews([row({ acmeCertNotBefore: 'bad', acmeCertNotAfter: 'bad' })], NOW))).toBeNull()
  })

  it('所有证书时间相同时给 null（不能让 0 做除数）', () => {
    const views = toCertViews([row({ acmeCertNotBefore: timeAt(0), acmeCertNotAfter: timeAt(0) })], NOW)
    expect(runwayAxis(views)).toBeNull()
  })
})

describe('certGeometry', () => {
  const axis = { startMs: NOW.getTime() - 100 * 86_400_000, endMs: NOW.getTime() + 100 * 86_400_000 }

  it('按比例给出偏移与宽度', () => {
    const view = toCertView(row({ acmeCertNotBefore: timeAt(-50), acmeCertNotAfter: timeAt(50) }), NOW)
    const geo = certGeometry(view, axis)!
    expect(geo.leftPercent).toBeCloseTo(25, 5)
    expect(geo.widthPercent).toBeCloseTo(50, 5)
  })

  it('极短的证书有可见下限', () => {
    const view = toCertView(row({ acmeCertNotBefore: timeAt(0), acmeCertNotAfter: timeAt(0.01) }), NOW)
    expect(certGeometry(view, axis)!.widthPercent).toBeGreaterThanOrEqual(0.6)
  })

  it('不超出轴右边界', () => {
    const view = toCertView(row({ acmeCertNotBefore: timeAt(90), acmeCertNotAfter: timeAt(200) }), NOW)
    const geo = certGeometry(view, axis)!
    expect(geo.leftPercent + geo.widthPercent).toBeLessThanOrEqual(100.0001)
  })

  it('时间缺失或倒挂时给 null', () => {
    expect(certGeometry(toCertView(row({ acmeCertNotBefore: 'bad' }), NOW), axis)).toBeNull()
    expect(
      certGeometry(toCertView(row({ acmeCertNotBefore: timeAt(10), acmeCertNotAfter: timeAt(-10) }), NOW), axis),
    ).toBeNull()
  })
})

describe('axisTicks', () => {
  it('给出指定数量的刻度，首尾对齐轴两端', () => {
    const axis = { startMs: parseCertTime('2026-01-01')!.getTime(), endMs: parseCertTime('2026-12-31')!.getTime() }
    const ticks = axisTicks(axis, 6)
    expect(ticks).toHaveLength(6)
    expect(ticks[0]).toBe('01-01')
    expect(ticks[5]).toBe('12-31')
  })

  it('数量下限为 2（一个刻度画不出轴）', () => {
    const axis = { startMs: 0, endMs: 86_400_000 }
    expect(axisTicks(axis, 1)).toHaveLength(2)
  })
})

describe('groupByUrgency', () => {
  it('分组顺序固定：已过期 → 紧急 → 即将到期 → 有效 → 未知', () => {
    const groups = groupByUrgency(toCertViews([row()], NOW))
    expect(groups.map(g => g.key)).toEqual([...URGENCY_ORDER])
  })

  it('组内按剩余天数升序，最急的在前', () => {
    const views = toCertViews(
      [
        row({ acmeCertId: 1, acmeCertNotAfter: timeAt(25) }),
        row({ acmeCertId: 2, acmeCertNotAfter: timeAt(10) }),
      ],
      NOW,
    )
    const soon = groupByUrgency(views).find(g => g.key === 'soon')!
    expect(soon.rows.map(v => v.id)).toEqual([2, 1])
  })

  it('空组也保留（左栏分组标题稳定，不会忽隐忽现）', () => {
    const groups = groupByUrgency([])
    expect(groups).toHaveLength(URGENCY_ORDER.length)
    expect(groups.every(g => g.rows.length === 0)).toBe(true)
  })

  it('每个紧迫度都有中文名', () => {
    for (const key of URGENCY_ORDER) expect(URGENCY_LABEL[key]).toBeTruthy()
  })
})

describe('urgencyBuckets', () => {
  it('按固定顺序给出计数', () => {
    const views = toCertViews(
      [row({ acmeCertId: 1, acmeCertNotAfter: timeAt(-1) }), row({ acmeCertId: 2, acmeCertNotAfter: timeAt(3) })],
      NOW,
    )
    expect(urgencyBuckets(countCerts(views)).map(b => b.count)).toEqual([1, 1, 0, 0, 0])
  })
})

describe('CERT_STATUS_OPTIONS', () => {
  it('第一项是「全部状态」，值为空串', () => {
    expect(CERT_STATUS_OPTIONS[0]).toEqual({ label: '全部状态', value: '' })
  })

  it('覆盖后端六个状态', () => {
    expect(CERT_STATUS_OPTIONS.map(o => o.value).filter(Boolean)).toEqual([
      'pending',
      'validating',
      'valid',
      'expired',
      'revoked',
      'failed',
    ])
  })
})
