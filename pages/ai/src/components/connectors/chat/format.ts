/**
 * 连接器聊天 UI 的共享格式化工具（会话标题、时间、日期标签）。
 * 后端时间字符串格式为 "YYYY-MM-DD HH:mm:ss"。
 */

/** 取标识中可读的末段（用于「用户 ab12cd」这类短名）。 */
export function shortId(id?: string | null): string {
  if (!id) return ''
  const compact = id.replace(/[^a-zA-Z0-9]/g, '')
  return compact.slice(-6) || id
}

/** 会话标题：群聊 / 用户。 */
export function conversationTitle(conv: { chatId?: string; fromGroup?: boolean }): string {
  return conv.fromGroup ? `群聊 ${shortId(conv.chatId)}` : `用户 ${shortId(conv.chatId)}`
}

/** 联系人短名。 */
export function contactShortName(fromUser?: string | null, chatId?: string | null): string {
  return `用户 ${shortId(fromUser || chatId)}`
}

/** 将后端时间字符串解析为 Date。 */
export function parseDate(time?: string | null): Date | null {
  if (!time) return null
  const d = new Date(time.replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** HH:mm。 */
export function formatHM(time?: string | null): string {
  const d = parseDate(time)
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : ''
}

/** HH:mm:ss。 */
export function formatHMS(time?: string | null): string {
  const d = parseDate(time)
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : ''
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

/** 日期分隔标签：今天 / 昨天 / M月D日。 */
export function dayLabel(time?: string | null): string {
  const d = parseDate(time)
  if (!d) return ''
  const now = new Date()
  if (isSameDay(d, now)) return '今天'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(d, yesterday)) return '昨天'
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/** 侧栏时间：当天显示 HH:mm，否则显示 M月D日。 */
export function conversationTime(time?: string | null): string {
  const d = parseDate(time)
  if (!d) return ''
  return isSameDay(d, new Date()) ? formatHM(time) : `${d.getMonth() + 1}/${d.getDate()}`
}
