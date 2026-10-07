<!--
  实时浏览器预览面板：左侧是真 Chromium 的 screencast 画面，右侧是 DevTools 风格页签。

  与静态模式（ReElementPicker 里的 iframe srcdoc）的区别：
  1) 真浏览器：JS 会执行、能翻页、能登录，动态站不再是空壳。
  2) 左侧画面来自 CDP Page.startScreencast 的 jpeg 帧流（经 sidecar 的 SSE 推过来），
     鼠标/滚轮/键盘事件用 Input.dispatch* 转发回页面 —— 与 Cloudflare live.browser.run
     同一套原理（那边前端直连 CDP，这边经本地 sidecar 中转）。
  3) 拾取用 Overlay.setInspectMode('searchForNode') 让浏览器画原生 hover 高亮；
     点选时不把 click 转发给页面（避免点链接跳走），改用 DOM.getNodeForLocation
     按坐标命中节点 —— 结果与 inspectNodeRequested 一致但不依赖点击穿透行为。
  4) 最左侧是 F12 风格的 Elements DOM 树：DOM.getDocument 起底 + DOM.requestChildNodes
     懒加载，hover 画 Overlay.highlightNode 高亮，点选生成选择器，并能按点选结果反向定位。
  5) 右侧四页签：元素（选中信息 + 实时状态）/ 选择器 / 原文 / 控制台（可执行表达式）。

  会话生命周期：visible=true 建会话，false 或组件卸载时销毁；「打开」按钮导航复用会话。
  sidecar 不可用或建会话失败时向父组件 emit('fallback')，由父组件回退静态模式。
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from "vue";
import { ElButton, ElInput, ElMessage, ElTabPane, ElTabs } from "element-plus";
import {
  closeLiveSession,
  createLiveSession,
  openEvents,
  sendCdp,
  type LiveEvent,
} from "./liveClient";

const props = withDefaults(
  defineProps<{
    /** 父弹窗显隐；false 时销毁会话 */
    visible: boolean;
    /** 要打开/导航的地址 */
    url?: string;
    /** 当前解析器类型，决定默认推荐 CSS 还是 XPath */
    parserType?: string;
    /** 父组件点「打开」时自增，触发（重新）导航 */
    navNonce?: number;
  }>(),
  {
    url: "",
    parserType: "CSS",
    navNonce: 0,
  },
);

const emit = defineEmits<{
  (e: "pick", payload: { expression: string; parserType: string }): void;
  /** 实时模式不可用（sidecar 挂了/浏览器起不来），父组件应切回静态模式 */
  (e: "fallback", message: string): void;
}>();

const recommendXpath = computed(() => (props.parserType || "CSS").toUpperCase() === "XPATH");

/** 会话 id；空表示未连接 */
const sessionId = ref("");
const connecting = ref(false);
/** 面板内错误横幅（导航失败、CDP 调用失败等） */
const error = ref("");
/** 已渲染的帧数，给状态栏一个「活着」的信号 */
const frameCount = ref(0);
/** 视口尺寸：screencast 帧坐标系，鼠标事件按它换算 */
const viewport = ref({ width: 1280, height: 800 });
/** 会话内当前页面地址（可能与 props.url 不同：重定向/站内跳转） */
const liveUrl = ref("");
/** 拾取模式：开 = hover 高亮 + 点选；关 = 把所有输入原样转发给页面（真实浏览） */
const inspectOn = ref(true);
const activeTab = ref("element");

/** CDP 事件订阅的取消函数 */
let unsubscribe: (() => void) | null = null;
/** 订阅先于建会话建立：会话 id 未定期间到达的事件先缓存，拿到 id 后回放 */
let pendingEvents: LiveEvent[] = [];
/** 上一次点选的节点与时间，用于去重（getNodeForLocation 与 inspectNodeRequested 可能双发） */
let lastPick: { backendNodeId: number; at: number } | null = null;

// ---------------- 左侧 screencast ----------------

const imgRef = ref<HTMLImageElement | null>(null);
const stage = ref<HTMLDivElement | null>(null);

/** screencast 帧：画到 img 上并 ack。不 ack 浏览器会限流停发（CDP 协议行为）。 */
function onFrame(params: any): void {
  if (imgRef.value) {
    imgRef.value.src = `data:image/jpeg;base64,${params.data}`;
  }
  frameCount.value += 1;
  const sid = sessionId.value;
  if (sid) {
    void sendCdp(sid, "Page.screencastFrameAck", { sessionId: params.sessionId }).catch(() => {
      /* 会话可能刚关 */
    });
  }
}

/**
 * 把鼠标在画面 img 上的坐标换算成页面视口坐标。
 *
 * 展示区宽度 ≠ 视口宽度（弹窗里只有约 60% 宽），按 img 实际盒子等比映射；
 * img 用 width:100% + height:auto，盒子与内容 1:1，无 letterbox 偏差。
 *
 * @param clientX 鼠标视口横坐标
 * @param clientY 鼠标视口纵坐标
 * @returns 页面 CSS 像素坐标
 */
function toPage(clientX: number, clientY: number): { x: number; y: number } {
  const rect = imgRef.value?.getBoundingClientRect();
  if (!rect || !rect.width || !rect.height) {
    return { x: 0, y: 0 };
  }
  return {
    x: Math.round(((clientX - rect.left) / rect.width) * viewport.value.width),
    y: Math.round(((clientY - rect.top) / rect.height) * viewport.value.height),
  };
}

/** 是否按住左键（非拾取模式下 drag 的 mouseMoved 要带 buttons 掩码） */
let dragging = false;

/** 鼠标移动：两种模式都要转发 —— 拾取模式下浏览器靠它画 hover 高亮，普通模式下靠它触发 :hover */
function onStageMouseMove(ev: MouseEvent): void {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  const { x, y } = toPage(ev.clientX, ev.clientY);
  void sendCdp(sid, "Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
    button: "none",
    buttons: dragging ? 1 : 0,
  }).catch(() => {});
}

/** mousedown：仅普通模式转发；拾取模式下刻意不转发，免得点到链接把页面跳走 */
function onStageMouseDown(ev: MouseEvent): void {
  if (ev.button !== 0) {
    return;
  }
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  if (inspectOn.value) {
    void pickAtPointer(ev);
    return;
  }
  dragging = true;
  const { x, y } = toPage(ev.clientX, ev.clientY);
  void sendCdp(sid, "Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  }).catch(() => {});
}

function onStageMouseUp(ev: MouseEvent): void {
  if (ev.button !== 0 || !dragging) {
    return;
  }
  dragging = false;
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  const { x, y } = toPage(ev.clientX, ev.clientY);
  void sendCdp(sid, "Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  }).catch(() => {});
}

/** 滚轮：两种模式都转发，预览区要能滚动 */
function onStageWheel(ev: WheelEvent): void {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  const { x, y } = toPage(ev.clientX, ev.clientY);
  void sendCdp(sid, "Input.dispatchMouseEvent", {
    type: "mouseWheel",
    x,
    y,
    deltaX: ev.deltaX,
    deltaY: ev.deltaY,
    modifiers: keyModifiers(ev),
  }).catch(() => {});
}

/** Ctrl/Alt/Shift/Meta → CDP 修饰键位掩码（shift=8, alt=1, ctrl=2, meta=4） */
function keyModifiers(ev: KeyboardEvent | WheelEvent): number {
  return (ev.ctrlKey ? 2 : 0) | (ev.altKey ? 1 : 0) | (ev.metaKey ? 4 : 0) | (ev.shiftKey ? 8 : 0);
}

/** 键盘：转发给页面（在预览区按下才转发，控制台输入框有自己的 Enter） */
function onStageKeyDown(ev: KeyboardEvent): void {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  // 拦掉容器自身对方向键/空格的滚动处理，让按键去页面
  ev.preventDefault();
  const printable = ev.key.length === 1;
  const text = printable ? ev.key : ev.key === "Enter" ? "\r" : ev.key === "Tab" ? "\t" : undefined;
  void sendCdp(sid, "Input.dispatchKeyEvent", {
    type: "keyDown",
    key: ev.key,
    code: ev.code,
    modifiers: keyModifiers(ev),
    ...(text ? { text } : {}),
  }).catch(() => {});
  void sendCdp(sid, "Input.dispatchKeyEvent", {
    type: "keyUp",
    key: ev.key,
    code: ev.code,
    modifiers: keyModifiers(ev),
  }).catch(() => {});
}

// ---------------- 拾取 ----------------

const pickedSummary = ref("");
const domPath = ref("");
const pickedHtml = ref("");
const pickedAttrs = ref<Array<[string, string]>>([]);
const cssSelector = ref("");
const xpathSelector = ref("");
const cssMatchCount = ref(0);
const xpathMatchCount = ref(0);

/**
 * 在页面上下文里算选择器的函数（Runtime.callFunctionOn 的 functionDeclaration）。
 *
 * 不能复用前端的 @medv/finder（那是打包进我们 app 的模块，页面里没有），
 * 所以在页面里现算：优先 #id，其次 tag.class，退化到 tag:nth-of-type 路径，
 * 每步用 querySelectorAll 验证唯一性，最后兜底全绝对路径（一定唯一）。
 * XPath 与静态模式同一套绝对路径算法，匹配数在页面里 document.evaluate 数出来。
 */
const PICK_FN = `function () {
  var el = this;
  var doc = el.ownerDocument || document;
  function uniq(sel) {
    try { return doc.querySelectorAll(sel).length === 1; } catch (e) { return false; }
  }
  function nthSeg(node) {
    var tag = node.tagName.toLowerCase();
    var i = 1;
    var s = node.previousElementSibling;
    while (s) { if (s.tagName === node.tagName) { i += 1; } s = s.previousElementSibling; }
    return tag + ":nth-of-type(" + i + ")";
  }
  function cssOf(node) {
    if (node.id) {
      var byId = "#" + CSS.escape(node.id);
      if (uniq(byId)) { return byId; }
    }
    var segs = [];
    var cur = node;
    while (cur && cur.nodeType === 1 && cur !== doc.documentElement) {
      if (cur.id) { segs.unshift("#" + CSS.escape(cur.id)); break; }
      var tag = cur.tagName.toLowerCase();
      var classes = (cur.getAttribute("class") || "").trim().split(/\\s+/).filter(Boolean);
      var seg = null;
      if (classes.length) {
        var two = tag + "." + classes.slice(0, 2).map(function (c) { return CSS.escape(c); }).join(".");
        if (uniq(two)) { seg = two; }
        else {
          var one = tag + "." + CSS.escape(classes[0]);
          if (uniq(one)) { seg = one; }
        }
      }
      if (!seg) { seg = nthSeg(cur); }
      segs.unshift(seg);
      cur = cur.parentElement;
    }
    var joined = segs.join(" > ");
    if (joined && uniq(joined)) { return joined; }
    // 兜底：全链路 nth-of-type 绝对路径（对真实链路必然唯一）
    var abs = [];
    var n = node;
    while (n && n.nodeType === 1) { abs.unshift(nthSeg(n)); n = n.parentElement; }
    var absSel = abs.join(" > ");
    return uniq(absSel) ? absSel : joined;
  }
  function xpathOf(node) {
    var parts = [];
    var cur = node;
    while (cur && cur.nodeType === 1) { parts.unshift(nthSeg(cur).replace(":nth-of-type(", "[").replace(")", "]")); cur = cur.parentElement; }
    return "/" + parts.join("/");
  }
  function domPathOf(node) {
    var parts = [];
    var cur = node;
    while (cur && cur.nodeType === 1) {
      var tag = cur.tagName.toLowerCase();
      var id = cur.getAttribute("id");
      var cls = (cur.getAttribute("class") || "").split(/\\s+/).filter(Boolean).slice(0, 2).join(".");
      parts.unshift(id ? tag + "#" + id : cls ? tag + "." + cls : tag);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }
  var css = cssOf(el);
  var xpath = xpathOf(el);
  var cssCount = 0;
  var xpathCount = 0;
  try { cssCount = css ? doc.querySelectorAll(css).length : 0; } catch (e) { cssCount = 0; }
  try {
    var r = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    xpathCount = r.snapshotLength;
  } catch (e) { xpathCount = 0; }
  var tag = el.tagName ? el.tagName.toLowerCase() : "";
  var cls = ((el.getAttribute && el.getAttribute("class")) || "").split(/\\s+/).filter(Boolean).slice(0, 3).join(" ");
  var text = (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 40);
  var attrs = [];
  if (el.attributes) {
    for (var i = 0; i < el.attributes.length && i < 30; i += 1) {
      attrs.push([el.attributes[i].name, el.attributes[i].value.slice(0, 200)]);
    }
  }
  return {
    summary: "<" + tag + ">" + (cls ? " ." + cls : "") + (text ? "  \u201c" + text + "\u201d" : ""),
    domPath: domPathOf(el),
    html: (el.outerHTML || "").replace(/\\s+/g, " ").trim().slice(0, 500),
    css: css,
    xpath: xpath,
    cssCount: cssCount,
    xpathCount: xpathCount,
    attrs: attrs
  };
}`;

/**
 * 按坐标命中节点并生成选择器（拾取模式下的点击入口）。
 *
 * @param ev 预览区上的鼠标事件
 */
async function pickAtPointer(ev: MouseEvent): Promise<void> {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  const { x, y } = toPage(ev.clientX, ev.clientY);
  try {
    const hit = await sendCdp(sid, "DOM.getNodeForLocation", { x, y, includeUserAgentShadowDOM: true });
    if (hit && typeof hit.backendNodeId === "number") {
      await pickBackendNode(hit.backendNodeId);
    }
  } catch (e) {
    error.value = `点选失败：${e instanceof Error ? e.message : String(e)}`;
  }
}

/**
 * 解析 backendNodeId → 在页面里算选择器 → 回填右侧页签。
 *
 * @param backendNodeId CDP 节点 id
 */
async function pickBackendNode(backendNodeId: number): Promise<void> {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  const now = Date.now();
  if (lastPick && lastPick.backendNodeId === backendNodeId && now - lastPick.at < 300) {
    return;
  }
  lastPick = { backendNodeId, at: now };
  try {
    const resolved = await sendCdp(sid, "DOM.resolveNode", { backendNodeId });
    const objectId = resolved?.object?.objectId;
    if (!objectId) {
      return;
    }
    const call = await sendCdp(sid, "Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: PICK_FN,
      returnByValue: true,
      awaitPromise: false,
    });
    const info = call?.result?.value;
    if (!info) {
      return;
    }
    pickedSummary.value = info.summary || "";
    domPath.value = info.domPath || "";
    pickedHtml.value = info.html || "";
    pickedAttrs.value = Array.isArray(info.attrs) ? info.attrs : [];
    cssSelector.value = info.css || "";
    xpathSelector.value = info.xpath || "";
    cssMatchCount.value = info.cssCount || 0;
    xpathMatchCount.value = info.xpathCount || 0;
    // 联动：在左侧 Elements 树里展开定位到该节点
    locateInTree(backendNodeId);
    // 选中后自动切到选择器页签：用户最关心表达式能不能用
    activeTab.value = "selector";
  } catch (e) {
    error.value = `解析节点失败：${e instanceof Error ? e.message : String(e)}`;
  }
}

function resetPicked(): void {
  pickedSummary.value = "";
  domPath.value = "";
  pickedHtml.value = "";
  pickedAttrs.value = [];
  cssSelector.value = "";
  xpathSelector.value = "";
  cssMatchCount.value = 0;
  xpathMatchCount.value = 0;
  lastPick = null;
}

/** 用某种解析器插入（与静态模式同一语义，由父组件回填字段表达式并关闭弹窗） */
function insert(parserType: string, expression: string): void {
  if (!expression) {
    ElMessage.warning("还没有选中元素");
    return;
  }
  emit("pick", { expression, parserType });
}

async function copy(text: string): Promise<void> {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("复制失败，请手动选中");
  }
}

// ---------------- 拾取模式开关 ----------------

const HIGHLIGHT_CONFIG = {
  showRulers: false,
  showExtensionLines: false,
  displayAsMaterial: false,
  contentColor: { r: 79, g: 124, b: 255, a: 0.2 },
  paddingColor: { r: 79, g: 124, b: 255, a: 0.3 },
  borderColor: { r: 79, g: 124, b: 255, a: 1 },
  marginColor: { r: 255, g: 185, b: 0, a: 0.3 },
  eventTargetColor: { r: 0, g: 185, b: 107, a: 0.3 },
  shapeColor: { r: 255, g: 69, b: 58, a: 0.4 },
  shapeMarginColor: { r: 255, g: 69, b: 58, a: 0.2 },
  cssGridColor: { r: 128, g: 128, b: 128, a: 0.6 },
};

/**
 * 进入/退出 inspect 拾取模式。
 *
 * 协议要求 searchForNode 模式必须内联 highlightConfig（实测缺了报
 * "highlight configuration parameter is missing"），所以每种模式都带上。
 */
async function setInspect(on: boolean): Promise<void> {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  try {
    await sendCdp(sid, "Overlay.setInspectMode", {
      mode: on ? "searchForNode" : "none",
      highlightConfig: HIGHLIGHT_CONFIG,
    });
  } catch (e) {
    console.warn("[live-view] setInspectMode:", e);
  }
}

function toggleInspect(): void {
  inspectOn.value = !inspectOn.value;
  void setInspect(inspectOn.value);
}

// ---------------- Elements DOM 树（F12 左栏） ----------------

/** 树节点（CDP DOM.Node 的精简版） */
interface TreeNode {
  nodeId: number;
  backendNodeId: number;
  /** 1 element / 3 text / 8 comment / 10 doctype / 9 document */
  nodeType: number;
  nodeName: string;
  localName: string;
  nodeValue: string;
  childNodeCount: number;
  /** CDP attributes 是 name,value 交替的一维数组 */
  attributes: string[];
  parentId: number;
  /** 子节点 id 列表；null = 尚未加载 */
  children: number[] | null;
}

interface TreeRow {
  kind: "node" | "close" | "loading";
  key: string;
  id: number;
  depth: number;
  node: TreeNode;
  expanded: boolean;
  hasChildren: boolean;
}

const showTree = ref(true);
const treeLoading = ref(false);
const treeError = ref("");
const treeBodyRef = ref<HTMLElement | null>(null);
/**
 * 原始节点表（nodeId → 节点），刻意用裸 Map 而不是响应式：
 * 大页面上万节点走 Vue 代理开销明显，结构变化后 bump treeVersion 驱动行重算即可。
 */
const treeNodes = new Map<number, TreeNode>();
/** 已展开的节点 id */
const expandedIds = reactive(new Set<number>());
const treeRootId = ref(0);
const treeSelectedId = ref(0);
const treeVersion = ref(0);
let treeReloadTimer: ReturnType<typeof setTimeout> | null = null;
/** 单帧渲染行数上限：防止把超大 DOM 一次铺满导致卡顿 */
const TREE_ROW_LIMIT = 5000;

function bumpTree(): void {
  treeVersion.value += 1;
}

/**
 * 把 CDP DOM.Node（可带整棵子树）登记进 treeNodes。
 *
 * @param raw CDP 原始节点
 * @param parentId 父节点 id（根为 0）
 * @returns 该节点的 nodeId
 */
function buildTree(raw: any, parentId: number): number {
  const node: TreeNode = {
    nodeId: raw.nodeId,
    backendNodeId: raw.backendNodeId,
    nodeType: raw.nodeType,
    nodeName: raw.nodeName || "",
    localName: raw.localName || "",
    nodeValue: raw.nodeValue || "",
    childNodeCount: raw.childNodeCount || 0,
    attributes: Array.isArray(raw.attributes) ? raw.attributes : [],
    parentId,
    children: null,
  };
  treeNodes.set(node.nodeId, node);
  if (Array.isArray(raw.children)) {
    node.children = raw.children.map((c: unknown) => buildTree(c, node.nodeId));
  } else if (node.childNodeCount === 0) {
    node.children = [];
  }
  return node.nodeId;
}

/** 从根把树拍平成渲染行（document 根不渲染，直接渲染其子级） */
const treeRows = computed<TreeRow[]>(() => {
  void treeVersion.value;
  const rows: TreeRow[] = [];
  const rootId = treeRootId.value;
  if (!rootId) {
    return rows;
  }
  const walk = (id: number, depth: number): void => {
    const n = treeNodes.get(id);
    if (!n) {
      return;
    }
    const isDoc = n.nodeType === 9;
    const hasChildren = n.childNodeCount > 0;
    const expanded = isDoc || expandedIds.has(id);
    if (!isDoc) {
      rows.push({ kind: "node", key: `n${id}`, id: n.nodeId, depth, node: n, expanded, hasChildren });
    }
    if (!expanded) {
      return;
    }
    const childDepth = isDoc ? depth : depth + 1;
    if (n.children === null) {
      // 懒加载占位（depth:-1 理论上不会走到，留给 requestChildNodes 兜底）
      rows.push({ kind: "loading", key: `p${id}`, id: n.nodeId, depth: childDepth, node: n, expanded: false, hasChildren: false });
      return;
    }
    for (const c of n.children) {
      walk(c, childDepth);
    }
    if (!isDoc && n.children.length) {
      rows.push({ kind: "close", key: `c${id}`, id: n.nodeId, depth, node: n, expanded, hasChildren });
    }
  };
  walk(rootId, 0);
  return rows;
});

/** 渲染上限裁剪：超出只显示前 N 行，末尾给提示 */
const visibleTreeRows = computed(() => treeRows.value.slice(0, TREE_ROW_LIMIT));

const treeOverflow = computed(() => treeRows.value.length > TREE_ROW_LIMIT);

/** CDP 一维 attributes → [name, value] 对 */
function attrPairs(attrs: string[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (let i = 0; i + 1 < attrs.length; i += 2) {
    out.push([attrs[i], attrs[i + 1]]);
  }
  return out;
}

/**
 * 拉取整棵 DOM 树作为 Elements 根。
 *
 * depth=-1 是「完整可展开树」，一次拿全（与 DevTools 首次 getDocument 一致）；
 * 后续增删改靠 DOM.* 增量事件维护，导航/新文档则整树重拉。
 */
async function loadTreeRoot(): Promise<void> {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  treeLoading.value = true;
  treeError.value = "";
  try {
    const r = await sendCdp(sid, "DOM.getDocument", { depth: -1, pierce: false });
    const root = r?.root;
    if (!root) {
      throw new Error("DOM.getDocument 未返回根节点");
    }
    treeNodes.clear();
    expandedIds.clear();
    treeSelectedId.value = 0;
    treeRootId.value = buildTree(root, 0);
    // 默认展开 document + <html>：进来就能看到 head/body 两层，其余按需展开
    expandedIds.add(treeRootId.value);
    const rootNode = treeNodes.get(treeRootId.value);
    const htmlId = (rootNode?.children || []).find((cid) => treeNodes.get(cid)?.nodeType === 1);
    if (htmlId) {
      expandedIds.add(htmlId);
    }
    bumpTree();
  } catch (e) {
    treeError.value = `读取 DOM 失败：${e instanceof Error ? e.message : String(e)}`;
  } finally {
    treeLoading.value = false;
  }
}

/** 导航/新文档后延迟重拉（nodeId 全部作废，旧树不可信） */
function scheduleTreeReload(delay = 350): void {
  if (treeReloadTimer) {
    clearTimeout(treeReloadTimer);
  }
  treeReloadTimer = setTimeout(() => {
    treeReloadTimer = null;
    if (sessionId.value) {
      void loadTreeRoot();
    }
  }, delay);
}

function clearTree(): void {
  if (treeReloadTimer) {
    clearTimeout(treeReloadTimer);
    treeReloadTimer = null;
  }
  treeNodes.clear();
  expandedIds.clear();
  treeRootId.value = 0;
  treeSelectedId.value = 0;
  bumpTree();
}

/** 展开/收起一行；展开未加载子级时走 requestChildNodes 兜底 */
function toggleTreeRow(row: TreeRow): void {
  if (row.kind !== "node" || !row.hasChildren) {
    return;
  }
  const opening = !expandedIds.has(row.id);
  if (opening) {
    expandedIds.add(row.id);
  } else {
    expandedIds.delete(row.id);
  }
  bumpTree();
  const sid = sessionId.value;
  if (opening && sid && treeNodes.get(row.id)?.children === null) {
    void sendCdp(sid, "DOM.requestChildNodes", { nodeId: row.id, depth: 1 }).catch(() => {
      /* 失败保持占位，再次点击可重试 */
    });
  }
}

/** 行悬停：在页面里高亮对应元素（与 F12 一致） */
function hoverTreeRow(row: TreeRow): void {
  if (row.kind !== "node" || row.node.nodeType !== 1 || !row.node.backendNodeId) {
    return;
  }
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  void sendCdp(sid, "Overlay.highlightNode", {
    backendNodeId: row.node.backendNodeId,
    highlightConfig: HIGHLIGHT_CONFIG,
  }).catch(() => {});
}

function unhoverTreeRow(): void {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  void sendCdp(sid, "Overlay.hideHighlight", {}).catch(() => {});
}

/** 点行：选中；元素节点直接走拾取（生成选择器并回填右侧页签） */
function clickTreeRow(row: TreeRow): void {
  if (row.kind !== "node") {
    return;
  }
  treeSelectedId.value = row.id;
  if (row.node.nodeType === 1 && row.node.backendNodeId) {
    void pickBackendNode(row.node.backendNodeId);
  }
}

/**
 * 按 backendNodeId 在已加载的树里反查并展开定位（点选后自动高亮+滚动可见）。
 *
 * @param backendNodeId CDP 节点 id
 */
function locateInTree(backendNodeId: number): void {
  let hit: TreeNode | undefined;
  for (const n of treeNodes.values()) {
    if (n.backendNodeId === backendNodeId) {
      hit = n;
      break;
    }
  }
  if (!hit) {
    return;
  }
  treeSelectedId.value = hit.nodeId;
  let pid = hit.parentId;
  while (pid) {
    expandedIds.add(pid);
    const p = treeNodes.get(pid);
    if (!p) {
      break;
    }
    pid = p.parentId;
  }
  bumpTree();
  void nextTick(() => {
    const el = treeBodyRef.value?.querySelector(`[data-nid="${hit!.nodeId}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "nearest" });
    }
  });
}

// ---------------- 控制台 ----------------

interface ConsoleLine {
  level: "log" | "info" | "warn" | "error" | "input" | "result";
  text: string;
}

const consoleLines = ref<ConsoleLine[]>([]);
const consoleInput = ref("");
const consoleBody = ref<HTMLElement | null>(null);
/** 控制台上限：防长会话把内存堆爆 */
const CONSOLE_MAX = 500;

function pushConsole(level: ConsoleLine["level"], text: string): void {
  consoleLines.value.push({ level, text });
  if (consoleLines.value.length > CONSOLE_MAX) {
    consoleLines.value.splice(0, consoleLines.value.length - CONSOLE_MAX);
  }
  void nextTick(() => {
    if (consoleBody.value) {
      consoleBody.value.scrollTop = consoleBody.value.scrollHeight;
    }
  });
}

/** 把 CDP RemoteObject 转成可读文本 */
function formatRemote(o: any): string {
  if (!o) {
    return "undefined";
  }
  if ("value" in o) {
    const v = o.value;
    if (typeof v === "string") {
      return v;
    }
    try {
      const s = JSON.stringify(v);
      return s === undefined ? String(v) : s;
    } catch {
      return String(v);
    }
  }
  return o.description ?? o.subtype ?? o.type ?? String(o);
}

/** 执行控制台表达式（await Promise，异常显示 description） */
async function runEval(): Promise<void> {
  const expr = consoleInput.value.trim();
  const sid = sessionId.value;
  if (!expr || !sid) {
    return;
  }
  pushConsole("input", `> ${expr}`);
  consoleInput.value = "";
  try {
    const r = await sendCdp(sid, "Runtime.evaluate", {
      expression: expr,
      awaitPromise: true,
      returnByValue: false,
    });
    if (r?.exceptionDetails) {
      pushConsole(
        "error",
        r.exceptionDetails.exception?.description || r.exceptionDetails.text || "求值出错",
      );
    } else {
      pushConsole("result", formatRemote(r?.result));
    }
  } catch (e) {
    pushConsole("error", e instanceof Error ? e.message : String(e));
  }
}

function clearConsole(): void {
  consoleLines.value = [];
}

// ---------------- 原文 ----------------

const sourceHtml = ref("");
const sourceLoading = ref(false);

async function loadSource(): Promise<void> {
  const sid = sessionId.value;
  if (!sid || sourceLoading.value) {
    return;
  }
  sourceLoading.value = true;
  try {
    const r = await sendCdp(sid, "Runtime.evaluate", {
      expression: "document.documentElement.outerHTML",
      returnByValue: true,
    });
    sourceHtml.value = (r?.result?.value as string) || "";
  } catch (e) {
    sourceHtml.value = `读取失败：${e instanceof Error ? e.message : String(e)}`;
  } finally {
    sourceLoading.value = false;
  }
}

// ---------------- 会话生命周期 ----------------

/**
 * 地址清洗：占位符（如 `${url}`）或残缺地址在预填场景很常见，
 * 它们不是 sidecar 故障 —— 不该触发回退静态（静态抓同一个地址一样失败），
 * 改成打开空白页并在错误条里提示用户补地址。
 *
 * @param raw 用户输入的地址
 * @returns 交给会话的有效 http(s) 地址；空串 = about:blank
 */
function sanitizeUrl(raw: string): { url: string; warning: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { url: "", warning: "" };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { url: "", warning: `地址「${trimmed}」不是有效 URL，已打开空白页；补上完整 http(s) 地址后点「打开」。` };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { url: "", warning: `只支持 http/https 地址（收到 ${parsed.protocol}），已打开空白页。` };
  }
  return { url: parsed.toString(), warning: "" };
}

/**
 * 建实时会话：先订阅事件流（会话创建期间的 console/网络事件不能丢），
 * 再建会话、起 screencast、设拾取模式。
 *
 * 只有「连不上 sidecar / 浏览器起不来」才 emit('fallback') 回退静态；
 * 地址无效属于用户输入问题，留在实时模式里等用户改地址。
 *
 * @param url 要打开的地址
 */
async function connect(url: string): Promise<void> {
  if (connecting.value) {
    return;
  }
  connecting.value = true;
  error.value = "";
  frameCount.value = 0;
  resetPicked();
  consoleLines.value = [];
  sourceHtml.value = "";
  pendingEvents = [];
  try {
    const clean = sanitizeUrl(url);
    error.value = clean.warning;
    unsubscribe = openEvents(onEvent);
    const sess = await createLiveSession(clean.url);
    sessionId.value = sess.sessionId;
    viewport.value = sess.viewport || { width: 1280, height: 800 };
    liveUrl.value = sess.url || clean.url || "about:blank";
    // 回放缓存的事件（建会话期间的 console 等）
    const buffered = pendingEvents;
    pendingEvents = [];
    for (const evt of buffered) {
      onEvent(evt);
    }
    if (!props.visible) {
      // 建会话期间用户把弹窗关了：立即回收
      teardown();
      return;
    }
    const sid = sessionId.value;
    await sendCdp(sid, "Page.startScreencast", {
      format: "jpeg",
      quality: 70,
      maxWidth: viewport.value.width,
      maxHeight: viewport.value.height,
      everyNthFrame: 1,
    });
    await setInspect(inspectOn.value);
    // Elements 树独立于 inspect 模式，始终加载
    void loadTreeRoot();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    error.value = `实时预览连接失败：${msg}`;
    teardown();
    emit("fallback", error.value);
  } finally {
    connecting.value = false;
  }
}

/** 在已建会话里导航到新地址（复用浏览器与事件订阅） */
async function navigate(url: string): Promise<void> {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  error.value = "";
  resetPicked();
  sourceHtml.value = "";
  const clean = sanitizeUrl(url);
  if (clean.warning) {
    error.value = clean.warning;
    return;
  }
  if (!clean.url) {
    // 空地址：导航到空白页，保持会话可用
    try {
      await sendCdp(sid, "Page.navigate", { url: "about:blank" });
      liveUrl.value = "about:blank";
    } catch (e) {
      error.value = `导航失败：${e instanceof Error ? e.message : String(e)}`;
    }
    return;
  }
  try {
    const r = await sendCdp(sid, "Page.navigate", { url: clean.url });
    if (r?.errorText) {
      error.value = `导航失败：${r.errorText}`;
    } else {
      liveUrl.value = clean.url;
    }
  } catch (e) {
    error.value = `导航失败：${e instanceof Error ? e.message : String(e)}`;
  }
}

async function reload(): Promise<void> {
  const sid = sessionId.value;
  if (!sid) {
    return;
  }
  error.value = "";
  resetPicked();
  sourceHtml.value = "";
  try {
    await sendCdp(sid, "Page.reload", {});
  } catch (e) {
    error.value = `刷新失败：${e instanceof Error ? e.message : String(e)}`;
  }
}

/** 销毁会话与订阅（幂等） */
function teardown(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  pendingEvents = [];
  dragging = false;
  clearTree();
  const sid = sessionId.value;
  sessionId.value = "";
  frameCount.value = 0;
  liveUrl.value = "";
  if (sid) {
    void sendCdp(sid, "Page.stopScreencast", {}).catch(() => {});
    void closeLiveSession(sid);
  }
}

// ---------------- 事件分发 ----------------

/** 单条 CDP 事件处理：帧、console、导航、inspect、错误 */
function onEvent(evt: LiveEvent): void {
  if (!sessionId.value) {
    // 会话 id 未就绪：缓存，拿到 id 后回放（只留本会话需要的类型）
    if (pendingEvents.length < 500) {
      pendingEvents.push(evt);
    }
    return;
  }
  if (evt.sessionId !== sessionId.value) {
    return;
  }
  const p = evt.params || {};
  switch (evt.method) {
    case "Page.screencastFrame":
      onFrame(p);
      break;
    case "Overlay.inspectNodeRequested":
      // 拾取模式主路径是 DOM.getNodeForLocation；浏览器若主动上报（如右键拾取）也接住
      if (typeof p.backendNodeId === "number") {
        void pickBackendNode(p.backendNodeId);
      }
      break;
    case "Runtime.consoleAPICalled": {
      const text = (p.args || []).map(formatRemote).join(" ");
      const levelMap: Record<string, ConsoleLine["level"]> = {
        warning: "warn",
        error: "error",
        info: "info",
      };
      pushConsole(levelMap[p.type] || "log", text);
      break;
    }
    case "Runtime.exceptionThrown":
      pushConsole(
        "error",
        p.exceptionDetails?.exception?.description ||
          p.exceptionDetails?.text ||
          "未捕获异常",
      );
      break;
    case "Log.entryAdded":
      if (p.entry) {
        pushConsole(p.entry.level === "warning" ? "warn" : p.entry.level === "error" ? "error" : "info",
          p.entry.text || "");
      }
      break;
    case "Page.frameNavigated":
      if (p.frame && !p.frame.parentId) {
        liveUrl.value = p.frame.url || "";
        resetPicked();
        sourceHtml.value = "";
        // 新文档 nodeId 全变：旧树作废，延迟重拉
        scheduleTreeReload();
        // 导航后 overlay 的 inspect 状态可能被重置，延迟重挂一次
        if (inspectOn.value) {
          setTimeout(() => void setInspect(true), 150);
        }
      }
      break;
    // ---- Elements 树的增量维护（DOM.enable 已在 sidecar 建会话时打开）----
    case "DOM.setChildNodes":
      // requestChildNodes / 插入的应答：父节点挂上子级
      if (typeof p.parentId === "number" && Array.isArray(p.nodes)) {
        const parent = treeNodes.get(p.parentId);
        if (parent) {
          const ids = p.nodes.map((n: unknown) => buildTree(n, parent.nodeId));
          parent.children = [...(parent.children || []), ...ids.filter((i: number) => !(parent.children || []).includes(i))];
          bumpTree();
        }
      }
      break;
    case "DOM.childNodeInserted": {
      // CDP 参数：parentNode(Node), node(Node), previousNodeId(NodeId)
      const parentId: number = p.parentNode?.nodeId || 0;
      const parent = treeNodes.get(parentId);
      if (parent && p.node) {
        const childId = buildTree(p.node, parent.nodeId);
        const kids = parent.children || [];
        const prevIdx = typeof p.previousNodeId === "number" ? kids.indexOf(p.previousNodeId) : -1;
        kids.splice(prevIdx >= 0 ? prevIdx + 1 : kids.length, 0, childId);
        parent.children = kids;
        parent.childNodeCount = kids.length;
        bumpTree();
      }
      break;
    }
    case "DOM.childNodeRemoved": {
      const parent = treeNodes.get(p.parentId);
      if (parent) {
        parent.children = (parent.children || []).filter((cid) => cid !== p.node?.nodeId);
        parent.childNodeCount = parent.children.length;
        const drop = (id: number): void => {
          const n = treeNodes.get(id);
          if (!n) {
            return;
          }
          (n.children || []).forEach(drop);
          treeNodes.delete(id);
          expandedIds.delete(id);
          if (treeSelectedId.value === id) {
            treeSelectedId.value = 0;
          }
        };
        if (p.node?.nodeId) {
          drop(p.node.nodeId);
        }
        bumpTree();
      }
      break;
    }
    case "DOM.childNodeCountUpdated": {
      const n = treeNodes.get(p.nodeId);
      if (n) {
        n.childNodeCount = p.childNodeCount || 0;
        if (!n.childNodeCount) {
          n.children = [];
        }
        bumpTree();
      }
      break;
    }
    case "DOM.documentUpdated":
      // 文档整体重置（同源脚本换文档等）：整树重拉
      scheduleTreeReload();
      break;
    case "DOM.attributeModified": {
      const n = treeNodes.get(p.nodeId);
      if (n) {
        const attrs = [...n.attributes];
        const idx = attrs.findIndex((a, i) => i % 2 === 0 && a === p.name);
        if (idx >= 0) {
          attrs[idx + 1] = p.value;
        } else {
          attrs.push(p.name, p.value);
        }
        n.attributes = attrs;
        bumpTree();
      }
      break;
    }
    case "DOM.characterDataModified": {
      const n = treeNodes.get(p.nodeId);
      if (n) {
        n.nodeValue = p.characterData || "";
        bumpTree();
      }
      break;
    }
    case "__navError":
      error.value = `导航失败：${p.message || "未知错误"}`;
      break;
    case "__crash":
      error.value = "页面崩溃，请刷新或重开弹窗";
      break;
    default:
      break;
  }
}

// ---------------- 生命周期与父组件联动 ----------------

watch(
  () => props.visible,
  (open) => {
    if (open) {
      if (!sessionId.value && !connecting.value) {
        void connect(props.url);
      }
    } else {
      teardown();
    }
  },
);

watch(
  () => props.navNonce,
  (n) => {
    if (!n || !props.visible) {
      return;
    }
    if (sessionId.value) {
      void navigate(props.url);
    } else if (!connecting.value) {
      void connect(props.url);
    }
  },
);

watch(activeTab, (tab) => {
  if (tab === "source" && !sourceHtml.value) {
    void loadSource();
  }
});

onMounted(() => {
  if (props.visible) {
    void connect(props.url);
  }
});

onBeforeUnmount(() => {
  teardown();
});

const statusText = computed(() => {
  if (connecting.value) {
    return "正在启动浏览器…";
  }
  if (!sessionId.value) {
    return "未连接";
  }
  return `实时 · ${viewport.value.width}×${viewport.value.height} · ${frameCount.value} 帧`;
});
</script>

<template>
  <div class="lv-main" :class="{ 'lv-no-tree': !showTree }">
    <!-- 最左：F12 风格 Elements DOM 树 -->
    <div v-if="showTree" class="lv-tree">
      <div class="lv-tree-bar">
        <span class="lv-tree-title">Elements</span>
        <span v-if="treeLoading" class="lv-tree-hint">读取中…</span>
        <span v-else-if="treeError" class="lv-tree-hint lv-tree-hint-err" :title="treeError">失败</span>
        <button
          v-else
          class="lv-tree-refresh"
          type="button"
          title="重新读取 DOM 树"
          @click="loadTreeRoot"
        >
          ⟳
        </button>
      </div>
      <div ref="treeBodyRef" class="lv-tree-body" @mouseleave="unhoverTreeRow">
        <div v-if="treeError" class="lv-tree-empty">{{ treeError }}</div>
        <div v-else-if="!visibleTreeRows.length && !treeLoading" class="lv-tree-empty">
          等待页面 DOM…
        </div>
        <template v-else>
          <div
            v-for="row in visibleTreeRows"
            :key="row.key"
            class="lv-tree-row"
            :class="{
              'lv-tree-sel': row.id === treeSelectedId,
              'lv-tree-close': row.kind === 'close',
              'lv-tree-loading': row.kind === 'loading',
            }"
            :style="{ paddingLeft: `${row.depth * 14 + 6}px` }"
            :data-nid="row.kind === 'node' ? row.id : undefined"
            @mouseover="hoverTreeRow(row)"
            @click="clickTreeRow(row)"
          >
            <span
              v-if="row.kind === 'node' && row.hasChildren"
              class="lv-tree-arrow"
              :class="{ 'lv-tree-arrow-open': row.expanded }"
              @click.stop="toggleTreeRow(row)"
            >▸</span>
            <span v-else-if="row.kind === 'node'" class="lv-tree-arrow lv-tree-arrow-leaf" />
            <span v-if="row.kind === 'loading'" class="lv-tree-placeholder">…</span>
            <template v-else-if="row.kind === 'close'">
              <span class="lv-tree-punc">&lt;/</span><span class="lv-tree-tag">{{ row.node.localName }}</span
              ><span class="lv-tree-punc">&gt;</span>
            </template>
            <template v-else-if="row.node.nodeType === 9">
              <span class="lv-tree-punc">#document</span>
            </template>
            <template v-else-if="row.node.nodeType === 10">
              <span class="lv-tree-punc">&lt;!DOCTYPE {{ row.node.nodeName }}&gt;</span>
            </template>
            <template v-else-if="row.node.nodeType === 3">
              <span class="lv-tree-text">"{{ (row.node.nodeValue || "").replace(/\s+/g, " ").trim().slice(0, 60) }}"</span>
            </template>
            <template v-else-if="row.node.nodeType === 8">
              <span class="lv-tree-comment">&lt;!-- {{ (row.node.nodeValue || "").trim().slice(0, 60) }} --&gt;</span>
            </template>
            <template v-else>
              <span class="lv-tree-punc">&lt;</span><span class="lv-tree-tag">{{ row.node.localName }}</span
              ><template v-for="(pair, ai) in attrPairs(row.node.attributes)" :key="ai"
                ><span class="lv-tree-attr"> {{ pair[0] }}</span
                ><span class="lv-tree-punc">=</span
                ><span class="lv-tree-value">"{{ pair[1].slice(0, 80) }}"</span></template
              ><span class="lv-tree-punc">&gt;</span>
              <span v-if="!row.hasChildren" class="lv-tree-punc">&lt;/{{ row.node.localName }}&gt;</span>
            </template>
          </div>
          <div v-if="treeOverflow" class="lv-tree-empty">
            树过大，仅显示前 {{ TREE_ROW_LIMIT }} 行（共 {{ treeRows.length }} 行）；点选页面元素可精确定位。
          </div>
        </template>
      </div>
    </div>

    <!-- 中：screencast 画面 -->
    <div class="lv-left">
      <div class="lv-toolbar">
        <ElButton
          size="small"
          :type="showTree ? 'primary' : 'default'"
          title="显示/隐藏 DOM 元素树（F12 Elements）"
          @click="showTree = !showTree"
        >
          Elements
        </ElButton>
        <ElButton size="small" :type="inspectOn ? 'primary' : 'default'" @click="toggleInspect">
          {{ inspectOn ? "拾取模式：开" : "拾取模式：关" }}
        </ElButton>
        <ElButton size="small" text :disabled="!sessionId" @click="reload">刷新页面</ElButton>
        <span class="lv-status">
          <span class="lv-dot" :class="{ 'lv-dot-on': Boolean(sessionId) }" />
          {{ statusText }}
        </span>
      </div>
      <div
        ref="stage"
        class="lv-stage"
        :class="{ 'lv-stage-inspect': inspectOn }"
        tabindex="0"
        @mousemove="onStageMouseMove"
        @mousedown="onStageMouseDown"
        @mouseup="onStageMouseUp"
        @wheel.prevent="onStageWheel"
        @keydown="onStageKeyDown"
        @contextmenu.prevent
      >
        <img ref="imgRef" class="lv-frame" draggable="false" alt="实时预览" />
        <div v-if="connecting" class="lv-placeholder">正在启动浏览器…</div>
        <div v-else-if="!sessionId" class="lv-placeholder">实时会话已断开</div>
      </div>
      <div class="lv-url" :title="liveUrl">{{ liveUrl || props.url }}</div>
    </div>

    <!-- 右：DevTools 风格页签 -->
    <div class="lv-right">
      <ElTabs v-model="activeTab" class="lv-tabs">
        <ElTabPane label="元素" name="element">
          <div class="lv-picked">
            <span class="lv-label">已选元素</span>
            <span v-if="pickedSummary" class="lv-summary">{{ pickedSummary }}</span>
            <span v-else class="lv-empty">
              {{ inspectOn ? "在左侧画面上点一下元素" : "先打开「拾取模式」再点选元素" }}
            </span>
          </div>
          <div v-if="domPath" class="lv-kv">
            <span class="lv-label">DOM 路径</span>
            <code class="lv-code">{{ domPath }}</code>
          </div>
          <div v-if="pickedHtml" class="lv-kv">
            <span class="lv-label">HTML 片段</span>
            <code class="lv-code lv-multiline">{{ pickedHtml }}</code>
          </div>
          <div v-if="pickedAttrs.length" class="lv-attrs">
            <div class="lv-attr" v-for="([name, value], i) in pickedAttrs" :key="i">
              <span class="lv-attr-name">{{ name }}</span>
              <span class="lv-attr-value">{{ value }}</span>
            </div>
          </div>
          <div class="lv-meta">
            实时地址：{{ liveUrl || "—" }}<br />
            视口：{{ viewport.width }}×{{ viewport.height }} · 已渲染 {{ frameCount }} 帧
          </div>
        </ElTabPane>

        <ElTabPane label="选择器" name="selector">
          <div class="lv-row">
            <span class="lv-label">CSS</span>
            <code class="lv-code">{{ cssSelector || "—" }}</code>
            <span class="lv-count">{{ cssSelector ? `${cssMatchCount} 个匹配` : "" }}</span>
          </div>
          <div class="lv-row lv-actions">
            <ElButton
              :type="recommendXpath ? 'default' : 'primary'"
              :disabled="!cssSelector"
              @click="insert('CSS', cssSelector)"
            >
              用 CSS 插入
            </ElButton>
            <ElButton text :disabled="!cssSelector" @click="copy(cssSelector)">复制</ElButton>
          </div>
          <div class="lv-row">
            <span class="lv-label">XPath</span>
            <code class="lv-code">{{ xpathSelector || "—" }}</code>
            <span class="lv-count">{{ xpathSelector ? `${xpathMatchCount} 个匹配` : "" }}</span>
          </div>
          <div class="lv-row lv-actions">
            <ElButton
              :type="recommendXpath ? 'primary' : 'default'"
              :disabled="!xpathSelector"
              @click="insert('XPATH', xpathSelector)"
            >
              用 XPath 插入
            </ElButton>
            <ElButton text :disabled="!xpathSelector" @click="copy(xpathSelector)">复制</ElButton>
          </div>
          <div class="lv-tip">XPath 属性请写在表达式里，如 //a/@href；右侧取值方式对它无效。</div>
        </ElTabPane>

        <ElTabPane label="原文" name="source">
          <div class="lv-source-bar">
            <ElButton size="small" text :loading="sourceLoading" @click="loadSource">重新读取</ElButton>
          </div>
          <pre class="lv-source">{{ (sourceHtml || "").slice(0, 20000) }}</pre>
          <div v-if="sourceHtml.length > 20000" class="lv-tip">
            原文过长，仅显示前 20000 字符（共 {{ sourceHtml.length }} 字符）。
          </div>
          <div v-if="!sourceHtml && !sourceLoading" class="lv-tip">原文尚未读取。</div>
        </ElTabPane>

        <ElTabPane label="控制台" name="console">
          <div ref="consoleBody" class="lv-console">
            <div
              v-for="(line, i) in consoleLines"
              :key="i"
              class="lv-console-line"
              :class="`lv-console-${line.level}`"
            >{{ line.text }}</div>
            <div v-if="!consoleLines.length" class="lv-empty">
              暂无输出；在下面输入表达式可直接在预览页里执行。
            </div>
          </div>
          <div class="lv-console-bar">
            <ElInput
              v-model="consoleInput"
              placeholder="输入表达式，回车执行，如 document.title"
              size="small"
              @keyup.enter="runEval"
            />
            <ElButton size="small" type="primary" :disabled="!consoleInput.trim()" @click="runEval">
              执行
            </ElButton>
            <ElButton size="small" text @click="clearConsole">清空</ElButton>
          </div>
        </ElTabPane>
      </ElTabs>

      <div v-if="error" class="lv-error">
        {{ error }}
        <ElButton size="small" text type="primary" @click="emit('fallback', error)">
          改用静态预览
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lv-main {
  display: grid;
  grid-template-columns: 260px 3fr 2fr;
  gap: 10px;
  margin-top: 10px;
}

/* 隐藏 Elements 树时回到两列 */
.lv-main.lv-no-tree {
  grid-template-columns: 3fr 2fr;
}

.lv-left {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 520px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

/* ---------------- Elements DOM 树 ---------------- */

.lv-tree {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 520px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.lv-tree-bar {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 5px 8px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.lv-tree-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.lv-tree-hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.lv-tree-hint-err {
  color: var(--el-color-danger);
}

.lv-tree-refresh {
  margin-left: auto;
  padding: 0 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: none;
  border: none;
  cursor: pointer;
}

.lv-tree-refresh:hover {
  color: var(--el-color-primary);
}

.lv-tree-body {
  flex: 1;
  min-height: 0;
  padding: 4px 0;
  overflow: auto;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 18px;
}

.lv-tree-empty {
  padding: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  word-break: break-all;
}

.lv-tree-row {
  display: flex;
  align-items: baseline;
  padding-right: 6px;
  overflow: hidden;
  cursor: default;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lv-tree-row:hover {
  background: var(--el-fill-color-light);
}

/* 选中行（拾取或点树反选时高亮，对齐 F12 选中态） */
.lv-tree-sel,
.lv-tree-sel:hover {
  background: var(--el-color-primary-light-9);
}

.lv-tree-close {
  color: var(--el-text-color-secondary);
}

.lv-tree-loading {
  color: var(--el-text-color-placeholder);
}

.lv-tree-arrow {
  flex: none;
  display: inline-block;
  width: 14px;
  color: var(--el-text-color-secondary);
  text-align: center;
  cursor: pointer;
  transform-origin: 50% 50%;
}

.lv-tree-arrow-open {
  transform: rotate(90deg);
}

.lv-tree-arrow-leaf {
  cursor: default;
}

.lv-tree-placeholder {
  color: var(--el-text-color-placeholder);
}

.lv-tree-punc {
  color: var(--el-text-color-secondary);
}

.lv-tree-tag {
  color: var(--el-color-primary);
}

.lv-tree-attr {
  color: var(--el-color-warning);
}

.lv-tree-value {
  color: var(--el-color-success);
}

.lv-tree-text {
  color: var(--el-text-color-regular);
}

.lv-tree-comment {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.lv-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.lv-status {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.lv-dot {
  width: 8px;
  height: 8px;
  background: var(--el-text-color-placeholder);
  border-radius: 50%;
}

.lv-dot-on {
  background: var(--el-color-success);
}

.lv-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #f5f6f8;
  outline: none;
}

/* 拾取模式：十字光标，提示当前点选语义 */
.lv-stage-inspect {
  cursor: crosshair;
}

.lv-frame {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
}

.lv-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.lv-url {
  padding: 4px 8px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
}

.lv-right {
  min-width: 0;
  height: 520px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.lv-tabs {
  padding: 0 10px 10px;
}

.lv-picked {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-top: 10px;
  font-size: 12px;
}

.lv-label {
  flex: none;
  width: 62px;
  color: var(--el-text-color-secondary);
}

.lv-summary {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.lv-empty {
  color: var(--el-text-color-placeholder);
}

.lv-kv {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 8px;
  font-size: 12px;
}

.lv-code {
  flex: 1;
  padding: 4px 8px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.lv-multiline {
  max-height: 120px;
  overflow: auto;
  text-overflow: clip;
  white-space: normal;
  word-break: break-all;
}

.lv-attrs {
  max-height: 160px;
  margin-top: 8px;
  overflow: auto;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.lv-attr {
  display: flex;
  gap: 8px;
  padding: 2px 8px;
  font-size: 12px;
}

.lv-attr-name {
  flex: none;
  color: var(--el-color-primary);
}

.lv-attr-value {
  overflow: hidden;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lv-meta {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.lv-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
}

.lv-count {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.lv-actions {
  justify-content: flex-end;
}

.lv-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.lv-source-bar {
  display: flex;
  justify-content: flex-end;
}

.lv-source {
  max-height: 400px;
  padding: 8px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.lv-console {
  height: 320px;
  padding: 6px 8px;
  overflow: auto;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.lv-console-line {
  white-space: pre-wrap;
  word-break: break-all;
}

.lv-console-log {
  color: var(--el-text-color-primary);
}

.lv-console-info {
  color: var(--el-color-info);
}

.lv-console-warn {
  color: var(--el-color-warning);
}

.lv-console-error {
  color: var(--el-color-danger);
}

.lv-console-input {
  color: var(--el-color-primary);
}

.lv-console-result {
  color: var(--el-color-success);
}

.lv-console-bar {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
}

.lv-error {
  margin: 8px 10px 10px;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 4px;
}

@media (max-width: 900px) {
  .lv-main {
    grid-template-columns: 1fr;
  }

  .lv-left,
  .lv-right {
    height: 380px;
  }
}
</style>
