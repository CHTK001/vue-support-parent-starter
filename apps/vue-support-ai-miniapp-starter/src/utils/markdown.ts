/**
 * 轻量 Markdown 子集解析器（小程序端）。
 *
 * <p><b>为什么不用 marked / markdown-it：</b>它们输出 HTML 字符串，而
 * {@code mp-weixin} 没有 DOM，{@code v-html} 不可用；换成 {@code rich-text}
 * 又拿不到代码块横向滚动与链接点击。这里只解析 AI 输出里真正会出现的结构，
 * 产出 JSON 节点树交给组件渲染，包体零依赖、行为可控。</p>
 *
 * <p><b>覆盖范围：</b>围栏代码块、标题（1~3 级）、有序/无序列表、引用、段落；
 * 行内支持 {@code `code`}、{@code **strong**}、{@code *em*}、{@code [text](href)}。
 * 不支持的语法（表格、图片、HTML）按原样当文本输出，不会吞内容。</p>
 *
 * <p><b>流式友好：</b>未闭合的围栏（只收到开头 {@code ```}）会把剩余内容当代码块，
 * 未闭合的行内标记按文本输出，不会出现"半截语法消失"的跳变。</p>
 */

/** 行内片段 */
export type InlineSegment =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "strong"; text: string }
  | { type: "em"; text: string }
  | { type: "link"; text: string; href: string };

/** 块级节点 */
export type MarkdownBlock =
  | { type: "code"; lang: string; text: string }
  | { type: "heading"; level: 1 | 2 | 3; inlines: InlineSegment[] }
  | { type: "list"; ordered: boolean; items: InlineSegment[][] }
  | { type: "quote"; inlines: InlineSegment[] }
  | { type: "paragraph"; inlines: InlineSegment[] };

const FENCE = /^\s*```([\w+#.-]*)\s*$/;
const HEADING = /^\s*(#{1,6})\s+(.+)$/;
const LIST_ITEM = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;

/** 解析整段文本为块级节点 */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = String(source ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // 围栏代码块：流式输出时可能还没等到收尾 ```
    const fence = FENCE.exec(line);
    if (fence) {
      const lang = fence[1] || "";
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !FENCE.test(lines[index])) {
        body.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1; // 跳过收尾围栏
      blocks.push({ type: "code", lang, text: body.join("\n") });
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, inlines: parseInline(heading[2]) });
      index += 1;
      continue;
    }

    const listItem = LIST_ITEM.exec(line);
    if (listItem) {
      const parsed = parseList(lines, index);
      blocks.push(parsed.block);
      index = parsed.next;
      continue;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      const quoted: string[] = [];
      while (index < lines.length) {
        const current = QUOTE.exec(lines[index]);
        if (!current) break;
        quoted.push(current[1]);
        index += 1;
      }
      blocks.push({ type: "quote", inlines: parseInline(quoted.join("\n")) });
      continue;
    }

    // 段落：连续的普通行合并，保留软换行（AI 输出常靠单换行分段）
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !FENCE.test(lines[index]) &&
      !HEADING.test(lines[index]) &&
      !LIST_ITEM.test(lines[index]) &&
      !QUOTE.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", inlines: parseInline(paragraph.join("\n")) });
  }

  return blocks;
}

/** 解析连续的列表项，返回块与下一个待处理的行号 */
function parseList(
  lines: string[],
  start: number,
): { block: MarkdownBlock; next: number } {
  const first = LIST_ITEM.exec(lines[start])!;
  const ordered = /^\d/.test(first[2]);
  const items: InlineSegment[][] = [];
  let index = start;

  const appendToLast = (text: string) => {
    if (!items.length) {
      items.push(parseInline(text));
      return;
    }
    items[items.length - 1] = items[items.length - 1].concat([{ type: "text", text: "\n" }], parseInline(text));
  };

  while (index < lines.length) {
    const line = lines[index];
    const item = LIST_ITEM.exec(line);
    if (item) {
      if (/^\d/.test(item[2]) !== ordered) break;
      items.push(parseInline(item[3]));
      index += 1;
      continue;
    }
    // 缩进续行算作上一个条目的一部分；空行结束列表
    if (line.trim() && /^\s{2,}/.test(line)) {
      appendToLast(line.trim());
      index += 1;
      continue;
    }
    break;
  }

  return { block: { type: "list", ordered, items }, next: index };
}

/** 解析行内标记（未闭合的标记按文本输出，保证流式时内容不丢） */
export function parseInline(text: string): InlineSegment[] {
  const source = String(text ?? "");
  const segments: InlineSegment[] = [];
  let buffer = "";
  let index = 0;

  const flush = () => {
    if (buffer) {
      segments.push({ type: "text", text: buffer });
      buffer = "";
    }
  };

  while (index < source.length) {
    const char = source[index];

    if (char === "`") {
      const end = source.indexOf("`", index + 1);
      if (end > index + 1) {
        flush();
        segments.push({ type: "code", text: source.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }

    if (char === "*" && source[index + 1] === "*") {
      const end = source.indexOf("**", index + 2);
      if (end > index + 2) {
        flush();
        segments.push({ type: "strong", text: source.slice(index + 2, end) });
        index = end + 2;
        continue;
      }
    }

    if (char === "*" && source[index + 1] !== "*") {
      const end = source.indexOf("*", index + 1);
      if (end > index + 1) {
        flush();
        segments.push({ type: "em", text: source.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }

    if (char === "[") {
      const labelEnd = source.indexOf("](", index + 1);
      if (labelEnd > index) {
        const hrefEnd = source.indexOf(")", labelEnd + 2);
        if (hrefEnd > labelEnd + 2) {
          flush();
          segments.push({
            type: "link",
            text: source.slice(index + 1, labelEnd),
            href: source.slice(labelEnd + 2, hrefEnd),
          });
          index = hrefEnd + 1;
          continue;
        }
      }
    }

    buffer += char;
    index += 1;
  }

  flush();
  return segments;
}
