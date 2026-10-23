/**
 * 知识库重构探索 —— 各方向共用的格式化工具（Phase 2，选定后并入正式工具）。
 */

/**
 * 大小换算：与真实 KBFileTree 的 formatSize 同口径。
 *
 * @param bytes 字节数
 * @returns 人类可读的大小
 */
export function fmtSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 千分位数字。
 *
 * @param n 数字
 * @returns 带逗号的字符串
 */
export function fmtNum(n: number): string {
  return (n || 0).toLocaleString('en-US')
}

/**
 * 大数缩写：12840 → 12.8k，用于紧凑版面。
 *
 * @param n 数字
 * @returns 缩写字符串
 */
export function fmtShort(n: number): string {
  if (!n) return '0'
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

/**
 * 相对时间：依据固定「当前时刻」，避免每次渲染结果不同导致截图不稳定。
 *
 * @param iso 时间字符串（YYYY-MM-DD HH:mm）
 * @param now 当前时刻基准
 * @returns 如「3 天前」
 */
export function fmtAgo(iso: string, now = new Date('2026-10-23T15:30:00+08:00')): string {
  const t = new Date(iso.replace(' ', 'T') + ':00+08:00').getTime()
  const diff = Math.max(0, now.getTime() - t)
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return `${Math.floor(d / 30)} 个月前`
}

/** 状态 → koi 语义令牌名（各方向自行映射到具体色值） */
export const STATUS_TOKEN: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  completed: 'success',
  processing: 'warning',
  pending: 'warning',
  queued: 'info',
  failed: 'error',
}
