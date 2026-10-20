/**
 * 搜索关键词高亮 Composable
 * 将文本中的关键词用 <mark> 标签包裹，实现搜索高亮效果
 */

/**
 * HTML 转义：把文本里的标记字符变成实体。
 *
 * <p>高亮结果是直接进 {@code v-html} 的，而文本来源（模型名、供应商名、平台返回的
 * 名称）并不可信。不转义就等于把上游字符串当 HTML 执行。</p>
 *
 * @param value 原始文本
 * @returns 可安全放进 innerHTML 的文本
 */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

/**
 * 高亮文本中的关键词（返回可安全交给 v-html 的字符串）
 *
 * <p>先转义整段文本，再在转义后的文本上匹配「同样被转义的关键词」，
 * 这样既保留了高亮，也不会让文本里的 {@code <img onerror=...>} 变成标签。</p>
 *
 * @param text 原始文本
 * @param keyword 搜索关键词
 * @returns 高亮后的 HTML 字符串（需配合 v-html 使用）
 */
export function highlightText(text: string | number | null | undefined, keyword: string): string {
  const safeText = escapeHtml(String(text ?? ''));
  if (!text || !keyword || !keyword.trim()) return safeText;
  const safeKeyword = escapeHtml(String(keyword));
  const escaped = safeKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return safeText.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * 在 Vue 模板中使用的计算属性工厂
 * @param keywordRef 搜索关键词的 ref
 * @returns 带高亮的文本处理函数
 */
export function useSearchHighlight() {
  /**
   * 对单个字段应用高亮
   * @param text 字段值
   * @returns 高亮后的 HTML
   */
  function highlight(text: string | number | null | undefined, keyword: string): string {
    return highlightText(text, keyword);
  }

  /**
   * 对多个字段应用高亮（用于行级别的多列高亮）
   * @param fields 要高亮的字段数组
   * @param keyword 关键词
   * @returns 字段名到高亮文本的映射
   */
  function highlightFields<T extends Record<string, unknown>>(
    fields: T,
    keyword: string,
  ): Record<keyof T, string> {
    const result = {} as Record<keyof T, string>;
    for (const key in fields) {
      result[key] = highlightText(fields[key] as string | number | null | undefined, keyword);
    }
    return result;
  }

  return { highlight, highlightText, highlightFields };
}

export default useSearchHighlight;
