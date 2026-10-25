/**
 * 共享时间解析单测。
 *
 * <p>这一层是四个页面共同的地基：会话审计、维护计划、ACME 证书、批量作业的
 * 「画在哪一格」「还剩几天」「是否进行中」全部经过它。它算错，四个页面会同时
 * 说错话，而且是那种不报错、只是位置偏一格的说错话。</p>
 */
import { describe, expect, it } from 'vitest'
import {
  DAY_MS,
  dayKeyOf,
  formatDate,
  formatDateTime,
  hourOfDay,
  hourToPercent,
  pad2,
  parseDateTime,
} from '../views/shared/datetime'

describe('parseDateTime', () => {
  it('解析 T 分隔写法（表单 value-format）', () => {
    const d = parseDateTime('2026-10-24T09:30:15')
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(9)
    expect(d?.getDate()).toBe(24)
    expect(d?.getHours()).toBe(9)
    expect(d?.getMinutes()).toBe(30)
    expect(d?.getSeconds()).toBe(15)
  })

  it('解析空格分隔写法，且与 T 写法完全等价', () => {
    const a = parseDateTime('2026-10-24T09:30:00')
    const b = parseDateTime('2026-10-24 09:30:00')
    expect(b?.getTime()).toBe(a?.getTime())
  })

  it('只有日期按 0 点', () => {
    const d = parseDateTime('2026-10-24')
    expect(d?.getHours()).toBe(0)
    expect(d?.getMinutes()).toBe(0)
  })

  it('无秒也接受', () => {
    expect(parseDateTime('2026-10-24 09:30')?.getSeconds()).toBe(0)
  })

  it('两侧空白不影响解析', () => {
    expect(parseDateTime('  2026-10-24 09:30:00  ')?.getHours()).toBe(9)
  })

  it('空值与垃圾值给 null —— 不能退化成「现在」', () => {
    expect(parseDateTime('')).toBeNull()
    expect(parseDateTime(null)).toBeNull()
    expect(parseDateTime(undefined)).toBeNull()
    expect(parseDateTime('不是时间')).toBeNull()
  })

  it('越界字段给 null，不靠 Date 的静默滚动', () => {
    // new Date(2026, 12, 45) 不会报错，它会安静地滚到 2027-02-13，
    // 于是「2026-13-45」这条脏数据会被画到用户从没写过的日子上
    expect(parseDateTime('2026-13-45')).toBeNull()
    expect(parseDateTime('2026-02-30')).toBeNull()
    expect(parseDateTime('2026-10-24 25:00:00')).toBeNull()
    expect(parseDateTime('2026-10-24 10:61:00')).toBeNull()
  })

  it('闰日是合法的', () => {
    expect(parseDateTime('2028-02-29')?.getDate()).toBe(29)
  })

  it('带时区的 ISO 写法回落到引擎（那种写法自带时区，应由引擎解释）', () => {
    expect(parseDateTime('2026-10-24T09:30:00Z')?.getTime()).toBe(Date.UTC(2026, 9, 24, 9, 30, 0))
  })
})

describe('pad2', () => {
  it('补到两位，超过两位不截断', () => {
    expect(pad2(5)).toBe('05')
    expect(pad2(12)).toBe('12')
    expect(pad2(123)).toBe('123')
  })
})

describe('formatDate / formatDateTime', () => {
  it('日期只到天', () => {
    expect(formatDate(new Date(2026, 0, 5, 7, 8))).toBe('2026-01-05')
  })

  it('时刻到分钟', () => {
    expect(formatDateTime(new Date(2026, 0, 5, 7, 8, 9))).toBe('2026-01-05 07:08')
  })

  it('null 给破折号（留空会被读成「这一格坏了」）', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDateTime(null)).toBe('—')
  })
})

describe('dayKeyOf', () => {
  it('给出 YYYY-MM-DD', () => {
    expect(dayKeyOf(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('不可知给空串（让调用方能过滤掉这一条，而不是分到一个「」组里）', () => {
    expect(dayKeyOf(null)).toBe('')
  })
})

describe('hourOfDay / hourToPercent', () => {
  it('含小数的小时数', () => {
    expect(hourOfDay(new Date(2026, 0, 5, 9, 30))).toBe(9.5)
  })

  it('不可知为 null', () => {
    expect(hourOfDay(null)).toBeNull()
  })

  it('映射到 24 小时轴百分比', () => {
    expect(hourToPercent(0)).toBe(0)
    expect(hourToPercent(12)).toBe(50)
    expect(hourToPercent(24)).toBe(100)
  })

  it('越界被夹住（脏数据不该画到轴外）', () => {
    expect(hourToPercent(-5)).toBe(0)
    expect(hourToPercent(30)).toBe(100)
  })
})

describe('DAY_MS', () => {
  it('就是一天的毫秒数', () => {
    expect(DAY_MS).toBe(86_400_000)
  })
})
