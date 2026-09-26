/**
 * 公式文本工具（$...$ 与 ReRichText 行内公式节点统一处理）
 *
 * - ReRichText 行内公式序列化为 <span data-latex="...">$...$</span>
 * - 纯文本字段（选项等）直接用 $...$ 约定
 * 两条来源在「纯文本化」后统一为 $...$，再交给 KaTeX 渲染。
 */
import katex from "katex";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** HTML → 纯文本（行内公式节点还原为 $...$） */
export function htmlToMathText(html?: string): string {
  return String(html ?? "")
    .replace(/<span[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi, (_m, tex: string) => `$${tex}$`)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** 截断文本，保证 $ 成对（避免把公式截半导致显示源码） */
export function truncateMathText(text: string, max: number): string {
  if (text.length <= max) return text;
  let cut = text.slice(0, max);
  const dollars = (cut.match(/\$/g) || []).length;
  if (dollars % 2 === 1) {
    cut = cut.slice(0, cut.lastIndexOf("$"));
  }
  return `${cut}…`;
}

/** 带花括号的 LaTeX 命令（\sqrt{2}、\frac{1}{3}） */
const TEX_CMD = /\\[a-zA-Z]+\s*\{[^{}]*\}/g;
/** 常见符号类命令（\pi、\times 等，无需花括号） */
const TEX_SYMBOL =
  /\\(?:pi|alpha|beta|theta|gamma|lambda|mu|sigma|omega|times|div|pm|mp|neq|leq|geq|approx|infty|sum|int|prod|angle|triangle|circ|cdot|to|in)\b/g;

/**
 * 裸 LaTeX 容错：没有 $ 分隔符时，把明显的 LaTeX 片段补上分隔符再渲染
 * （如用户直接输入「根号2 = \sqrt{2}」也能渲染成公式）
 */
export function autoWrapLatex(src: string): string {
  if (!src || src.includes("$")) return src;
  return src.replace(TEX_CMD, (m) => `$${m}$`).replace(TEX_SYMBOL, (m) => `$${m}$`);
}

/** 渲染「文字 + $公式$」混排为 HTML（文本转义，公式 KaTeX 渲染） */
export function renderMixedText(text: string): string {
  if (!text) return "";
  const src = autoWrapLatex(String(text));
  let out = "";
  let last = 0;
  for (const m of src.matchAll(/\$([^$]+)\$/g)) {
    const idx = m.index ?? 0;
    out += escapeHtml(src.slice(last, idx));
    out += renderTexHtml(m[1]);
    last = idx + m[0].length;
  }
  out += escapeHtml(src.slice(last));
  return out;
}

/** 富文本 → 含公式渲染的摘要 HTML（用于表格/卡片） */
export function renderMathSummary(html: string | undefined, max = 80): string {
  const plain = htmlToMathText(html);
  if (!plain) return "";
  return renderMixedText(truncateMathText(plain, max));
}

/** 单个 LaTeX → KaTeX HTML（失败时回退为原文）；renderTexHtml 供 renderMixedText 复用 */
export function renderTexHtml(tex: string): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: false });
  } catch {
    return escapeHtml(`$${tex}$`);
  }
}

/**
 * 富文本 HTML → 保留排版并把公式渲染出来（用于实时预览等展示场景）
 *  - <span data-latex="..."> → KaTeX
 *  - 标签外的文本里的 $...$ → KaTeX
 */
export function renderRichWithMath(html?: string): string {
  const src = String(html ?? "");
  if (!src) return "";
  const withMathNodes = src.replace(
    /<span[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi,
    (_m, tex: string) => renderTexHtml(tex),
  );
  // 只处理标签之外的文本，避免破坏属性
  return withMathNodes
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith("<") ? part : renderMixedText(part)))
    .join("");
}
