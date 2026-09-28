/**
 * 古诗文本归一化工具
 *
 * 背景：同一首诗的正文在不同来源下有两种形态，展示前必须统一，否则会把 JSON 的
 * 方括号与引号当成诗句渲染出来：
 *   1) 采集器入库的 JSON 数组字符串：["床前明月光，疑是地上霜。", "举头望明月，…"]
 *   2) initdata / 手工录入的按行纯文本：床前明月光，疑是地上霜。\n举头望明月，…
 *
 * 本模块是唯一实现方，预览组件（ScPoemPreview）与列表（ScPoemTable）共用。
 */

/** 句末标点：正文按此切句 */
const SENTENCE_END = /(?<=[。！？!?])/;

/**
 * 把可能是 JSON 数组字符串的正文还原成纯文本；非数组形态原样返回。
 *
 * @param raw 原始正文
 * @returns 纯文本（数组形态已用换行连接）
 */
export function normalizePoemContent(raw?: string): string {
  const text = String(raw ?? "").trim();
  if (!text) {
    return "";
  }
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((x) => typeof x === "string")
          .map((x) => x.trim())
          .filter(Boolean)
          .join("\n");
      }
    } catch {
      return text;
    }
  }
  return text;
}

/**
 * 按句切分正文（每句连同其标点）。
 *
 * @param raw 原始正文
 * @returns 句子列表，已去空
 */
export function splitSentences(raw?: string): string[] {
  return normalizePoemContent(raw)
    .split(/\r?\n/)
    .flatMap((seg) => seg.split(SENTENCE_END))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 按行切分译文/赏析（不按句标点切，保留原意完整）。
 *
 * @param raw 原始文本
 * @returns 行列表
 */
export function splitParagraphs(raw?: string): string[] {
  return normalizePoemContent(raw)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 生成列表单元格用的单行摘要：归一化 + 换行压成空格 + 超长截断。
 *
 * @param raw   原始文本
 * @param limit 最大字符数，超出截断并加省略号
 * @returns 单行摘要
 */
export function flattenPreview(raw?: string, limit = 40): string {
  const text = normalizePoemContent(raw).split(/\r?\n/).join(" ").replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

/**
 * 逗号分隔标签字符串 → 去重数组（兼容中英文逗号）。
 *
 * @param raw 标签字符串
 * @returns 标签数组
 */
export function parseTags(raw?: string): string[] {
  return [...new Set(String(raw ?? "").split(/[,，]/).map((t) => t.trim()).filter(Boolean))];
}
