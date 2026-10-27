import { describe, expect, it } from 'vitest'
import { buildLifecycleBreakdown } from '../lifecyclePhases'
import type { TsharkStep } from '../types'

/**
 * 造一步报文。
 *
 * @param relativeMs 相对首个报文的耗时
 * @param phase      阶段
 * @param options    方向 / 标志 / 长度
 * @returns 报文步骤
 */
function step(
  relativeMs: number,
  phase: string,
  options: { fromClient?: boolean; flags?: string; length?: number; packetId?: number } = {},
): TsharkStep {
  return {
    packetId: options.packetId ?? relativeMs + 1,
    fromClient: options.fromClient ?? true,
    flags: options.flags ?? '',
    length: options.length ?? 0,
    relativeMs,
    phase,
  }
}

describe('buildLifecycleBreakdown', () => {
  it('空序列返回空结果', () => {
    const r = buildLifecycleBreakdown([])
    expect(r.totalMs).toBe(0)
    expect(r.phases).toEqual([])
    expect(r.dominant).toBeNull()
    expect(r.verdict).toBe('')
  })

  it('只有握手没有请求时，退化为建连 + 收尾', () => {
    const r = buildLifecycleBreakdown([
      step(0, 'TCP', { flags: 'SYN' }),
      step(12, 'TCP', { fromClient: false, flags: 'SYN,ACK' }),
      step(14, 'TCP', { flags: 'ACK' }),
      step(30, 'CLOSE', { flags: 'FIN,ACK' }),
    ])
    expect(r.totalMs).toBe(30)
    expect(r.phases.map(p => p.key)).toEqual(['connect', 'close'])
    // 建连只算到握手结束那一步，剩下的空档归收尾，不能把空闲算成建连慢
    expect(r.phases[0].ms).toBe(14)
    expect(r.phases[1].ms).toBe(16)
  })

  it('一次 HTTPS 请求切成 建连 / TLS / 请求 / 首字节 / 传输 / 收尾', () => {
    const r = buildLifecycleBreakdown([
      step(0, 'TCP', { flags: 'SYN' }),
      step(10, 'TCP', { fromClient: false, flags: 'SYN,ACK' }),
      step(11, 'TCP', { flags: 'ACK' }),
      step(15, 'TLS', { length: 300 }),
      step(25, 'TLS', { fromClient: false, length: 1200 }),
      step(40, 'HTTP', { length: 500 }),
      step(200, 'HTTP', { fromClient: false, length: 2000 }),
      step(260, 'HTTP', { fromClient: false, length: 3000 }),
      step(300, 'CLOSE', { flags: 'FIN,ACK' }),
    ])

    const byKey = Object.fromEntries(r.phases.map(p => [p.key, p.ms]))
    expect(byKey.connect).toBe(15)
    expect(byKey.tls).toBe(10)
    expect(byKey.request).toBe(15)
    expect(byKey.wait).toBe(160)
    expect(byKey.transfer).toBe(60)
    // 收尾 = 最后一条响应（260）到抓包结束（300），含 FIN 与尾段空闲
    expect(byKey.close).toBe(40)
    expect(r.totalMs).toBe(300)
    // 各段之和必须等于总跨度，否则进度条会出现无归属的空白
    const sum = r.phases.reduce((acc, p) => acc + p.ms, 0)
    expect(sum).toBe(r.totalMs)
  })

  it('占比最大的阶段会出现在结论里', () => {
    const r = buildLifecycleBreakdown([
      step(0, 'TCP', { flags: 'SYN' }),
      step(5, 'TCP', { fromClient: false, flags: 'SYN,ACK' }),
      step(6, 'TCP', { flags: 'ACK' }),
      step(10, 'HTTP', { length: 200 }),
      step(410, 'HTTP', { fromClient: false, length: 800 }),
      step(420, 'CLOSE', { flags: 'FIN,ACK' }),
    ])
    expect(r.dominant?.key).toBe('wait')
    expect(r.verdict).toContain('首字节')
    expect(r.verdict).toContain('服务端处理')
  })

  it('没有 TLS 报文时不展示 TLS 段', () => {
    const r = buildLifecycleBreakdown([
      step(0, 'TCP', { flags: 'SYN' }),
      step(2, 'TCP', { fromClient: false, flags: 'SYN,ACK' }),
      step(3, 'TCP', { flags: 'ACK' }),
      step(5, 'HTTP', { length: 100 }),
      step(50, 'HTTP', { fromClient: false, length: 900 }),
    ])
    expect(r.phases.some(p => p.key === 'tls')).toBe(false)
  })

  it('时间倒挂（乱序报文）不会出现负耗时', () => {
    const r = buildLifecycleBreakdown([
      step(0, 'TCP', { flags: 'SYN' }),
      step(30, 'HTTP', { length: 100 }),
      step(10, 'HTTP', { fromClient: false, length: 900 }),
    ])
    expect(r.phases.every(p => p.ms >= 0)).toBe(true)
    expect(r.totalMs).toBe(30)
  })

  it('只保留第一条请求的响应区间，后续轮次归入收尾', () => {
    const r = buildLifecycleBreakdown([
      step(0, 'TCP', { flags: 'SYN' }),
      step(2, 'TCP', { fromClient: false, flags: 'SYN,ACK' }),
      step(3, 'TCP', { flags: 'ACK' }),
      step(5, 'HTTP', { length: 100 }),
      step(20, 'HTTP', { fromClient: false, length: 500 }),
      step(100, 'HTTP', { length: 100 }),
      step(120, 'HTTP', { fromClient: false, length: 500 }),
      step(150, 'CLOSE', { flags: 'FIN,ACK' }),
    ])
    const byKey = Object.fromEntries(r.phases.map(p => [p.key, p.ms]))
    expect(byKey.wait).toBe(15)
    // 只有一条响应报文：首字节到传输之间没有跨度，transfer 为 0（不展示）
    expect(byKey.transfer).toBeUndefined()
    // 第二轮请求（100ms 起）整体落在收尾段，不混进第一次请求的传输里
    expect(byKey.close).toBe(130)
    expect(r.phases.reduce((acc, p) => acc + p.ms, 0)).toBe(r.totalMs)
  })
})
