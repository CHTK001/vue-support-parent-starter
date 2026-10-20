/**
 * TShark 页面的显示格式化
 *
 * <p>导入记录表（ScTsharkImportPanel）和 PCAP 分析页的详情头讲的是「同一条会话」，
 * 会话名 / 解析状态 / 报文时间范围 / 时长这四件事必须两边一致 —— 各写一份的话，
 * 改了一处忘了另一处，同一个文件在表格里和详情里就会显示成两个样子（表格说「已解析」、
 * 详情说「解析中」是最容易被用户抓到的 bug）。所以抽到这里，谁要显示谁 import。</p>
 */
import type { TsharkSession } from './types'

/** 会话显示名：没起名字的（导入时留空且后端也没拿到文件名）退回 id */
export function sessionName(s: TsharkSession): string {
  return s.sessionName || `导入 ${s.id}`
}

/**
 * 解析状态。
 *
 * <p>三态而不是两态：报文数为 0 的「已解析」多半是文件本身不含报文（或格式不对），
 * 和正常解析完的文件混在一起会让人以为数据丢了，所以单独标成「无报文」。</p>
 */
export function statusOf(s: TsharkSession): { type: 'warning' | 'info' | 'success'; text: string } {
  if (s.captureStatus === 1) return { type: 'warning', text: '解析中' }
  if ((s.packetCount ?? 0) === 0) return { type: 'info', text: '无报文' }
  return { type: 'success', text: '已解析' }
}

/** 报文的首末时间。解析中时后端还没回填结束时间，就只显示起点 + 「解析中」 */
export function timeRange(s: TsharkSession): string {
  const from = fmtTime(s.startTime)
  if (!from) return '—'
  const to = fmtTime(s.endTime)
  if (!to) return `${from} → 解析中`
  return `${from} → ${to}`
}

/** 后端给的是「2026-10-18T13:36:38」或「2026-10-18 13:36:38」两种形态，都要吃得下 */
export function fmtTime(t?: string | null): string {
  if (!t) return ''
  const d = t.includes('T') ? new Date(t) : new Date(t.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return t
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 把「秒」说成人话；小于 1 秒的抓包很常见，直接显示 0s 会显得像没抓到东西 */
export function fmtDuration(sec?: number | null): string {
  if (sec === null || sec === undefined) return '—'
  if (sec <= 0) return '<1s'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return s ? `${m}m${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h${m % 60}m`
}

/** 文件体积（选文件时的提示文字用）：一位小数够了，这里是给「感量级」不是给对账用 */
export function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}
