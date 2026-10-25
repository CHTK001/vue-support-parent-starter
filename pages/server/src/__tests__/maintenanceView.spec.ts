/**
 * 维护计划展示层单测。
 *
 * <p>这一层决定了四个界面事实：窗口落在哪一天、在轴上占多宽、是否「进行中」、
 * 以及几个窗口会不会撞车。算错了界面不会报错，只会安静地说错话 —— 比如把
 * 一个跨天窗口画成 72 小时宽，或者把「已结束」标成「进行中」。</p>
 */
import { describe, expect, it } from 'vitest'
import {
  EMPTY_PLAN_FILTERS,
  PLAN_STATUS,
  PLAN_TYPES,
  assignLanes,
  countPlans,
  dayKeyOf,
  dayLabel,
  filterPlans,
  formatSpan,
  parseHostIds,
  planDays,
  planGeometry,
  toPlanView,
  toPlanViews,
  typeBuckets,
  type PlanRow,
} from '../views/maintenance/maintenanceView'

/** 固定「现在」：2026-10-24 10:00 本地时间 */
const NOW = new Date(2026, 9, 24, 10, 0, 0)

/**
 * 造一行后端数据
 *
 * @param patch 覆盖字段
 */
function row(patch: Partial<PlanRow> = {}): PlanRow {
  return {
    id: 1,
    planName: '核心服务升级',
    planType: 'UPGRADE',
    startTime: '2026-10-24T09:00:00',
    endTime: '2026-10-24T12:00:00',
    targetHostIds: '[1,2]',
    status: 'RUNNING',
    description: '升级到 4.0',
    ...patch,
  }
}

describe('formatSpan', () => {
  it('分钟 / 小时 / 天三档', () => {
    expect(formatSpan(5 * 60_000)).toBe('5 分钟')
    expect(formatSpan(3 * 3_600_000)).toBe('3 小时')
    expect(formatSpan(2 * 3_600_000 + 30 * 60_000)).toBe('2 小时 30 分')
    expect(formatSpan(2 * 86_400_000 + 3 * 3_600_000)).toBe('2 天 3 小时')
  })

  it('不足一分钟不说「0 分钟」', () => {
    // 20 秒四舍五入后是 0 分钟；直接显示「0 分钟」会让人以为窗口没排上
    expect(formatSpan(20_000)).toBe('不到 1 分钟')
  })

  it('null 与负数给破折号', () => {
    expect(formatSpan(null)).toBe('—')
    expect(formatSpan(-1000)).toBe('—')
  })
})

describe('parseHostIds', () => {
  it('正常 JSON 数组', () => {
    expect(parseHostIds('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('空值当作「没有目标主机」', () => {
    expect(parseHostIds('')).toEqual([])
    expect(parseHostIds(null)).toEqual([])
  })

  it('坏 JSON 返回 null（与「没有主机」区分开）', () => {
    expect(parseHostIds('{oops')).toBeNull()
    expect(parseHostIds('{"a":1}')).toBeNull()
  })

  it('丢掉非数字项', () => {
    expect(parseHostIds('[1,"x",3]')).toEqual([1, 3])
  })
})

describe('toPlanView', () => {
  it('窗口处境：未开始 / 进行中 / 已结束', () => {
    expect(toPlanView(row({ startTime: '2026-10-24T11:00:00', endTime: '2026-10-24T12:00:00' }), {}, NOW).windowState).toBe('upcoming')
    expect(toPlanView(row({ startTime: '2026-10-24T09:00:00', endTime: '2026-10-24T12:00:00' }), {}, NOW).windowState).toBe('active')
    expect(toPlanView(row({ startTime: '2026-10-24T07:00:00', endTime: '2026-10-24T08:00:00' }), {}, NOW).windowState).toBe('past')
  })

  it('时间不可解析时处境是 unknown，不是「已结束」', () => {
    expect(toPlanView(row({ startTime: 'bad', endTime: 'bad' }), {}, NOW).windowState).toBe('unknown')
  })

  it('日期键与当日小时数', () => {
    const view = toPlanView(row({ startTime: '2026-10-24T09:30:00' }), {}, NOW)
    expect(view.dayKey).toBe('2026-10-24')
    expect(view.startHour).toBeCloseTo(9.5, 5)
  })

  it('时长与时长文本', () => {
    const view = toPlanView(row(), {}, NOW)
    expect(view.durationMs).toBe(3 * 3_600_000)
    expect(view.durationText).toBe('3 小时')
  })

  it('主机名取自台账；查不到时用 #id 而不是静默丢掉', () => {
    const view = toPlanView(row({ targetHostIds: '[1,99]' }), { 1: 'web-01' }, NOW)
    expect(view.hostNames).toEqual(['web-01', '#99'])
    expect(view.hostText).toBe('web-01, #99')
  })

  it('目标主机字段坏掉时，原样显示而不是假装没有主机', () => {
    const view = toPlanView(row({ targetHostIds: '{oops' }), {}, NOW)
    expect(view.hostText).toBe('{oops')
    expect(view.hostIds).toEqual([])
  })

  it('没填主机时说「未指定主机」', () => {
    expect(toPlanView(row({ targetHostIds: '' }), {}, NOW).hostText).toBe('未指定主机')
  })

  it('类型与状态的中文映射', () => {
    const view = toPlanView(row({ planType: 'BACKUP', status: 'PENDING' }), {}, NOW)
    expect(view.typeLabel).toBe('备份')
    expect(view.typeTone).toBe('backup')
    expect(view.statusLabel).toBe('待执行')
    expect(view.statusTone).toBe('pending')
  })

  it('未知类型 / 状态不吞掉原值', () => {
    const view = toPlanView(row({ planType: 'MIGRATE', status: 'PAUSED' }), {}, NOW)
    expect(view.typeLabel).toBe('MIGRATE')
    expect(view.typeTone).toBe('other')
    expect(view.statusLabel).toBe('PAUSED')
    expect(view.statusTone).toBe('other')
  })

  it('没有名称时给「未命名计划」', () => {
    expect(toPlanView(row({ planName: '  ' }), {}, NOW).name).toBe('未命名计划')
  })

  it('null / undefined 集合给空数组', () => {
    expect(toPlanViews(null, {}, NOW)).toEqual([])
    expect(toPlanViews(undefined, {}, NOW)).toEqual([])
  })
})

describe('filterPlans', () => {
  const views = toPlanViews(
    [
      row({ id: 1, planName: '核心服务升级', planType: 'UPGRADE', status: 'RUNNING', description: '升级 4.0', targetHostIds: '[1]' }),
      row({ id: 2, planName: '数据库备份', planType: 'BACKUP', status: 'PENDING', description: '', targetHostIds: '[2]' }),
      row({ id: 3, planName: '节点重启', planType: 'REBOOT', status: 'COMPLETED', description: '', targetHostIds: '[1]' }),
    ],
    { 1: 'web-01', 2: 'db-01' },
    NOW,
  )

  it('空条件不筛', () => {
    expect(filterPlans(views, { ...EMPTY_PLAN_FILTERS })).toHaveLength(3)
  })

  it('按类型', () => {
    expect(filterPlans(views, { ...EMPTY_PLAN_FILTERS, type: 'BACKUP' }).map(v => v.id)).toEqual([2])
  })

  it('按状态', () => {
    expect(filterPlans(views, { ...EMPTY_PLAN_FILTERS, status: 'RUNNING' }).map(v => v.id)).toEqual([1])
  })

  it('关键字匹配名称、描述与主机名', () => {
    expect(filterPlans(views, { ...EMPTY_PLAN_FILTERS, keyword: '备份' }).map(v => v.id)).toEqual([2])
    expect(filterPlans(views, { ...EMPTY_PLAN_FILTERS, keyword: '4.0' }).map(v => v.id)).toEqual([1])
    expect(filterPlans(views, { ...EMPTY_PLAN_FILTERS, keyword: 'db-01' }).map(v => v.id)).toEqual([2])
  })

  it('多个条件叠加是「与」', () => {
    expect(filterPlans(views, { keyword: '重启', type: 'REBOOT', status: 'COMPLETED' }).map(v => v.id)).toEqual([3])
    expect(filterPlans(views, { keyword: '重启', type: 'REBOOT', status: 'PENDING' })).toEqual([])
  })
})

describe('countPlans', () => {
  it('各状态计数，总数与行数对得上', () => {
    const views = toPlanViews(
      [
        row({ id: 1, status: 'PENDING' }),
        row({ id: 2, status: 'PENDING' }),
        row({ id: 3, status: 'RUNNING' }),
      ],
      {},
      NOW,
    )
    const counts = countPlans(views)
    expect(counts.total).toBe(3)
    expect(counts.byStatus['PENDING']).toBe(2)
    expect(counts.byStatus['RUNNING']).toBe(1)
  })

  it('未知状态单独计一格 —— 否则「全部」会大于各页签之和', () => {
    const views = toPlanViews([row({ id: 1, status: 'PAUSED' })], {}, NOW)
    const counts = countPlans(views)
    expect(counts.byStatus['PAUSED']).toBe(1)
    const sum = PLAN_STATUS.reduce((n, s) => n + (counts.byStatus[s.value] ?? 0), 0)
    expect(sum + counts.byStatus['PAUSED']).toBe(counts.total)
  })
})

describe('planGeometry', () => {
  it('09:00–12:00 在 24 小时轴上占 12.5% 宽，起点 37.5%', () => {
    const geo = planGeometry(toPlanView(row(), {}, NOW))!
    expect(geo.leftPercent).toBeCloseTo(37.5, 5)
    expect(geo.widthPercent).toBeCloseTo(12.5, 5)
  })

  it('跨天窗口截断到 24 点，不溢出轴外', () => {
    const geo = planGeometry(
      toPlanView(row({ startTime: '2026-10-24T22:00:00', endTime: '2026-10-26T02:00:00' }), {}, NOW),
    )!
    expect(geo.leftPercent + geo.widthPercent).toBeCloseTo(100, 5)
  })

  it('很短的窗口有可见下限（5 分钟不至于细到看不见）', () => {
    const geo = planGeometry(
      toPlanView(row({ startTime: '2026-10-24T09:00:00', endTime: '2026-10-24T09:05:00' }), {}, NOW),
    )!
    expect(geo.widthPercent).toBeGreaterThanOrEqual(0.4)
  })

  it('结束不晚于开始时不画（脏数据不该得到一根负宽度的条）', () => {
    expect(
      planGeometry(toPlanView(row({ startTime: '2026-10-24T12:00:00', endTime: '2026-10-24T09:00:00' }), {}, NOW)),
    ).toBeNull()
  })

  it('时间不可解析时给 null', () => {
    expect(planGeometry(toPlanView(row({ startTime: 'bad', endTime: 'bad' }), {}, NOW))).toBeNull()
  })
})

describe('assignLanes', () => {
  it('不重叠的计划共用一道', () => {
    const views = toPlanViews(
      [
        row({ id: 1, startTime: '2026-10-24T08:00:00', endTime: '2026-10-24T09:00:00' }),
        row({ id: 2, startTime: '2026-10-24T10:00:00', endTime: '2026-10-24T11:00:00' }),
      ],
      {},
      NOW,
    )
    expect(assignLanes(views, 13).map(r => r.top)).toEqual([0, 0])
  })

  it('重叠的计划落到不同道', () => {
    const views = toPlanViews(
      [
        row({ id: 1, startTime: '2026-10-24T09:00:00', endTime: '2026-10-24T12:00:00' }),
        row({ id: 2, startTime: '2026-10-24T10:00:00', endTime: '2026-10-24T11:00:00' }),
      ],
      {},
      NOW,
    )
    expect(assignLanes(views, 13).map(r => r.top)).toEqual([0, 13])
  })

  it('首尾相接（前者结束 = 后者开始）可以共用一道', () => {
    const views = toPlanViews(
      [
        row({ id: 1, startTime: '2026-10-24T08:00:00', endTime: '2026-10-24T09:00:00' }),
        row({ id: 2, startTime: '2026-10-24T09:00:00', endTime: '2026-10-24T10:00:00' }),
      ],
      {},
      NOW,
    )
    expect(assignLanes(views, 13).map(r => r.top)).toEqual([0, 0])
  })

  it('乱序输入也按开始时刻排，布局稳定可复现', () => {
    const views = toPlanViews(
      [
        row({ id: 2, startTime: '2026-10-24T10:00:00', endTime: '2026-10-24T11:00:00' }),
        row({ id: 1, startTime: '2026-10-24T08:00:00', endTime: '2026-10-24T09:00:00' }),
      ],
      {},
      NOW,
    )
    expect(assignLanes(views, 13).map(r => r.view.id)).toEqual([1, 2])
  })

  it('时间不可解析的计划被跳过（它们仍在表格里）', () => {
    const views = toPlanViews(
      [row({ id: 1, startTime: 'bad', endTime: 'bad' }), row({ id: 2 })],
      {},
      NOW,
    )
    expect(assignLanes(views, 13).map(r => r.view.id)).toEqual([2])
  })
})

describe('planDays / dayLabel', () => {
  it('按日期聚合并升序', () => {
    const views = toPlanViews(
      [
        row({ id: 1, startTime: '2026-10-25T08:00:00' }),
        row({ id: 2, startTime: '2026-10-24T08:00:00' }),
        row({ id: 3, startTime: '2026-10-25T20:00:00' }),
      ],
      {},
      NOW,
    )
    expect(planDays(views)).toEqual([
      { dayKey: '2026-10-24', count: 1 },
      { dayKey: '2026-10-25', count: 2 },
    ])
  })

  it('时间不可解析的行不产生空日期分组', () => {
    expect(planDays(toPlanViews([row({ startTime: 'bad' })], {}, NOW))).toEqual([])
  })

  it('短标签取 MM-DD', () => {
    expect(dayLabel('2026-10-24')).toBe('10-24')
  })

  it('dayKeyOf 补零', () => {
    expect(dayKeyOf(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dayKeyOf(null)).toBe('')
  })
})

describe('typeBuckets', () => {
  it('四个已知类型各有计数', () => {
    const views = toPlanViews(
      [
        row({ id: 1, planType: 'MAINTENANCE' }),
        row({ id: 2, planType: 'MAINTENANCE' }),
        row({ id: 3, planType: 'UPGRADE' }),
      ],
      {},
      NOW,
    )
    const buckets = typeBuckets(views)
    expect(buckets.map(b => b.label)).toEqual(PLAN_TYPES.map(t => t.label))
    expect(buckets[0]!.count).toBe(2)
    expect(buckets[1]!.count).toBe(1)
  })

  it('出现未知类型时补一个「其它」桶', () => {
    const buckets = typeBuckets(toPlanViews([row({ planType: 'MIGRATE' })], {}, NOW))
    expect(buckets[buckets.length - 1]!.label).toBe('其它')
    expect(buckets[buckets.length - 1]!.count).toBe(1)
  })

  it('没有未知类型时不补空桶（避免多一根永远是 0 的柱子）', () => {
    const buckets = typeBuckets(toPlanViews([row({ planType: 'UPGRADE' })], {}, NOW))
    expect(buckets).toHaveLength(PLAN_TYPES.length)
  })
})
