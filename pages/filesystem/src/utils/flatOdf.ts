/**
 * 扁平 OpenDocument 文字（{@code .fodt}）解析。
 *
 * <p>fodt 是「扁平」ODF：整篇文档是**一个 XML 文件**，不像 .odt 那样打成 ZIP。
 * 服务端现有的 Aspose 转换器读不了它（实测落到「不支持在线预览」页），file-viewer
 * 的 office registry 也不认这个扩展名，所以在客户端做一层轻量解析：只取正文的
 * 段落与标题，渲染成可读文档。</p>
 *
 * <p><b>为什么用正则而不是 DOMParser</b>：本模块要在 Node 单测里跑，而 DOMParser
 * 不在 Node 全局。ODF 正文结构非常规整（{@code text:h} / {@code text:p} 直接位于
 * {@code office:text} 下），按标签成对扫描足够稳，且可被单测覆盖。</p>
 */

/** 一个正文块 */
export interface OdfBlock {
  /** 块类型：标题或段落 */
  kind: "heading" | "paragraph";
  /** 标题层级（1..6），段落为 0 */
  level: number;
  /** 纯文本内容 */
  text: string;
}

/** 常见命名字体实体（够覆盖文档正文里会出现的那几个） */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** 解码 XML 实体（数字实体 + 常见命名实体） */
function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const cp = parseInt(body.slice(2), 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : whole;
    }
    if (body.startsWith("#")) {
      const cp = parseInt(body.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : whole;
    }
    return NAMED_ENTITIES[body] ?? whole;
  });
}

/**
 * 把 ODF 行内内容转成纯文本。
 *
 * <p>处理 {@code text:s}（空格）、{@code text:tab}（制表）、{@code text:line-break}
 * 三种空元素，以及其它行内标签（span / a / …）——直接剥标签、保留其文字。</p>
 */
function inlineToText(inner: string): string {
  return decodeEntities(
    inner
      .replace(/<text:line-break\b[^>]*\/?>/gi, "\n")
      .replace(/<text:tab\b[^>]*\/?>/gi, "\t")
      .replace(/<text:s\b([^>]*)\/?>/gi, (_m, attrs: string) => {
        // text:s 的 c 属性表示空格个数，默认 1
        const m = /text:c="(\d+)"/i.exec(attrs ?? "");
        return " ".repeat(m ? Math.max(1, Number(m[1])) : 1);
      })
      .replace(/<[^>]+>/g, ""),
  ).replace(/[ \t]+\n/g, "\n");
}

/**
 * 解析 flat ODF 正文。
 *
 * @param xml 整个 fodt 的 XML 文本
 * @returns 正文块（按文档顺序）；非 ODF 或无正文时返回空数组
 */
export function parseFlatOdf(xml: string): OdfBlock[] {
  const blocks: OdfBlock[] = [];
  // 只扫 text:h / text:p；其它元素（office:body 等）不产生块
  const re = /<(text:h|text:p)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    const text = inlineToText(m[3]).trim();
    if (!text) continue;
    if (tag === "text:h") {
      const lv = /text:outline-level="(\d+)"/i.exec(attrs);
      const level = lv ? Math.min(6, Math.max(1, Number(lv[1]))) : 1;
      blocks.push({ kind: "heading", level, text });
    } else {
      blocks.push({ kind: "paragraph", level: 0, text });
    }
  }
  return blocks;
}
