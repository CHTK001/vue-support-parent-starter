/**
 * 文本清洗
 *
 * 资源站的简介（vod_content）常带 `<p>`、`<br>`、`&nbsp;` 这类富文本片段，
 * 直接插值会把这些标记原样显示在页面上。这里统一转成纯文本：
 * 去标签、解实体、压缩空白，卡片/焦点图/详情简介共用。
 */

/** 段落类标签换成空格，避免相邻句子粘连 */
const BLOCK_TAGS = /<\s*\/?\s*(p|div|br|li|ul|ol|h[1-6]|tr|td|section)\b[^>]*>/gi;

/**
 * 富文本 → 单行纯文本。
 *
 * 用 DOMParser 解析而非临时挂到文档上：解析出来的文档是惰性的，
 * 不会执行脚本、也不会去加载简介里的图片。
 *
 * @param value 原始文本（可能是 HTML 片段）
 * @returns 纯文本；空输入返回空串
 */
export function plainText(value?: string | null): string {
  if (!value) return "";
  const spaced = value.replace(BLOCK_TAGS, " ");
  const doc = new DOMParser().parseFromString(spaced, "text/html");
  const text = doc.body.textContent ?? "";
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}
