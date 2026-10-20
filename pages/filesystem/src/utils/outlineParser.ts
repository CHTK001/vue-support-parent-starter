/**
 * 大纲 / 脑图（非 XMind）解析：FreeMind（{@code .mm}）与 OPML（{@code .opml}）。
 *
 * <p>为什么单独成模块：这两种格式都是**纯 XML 大纲**，file-viewer 的 mindmapRenderer
 * 只认 {@code .xmind}（按扩展名路由），因此需要在应用侧解析成统一树后自绘。
 * 抽成纯函数便于单测（见 {@code .e2e-preview/check-outline.mjs}），面板只负责取字节与渲染。</p>
 *
 * <p>解析器从 {@code globalThis.DOMParser} 取（浏览器原生；Node 测试里注入
 * {@code @xmldom/xmldom}），不引入额外依赖。</p>
 */

/** 大纲节点（两种格式归一后的结构） */
export interface OutlineNode {
  /** 标题（FreeMind 的 TEXT / OPML 的 text；缺失时为空串） */
  title: string;
  /** 备注（FreeMind 的 richcontent / OPML 的 _note），可选 */
  note?: string;
  /** 子节点（保持文档顺序） */
  children: OutlineNode[];
  /** 唯一键（用于折叠状态；解析期按路径生成） */
  key: string;
}

/**
 * 标题归一：Freeplane 的节点标题可能是**富文本 HTML**（HTML 存在 {@code TEXT} 属性里），
 * 直接展示会看到一堆标签。这里去标签 + 解常见实体（含数字实体）后压缩空白。
 *
 * @param raw 原始标题
 * @returns 纯文本标题
 */
export function plainOutlineTitle(raw: string): string {
  let s = raw ?? "";
  if (!/[<>&]/.test(s)) return s;
  s = s.replace(/<[^>]*>/g, "");
  s = s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  return s.replace(/\s+/g, " ").trim();
}

/** 取某个元素的直接子元素（忽略大小写与命名空间前缀） */
function directChildren(parent: Element, name: string): Element[] {
  const out: Element[] = [];
  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (n.nodeType !== 1) continue;
    const el = n as Element;
    const ln = (el.localName ?? el.nodeName).replace(/^.*:/, "");
    if (ln.toLowerCase() === name.toLowerCase()) out.push(el);
  }
  return out;
}

/** FreeMind 节点 → 统一结构（node[ TEXT ] + 嵌套 node） */
function buildFreemind(node: Element, path: string): OutlineNode {
  const title = plainOutlineTitle(node.getAttribute("TEXT") ?? node.getAttribute("text") ?? "");
  const rich = directChildren(node, "richcontent")[0];
  const note = rich?.textContent?.trim() || undefined;
  const children = directChildren(node, "node").map((c, i) => buildFreemind(c, `${path}.${i}`));
  return { title, note, children, key: path };
}

/** OPML 节点 → 统一结构（outline[ text ] + 嵌套 outline） */
function buildOpml(node: Element, path: string): OutlineNode {
  const title = plainOutlineTitle(node.getAttribute("text") ?? node.getAttribute("title") ?? "");
  const note = node.getAttribute("_note")?.trim() || undefined;
  const children = directChildren(node, "outline").map((c, i) => buildOpml(c, `${path}.${i}`));
  return { title, note, children, key: path };
}

/**
 * 解析大纲文件为统一树。
 *
 * @param text     文件文本（UTF-8）
 * @param fileName 文件名（按扩展名分派 .opml → OPML，其余按 FreeMind）
 * @returns 顶层节点列表（通常只有一个根）
 * @throws Error XML 不合法或结构缺失时抛出可读中文错误
 */
export function parseOutline(text: string, fileName: string): OutlineNode[] {
  const Parser = (globalThis as { DOMParser?: new () => DOMParser }).DOMParser;
  if (!Parser) {
    throw new Error("当前环境不支持 XML 解析（缺少 DOMParser）");
  }
  const doc = (() => {
    try {
      return new Parser().parseFromString(text, "text/xml");
    } catch (e) {
      // 部分解析器（如 @xmldom/xmldom）对畸形 XML 直接抛异常，而非产出 parsererror 文档
      throw new Error(`大纲文件解析失败（XML 格式不合法），文件可能已损坏：${(e as Error)?.message ?? e}`);
    }
  })();
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("大纲文件解析失败（XML 格式不合法），可能已损坏");
  }

  if (fileName.toLowerCase().endsWith(".opml")) {
    const body = doc.getElementsByTagName("body")[0] ?? doc.documentElement;
    return directChildren(body, "outline").map((o, i) => buildOpml(o, String(i)));
  }

  // FreeMind / Freeplane：<map><node TEXT="根">…</node></map>
  const map = doc.getElementsByTagName("map")[0] ?? doc.documentElement;
  const root = directChildren(map, "node")[0];
  return root ? [buildFreemind(root, "0")] : [];
}

/** 节点总数（含自身），用于展示统计 */
export function countOutlineNodes(node: OutlineNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countOutlineNodes(c), 0);
}
