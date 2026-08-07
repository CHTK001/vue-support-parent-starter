<script setup lang="ts">
/**
 * ReGraph default 主题 —— 关系图全能组件
 *
 * 封装 @relation-graph/vue3，提供：
 *   - data / options / instance 全套 props 透传
 *   - mode 预设：force / mind / tree / circle / center / fixed / relation
 *   - 完整功能：搜索高亮 / 路径模式 / 右键扩线 / 折叠 / 锁定 / 历史回溯 / 批量操作 / 导入导出
 *   - 支持插槽：node、line、view、toolbar、overlay（操作面板）
 *   - emit 事件：ready、node-click、line-click、layout-change、search-change、expand
 */
import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  ArrowRight,
  Connection,
  Delete,
  Download,
  Expand,
  Folder,
  FullScreen,
  Histogram,
  Lock,
  Position,
  Refresh,
  Search,
  Unlock,
  Upload,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
import RelationGraph, {
  type JsonLine,
  type JsonNode,
  type RGJsonData,
  type RGLine,
  type RGLink,
  type RGNode,
  type RGNodeSlotProps,
  type RGOptions,
  type RGUserEvent,
} from "@relation-graph/vue3";
import "@relation-graph/vue3/style.css";
import {
  collectChildIds,
  findShortestPath,
  fuzzyMatchNodes,
  splitKeywords,
  buildContainerStyle,
  buildFinalData,
} from "../../internals";
import type {
  ExpandFetcher,
  HistorySnapshot,
  NodeMenuAction,
  SearchMode,
} from "../../internals";

defineOptions({ name: "ReGraph", inheritAttrs: true });

/** 预设布局模式 */
export type ReGraphMode =
  | "force"
  | "mind"
  | "tree"
  | "circle"
  | "center"
  | "fixed"
  | "relation";

/** 工具栏功能开关 */
export interface ReGraphToolbarOptions {
  /** 显示搜索框 */
  search?: boolean;
  /** 显示布局切换 */
  layout?: boolean;
  /** 显示缩放按钮 */
  zoom?: boolean;
  /** 显示适配按钮 */
  fit?: boolean;
  /** 显示折叠全部 */
  collapseAll?: boolean;
  /** 显示展开全部 */
  expandAll?: boolean;
  /** 显示导入导出 */
  importExport?: boolean;
  /** 显示历史回溯 */
  history?: boolean;
}

const props = withDefaults(
  defineProps<{
    /** 预设模式（决定默认布局与配置），可被 options.layoutName 覆盖 */
    mode?: ReGraphMode;
    /** 节点/连线数据 */
    data?: RGJsonData;
    /** 节点列表（与 data.nodes 二选一） */
    nodes?: JsonNode[];
    /** 连线列表（与 data.lines 二选一） */
    lines?: JsonLine[];
    /** 图配置 */
    options?: RGOptions;
    /** 容器高度 */
    height?: string | number;
    /** 容器宽度 */
    width?: string | number;
    /** 是否显示工具栏 */
    showToolbar?: boolean;
    /** 是否显示小地图 */
    showMiniView?: boolean;
    /** 是否启用编辑模式 */
    editable?: boolean;
    /** 是否显示调试信息 */
    debug?: boolean;
    /** 工具栏功能开关 */
    toolbar?: ReGraphToolbarOptions;
    /** 远程扩线接口 */
    fetchExpand?: ExpandFetcher;
    /** 是否启用历史记录 */
    enableHistory?: boolean;
    /** 历史栈最大长度 */
    maxHistorySize?: number;
  }>(),
  {
    mode: "force",
    data: undefined,
    nodes: undefined,
    lines: undefined,
    options: undefined,
    height: "100%",
    width: "100%",
    showToolbar: true,
    showMiniView: false,
    editable: false,
    debug: false,
    toolbar: () => ({
      search: true,
      layout: true,
      zoom: true,
      fit: true,
      collapseAll: true,
      expandAll: true,
      importExport: true,
      history: true,
    }),
    fetchExpand: undefined,
    enableHistory: true,
    maxHistorySize: 50,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: RGNode, ev: RGUserEvent): void;
  (e: "line-click", line: RGLine, link: RGLink, ev: RGUserEvent): void;
  (e: "layout-change", name: string): void;
  (e: "search-change", keyword: string, matched: JsonNode[]): void;
  (e: "expand", node: JsonNode, payload: { nodes: JsonNode[]; links: JsonLine[] }): void;
  (e: "node-menu", action: NodeMenuAction, node: JsonNode): void;
}>();

/** relation-graph 实例引用 */
const instance = shallowRef<unknown>(null);

/** 内置数据源（用于 import/export / 撤销重做） */
const internalData = reactive<{ nodes: JsonNode[]; lines: JsonLine[] }>({
  nodes: [],
  lines: [],
});

/** 当前右键菜单（DOM 坐标） */
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  node: null as JsonNode | null,
});

/** 搜索相关 */
const search = reactive({
  keyword: "",
  mode: "highlight" as SearchMode,
  matched: [] as JsonNode[],
});

/** 历史栈 */
const history = reactive({
  past: [] as HistorySnapshot[],
  future: [] as HistorySnapshot[],
  paused: false,
});

/** 加载中标记（按节点 id 记录） */
const loadingMap = reactive<Record<string, boolean>>({});

/** 文件输入引用（用于导入 JSON） */
const fileInputRef = ref<HTMLInputElement | null>(null);

/** 当前模式对应的默认 options */
function buildDefaultOptions(mode: ReGraphMode): RGOptions {
  const base: RGOptions = {
    debug: props.debug,
    defaultLineShape: 1,
    defaultNodeShape: 0,
    defaultNodeWidth: 60,
    defaultNodeHeight: 60,
    defaultLineTextOnPath: true,
    defaultExpandHolderPosition: "right",
    reLayoutWhenExpandedOrCollapsed: true,
    enableMultiSelect: true,
    multiSelectKey: "ctrl",
    enableSelectionBox: true,
    selectionBoxColor: "rgba(0, 136, 255, 0.25)",
    selectionBoxBorderColor: "#0088ff",
    selectionBoxBorderWidth: 2,
    moveSelectedNodesTogether: true,
    enableNearbyHighlight: true,
  };

  switch (mode) {
    case "force":
      return {
        ...base,
        layout: {
          layoutName: "force",
          force_node_repulsion: 1000,
          force_line_elastic: 100,
          force_friction: 0.6,
          preventNodeOverlap: true,
          preventOverlapInnerPadding: 20,
        } as RGOptions["layout"],
      };
    case "mind":
      return {
        ...base,
        layout: { layoutName: "mindmap" } as RGOptions["layout"],
      };
    case "tree":
      return {
        ...base,
        layout: {
          layoutName: "tree",
          from: "top",
          distance_coefficient: 1.2,
        } as RGOptions["layout"],
      };
    case "circle":
      return {
        ...base,
        layout: { layoutName: "circle" } as RGOptions["layout"],
      };
    case "center":
      return {
        ...base,
        layout: { layoutName: "center" } as RGOptions["layout"],
      };
    case "fixed":
      return {
        ...base,
        layout: { layoutName: "fixed" } as RGOptions["layout"],
      };
    case "relation":
    default:
      return {
        ...base,
        layout: { layoutName: "center" } as RGOptions["layout"],
      };
  }
}

/** 最终 options：用户传入优先，否则按 mode 生成 */
const finalOptions = computed<RGOptions>(() => {
  const userOpts = props.options ?? {};
  const modeOpts = buildDefaultOptions(props.mode);
  return {
    ...modeOpts,
    ...userOpts,
    layout: {
      ...modeOpts.layout,
      ...(userOpts.layout ?? {}),
    } as RGOptions["layout"],
  };
});

/** 最终 data：data 优先，否则组装 nodes/lines，并同步给 internalData */
const finalData = computed<RGJsonData>(() => {
  if (props.data) return props.data;
  return {
    rootId: "",
    nodes: internalData.nodes.length ? internalData.nodes : (props.nodes ?? []),
    lines: internalData.lines.length ? internalData.lines : (props.lines ?? []),
  } as RGJsonData;
});

/** 容器样式 */
const containerStyle = computed<Record<string, string>>(() =>
  buildContainerStyle(props.width, props.height),
);

/** 等待实例就绪 */
async function onReady(ins: unknown) {
  instance.value = ins;
  // 把 props.data 同步给 internalData（供历史记录使用）
  const incoming = props.data ?? {
    nodes: props.nodes ?? [],
    lines: props.lines ?? [],
  };
  internalData.nodes = [...(incoming.nodes ?? [])];
  internalData.lines = [...(incoming.lines ?? [])];
  emit("ready", ins);
}

/** 节点点击 → 选中 */
function onNodeClick(node: RGNode, e: RGUserEvent) {
  emit("node-click", node, e);
}

/** 连线点击 */
function onLineClick(line: RGLine, link: RGLink, e: RGUserEvent) {
  emit("line-click", line, link, e);
}

/** 记录历史快照 */
function recordSnapshot(snap: HistorySnapshot) {
  if (!props.enableHistory || history.paused) return;
  history.past.push(snap);
  if (history.past.length > props.maxHistorySize) {
    history.past.shift();
  }
  history.future = [];
}

/** mode 切换时重新布局 */
watch(
  () => props.mode,
  async () => {
    const ins = instance.value as
      | {
          setOptions?: (o: RGOptions) => Promise<void>;
          refresh?: () => Promise<void>;
        }
      | null;
    if (!ins) return;
    if (typeof ins.setOptions === "function") {
      await ins.setOptions(finalOptions.value);
    }
    if (typeof ins.refresh === "function") {
      await ins.refresh();
    }
    recordSnapshot({
      timestamp: Date.now(),
      action: "layout-change",
    });
    emit("layout-change", props.mode);
  },
);

onBeforeUnmount(() => {
  instance.value = null;
  contextMenu.visible = false;
});

// ============================================================
// 搜索 & 路径模式
// ============================================================

/** 触发搜索 */
function runSearch(value: string) {
  search.keyword = value;
  const allNodes = (finalData.value.nodes ?? []) as JsonNode[];
  const allLines = (finalData.value.lines ?? []) as JsonLine[];

  if (!value.trim()) {
    clearSearch();
    return;
  }

  const keywords = splitKeywords(value);
  const matched = new Set<string>();
  keywords.forEach((kw) => {
    fuzzyMatchNodes(allNodes, kw).forEach((n) => matched.add(n.id));
  });
  const matchedNodes = allNodes.filter((n) => matched.has(n.id));
  search.matched = matchedNodes;

  if (search.mode === "path") {
    runPathSearch(matchedNodes, allNodes, allLines);
  } else {
    runHighlightSearch(matchedNodes);
  }
  emit("search-change", value, matchedNodes);
}

/** 高亮模式：匹配的节点高亮，其他变暗 */
async function runHighlightSearch(matched: JsonNode[]) {
  const ins = instance.value as
    | {
        setOthersDim?: (dim: boolean, opacity?: number) => Promise<void>;
        setNodesHighlight?: (ids: string[], style?: unknown) => Promise<void>;
        clearHighlight?: () => Promise<void>;
      }
    | null;
  if (!ins) return;
  if (typeof ins.clearHighlight === "function") {
    await ins.clearHighlight();
  }
  if (typeof ins.setOthersDim === "function") {
    await ins.setOthersDim(true, 0.15);
  }
  if (typeof ins.setNodesHighlight === "function") {
    await ins.setNodesHighlight(
      matched.map((n) => n.id),
      { borderColor: "#ff6600", borderWidth: 3 },
    );
  }
}

/** 路径模式：两两计算最短路径 */
async function runPathSearch(
  matched: JsonNode[],
  allNodes: JsonNode[],
  allLines: JsonLine[],
) {
  const ins = instance.value as
    | {
        highlightPath?: (
          a: RGNode | string,
          b: RGNode | string,
          color?: string,
        ) => Promise<void>;
        clearHighlight?: () => Promise<void>;
        setOthersDim?: (dim: boolean, opacity?: number) => Promise<void>;
      }
    | null;
  if (!ins) return;
  if (typeof ins.clearHighlight === "function") {
    await ins.clearHighlight();
  }
  if (matched.length < 2) {
    // 退化为高亮模式
    await runHighlightSearch(matched);
    return;
  }
  const color = "#ff6600";
  let first = true;
  for (let i = 0; i < matched.length - 1; i++) {
    const a = matched[i];
    const b = matched[i + 1];
    const path = findShortestPath(
      allNodes.map((n) => n.id),
      allLines,
      a.id,
      b.id,
    );
    if (path.nodeIds.size === 0) continue;
    if (typeof ins.highlightPath === "function") {
      await ins.highlightPath(a.id, b.id, color);
    }
    if (first && typeof ins.setOthersDim === "function") {
      await ins.setOthersDim(true, 0.15);
      first = false;
    }
  }
}

/** 清空搜索 */
async function clearSearch() {
  search.keyword = "";
  search.matched = [];
  const ins = instance.value as
    | {
        clearHighlight?: () => Promise<void>;
        setOthersDim?: (dim: boolean) => Promise<void>;
      }
    | null;
  if (!ins) return;
  if (typeof ins.clearHighlight === "function") {
    await ins.clearHighlight();
  }
  if (typeof ins.setOthersDim === "function") {
    await ins.setOthersDim(false);
  }
  emit("search-change", "", []);
}

/** 切换搜索模式 */
function toggleSearchMode() {
  search.mode = search.mode === "highlight" ? "path" : "highlight";
  if (search.keyword) {
    runSearch(search.keyword);
  }
}

// ============================================================
// 右键菜单 / 扩线 / 折叠 / 锁定
// ============================================================

/** 节点右键事件 → 打开菜单 */
function onNodeContextMenu(node: JsonNode, ev: MouseEvent) {
  contextMenu.visible = true;
  contextMenu.x = ev.clientX;
  contextMenu.y = ev.clientY;
  contextMenu.node = node;
  ev.preventDefault();
}

/** 关闭右键菜单 */
function closeContextMenu() {
  contextMenu.visible = false;
}

/** 处理右键菜单动作 */
async function handleMenuAction(action: NodeMenuAction) {
  const node = contextMenu.node;
  closeContextMenu();
  if (!node) return;
  emit("node-menu", action, node);
  const ins = instance.value as
    | {
        expandNodeById?: (id: string) => Promise<void>;
        collapseNodeById?: (id: string) => Promise<void>;
        updateNode?: (n: RGNode, patch: Record<string, unknown>) => Promise<void>;
        hideNode?: (id: string) => Promise<void>;
        showNode?: (id: string) => Promise<void>;
        focusNodeById?: (id: string) => Promise<void>;
        removeNodeById?: (id: string) => Promise<void>;
        getNodeById?: (id: string) => RGNode | undefined;
      }
    | null;
  if (!ins) return;

  const live = typeof ins.getNodeById === "function" ? ins.getNodeById(node.id) : null;
  const target = (live ?? node) as RGNode;

  switch (action) {
    case "expand":
      await expandNode(node);
      break;
    case "collapse":
      await collapseNode(node);
      break;
    case "lock":
      if (typeof ins.updateNode === "function") {
        await ins.updateNode(target, { locked: true });
        recordSnapshot({
          timestamp: Date.now(),
          action: "lock",
          nodeStateChanges: [{ id: node.id, before: { locked: false }, after: { locked: true } }],
        });
      }
      break;
    case "unlock":
      if (typeof ins.updateNode === "function") {
        await ins.updateNode(target, { locked: false });
        recordSnapshot({
          timestamp: Date.now(),
          action: "unlock",
          nodeStateChanges: [{ id: node.id, before: { locked: true }, after: { locked: false } }],
        });
      }
      break;
    case "hide":
      if (typeof ins.hideNode === "function") await ins.hideNode(node.id);
      break;
    case "show":
      if (typeof ins.showNode === "function") await ins.showNode(node.id);
      break;
    case "focus":
      if (typeof ins.focusNodeById === "function") {
        await ins.focusNodeById(node.id);
      }
      break;
    case "remove":
      try {
        await ElMessageBox.confirm(`确定删除节点「${node.text}」？`, "删除确认", {
          type: "warning",
        });
        if (typeof ins.removeNodeById === "function") {
          await ins.removeNodeById(node.id);
          recordSnapshot({
            timestamp: Date.now(),
            action: "remove-nodes",
            removedNodes: [node],
          });
        }
      } catch {
        /* 用户取消 */
      }
      break;
  }
}

/** 双击节点 → 触发扩线 */
async function onNodeDblClick(node: JsonNode) {
  await expandNode(node);
}

/** 远程扩线节点 */
async function expandNode(node: JsonNode) {
  if (!props.fetchExpand) {
    ElMessage.info("未配置 fetchExpand，无法扩线");
    return;
  }
  if (loadingMap[node.id]) return;
  const ins = instance.value as
    | {
        addNodes?: (n: JsonNode[]) => Promise<void>;
        addLines?: (l: JsonLine[]) => Promise<void>;
        updateNode?: (n: RGNode, p: Record<string, unknown>) => Promise<void>;
        doLayout?: () => Promise<void>;
        getNodes?: () => RGNode[];
        getLinks?: () => RGLink[];
      }
    | null;
  if (!ins) return;
  loadingMap[node.id] = true;
  try {
    const payload = await props.fetchExpand(node.id);
    const existingNodeIds = new Set(
      (ins.getNodes?.() ?? []).map((n) => (n as RGNode).id),
    );
    const existingLineKeys = new Set(
      (ins.getLinks?.() ?? [] ).map((l) => {
        const line = l as unknown as RGLine & { from?: string; to?: string };
        return `${line.from ?? ""}-${line.to ?? ""}`;
      }),
    );
    const newNodes = payload.nodes.filter((n) => !existingNodeIds.has(n.id));
    const newLines = payload.links.filter((l) => {
      const s = l.from ?? (l as { source?: string }).source;
      const t = l.to ?? (l as { target?: string }).target;
      return s && t && !existingLineKeys.has(`${s}-${t}`);
    });
    if (newNodes.length && typeof ins.addNodes === "function") {
      await ins.addNodes(newNodes);
    }
    if (newLines.length && typeof ins.addLines === "function") {
      await ins.addLines(newLines);
    }
    if (typeof ins.updateNode === "function") {
      await ins.updateNode(node as unknown as RGNode, { expanded: true });
    }
    if (typeof ins.doLayout === "function") {
      await ins.doLayout();
    }
    internalData.nodes.push(...newNodes);
    internalData.lines.push(...newLines);
    recordSnapshot({
      timestamp: Date.now(),
      action: "add-nodes",
      addedNodes: newNodes,
      addedLinks: newLines,
    });
    emit("expand", node, payload);
    ElMessage.success(`已扩展 ${newNodes.length} 个节点`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ElMessage.error(`扩线失败：${msg}`);
  } finally {
    delete loadingMap[node.id];
  }
}

/** 折叠节点：隐藏其所有子节点 */
async function collapseNode(node: JsonNode) {
  const ins = instance.value as
    | {
        hideNode?: (id: string) => Promise<void>;
        hideLines?: (ids: string[]) => Promise<void>;
        getLinks?: () => RGLink[];
      }
    | null;
  if (!ins) return;
  const allLines = (finalData.value.lines ?? []) as JsonLine[];
  const allNodes = (finalData.value.nodes ?? []) as JsonNode[];
  const childIds = collectChildIds(allLines, [node.id]);
  const childIdSet = new Set(childIds);
  const hiddenLinkIds: string[] = [];
  if (typeof ins.getLinks === "function") {
    (ins.getLinks() ?? []).forEach((l) => {
      const line = l as unknown as RGLine & { id?: string };
      const sid = line.from ?? "";
      const tid = line.to ?? "";
      if ((sid && childIdSet.has(sid)) || (tid && childIdSet.has(tid))) {
        if (line.id) hiddenLinkIds.push(line.id);
      }
    });
  }
  childIds.forEach((id) => {
    if (typeof ins.hideNode === "function") {
      void ins.hideNode(id);
    }
  });
  if (hiddenLinkIds.length && typeof ins.hideLines === "function") {
    await ins.hideLines(hiddenLinkIds);
  }
  recordSnapshot({
    timestamp: Date.now(),
    action: "collapse",
    nodeStateChanges: Array.from(childIdSet).map((id) => ({
      id,
      before: { visible: true },
      after: { visible: false },
    })),
  });
}

// ============================================================
// 工具栏动作
// ============================================================

/** 缩放 / 适配 */
async function doZoom(delta: number) {
  const ins = instance.value as { setZoom?: (z: number) => Promise<void>; getZoom?: () => number } | null;
  if (!ins) return;
  const cur = typeof ins.getZoom === "function" ? ins.getZoom() : 100;
  const next = Math.max(20, Math.min(400, cur + delta));
  if (typeof ins.setZoom === "function") await ins.setZoom(next);
}

async function doFit() {
  const ins = instance.value as
    | { zoomToFit?: () => Promise<void>; moveToCenter?: () => Promise<void> }
    | null;
  if (!ins) return;
  if (typeof ins.zoomToFit === "function") await ins.zoomToFit();
  if (typeof ins.moveToCenter === "function") await ins.moveToCenter();
}

async function doLayout() {
  const ins = instance.value as { doLayout?: () => Promise<void> } | null;
  if (!ins || typeof ins.doLayout !== "function") return;
  await ins.doLayout();
  recordSnapshot({ timestamp: Date.now(), action: "layout-change" });
}

async function doCollapseAll() {
  const ins = instance.value as { collapseAll?: () => Promise<void> } | null;
  if (ins && typeof ins.collapseAll === "function") await ins.collapseAll();
  recordSnapshot({ timestamp: Date.now(), action: "collapse" });
}

async function doExpandAll() {
  const ins = instance.value as { expandAll?: () => Promise<void> } | null;
  if (ins && typeof ins.expandAll === "function") await ins.expandAll();
  recordSnapshot({ timestamp: Date.now(), action: "expand" });
}

// ============================================================
// 历史回溯
// ============================================================

async function undo() {
  if (!history.past.length) return;
  const snap = history.past.pop()!;
  history.future.push(snap);
  history.paused = true;
  try {
    await applySnapshot(snap, true);
  } finally {
    history.paused = false;
  }
}

async function redo() {
  if (!history.future.length) return;
  const snap = history.future.pop()!;
  history.past.push(snap);
  history.paused = true;
  try {
    await applySnapshot(snap, false);
  } finally {
    history.paused = false;
  }
}

/** 应用快照：reverse=true 表示回退 */
async function applySnapshot(snap: HistorySnapshot, reverse: boolean) {
  const ins = instance.value as
    | {
        addNodes?: (n: JsonNode[]) => Promise<void>;
        addLines?: (l: JsonLine[]) => Promise<void>;
        removeNodeById?: (id: string) => Promise<void>;
        removeLinkById?: (id: string) => Promise<void>;
        updateNode?: (n: RGNode, p: Record<string, unknown>) => Promise<void>;
        getNodeById?: (id: string) => RGNode | undefined;
      }
    | null;
  if (!ins) return;

  const additions = reverse
    ? { nodes: snap.removedNodes ?? [], lines: snap.removedLinks ?? [] }
    : { nodes: snap.addedNodes ?? [], lines: snap.addedLinks ?? [] };
  const removals = reverse
    ? { nodes: snap.addedNodes ?? [], lines: snap.addedLinks ?? [] }
    : { nodes: snap.removedNodes ?? [], lines: snap.removedLinks ?? [] };

  if (removals.nodes.length && typeof ins.removeNodeById === "function") {
    for (const n of removals.nodes) await ins.removeNodeById(n.id);
  }
  if (removals.lines.length && typeof ins.removeLinkById === "function") {
    for (const l of removals.lines) {
      if (l.id) await ins.removeLinkById(l.id);
    }
  }
  if (additions.nodes.length && typeof ins.addNodes === "function") {
    await ins.addNodes(additions.nodes);
  }
  if (additions.lines.length && typeof ins.addLines === "function") {
    await ins.addLines(additions.lines);
  }
  if (snap.nodeStateChanges && typeof ins.updateNode === "function") {
    for (const change of snap.nodeStateChanges) {
      const live = typeof ins.getNodeById === "function" ? ins.getNodeById(change.id) : null;
      if (!live) continue;
      const patch = reverse ? change.before ?? {} : change.after ?? {};
      await ins.updateNode(live, patch);
    }
  }
}

// ============================================================
// 导入 / 导出
// ============================================================

/** 导出当前图谱 JSON */
function exportGraph() {
  const payload = {
    version: "1.0",
    exportTime: new Date().toISOString(),
    nodes: [...internalData.nodes],
    links: [...internalData.lines],
    layout: { layoutName: finalOptions.value.layout?.layoutName ?? props.mode },
    options: finalOptions.value,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relation-graph-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("图谱已导出");
}

/** 触发文件选择 */
function triggerImport() {
  fileInputRef.value?.click();
}

/** 处理导入 JSON */
async function handleImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text) as RGJsonData;
    const ins = instance.value as
      | {
          setJsonData?: (d: RGJsonData) => Promise<void>;
          doLayout?: () => Promise<void>;
        }
      | null;
    if (ins && typeof ins.setJsonData === "function") {
      await ins.setJsonData(payload);
      if (typeof ins.doLayout === "function") await ins.doLayout();
    }
    internalData.nodes = [...(payload.nodes ?? [])];
    internalData.lines = [...(payload.lines ?? [])];
    ElMessage.success("图谱已导入");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ElMessage.error(`导入失败：${msg}`);
  } finally {
    input.value = "";
  }
}

// ============================================================
// 多选（来自 RGNodeSlotProps 的 checked）
// ============================================================

watch(
  () => props.data,
  () => {
    // data 外部变化时同步到 internalData，便于历史记录
    if (props.data) {
      internalData.nodes = [...(props.data.nodes ?? [])];
      internalData.lines = [...(props.data.lines ?? [])];
    }
  },
  { deep: true },
);

/** 通过点击关闭右键菜单 */
function onCanvasClick() {
  if (contextMenu.visible) closeContextMenu();
}

defineExpose({
  instance,
  exportGraph,
  importGraph: handleImportFile,
  undo,
  redo,
  runSearch,
  clearSearch,
  doLayout,
  doFit,
});
</script>

<template>
  <div class="re-graph" :style="containerStyle" @click="onCanvasClick">
    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="re-graph__toolbar">
      <div class="re-graph__toolbar-left">
        <!-- 搜索框 -->
        <template v-if="toolbar.search !== false">
          <div class="re-graph__search">
            <el-input
              v-model="search.keyword"
              placeholder="搜索节点（多个用逗号分隔）"
              clearable
              size="small"
              @input="runSearch"
              @clear="clearSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button-group size="small">
              <el-button
                :type="search.mode === 'highlight' ? 'primary' : 'default'"
                size="small"
                @click="search.mode = 'highlight'; runSearch(search.keyword)"
              >
                高亮
              </el-button>
              <el-button
                :type="search.mode === 'path' ? 'primary' : 'default'"
                size="small"
                @click="search.mode = 'path'; runSearch(search.keyword)"
              >
                路径
              </el-button>
            </el-button-group>
          </div>
        </template>
      </div>
      <div class="re-graph__toolbar-right">
        <!-- 缩放 -->
        <template v-if="toolbar.zoom !== false">
          <el-button-group size="small">
            <el-button size="small" @click="doZoom(20)">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button size="small" @click="doZoom(-20)">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button size="small" @click="doFit">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-button-group>
        </template>
        <!-- 折叠/展开 -->
        <template v-if="toolbar.collapseAll !== false || toolbar.expandAll !== false">
          <el-button-group size="small">
            <el-button v-if="toolbar.collapseAll !== false" size="small" @click="doCollapseAll">
              <el-icon><Folder /></el-icon>
              折叠
            </el-button>
            <el-button v-if="toolbar.expandAll !== false" size="small" @click="doExpandAll">
              <el-icon><Expand /></el-icon>
              展开
            </el-button>
          </el-button-group>
        </template>
        <!-- 重新布局 -->
        <template v-if="toolbar.layout !== false">
          <el-button size="small" @click="doLayout">
            <el-icon><Refresh /></el-icon>
            重排
          </el-button>
        </template>
        <!-- 历史回溯 -->
        <template v-if="toolbar.history !== false && enableHistory">
          <el-button-group size="small">
            <el-button
              size="small"
              :disabled="!history.past.length"
              @click="undo"
            >
              <el-icon><ArrowLeft /></el-icon>
              撤销
            </el-button>
            <el-button
              size="small"
              :disabled="!history.future.length"
              @click="redo"
            >
              <el-icon><ArrowRight /></el-icon>
              重做
            </el-button>
          </el-button-group>
        </template>
        <!-- 导入导出 -->
        <template v-if="toolbar.importExport !== false">
          <el-button-group size="small">
            <el-button size="small" @click="triggerImport">
              <el-icon><Upload /></el-icon>
              导入
            </el-button>
            <el-button size="small" @click="exportGraph">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </el-button-group>
        </template>
        <!-- 自定义 toolbar 插槽 -->
        <slot name="toolbar" :instance="instance" />
      </div>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      accept="application/json"
      hidden
      @change="handleImportFile"
    />

    <!-- 主画布 -->
    <div class="re-graph__canvas">
      <RelationGraph
        :data="finalData"
        :options="finalOptions"
        @ready="onReady"
        @node-click="onNodeClick"
        @line-click="onLineClick"
        @node-dblclick="onNodeDblClick"
        @node-contextmenu="onNodeContextMenu"
      >
        <template #node="{ node, checked, dragging }: RGNodeSlotProps">
          <slot name="node" :node="node" :checked="checked" :dragging="dragging">
            <div
              class="re-graph__default-node"
              :class="{ 'is-checked': checked, 'is-dragging': dragging }"
            >
              <span>{{ node.text }}</span>
            </div>
          </slot>
        </template>

        <template v-if="showToolbar || showMiniView || $slots.view" #view>
          <slot name="view" :instance="instance" />
        </template>
      </RelationGraph>

      <!-- 右键菜单 -->
      <div
        v-if="contextMenu.visible"
        class="re-graph__context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <div class="re-graph__context-menu-title">{{ contextMenu.node?.text }}</div>
        <div class="re-graph__context-menu-actions">
          <div class="re-graph__context-menu-item" @click="handleMenuAction('expand')">
            <el-icon><Connection /></el-icon>
            <span>扩展节点</span>
          </div>
          <div class="re-graph__context-menu-item" @click="handleMenuAction('collapse')">
            <el-icon><Folder /></el-icon>
            <span>折叠子节点</span>
          </div>
          <div class="re-graph__context-menu-item" @click="handleMenuAction('lock')">
            <el-icon><Lock /></el-icon>
            <span>锁定位置</span>
          </div>
          <div class="re-graph__context-menu-item" @click="handleMenuAction('unlock')">
            <el-icon><Unlock /></el-icon>
            <span>解锁位置</span>
          </div>
          <div class="re-graph__context-menu-item" @click="handleMenuAction('focus')">
            <el-icon><Position /></el-icon>
            <span>定位到此节点</span>
          </div>
          <div class="re-graph__context-menu-item" @click="handleMenuAction('hide')">
            <el-icon><Histogram /></el-icon>
            <span>隐藏节点</span>
          </div>
          <div class="re-graph__context-menu-item re-graph__context-menu-item--danger" @click="handleMenuAction('remove')">
            <el-icon><Delete /></el-icon>
            <span>删除节点</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息栏（选中数量等） -->
    <div v-if="showToolbar" class="re-graph__statusbar">
      <span class="re-graph__statusbar-item">
        节点 {{ (finalData.nodes ?? []).length }}
      </span>
      <span class="re-graph__statusbar-item">
        连线 {{ (finalData.lines ?? []).length }}
      </span>
      <span v-if="search.matched.length" class="re-graph__statusbar-item">
        匹配 {{ search.matched.length }}
      </span>
      <span v-if="Object.keys(loadingMap).length" class="re-graph__statusbar-item re-graph__statusbar-item--loading">
        加载中 {{ Object.keys(loadingMap).length }}
      </span>
      <slot name="status" :data="finalData" :instance="instance" />
    </div>
  </div>
</template>

<style scoped>
.re-graph {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--el-border-radius-base, 8px);
  background: var(--el-bg-color, #fff);
}
.re-graph :deep(.rel-map) {
  background: var(--el-bg-color, #fff);
}

.re-graph__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-shrink: 0;
}
.re-graph__toolbar-left,
.re-graph__toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.re-graph__search {
  display: flex;
  align-items: center;
  gap: 6px;
}
.re-graph__search :deep(.el-input) {
  width: 220px;
}

.re-graph__canvas {
  position: relative;
  flex: 1;
  min-height: 0;
}

.re-graph__default-node {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
}
.re-graph__default-node.is-checked {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
}
.re-graph__default-node.is-dragging {
  opacity: 0.85;
  cursor: grabbing;
}

.re-graph__context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base, 8px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 4px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.re-graph__context-menu-title {
  padding: 6px 10px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.re-graph__context-menu-actions {
  padding: 4px 0;
}
.re-graph__context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.12s ease;
}
.re-graph__context-menu-item:hover {
  background: var(--el-fill-color-light);
}
.re-graph__context-menu-item--danger {
  color: var(--el-color-danger);
}
.re-graph__context-menu-item--danger:hover {
  background: var(--el-color-danger-light-9);
}

.re-graph__statusbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-shrink: 0;
}
.re-graph__statusbar-item--loading {
  color: var(--el-color-warning);
}
</style>
