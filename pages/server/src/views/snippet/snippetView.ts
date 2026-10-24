/**
 * 片段管理 —— 行数据到展示数据的映射（纯函数，无 Vue 依赖）
 *
 * <p>重构前这一页的表格只有「编号 / 名称 / 备注」三列，**命令正文完全没有出现**。
 * 而片段这个概念的全部内容就是那段命令：用户来这一页是找一条命令，不是找一行元数据。
 * 本层把正文及它的形状（行数、首行、是否为空）算出来，四个方向都能直接用。</p>
 *
 * @author CH
 * @since 4.0.0
 */

/** 后端片段行 */
export interface SnippetRow {
  id: number
  msTerminalSnippetName?: string
  msTerminalSnippetContent?: string
  msTerminalSnippetRemark?: string
}

/** 画布消费的展示行 */
export interface SnippetView {
  id: number
  /** 片段名 */
  name: string
  /** 命令正文（原文，保留换行） */
  content: string
  /** 备注 */
  remark: string
  /** 正文非空行数 */
  lines: number
  /** 正文字符数 */
  chars: number
  /** 正文首行（表格摘要用） */
  firstLine: string
  /** 正文是否为空 */
  empty: boolean
}

/** 片段统计 */
export interface SnippetStats {
  /** 总数 */
  total: number
  /** 有正文的条数 */
  withContent: number
  /** 无正文的条数 */
  empty: number
  /** 平均非空行数；无数据时为 0 */
  avgLines: number
  /** 最长片段的非空行数；无数据时为 0 */
  maxLines: number
}

/** 行数分布的一个桶 */
export interface LineBucket {
  /** 桶标签 */
  label: string
  /** 条数 */
  count: number
}

/**
 * 拆行。
 *
 * <p>统一按 CRLF / CR / LF 切：用户在 Windows 编辑器里粘的命令、后端存的、
 * 浏览器 textarea 交上来的，三种换行都可能出现；只按 \n 切会把 `\r` 留在行尾，
 * 行数照样对，但 `firstLine` 会带一个不可见的 \r。</p>
 *
 * @param content 正文
 */
export function splitLines(content?: string | null): string[] {
  if (!content) return []
  return String(content).replace(/\r\n?/g, '\n').split('\n')
}

/**
 * 非空行数（忽略只有空白的行）。
 *
 * <p>用非空行而不是总行数：命令尾部常见一两个空行，算进去会让「3 行脚本」显示成 5 行，
 * 而用户对「这段命令有多长」的判断是基于有内容的部分。</p>
 *
 * @param content 正文
 */
export function countLines(content?: string | null): number {
  return splitLines(content).filter(line => line.trim().length > 0).length
}

/**
 * 首行（跳过开头的空行与纯注释前的空行）。
 *
 * @param content 正文
 */
export function firstLineOf(content?: string | null): string {
  for (const line of splitLines(content)) {
    const t = line.trim()
    if (t) return t
  }
  return ''
}

/**
 * 单行映射。
 *
 * @param row 后端行
 */
export function toSnippetView(row: SnippetRow): SnippetView {
  const content = String(row.msTerminalSnippetContent ?? '')
  const lines = countLines(content)
  return {
    id: row.id,
    name: row.msTerminalSnippetName?.trim() || '未命名片段',
    content,
    remark: String(row.msTerminalSnippetRemark ?? '').trim(),
    lines,
    chars: content.length,
    firstLine: firstLineOf(content),
    empty: lines === 0,
  }
}

/**
 * 批量映射。
 *
 * @param rows 后端行
 */
export function toSnippetViews(rows: readonly SnippetRow[] | null | undefined): SnippetView[] {
  return (rows ?? []).map(toSnippetView)
}

/**
 * 关键字筛选：名称、正文、备注三者都参与。
 *
 * <p>正文必须参与匹配 —— 用户常常只记得命令里有个 `systemctl`，
 * 完全不记得自己给这条片段起了什么名字。原先只匹配名称，等于逼用户先想起名字。</p>
 *
 * @param views   展示行
 * @param keyword 关键字
 */
export function filterSnippets(views: readonly SnippetView[], keyword: string): SnippetView[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return [...views]
  return views.filter(
    v =>
      v.name.toLowerCase().includes(kw) ||
      v.content.toLowerCase().includes(kw) ||
      v.remark.toLowerCase().includes(kw),
  )
}

/**
 * 统计。
 *
 * @param views 展示行
 */
export function snippetStats(views: readonly SnippetView[]): SnippetStats {
  const total = views.length
  const withContent = views.filter(v => !v.empty).length
  const maxLines = views.reduce((m, v) => Math.max(m, v.lines), 0)
  const sum = views.reduce((n, v) => n + v.lines, 0)
  return {
    total,
    withContent,
    empty: total - withContent,
    avgLines: total ? Math.round((sum / total) * 10) / 10 : 0,
    maxLines,
  }
}

/**
 * 行数分布。
 *
 * <p>回答一个统计卡回答不了的问题：这些片段到底是「一行命令」还是「一段脚本」。
 * 分档刻意不等宽 —— 1 行、2~3 行、4~10 行、10 行以上，
 * 因为运维片段的真实分布就是「绝大多数一行，少数几段脚本」。</p>
 *
 * @param views 展示行
 */
export function lineBuckets(views: readonly SnippetView[]): LineBucket[] {
  const buckets: LineBucket[] = [
    { label: '1 行', count: 0 },
    { label: '2–3 行', count: 0 },
    { label: '4–10 行', count: 0 },
    { label: '10 行以上', count: 0 },
  ]
  for (const v of views) {
    if (v.lines <= 0) continue
    if (v.lines === 1) buckets[0]!.count++
    else if (v.lines <= 3) buckets[1]!.count++
    else if (v.lines <= 10) buckets[2]!.count++
    else buckets[3]!.count++
  }
  return buckets
}
