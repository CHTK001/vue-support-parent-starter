/**
 * 最小 OOXML DOCX 导出 —— 纯 jszip 手写，不引入 docx 库。
 *
 * 用途：协同 Word 编辑器（快照 = 富文本 HTML）把当前内容导出为真正的
 * .docx 文件（此前是导出 .html 改名，Word 无法识别为原生文档）。
 *
 * 覆盖的 HTML 结构（mammoth 导入与 contenteditable 输入的实际产物）：
 *   - 段落 <p>、标题 <h1>~<h6>（outlineLvl + 加粗 + 字号）
 *   - 行内 <b>/<strong>/<i>/<em>/<u>、<br>（<w:br/>）、<span>、文本节点
 *   - 列表 <ul>/<ol>/<li>（字符前缀缩进，不引入 numbering.xml）
 *   - <blockquote>、<table>（单元格按行拼接）、<div> 递归拍平
 *
 * 简化取舍：不输出图片（mammoth 默认不带图片）、不输出页码/页眉页脚，
 * 样式为最小集（Word/WPS 均可直接打开）。导出格式映射足够覆盖
 * 「打开/查看/再编辑」的主流场景。
 */

/** OOXML 包契约：/word/document.xml 为主体部件 */
const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

/** 包级关系：指向主体文档 */
const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

/** XML 文本转义（属性值用；正文文本走 escapeText） */
function xmlAttr(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 正文文本转义（& < >；换行转 <w:br/>，空格保留） */
function escapeText(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<w:br/>");
}

/** 行内 run：一段连续同样式文本 */
interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/** 段落选项 */
interface ParaOpts {
  /** 标题层级 1-6（0 = 普通段落） */
  heading?: number;
  /** 列表项（左缩进 + 字符前缀由调用方写入 text） */
  list?: boolean;
  /** 引用块（左右缩进） */
  quote?: boolean;
  /** 表格行（单元格 | 拼接） */
  table?: boolean;
}

/** 收集行内内容 → run 列表（同类样式合并） */
function collectInline(
  node: Node,
  runs: InlineRun[] = [],
  style?: { bold?: boolean; italic?: boolean; underline?: boolean },
): InlineRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent ?? "";
    if (!t) return runs;
    const top = runs[runs.length - 1];
    const same =
      !!top &&
      top.bold === (style?.bold ?? false) &&
      top.italic === (style?.italic ?? false) &&
      top.underline === (style?.underline ?? false);
    if (same) {
      top.text += t;
    } else {
      runs.push({ text: t, bold: style?.bold, italic: style?.italic, underline: style?.underline });
    }
    return runs;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return runs;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const s = {
    bold: style?.bold ?? false,
    italic: style?.italic ?? false,
    underline: style?.underline ?? false,
  };
  if (tag === "b" || tag === "strong") s.bold = true;
  if (tag === "i" || tag === "em") s.italic = true;
  if (tag === "u") s.underline = true;
  if (tag === "br") {
    runs.push({ text: "\n", bold: s.bold, italic: s.italic, underline: s.underline });
    return runs;
  }
  for (const ch of Array.from(el.childNodes)) collectInline(ch, runs, s);
  return runs;
}

/** 单个 <w:p> 的 XML（含 run 级样式） */
function paragraphXml(runs: InlineRun[], opts: ParaOpts = {}): string {
  const pPr: string[] = [];
  if (opts.heading) {
    pPr.push(`<w:outlineLvl w:val="${opts.heading - 1}"/>`);
    pPr.push('<w:spacing w:before="160" w:after="80"/>');
  }
  if (opts.list) pPr.push('<w:ind w:left="360"/>');
  if (opts.quote) pPr.push('<w:ind w:left="720" w:right="720"/>');
  const runsXml = runs
    .map((r) => {
      const rPr: string[] = [];
      if (opts.heading || r.bold) rPr.push("<w:b/>");
      if (r.italic) rPr.push("<w:i/>");
      if (r.underline) rPr.push('<w:u w:val="single"/>');
      if (opts.heading) {
        const sz = opts.heading === 1 ? 32 : opts.heading === 2 ? 28 : 24;
        rPr.push(`<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`);
      }
      const text = escapeText(r.text);
      const rPrXml = rPr.length ? `<w:rPr>${rPr.join("")}</w:rPr>` : "";
      return `<w:r>${rPrXml}<w:t xml:space="preserve">${text}</w:t></w:r>`;
    })
    .join("");
  const pPrXml = pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
  return `<w:p>${pPrXml}${runsXml}</w:p>`;
}

/** 递归收集块级内容 → <w:p> 列表（div/section 拍平） */
function collectBlocks(root: ParentNode, out: string[]): void {
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? "";
      if (text.trim()) out.push(paragraphXml([{ text }]));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    const heading = /^h([1-6])$/.exec(tag);
    if (heading) {
      out.push(paragraphXml(collectInline(el), { heading: Number(heading[1]) }));
      continue;
    }
    if (tag === "p" || tag === "pre" || tag === "blockquote") {
      out.push(paragraphXml(collectInline(el), { quote: tag === "blockquote" }));
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      let idx = 0;
      for (const li of Array.from(el.children)) {
        if (li.tagName.toLowerCase() !== "li") continue;
        idx += 1;
        const runs = collectInline(li);
        runs.unshift({ text: ordered ? `${idx}. ` : "• " });
        out.push(paragraphXml(runs, { list: true }));
      }
      continue;
    }
    if (tag === "table") {
      const rows = Array.from(
        el.querySelectorAll(":scope > tr, :scope > tbody > tr"),
      );
      for (const tr of rows) {
        const cells = Array.from(tr.children).map(
          (td) => (td.textContent ?? "").trim(),
        );
        out.push(paragraphXml([{ text: cells.join(" | ") }], { table: true }));
      }
      continue;
    }
    if (tag === "br" || tag === "img" || tag === "hr" || tag === "input") {
      continue;
    }
    // div / section / span / li 等容器：递归拍平
    collectBlocks(el, out);
  }
}

/** 渲染 HTML（可能含纯文本旧快照）→ 真正的 .docx Blob（Word/WPS 可打开） */
export async function htmlToDocxBlob(html: string): Promise<Blob> {
  const mod = await import("jszip");
  const JSZip = mod.default as unknown as typeof import("jszip");
  const parsed = new DOMParser().parseFromString(html || "<p></p>", "text/html");
  const blocks: string[] = [];
  collectBlocks(parsed.body, blocks);
  if (blocks.length === 0) blocks.push("<w:p/>");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${blocks.join(
    "",
  )}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.file("_rels/.rels", RELS_XML);
  zip.file("word/document.xml", documentXml);
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
}

/** 按文件名规则生成下载用文件名（空内容也给出合法 docx 名） */
export function docxFileName(fileName: string): string {
  const base = (fileName || "doc").replace(/\.(docx?|txt|md|html?)$/i, "");
  return `${base || "doc"}.docx`;
}