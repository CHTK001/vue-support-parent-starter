/**
 * 知识库检索结果的文本处理。
 *
 * <p>{@link KBSearchPanel} 的检索片段渲染依赖这里：{@code highlightText} 此前在多个调用点
 * 各存一份，改一处忘另一处就会静默漂移（评分展示就出过这类问题：只有一处修了、
 * 另一处仍显示「相似度 0.0%」）。这里抽成单一来源。</p>
 */

/**
 * 去掉 Markdown 语法标记，只留正文文字。
 *
 * <p>知识库里的文档就是 .md，检索片段直接渲染会满屏 `## 标题`、`**加粗**`、
 * `- 列表项` 这类标记（截图里「## 连环计（王允）」「**曹操**」就是这么冒出来的）。
 * 片段只 clamp 三行、也放不下真正的排版，所以走「剥标记留文字」而不是整套 Markdown 渲染。</p>
 *
 * <p>必须在 HTML 转义<b>之前</b>调用：先转义的话，`&lt;` 之类实体反而会被后续正则改坏。</p>
 *
 * @param text 原始片段（可能含 Markdown）
 * @returns 纯文本片段
 */
export function stripMarkdown(text: string): string {
  // 导出为公共工具，调用方未必都做了判空，这里兜住，避免 undefined 抛错
  if (!text) return ''
  return text
    // 代码块围栏 / 行内代码
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    // 图片 ![alt](url) → alt；链接 [text](url) → text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // 标题 / 引用 / 分隔线：只吃掉标记本身，保留正文。
    // ⚠ 这里的片段在后端已被压成「整段没有换行」（实测 snippet 里 \n 恒为 false），
    // 所有块级标记都出现在行中间，所以不能锚定 ^ —— 锚了就整条漏掉。
    // 改用「标记前不是文字字符」作守卫：C# 语言、208-223、王允-董卓 这类紧贴写法不会被误伤。
    .replace(/(^|[^\w一-龥])#{1,6}\s+/g, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}([-*_])\s*(?:\1\s*){2,}$/gm, ' ')
    // 加粗 / 斜体 / 删除线 —— 必须排在列表规则「之前」：
    // 列表规则里的 [*+]\s+ 会跨换行吃掉 `**B**` 收尾的那个 *（`**B**\n- C` → `A B*- C`），
    // 成对的强调标记更特异，应当先消费。
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[\s(])\*([^*]+)\*(?=$|[\s).,，。])/g, '$1$2')
    .replace(/~~([^~]+)~~/g, '$1')
    // 列表与任务项符号（同样不能锚行首）
    .replace(/(^|[^\w一-龥])(?:[-*+]|\d{1,2}[.)])\s+/g, '$1')
    .replace(/(^|[^\w一-龥])\[[ xX]\]\s+/g, '$1')
    // 片段被截断时常留下无配对的 ** / __（开标记在片段内、闭标记被切掉），
    // 上面成对替换处理不了，只能在这里兜底清掉，否则结尾挂着一串星号。
    .replace(/\*\*|__/g, '')
    // 表格竖线与分隔行
    .replace(/^\s*\|?[\s:|-]{4,}\|?\s*$/gm, ' ')
    .replace(/\|/g, ' ')
    // 残留 HTML 标签
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    // 收敛空白：Markdown 里换行常用于硬折行，直接拼起来会黏成一团
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .trim()
}

/**
 * 剥 Markdown → HTML 转义（防 XSS）→ 对关键词套 `<mark>`。
 *
 * @param text 原始片段
 * @param query 查询词（按空白切分为多个关键词）
 * @returns 可直接 `v-html` 的高亮 HTML
 */
export function highlightText(text: string, query: string): string {
  /** 转义 HTML 特殊字符 */
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  if (!query || !text) {
    return escapeHtml(stripMarkdown(text || ''))
  }

  try {
    const escapedText = escapeHtml(stripMarkdown(text))
    const keywords = query.trim().split(/\s+/).filter((k) => k.length > 0)
    let highlighted = escapedText

    keywords.forEach((keyword) => {
      // 转义关键词里的正则元字符，避免构造成非法/越界正则
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedKeyword})`, 'gi')
      // 底色走 koi 令牌，暗色自动跟随（原先是 dark:bg-yellow-700 硬编码）
      highlighted = highlighted.replace(regex, '<mark class="kb-search-mark">$1</mark>')
    })

    return highlighted
  } catch (e) {
    console.error('高亮处理失败:', e)
    return escapeHtml(stripMarkdown(text))
  }
}