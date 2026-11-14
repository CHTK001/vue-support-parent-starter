/**
 * office-engine 界面汉化。
 *
 * <p>协同编辑用的是 `@p10node/office-engine`，它的工具栏 / 右键菜单 / 文件菜单文案
 * 全部写死在 bundle 里（`label: "Undo"`、`title: "Bold (Ctrl+B)"` 这种），
 * 既没有 locale 选项，也没有可覆盖的词典。因此这里用**渲染后翻译**：
 * 引擎挂载在 open 的 shadow root 里，可以直接遍历它的文本节点与
 * `title` / `aria-label` 属性，把**整串精确匹配**的英文换成中文。</p>
 *
 * <p>为什么必须"整串精确匹配"：用户文档正文也在同一棵树下，按子串替换会把正文里的
 * 英文单词一起改掉（例如正文写着 Undo）。只替换整串等于标签的文本、且限定在
 * 工具栏 / 菜单 / 对话框区域，才能既不漏译也不误伤内容。</p>
 *
 * <p>动态菜单是打开时才插入 DOM 的，所以用 MutationObserver 增量翻译；
 * 返回的 dispose 会在组件卸载时断开，避免 observer 泄漏。</p>
 */

/** 精确匹配的标签词典（键区分大小写，值按中文习惯） */
const LABELS: Record<string, string> = {
  // 文件菜单
  File: "文件",
  Open: "打开",
  Save: "保存",
  "Save as": "另存为",
  Download: "下载",
  Print: "打印",
  Close: "关闭",
  "Document details": "文档详情",
  Document: "文档",
  Spreadsheet: "表格",
  Presentation: "演示文稿",
  "PDF document": "PDF 文档",
  "Web page": "网页",
  "Plain text": "纯文本",
  Markdown: "Markdown",
  "CSV (current sheet)": "CSV（当前工作表）",
  "TSV (current sheet)": "TSV（当前工作表）",
  Export: "导出",
  "Rename": "重命名",
  // 撤销 / 编辑
  Undo: "撤销",
  Redo: "重做",
  Cut: "剪切",
  Copy: "复制",
  Paste: "粘贴",
  "Paste without formatting": "粘贴为纯文本",
  Delete: "删除",
  Remove: "移除",
  "Select all": "全选",
  "Clear formatting": "清除格式",
  "Update style to match": "更新样式以匹配",
  // 字体 / 段落
  Bold: "粗体",
  Italic: "斜体",
  Underline: "下划线",
  Strikethrough: "删除线",
  Superscript: "上标",
  Subscript: "下标",
  "Font": "字体",
  "Font size": "字号",
  "Text color": "文字颜色",
  "Highlight color": "突出显示",
  "Align left": "左对齐",
  "Align center": "居中对齐",
  "Align right": "右对齐",
  Justify: "两端对齐",
  "Increase indent": "增加缩进",
  "Decrease indent": "减少缩进",
  "Bulleted list": "项目符号",
  "Numbered list": "编号列表",
  "Line spacing": "行距",
  Single: "单倍",
  Double: "双倍",
  Triple: "三倍",
  "Normal text": "正文",
  Title: "标题",
  Subtitle: "副标题",
  "Heading 1": "标题 1",
  "Heading 2": "标题 2",
  "Heading 3": "标题 3",
  "Heading 4": "标题 4",
  "Heading 5": "标题 5",
  "Heading 6": "标题 6",
  // 插入
  Insert: "插入",
  "Insert table": "插入表格",
  "Insert row above": "在上方插入行",
  "Insert row below": "在下方插入行",
  "Insert column left": "在左侧插入列",
  "Insert column right": "在右侧插入列",
  "Delete row": "删除行",
  "Delete column": "删除列",
  "Delete table": "删除表格",
  Table: "表格",
  Image: "图片",
  Link: "链接",
  "Open link": "打开链接",
  "Remove link": "移除链接",
  "Page break": "分页符",
  "Text box": "文本框",
  Line: "线条",
  Rectangle: "矩形",
  "Rounded rectangle": "圆角矩形",
  Ellipse: "椭圆",
  Chart: "图表",
  "Original size": "原始大小",
  "Fit to page width": "适应页宽",
  "Download image": "下载图片",
  "Delete image": "删除图片",
  // 表格 / 工作表
  Sheet: "工作表",
  "Insert sheet": "插入工作表",
  "Delete sheet": "删除工作表",
  "Rename sheet": "重命名工作表",
  "Duplicate sheet": "复制工作表",
  "Freeze panes": "冻结窗格",
  "Merge cells": "合并单元格",
  "Unmerge cells": "取消合并",
  "Format cells": "设置单元格格式",
  Number: "数值",
  Currency: "货币",
  Percent: "百分比",
  Date: "日期",
  // 视图
  View: "视图",
  "Zoom in": "放大",
  "Zoom out": "缩小",
  "Fit to page": "适应页面",
  "Page width": "页宽",
  "Actual size": "实际大小",
  "Show gridlines": "显示网格线",
  "Show headers": "显示表头",
  Edit: "编辑",
  Format: "格式",
  Help: "帮助",
  Cancel: "取消",
  OK: "确定",
  Yes: "是",
  No: "否",
  Apply: "应用",
  Reset: "重置",
  Loading: "加载中",
  "Loading...": "加载中…",
  "Untitled": "未命名",
  "Sheet1": "Sheet1",
};

/** `title` 里带快捷键的标签（`Bold (Ctrl+B)`），按前缀映射 */
const TITLE_PREFIX: ReadonlyArray<readonly [RegExp, string]> = [
  [/^Undo\s*(\(.*\))?$/i, "撤销"],
  [/^Redo\s*(\(.*\))?$/i, "重做"],
  [/^Bold\s*(\(.*\))?$/i, "粗体"],
  [/^Italic\s*(\(.*\))?$/i, "斜体"],
  [/^Underline\s*(\(.*\))?$/i, "下划线"],
  [/^Strikethrough\s*(\(.*\))?$/i, "删除线"],
  [/^Cut\s*(\(.*\))?$/i, "剪切"],
  [/^Copy\s*(\(.*\))?$/i, "复制"],
  [/^Paste\s*(\(.*\))?$/i, "粘贴"],
  [/^Select all\s*(\(.*\))?$/i, "全选"],
  [/^Align left\s*(\(.*\))?$/i, "左对齐"],
  [/^Align center\s*(\(.*\))?$/i, "居中对齐"],
  [/^Align right\s*(\(.*\))?$/i, "右对齐"],
  [/^Justify\s*(\(.*\))?$/i, "两端对齐"],
  [/^Increase indent\s*(\(.*\))?$/i, "增加缩进"],
  [/^Decrease indent\s*(\(.*\))?$/i, "减少缩进"],
  [/^Zoom in\s*(\(.*\))?$/i, "放大"],
  [/^Zoom out\s*(\(.*\))?$/i, "缩小"],
  [/^Fit to page\s*(\(.*\))?$/i, "适应页面"],
  [/^Print\s*(\(.*\))?$/i, "打印"],
  [/^Save\s*(\(.*\))?$/i, "保存"],
  [/^Delete\s*(\(.*\))?$/i, "删除"],
  [/^Insert table\s*(\(.*\))?$/i, "插入表格"],
  [/^Bulleted list\s*(\(.*\))?$/i, "项目符号"],
  [/^Numbered list\s*(\(.*\))?$/i, "编号列表"],
];

/** 允许翻译的区域选择器：只在这些容器内替换，避免动到正文 */
const ZONE_SELECTOR = [
  '[role="toolbar"]',
  '[role="menu"]',
  '[role="dialog"]',
  '[role="menubar"]',
  '[role="tablist"]',
  '[data-testid*="toolbar"]',
  ".dv-toolbar",
  ".dv-menu",
  ".dv-dialog",
].join(",");

/**
 * 翻译一条字符串
 *
 * @param raw 原始文本（会先 trim 再精确匹配）
 * @returns 中文；没有对应词条时返回 null
 */
function translate(raw: string): string | null {
  const key = raw.trim();
  if (!key) return null;
  const exact = LABELS[key];
  if (exact) return exact;
  for (const [re, zh] of TITLE_PREFIX) {
    if (re.test(key)) return zh;
  }
  return null;
}

/**
 * 就地翻译一个文本节点
 *
 * @param node 文本节点
 */
function translateTextNode(node: Node): void {
  const text = node.nodeValue ?? "";
  const zh = translate(text);
  if (zh && zh !== text) {
    // 保留原有前后空白，避免把按钮内边距造成的空格也吃掉
    node.nodeValue = text.replace(text.trim(), zh);
  }
}

/**
 * 翻译元素的 title / aria-label
 *
 * @param el 元素
 */
function translateAttrs(el: Element): void {
  for (const attr of ["title", "aria-label", "placeholder"]) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    const zh = translate(value);
    if (zh && zh !== value) el.setAttribute(attr, zh);
  }
}

/**
 * 翻译一棵子树
 *
 * @param root 根节点
 */
function translateTree(root: ParentNode): void {
  const zones = new Set<Element>();
  if (root instanceof Element && root.matches(ZONE_SELECTOR)) zones.add(root);
  root.querySelectorAll?.(ZONE_SELECTOR).forEach((el) => zones.add(el));
  for (const zone of zones) {
    translateAttrs(zone);
    const walker = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      translateTextNode(node);
      node = walker.nextNode();
    }
    zone.querySelectorAll("*").forEach((el) => translateAttrs(el));
  }
}

/** 汉化句柄 */
export interface OfficeEngineZhHandle {
  /** 停止观察并清理（组件卸载时调用） */
  dispose: () => void;
}

/**
 * 给 office-engine 的 shadow root 挂上汉化
 *
 * <p>找不到 shadow root（引擎尚未挂载完）时返回 null，调用方稍后重试即可。</p>
 *
 * @param host 引擎挂载宿主元素
 * @returns 汉化句柄；宿主无 shadow root 时为 null
 */
export function localizeOfficeEngine(host: HTMLElement | null): OfficeEngineZhHandle | null {
  const shadow = host?.shadowRoot;
  if (!shadow) return null;

  translateTree(shadow);

  let pending = false;
  const observer = new MutationObserver((records) => {
    // 合并同一帧内的多次变更：菜单展开会一次插入几十个节点
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      for (const r of records) {
        if (r.type === "attributes" && r.target instanceof Element) {
          translateAttrs(r.target);
          continue;
        }
        r.addedNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) translateTextNode(n);
          else if (n instanceof Element) translateTree(n);
        });
      }
    });
  });
  observer.observe(shadow, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["title", "aria-label", "placeholder"],
  });

  return {
    dispose() {
      observer.disconnect();
    },
  };
}
