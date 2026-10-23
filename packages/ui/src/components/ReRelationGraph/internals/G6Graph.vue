<script setup lang="ts">
/**
 * ReRelationGraph 核心画布（G6 v5）
 *
 * <p>与主题无关：只负责 G6 实例的生命周期、数据映射、交互行为与对外 API；
 * 外观由 theme/default 与 theme/koi 两个包装层决定。</p>
 *
 * <p><strong>数据映射约定</strong>：业务字段进 G6 的 {@code data}，视觉属性进 {@code style}，
 * 与 G6 v5 的 {@code { id, type, data, style }} 结构对齐，避免业务与渲染参数混在一起。
 * 组件对外仍暴露 {@code label/size/group/fixed/image/directed/animated} 这类业务-friendly 字段，
 * 由本文件统一翻译。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import {
  computed,
  defineAsyncComponent,
  Fragment,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  render,
  shallowRef,
  useSlots,
  watch,
} from "vue";
import { Graph, Minimap, register, ExtensionCategory } from "@antv/g6";
import { useDebounceFn } from "@vueuse/core";
import { getStorageKey } from "@repo/config";
import ReButton from "../../ReButton";
import ReIcon from "../../ReIcon";
import ReInput from "../../ReInput";
import ReSelect from "../../ReSelect";
import ReSwitch from "../../ReSwitch";
import { t, tLayout } from "./i18n";
import {
  type RelationContextMenuContext,
  type RelationContextMenuItem,
  type RelationEdge,
  type RelationGraphApi,
  type RelationGraphData,
  type RelationGraphSettings,
  type RelationHighlightMode,
  type RelationLayoutName,
  type RelationNode,
  type RelationToolbarItem,
  type RelationToolbarPosition,
  type RelationViewMode,
  RELATION_LAYOUTS,
} from "./types";
import GraphHoverTip from "./components/GraphHoverTip.vue";
import GraphDetailPanel from "./components/GraphDetailPanel.vue";
import GraphContextMenu from "./components/GraphContextMenu.vue";
import GraphToolbar from "./components/GraphToolbar.vue";
import GraphTuningPanel from "./components/GraphTuningPanel.vue";

// Minimap 不在 G6 的 build-in 注册表里（build-in 只注册了 bubble-sets / edge-bundling /
// edge-filter-lens / grid-line），必须显式注册后才能用 { type: 'minimap' } 声明。
// 另：Minimap 的构造函数是 (context, options) 两参，不能在这里预构造实例。
// 加 once 守卫：热更新会重复执行模块体，重复注册会刷 "[G6] extension ... registered before" 警告。
let minimapRegistered = false;
if (!minimapRegistered) {
  register(ExtensionCategory.PLUGIN, "minimap", Minimap);
  minimapRegistered = true;
}

/**
 * 分组聚簇的布局名（原生 {@code combo-combined} 的语义别名）
 *
 * <p>势力/分组聚簇完全交给 G6 自带能力，不再自研坐标算法：
 * 每个分组是一个 {@code circle} 组合（圆形容器，尺寸由子节点包围盒自动推导），
 * 组内跑 {@code concentric} 同心环，组与组之间跑 {@code force} 排斥排开。</p>
 *
 * <p>保留 {@code rrg-cluster} 这个名字，是为了让已有业务的
 * {@code layout="rrg-cluster"} / {@code grouped-layout} 继续有效——它现在只是
 * G6 原生 {@code combo-combined} 的别名，没有任何自定义布局代码。</p>
 */
const GROUPED_LAYOUT = "rrg-cluster";

/**
 * 把 {@code rrg-cluster} 翻译成 G6 原生布局描述（combo-combined）。
 *
 * <p>根层（无组合的散点 + 各组合整体）用力导向，组内（每个组合）用同心环——
 * 这正是「每组聚成一团、组间不重叠」的原生表达。业务显式给出的参数
 * （{@code nodeSpacing}/{@code comboPadding}/{@code comboSpacing}）原样透传。</p>
 *
 * @param options 业务 / 调参面板给出的参数
 * @return G6 布局描述
 */
const toGroupedLayoutDesc = (options?: Record<string, unknown>): Record<string, unknown> => ({
  type: "combo-combined",
  nodeSize: 40,
  nodeSpacing: 12,
  comboPadding: 18,
  comboSpacing: 40,
  ...(options ?? {}),
  layout: (comboId: string | null) =>
    comboId
      // 组内：同心环，preventOverlap 保证同组节点不叠
      ? { type: "concentric", preventOverlap: true, nodeSize: 40, minNodeSpacing: 24, sortBy: "degree" }
      // 根层：力导向把各组合推开，用组合包围盒当碰撞半径
      : { type: "force", preventOverlap: true, nodeSize: 40, linkDistance: 220 },
});

defineOptions({ name: "ReRelationGraphCore" });

const props = withDefaults(
  defineProps<{
    /** 完整图数据 */
    data?: RelationGraphData;
    /** 节点（与 data.nodes 二选一，便于兼容旧调用方） */
    nodes?: RelationNode[];
    /** 边（与 data.edges 二选一） */
    edges?: RelationEdge[];
    /** 边（旧调用方用的名字） */
    lines?: RelationEdge[];
    /** 布局名，缺省 force */
    layout?: RelationLayoutName;
    /** 布局参数（覆盖默认） */
    layoutOptions?: Record<string, unknown>;
    /** 按 group 分区布局：开启后同 group 节点被分配到画布同一区块的初始坐标，
     *  力导向从分区起点散开，同组自然聚成区块（适合按类别/势力分组的图） */
    groupedLayout?: boolean;
    /** 高度 */
    height?: string | number;
    /** 宽度 */
    width?: string | number;
    /** 是否显示工具栏 */
    toolbar?: boolean;
    /** 是否显示小地图 */
    minimap?: boolean;
    /** 是否允许滚轮/双指缩放 */
    zoom?: boolean;
    /** 是否允许拖拽节点 */
    drag?: boolean;
    /** 悬停高亮模式：none/group/adjacent/both */
    highlight?: RelationHighlightMode;
    /** 是否允许 ctrl+左键多选 */
    multiSelect?: boolean;
    /** 是否显示右键菜单 */
    contextMenu?: boolean;
    /** 是否可编辑（右键菜单里的增删） */
    editable?: boolean;
    /** 节点缺省原型 */
    nodeType?: string;
    /** 边缺省类型 */
    edgeType?: string;
    /** 节点缺省大小 */
    nodeSize?: number;
    /** 边缺省是否带方向箭头 */
    directed?: boolean;
    /** 空数据时的提示 */
    emptyText?: string;
    /** 是否输出调试日志 */
    debug?: boolean;
    /** 视图模式：2d（G6 画布，默认）/ 3d（vue-force-graph-3d 力导向） */
    mode?: RelationViewMode;
    /** 是否在工具栏显示节点搜索框（search/locate） */
    searchable?: boolean;
    /** 是否在工具栏显示图片导出 */
    exportable?: boolean;
    /**
     * 边标签的显示策略。
     *
     * <p>大图（几百条边）里每条边都常显标签会糊成一片，实测 248 节点/387 边的
     * 三国知识图谱有近一半标签互相压字。因此提供 onHover：默认全部隐藏，
     * 只有鼠标悬停/选中某条边时才显示那一条的标签；图面立刻干净，
     * 信息改为按需呈现。可用“显示全部标签”开关随时切回常显。</p>
     */
    edgeLabelMode?: "always" | "onHover";
    /**
     * 是否允许「布局调参」面板。
     *
     * <p>与 {@link toolbar} 解耦：KB 图谱这类自带工具栏的调用方传 {@code toolbar=false}
     * 仍可开启本面板，通过 {@link RelationGraphApi.openTuning} 等方法开合，
     * 面板浮在画布右上角，不占用任何布局空间。</p>
     */
    tunable?: boolean;
    /**
     * 工具栏定位：默认右上角。类似地图工具条，支持四角与顶部居中。
     */
    toolbarPosition?: RelationToolbarPosition;
    /**
     * 工具栏按钮集合；缺省显示全部按钮。
     *
     * <p>传数组后只渲染数组里的按钮，方便调用方按业务隐藏/显示。
     * 搜索/导出/布局调参还受 {@code searchable} / {@code exportable} / {@code tunable} 控制。</p>
     */
    toolbarItems?: RelationToolbarItem[];
    /** 是否显示分组容器（按节点 group 包一层浅色背景） */
    showGroups?: boolean;
    /** 分组容器原型：circle / rect */
    groupShape?: "circle" | "rect";
    /** 悬停高亮时是否隐藏其它节点（默认只淡出） */
    hoverFocus?: boolean;
    /** 是否启用右键详情入口 */
    details?: boolean;
    /** 详情属性是否延迟加载（默认开；未配置 loadNodeDetail 时直接展示节点 data） */
    lazyDetails?: boolean;
    /** 详情属性加载函数：右键详情时调用，返回的字段会展示在详情面板 */
    loadNodeDetail?: (node: RelationNode) => Promise<Record<string, unknown> | null | undefined>;
    /** 右键扩线数据加载函数：返回待合并的邻居节点与边 */
    loadNeighbors?: (node: RelationNode, depth?: number) => Promise<RelationGraphData | null | undefined>;
    /** 部分加载（Neo4j 式）：挂载后按 depth 只加载局部子图，后续靠右键扩线 */
    loadPartial?: (depth: number) => Promise<RelationGraphData | null | undefined>;
    /** 右键扩线默认深度 */
    expandDepth?: number;
    /** 最大加载深度 */
    maxDepth?: number;
    /** 是否开启部分加载（Neo4j 式），默认只加载局部数据 */
    partial?: boolean;
    /** 是否启用 G6 官方 tooltip（鼠标悬停节点/边时显示内容） */
    tooltip?: boolean;
    /** 是否显示左上角悬浮信息（GraphHoverTip；KB 图谱关闭后只保留节点自带 label） */
    hoverTip?: boolean;
    /** 是否启用 G6 官方框选（brush-select） */
    brushSelect?: boolean;
    /** 是否启用 G6 官方拉索选择（lasso-select） */
    lassoSelect?: boolean;
    /** 是否启用 G6 官方 hull 轮廓（按 group 生成外围轮廓） */
    hull?: boolean;
    /** 是否启用 G6 官方 bubble-sets 分组描边 */
    bubbleSets?: boolean;
    /** 大数据量性能优化（启用 optimize-viewport-transform；缺省自动按节点数启用） */
    performance?: boolean;
    /** 自定义右键菜单项 */
    menuItems?: RelationContextMenuItem[];
    /** 偏好保存回调：用户调布局/开关后把当前设置写入后台 */
    saveSettings?: (settings: RelationGraphSettings) => Promise<void> | void;
    /** 偏好加载回调：挂载后可主动应用后台已存设置 */
    loadSettings?: () => Promise<RelationGraphSettings | null | undefined>;
  }>(),
  {
    data: undefined,
    nodes: undefined,
    edges: undefined,
    lines: undefined,
    layout: "force",
    layoutOptions: undefined,
    groupedLayout: false,
    height: "100%",
    width: "100%",
    toolbar: true,
    minimap: false,
    zoom: true,
    drag: true,
    highlight: "adjacent",
    multiSelect: true,
    contextMenu: true,
    editable: false,
    nodeType: "circle",
    edgeType: "line",
    nodeSize: 32,
    directed: true,
    emptyText: "暂无数据",
    debug: false,
    mode: "2d",
    searchable: true,
    exportable: true,
    tunable: true,
    edgeLabelMode: "always",
    toolbarPosition: "top-right",
    toolbarItems: undefined,
    showGroups: false,
    groupShape: "circle",
    hoverFocus: false,
    details: true,
    lazyDetails: true,
    loadNodeDetail: undefined,
    loadNeighbors: undefined,
    loadPartial: undefined,
    expandDepth: 3,
    maxDepth: 3,
    partial: false,
    menuItems: undefined,
    tooltip: true,
    hoverTip: true,
    brushSelect: false,
    lassoSelect: false,
    hull: false,
    bubbleSets: false,
    performance: false,
    saveSettings: undefined,
    loadSettings: undefined,
  },
);

const emit = defineEmits<{
  (e: "ready", graph: unknown): void;
  (e: "node-click", node: RelationNode, ev: unknown): void;
  (e: "node-right-click", node: RelationNode, ev: unknown): void;
  (e: "node-dblclick", node: RelationNode, ev: unknown): void;
  (e: "node-hover", node: RelationNode | null, ev: unknown): void;
  (e: "edge-click", edge: RelationEdge, ev: unknown): void;
  (e: "edge-right-click", edge: RelationEdge, ev: unknown): void;
  (e: "edge-dblclick", edge: RelationEdge, ev: unknown): void;
  (e: "canvas-click", ev: unknown): void;
  (e: "selection-change", ids: string[]): void;
  (e: "layout-change", name: string): void;
  (e: "data-change", data: RelationGraphData): void;
  (e: "mode-change", mode: RelationViewMode): void;
  /** 拖边连线完成一个新边时 —— data 与 model 已同步，携带 business 边数据 */
  (e: "edge-created", edge: RelationEdge): void;
  /** 撤销 / 重做 / 清栈 / 编辑操作后 */
  (e: "history-change", state: { canUndo: boolean; canRedo: boolean }): void;
  /** 连线模式开关 */
  (e: "connect-mode-change", on: boolean): void;
  /** 悬停/显示开关或布局参数变化后派发，调用方接事件写后台 */
  (e: "settings-change", settings: RelationGraphSettings): void;
  /** 打开详情面板（可在面板内懒加载） */
  (e: "node-detail", node: RelationNode, data: Record<string, unknown> | null): void;
  /** 请求扩线：未配置 loadNeighbors 时由调用方处理 */
  (e: "node-expand", node: RelationNode, depth: number): void;
  /** 最短路径状态变化（空数组=恢复） */
  (e: "path-change", ids: string[]): void;
  /** 自定义菜单项被点击 */
  (e: "menu-item-click", item: RelationContextMenuItem, ctx: RelationContextMenuContext): void;
}>();

const wrapRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const graphRef = shallowRef<Graph | null>(null);
const ready = ref(false);
/** 生效布局：groupedLayout 开启时强制用分组圆形聚簇（rrg-cluster），否则跟随 props.layout */
const currentLayout = ref<string>(props.groupedLayout ? "rrg-cluster" : props.layout);
const empty = ref(true);

/** 右键菜单状态 */
const menu = ref<{ visible: boolean; x: number; y: number; kind: "node" | "edge" | "canvas"; id: string }>(
  { visible: false, x: 0, y: 0, kind: "canvas", id: "" },
);
/** 悬浮详情（供父级 tooltip 或内置气泡使用） */
const hovered = ref<RelationNode | null>(null);

// ==================== 2026-10-13 显示开关 / 扩线 / 详情 / 设置 ====================

/** 是否显示分组容器（combo） */
/**
 * 组合容器开关（combo）。
 *
 * <p>{@code groupedLayout} 是分组聚簇布局，它必须建立在组合容器之上：G6 原生
 * {@code combo-combined} 靠 combo 分组排布。所以开了聚簇布局就自动打开组合容器，
 * 否则布局拿不到任何分组信息，只能把节点挤成一圈（互相压盖）。</p>
 */
const showGroupsOn = ref(props.showGroups || props.groupedLayout || currentLayout.value === GROUPED_LAYOUT);
/** 悬停高亮模式运行时状态（首值来自 prop，工具栏可切） */
const highlightMode = ref<RelationHighlightMode>(props.highlight);
/** 悬停时是否隐藏其它节点（而非淡出） */
const hoverFocusOn = ref(props.hoverFocus);
/** 是否显示左上角悬浮信息（GraphHoverTip；KB 图谱大数据场景关闭） */
const hoverTipOn = ref(props.hoverTip);
/** 右键扩线默认深度 */
const expandDepthOn = ref(props.expandDepth);
/** 最大加载深度 */
const maxDepthOn = ref(props.maxDepth);
/** 是否开启 Neo4j 式部分加载 */
const partialOn = ref(props.partial);

/** 右侧详情面板当前节点 */
const detailNode = ref<RelationNode | null>(null);
const detailLoading = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);

/** 正在扩线的节点 id，菜单项显示 loading 状态 */
const expandingIds = ref<string[]>([]);
/** 已经扩线过的节点 id，避免重复请求 */
const expandedIds = ref<Set<string>>(new Set());

/** 最短路径当前高亮节点；空表示未显示 */
const pathIds = ref<string[]>([]);
/** 最短路径高亮前的元素状态快照（用于恢复原图） */
let pathStateSnapshot: Record<string, string[]> = {};

/** 是否已执行过 Neo4j 式部分加载（只执行一次） */
const partialLoaded = ref(false);

/** 应用后台设置期间，避免 emitSettingsChange 反向触发保存 */
const applyingSettings = ref(false);

// ==================== 2D/3D 双模式状态 ====================

/**
 * 当前视图模式。
 *
 * <p>2D 与 3D **同时活着**：切到 3D 时 G6 实例不销毁，只用 visibility 隐藏
 * （display:none 会让 G6 的 autoResize 量到 0 尺寸，切回来画布就花了），
 * G6 仍是唯一数据源，3D 层只是它的一份快照视图。</p>
 */
const mode = ref<RelationViewMode>(props.mode);
const is3d = computed(() => mode.value === "3d");

/** 3D 层数据：从 G6 模型导出的快照（保留 style 色值，exportData 会丢 style 所以不复用它） */
const data3d = ref<RelationGraphData>({ nodes: [], edges: [] });
/** 3D 选中节点 id（G6 的 selected 状态在 3D 层没有对应物，单独维护） */
const selected3d = ref<string[]>([]);
/** 3D 高亮节点 id；null 表示不高亮 */
const highlight3d = ref<string[] | null>(null);
/** 3D 悬停产生的临时高亮（与 highlight3d 叠加：任一命中即高亮） */
const hoverHl3d = ref<string[] | null>(null);
/** 懒加载 3D 组件：three.js 体积大，不切 3D 就不进首屏 */
const ForceGraph3DComp = defineAsyncComponent(() => import("./ForceGraph3D.vue"));
const fg3dRef = ref<any>(null);

// ==================== 2026-10-07 补齐 feature #3/#5/#6/#7 ====================

/** G6 History 插件实例（key 取 'history'）。null 仅在未挂载前。 */
const historyInst = shallowRef<any>(null);
const canUndo = ref(false);
const canRedo = ref(false);

/**「拖边连线」模式（2D+editable） */
const connectMode = ref(false);
/**
 * 进入/退出「拖边连线」模式。 behaviors 的 enable() 闭包会即时感知到 ref 变化，
 * 无需调用 setBehaviors / setActiveMethod（后者 v5 不存在）。
 */
function setConnectMode(on: boolean) {
  connectMode.value = !!on;
  if (on) {
    clear2dState();
  }
  emit("connect-mode-change", connectMode.value);
}
function getConnectMode(): boolean {
  return connectMode.value;
}

/** 清除 2D 上的选中 / 搜索高亮 */
function clear2dState() {
  const g = graphRef.value;
  if (g) {
    g.setElementState({} as any, false);
  }
  selectedIds.value = [];
  searchMatches.value = [];
  searchMatchIndex.value = -1;
}

// ==================== search / locate (#3) ====================

/** 搜索框 & 命中高亮 */
const searchText = ref("");
const searchMatches = ref<string[]>([]);
const searchMatchIndex = ref(-1);

/** 命中节点 id（模糊匹配 label / id，不区分大小写） */
const searchNodes = (keyword: string): string[] => {
  if (!keyword.trim()) {
    return [];
  }
  const kw = keyword.trim().toLowerCase();
  const g = graphRef.value;
  const nodes = g?.getNodeData() ?? graphData.value.nodes ?? [];
  return (nodes as any[])
    .filter(n => {
      if (!n || n.id === undefined) return false;
      const d = n.data ?? {};
      const label = d.__label ?? d.label ?? n.id;
      const idStr = String(n.id);
      return String(label).toLowerCase().includes(kw) || idStr.toLowerCase().includes(kw);
    })
    .map(n => String(n.id));
};

/** 高亮命中节点并聚焦首个 */
const highlightMatches = (ids: string[]) => {
  searchMatches.value = ids;
  searchMatchIndex.value = ids.length ? 0 : -1;
  if (is3d.value) {
    // 3D 层没有 G6 的 element state，用 highlight 集合 + centerOn 达到同样效果
    highlight3d.value = ids.length ? [...ids] : null;
    if (ids[0]) {
      fg3dRef.value?.centerOn?.(ids[0]);
    }
    return;
  }
  const g = graphRef.value;
  if (ids.length) {
    g?.setElementState({} as any, false); // 先清已有选中
    const map: Record<string, string[]> = {};
    ids.forEach(id => {
      map[id] = ["active"];
    });
    void safeSetElementState(g, map, true);
  } else {
    g?.setElementState({} as any, false);
  }
  if (ids[0]) {
    g?.focusElement(ids[0], true as any).catch(() => {});
  }
};

const runSearch = (keyword: string) => {
  searchText.value = keyword;
  highlightMatches(searchNodes(keyword));
};

/** 清除搜索 */
const clearSearch = () => {
  searchText.value = "";
  if (is3d.value) {
    highlight3d.value = null;
  } else {
    graphRef.value?.setElementState({} as any, false);
  }
  searchMatches.value = [];
  searchMatchIndex.value = -1;
};

/** 跳转到下一个/上一个命中 */
const nextMatch = (dir = 1) => {
  const ids = searchMatches.value;
  if (!ids.length) {
    runSearch(searchText.value);
    return;
  }
  let i = (searchMatchIndex.value + dir + ids.length) % ids.length;
  searchMatchIndex.value = i;
  void safeFocusElement(graphRef.value, ids[i], true);
  void safeSetElementState(graphRef.value, { [ids[i]]: ["active"] } as Record<string, string[]>, true);
};

/** 定位 + 选中一个节点 */
async function locateNode(id: string) {
  const g = graphRef.value;
  if (!g || is3d.value) {
    return;
  }
  await safeFocusElement(g, id, true);
  g.setElementState({} as any, false);
  void safeSetElementState(g, { [id]: ["selected"] } as Record<string, string[]>, true);
  selectedIds.value = [id];
  emit("selection-change", [id]);
}

// ==================== 导出图片 (#4) ====================

/** 导出图片为 dataURL。2D 用 G6 toDataURL，3D 用 three 渲染器截帧。 */
async function exportImage(
  type: "png" | "jpeg" = "png",
  quality = 1,
): Promise<string> {
  if (is3d.value) {
    return fg3dRef.value?.toDataURL?.(type, quality) ?? "";
  }
  const g = graphRef.value;
  if (!g) return "";
  return g.toDataURL({ type, quality } as any);
}

/** 下载 dataURL */
function downloadDataURL(dataURL: string, name = "relation-graph") {
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = `${name}.png`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==================== 节点内容插槽 (#6) ====================

const slots = useSlots();
const hasNodeSlot = computed(() => !!slots["node-content"]);
const slotEls = new Map<string, HTMLElement>();
/** 2D 选中节点 id 列表（插槽 scope + 外部 select 同步） */
const selectedIds = ref<string[]>([]);

/** 取/建用于某个节点的 slot 容器元素（G6 html 节点的 innerHTML）。 */
const ensureSlotEl = (id: string): HTMLElement => {
  let el = slotEls.get(id);
  if (!el) {
    el = document.createElement("div");
    el.className = "rrg__node-content";
    slotEls.set(id, el);
  }
  return el;
};

/** 把 #node-content 插槽渲染到某个节点的 G6 html 容器里。 */
const renderSlotNode = (node: RelationNode) => {
  if (!hasNodeSlot.value) return;
  const el = ensureSlotEl(node.id);
  const sel = selectedIds.value.includes(node.id);
  // 让插槽函数在当前组件作用域下执行，拿到最新的 vnodes；G6 html 节点自身负责
  // transform（节点坐标 + 视口），我们只管把内容塞进容器、居中显示。
  const vnodes = slots["node-content"]!({ node, selected: sel });
  render(vnodes.length ? h(Fragment, null, vnodes as any) : h(Fragment), el);
};

/** 卸载某个节点的插槽容器（节点被移除 / 组件卸载时） */
const unmountSlot = (id: string) => {
  const el = slotEls.get(id);
  if (el) {
    render(null as unknown as Parameters<typeof render>[0], el);
    el.remove();
    slotEls.delete(id);
  }
};

/**
 * 把已渲染的插槽容器挂进 G6 html 节点的关键图形 DOM。
 *
 * <p>不能通过 node style.innerHTML 传 DOM 元素：History 插件的 alignFields 会深度
 * 遍历命令数据，DOM 的循环引用会让它无限递归爆栈。所以 model 里 innerHTML 只存
 * 字符串，真正的 DOM 在这里按元素实例 {@code getShape('key').getDomElement()} 挂载。</p>
 */
const attachSlots = () => {
  const g: any = graphRef.value;
  if (!hasNodeSlot.value || !g) return;
  const nodeData = (g.getNodeData?.() ?? []) as any[];
  for (const d of nodeData) {
    if (d.type !== "html") continue;
    const el = ensureSlotEl(d.id);
    renderSlotNode({
      id: d.id,
      label: d.data?.__label,
      group: d.data?.__group,
      type: d.type,
      data: d.data,
    } as RelationNode);
    try {
      const inst = g.context?.element?.getElement?.(d.id);
      const host: HTMLElement | undefined = inst?.getShape?.("key")?.getDomElement?.();
      if (host && el.parentElement !== host) {
        host.appendChild(el);
      }
    } catch (e) {
      log("attachSlots 失败", d.id, e);
    }
  }
};

const log = (...args: unknown[]) => {
  if (props.debug) {
    console.log("[ReRelationGraph]", ...args);
  }
};

/** 归一化输入数据：data 优先，其次 nodes/edges/lines */
/**
 * 兼容旧（X6 版 ReGraphRelation）命名的节点：{@code text} → {@code label}。
 *
 * @param n 原始节点
 * @return 补齐 label 的节点；本来就带 label 时原样返回
 */
const aliasNode = (n: any): RelationNode => {
  if (n?.label !== undefined || n?.text === undefined) {
    return n as RelationNode;
  }
  return { ...n, label: n.text } as RelationNode;
};

/**
 * 兼容旧（X6 版 ReGraphRelation）命名的边：{@code from/to} → {@code source/target}，
 * {@code text} → {@code label}。
 *
 * @param e 原始边
 * @return 补齐 source/target/label 的边
 */
const aliasEdge = (e: any): RelationEdge => {
  const out: any = { ...e };
  if (out.source === undefined && e?.from !== undefined) {
    out.source = e.from;
  }
  if (out.target === undefined && e?.to !== undefined) {
    out.target = e.to;
  }
  if (out.label === undefined && e?.text !== undefined) {
    out.label = e.text;
  }
  return out as RelationEdge;
};

const GROUP_COLOR_PALETTE = ["#409eff", "#f56c6c", "#67c23a", "#e6a23c", "#909399", "#b37feb"];

/** 由 group 名称生成稳定的 combo id */
const groupComboId = (group: string): string => `rrg-group:${group}`;

/** 生成分组容器的浅色背景样式（v2：提升可见性，势力区块一眼可辨） */
const groupComboStyle = (group: string, index: number): Record<string, unknown> => {
  const base = GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length];
  return {
    fill: `${base}26`,
    stroke: `${base}aa`,
    lineWidth: 2,
    lineDash: [5, 4],
    radius: 8,
    labelText: String(group ?? ""),
    labelFill: base,
    labelFontSize: 12,
    labelFontWeight: "bold",
    labelPlacement: "left-top",
    labelOffsetY: -14,
    labelPadding: [2, 6],
    labelBackground: true,
    labelBackgroundFill: "#fff",
  };
};

/**
 * 归一化输入数据：data 优先，其次 nodes/edges/lines。
 *
 * <p>本组件是 G6 内核版，对外契约是 {@code label} 与 {@code source/target}；而它替换掉的
 * 上一版（X6 内核的 {@code ReGraphRelation}）用的是 {@code text} 与 {@code from/to}，
 * 仓库里其它图组件（{@code ReGraph} / {@code ReGraphForce} / {@code ReGraphMind} …）
 * 也都沿用旧命名。调用方照旧写法传参时，若不做兼容会出现**边画不出来（source/target 为
 * undefined）、节点名显示成 id（label 缺失）**——两种都是"没报错但图不对"的静默故障，
 * 所以两种写法都接受。</p>
 *
 * <p><strong>显示分组开关</strong>：{@code showGroups=true} 时，把有 {@code group} 字段的
 * 节点自动归入按组生成的 combo 容器，并给每组配一种浅色背景。节点自身已显式声明
 * {@code combo} 时优先尊重调用方，不重复归组。</p>
 *
 * @return 归一化后的图数据
 */
const graphData = computed<RelationGraphData>(() => {
  const rawNodes = props.data?.nodes ?? props.nodes ?? [];
  const rawEdges = props.data?.edges ?? props.edges ?? props.lines ?? [];
  const rawCombos = props.data?.combos ?? [];
  const nodes = rawNodes.map(aliasNode).map((n) => {
    if (showGroupsOn.value && !n.combo && n.group) {
      return { ...n, combo: groupComboId(n.group) };
    }
    return n;
  });
  const combos = [...rawCombos];
  if (showGroupsOn.value) {
    const groupNames = [...new Set(nodes.map((n) => n.group).filter((g): g is string => !!g))];
    groupNames.forEach((group, index) => {
      const cid = groupComboId(group);
      if (!combos.some((c) => c.id === cid)) {
        combos.push({ id: cid, label: group, type: props.groupShape, style: groupComboStyle(group, index) });
      }
    });
  }
  const result = { nodes, edges: rawEdges.map(aliasEdge), combos };
  // 可观测性：把「真正交给 G6 的分组/组合规模」暴露出来，便于自动化验收断言
  // 组合确实生成了（而不是只在 props 里配了 grouped-layout）。
  if (typeof window !== "undefined") {
    (window as any).__RRG_GRAPH_INFO__ = {
      layout: currentLayout.value,
      showGroups: showGroupsOn.value,
      nodes: nodes.length,
      combos: combos.length,
      comboTypes: [...new Set(combos.map((c: any) => c.type ?? "(default)"))],
      comboCapped: nodes.filter((n) => !!n.combo).length,
      groups: [...new Set(nodes.map((n) => n.group).filter(Boolean))].slice(0, 20),
      at: Date.now(),
    };
  }
  return result;
});

/**
 * 事件对象里取元素 id。
 *
 * <p>G6 v5 的 {@code e.target} 是元素实例而不是 id 字符串，不同小版本还出现过
 * 字符串形态，这里统一兼容，避免版本差异把取值打翻。</p>
 *
 * @param ev G6 事件
 * @return 元素 id，取不到为空串
 */
const idOf = (ev: any): string => {
  const t = ev?.target;
  if (typeof t === "string") {
    return t;
  }
  return t?.id ?? t?.attributes?.id ?? "";
};

/** 节点 -> G6 NodeData */
const toNodeData = (n: RelationNode) => {
  const isHtml = (n.type ?? props.nodeType) === "html" || (n.style as any)?.__htmlSlot === true;
  const size = n.size ?? (isHtml ? [160, 64] : props.nodeSize);
  // HTML 节点默认关闭画布 label（G6 HTML.defaultStyleProps.label=false）：
  // 一旦再设 labelText，label 定位会和 HTML 关键图形互相递归，抛
  // "Maximum call stack size exceeded"（alignFields）。故 html 节点不设 label* 字段，
  // 名称直接在插槽内容里渲染。
  const style: Record<string, unknown> = isHtml
    ? { size, label: false }
    : {
      size,
      labelText: n.label ?? n.id,
      labelPlacement: "bottom",
      labelBackground: true,
      labelBackgroundFill: "rgba(0,0,0,0.55)",
      labelBackgroundRadius: 4,
      labelPadding: [2, 6],
      labelFill: "#fff",
      labelFontSize: 11,
    };
  if (n.image) {
    style.src = n.image;
  }
  // HTML 节点（节点内容插槽）：innerHTML 保持字符串占位（不能塞 DOM 元素——
  // History 插件的 alignFields 会深度遍历数据，遇到 DOM 的循环引用直接爆栈）。
  // 真正的 DOM 内容在 draw 之后由 attachSlots() 通过元素实例挂上去。
  if (isHtml) {
    style.innerHTML = hasNodeSlot.value ? "" : `<div class="rrg__node-content rrg__node-content--plain">${escapeHtml(n.label ?? n.id)}</div>`;
  }
  return {
    id: n.id,
    type: n.type ?? (n.image ? "image" : props.nodeType),
    combo: n.combo,
    data: { ...(n.data ?? {}), __label: n.label ?? n.id, __group: n.group, __fixed: n.fixed === true, __image: n.image },
    style: { ...style, ...(n.style ?? {}) },
  };
};

/** 无插槽时，html 类型节点的兜底渲染（纯文本块） */
const escapeHtml = (s: string): string =>
  String(s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));

/**
 * 当前是否让所有边的标签常显。
 *
 * <p>初值取自 {@link ReRelationGraphCore.props.edgeLabelMode}，之后由面板上的
 * 「显示全部标签」开关在运行时改写——用局部 ref 而非直接改 prop，
 * 因为 prop 是只读的，且允许调用方保持默认值不变。</p>
 */
const edgeLabelsShownOverride = ref<boolean | null>(null);

/** 实际生效的边标签策略（override 优先于 prop） */
const edgeLabelsShown = computed(
  () => edgeLabelsShownOverride.value ?? props.edgeLabelMode === "always"
);

/** 边 -> G6 EdgeData */
const toEdgeData = (e: RelationEdge) => {
  const directed = e.directed ?? props.directed;
  // onHover 模式下默认把标签文本留空，只留一个占位样式；
  // 悬停时由 setEdgeLabelVisible 临时把 labelText 填回去。
  const labelText = edgeLabelsShown.value ? (e.label ?? "") : "";
  const style: Record<string, unknown> = {
    labelText,
    labelBackground: true,
    labelBackgroundFill: "rgba(0,0,0,0.55)",
    labelBackgroundRadius: 4,
    labelPadding: [2, 6],
    labelFill: "#fff",
    labelFontSize: 10,
    endArrow: directed,
    endArrowSize: 8,
  };
  if (e.animated) {
    style.lineDash = [8, 6];
  }
  return {
    id: e.id ?? `${e.source}->${e.target}`,
    source: e.source,
    target: e.target,
    type: e.type ?? props.edgeType,
    data: { ...(e.data ?? {}), __label: e.label, __group: e.group, __directed: directed, __animated: e.animated === true },
    style: { ...style, ...(e.style ?? {}) },
  };
};

/** 按 id 找回业务节点（事件回调要把业务对象交回给调用方）。
 *  先查 props 派生的业务数据，查不到再回退到 G6 实时模型（含 API 新增的节点）。 */
const nodeById = (id: string): RelationNode | undefined => {
  const fromProps = graphData.value.nodes?.find(n => n.id === id);
  if (fromProps) {
    return fromProps;
  }
  const d: any = graphRef.value?.getElementData?.(id);
  if (!d) {
    return undefined;
  }
  return {
    id: d.id,
    label: d.data?.__label,
    group: d.data?.__group,
    fixed: d.data?.__fixed,
    image: d.data?.__image,
    type: d.type,
    data: d.data,
  } as RelationNode;
};
const edgeById = (id: string): RelationEdge | undefined => {
  const fromProps = (graphData.value.edges ?? []).find(
    e => (e.id ?? `${e.source}->${e.target}`) === id,
  );
  if (fromProps) {
    return fromProps;
  }
  const d: any = graphRef.value?.getElementData?.(id);
  if (!d) {
    return undefined;
  }
  return {
    id: d.id,
    source: typeof d.source === "object" ? d.source?.id : d.source,
    target: typeof d.target === "object" ? d.target?.id : d.target,
    label: d.data?.__label,
    directed: d.data?.__directed,
    animated: d.data?.__animated,
    type: d.type,
    data: d.data,
  } as RelationEdge;
};

/** 判断 id 是否为（普通）节点：先查 props 业务数据，再问 G6 模型。
 *  G6 的 getElementType 对未知 id 会抛异常，这里兜底为 false；combo 不算节点。 */
const isNodeId = (id: string): boolean => {
  if ((graphData.value.nodes ?? []).some(n => n.id === id)) {
    return true;
  }
  try {
    return graphRef.value?.getElementType?.(id) === "node";
  } catch {
    return false;
  }
};

/** 判断 id 是否为边：语义与 {@link isNodeId} 对称。 */
const isEdgeId = (id: string): boolean => {
  if ((graphData.value.edges ?? []).some(e => (e.id ?? `${e.source}->${e.target}`) === id)) {
    return true;
  }
  try {
    return graphRef.value?.getElementType?.(id) === "edge";
  } catch {
    return false;
  }
};

/** 构建 behaviors */
const buildBehaviors = () => {
  const list: any[] = ["drag-canvas"];
  if (props.zoom) {
    list.push("zoom-canvas");
  }
  if (props.drag) {
    // enable 是「每次 pointerdown 才求值」的闭包：进入连线模式时即时让位给 create-edge，
    // 无需 setBehaviors（v5 的 setBehaviors 不会在运行期实例化新行为，改它反而不生效）。
    list.push({
      type: "drag-element",
      shadow: true,
      enable: (ev: any) =>
        !connectMode.value &&
        ["node", "combo"].includes(ev?.targetType),
    });
  }
  list.push({
    type: "click-select",
    multiple: props.multiSelect,
    // ShortcutKey 是 string[]（默认 ['shift']）；写成字符串 "ctrl" 会让
    // Shortcut.match -> lowerCaseKeys 里 keys.map 抛 "keys.map is not a function"。
    // 注意值必须是 event.key 的小写："control"（不是 "ctrl"，后者永不命中）。
    trigger: ["control"],
    state: "selected",
    unselectedState: undefined,
  });
  // G6 官方框选：按住并拖出矩形选区，配合 click-select 的 ctrl 多选互补
  if (props.brushSelect) {
    list.push({
      type: "brush-select",
      key: "brush-select",
      // drag 拖拽选区（默认）；shift 按住时可追加到现有选区
      trigger: ["drag"],
      onSelect: (ids: string[]) => {
        selectedIds.value = ids;
        emit("selection-change", ids);
      },
    });
  }
  // G6 官方拉索选择：自由曲线圈选
  if (props.lassoSelect) {
    list.push({
      type: "lasso-select",
      key: "lasso-select",
      onSelect: (ids: string[]) => {
        selectedIds.value = ids;
        emit("selection-change", ids);
      },
    });
  }
  if (highlightMode.value !== "none") {
    // 高亮由 node:pointerenter/leave → applyHoverHighlight 手动 setElementState 承担
    // （G6 内置 hover-activate 在图片/密集大图上触发不稳定，用户实测无反馈），
    // 这里不再 push behavior，避免双路状态互相覆盖。
  }
  // 大数据量性能优化：节点数多时只重绘视口内元素，避免拖拽/缩放全量更新
  const nodeCount = graphData.value.nodes?.length ?? 0;
  if (props.performance || nodeCount >= 3000) {
    list.push({ type: "optimize-viewport-transform", key: "optimize-viewport-transform" });
  }
  // 拖边连线：仅 2D 且开启 editable、且处于连线模式时生效。
  // trigger='drag' 时它监听 node:dragstart / pointerup —— 与 drag-element 互斥（上面的 enable）。
  list.push({
    type: "create-edge",
    key: "create-edge",
    trigger: "drag",
    enable: () => props.editable && connectMode.value,
    style: { endArrow: props.directed, stroke: "var(--el-color-primary, #409eff)" },
    // 返回 undefined 会取消创建；这里补上业务字段（label/方向等）后放行
    onCreate: (edge: any) => toEdgeData(edge as RelationEdge) as any,
    onFinish: (edge: any) => {
      // G6 已经把边加进 model；这里把业务对象交回并同步 3D / 空态
      const rel = edgeById(edge.id) ?? {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.data?.__label,
        directed: edge.data?.__directed,
        data: edge.data,
      } as RelationEdge;
      log("create-edge finished", rel);
      emit("edge-created", rel);
      emitDataChange();
      empty.value = false;
      sync3d();
      refreshHistoryState();
    },
  });
  return list;
};

/** 构建 plugins */
const buildPlugins = () => {
  const list: any[] = [];
  if (minimapOn.value) {
    list.push({ type: "minimap", size: [200, 128], padding: 8, position: "right-bottom" });
  }
  // G6 官方 tooltip：悬停节点/边时显示名称（不绑定任何自定义 DOM，随画布销毁）。
  // 做成无白底的轻量名签（pointer-events:none 穿透），避免「节点上多一层背景」遮挡画布。
  if (props.tooltip) {
    list.push({
      type: "tooltip",
      key: "tooltip",
      trigger: "hover",
      getContent: (event: any, items: any[]) => {
        const it = items?.[0];
        const label = it?.style?.labelText ?? it?.data?.label ?? it?.data?.labelText ?? it?.id ?? "";
        const div = document.createElement("div");
        div.textContent = String(label ?? "");
        div.style.cssText = "padding:2px 6px;font-size:12px;line-height:1.4;color:var(--el-text-color-primary,#303133);background:transparent;border:none;box-shadow:none;border-radius:4px;pointer-events:none;";
        return div;
      },
      // G6 TooltipComponent 外层自带白底圆角容器，这里抹掉，只留名字本身
      style: {
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: "2px 6px",
        borderRadius: "4px",
        color: "var(--el-text-color-primary,#303133)",
      },
    });
  }
  // G6 官方 hull / bubble-sets：按 group 生成分组轮廓，成员在数据装载后由 syncSetPlugins 刷新
  if (props.hull || props.bubbleSets) {
    for (const [group, ids] of groupMembers()) {
      if (ids.length < 2) continue;
      if (props.hull) {
        list.push({
          type: "hull",
          key: `hull-${group}`,
          members: ids,
          style: { fill: "rgba(64,158,255,0.08)", stroke: "var(--el-color-primary,#409eff)", lineWidth: 1 },
          padding: 8,
        });
      }
      if (props.bubbleSets) {
        list.push({
          type: "bubble-sets",
          key: `bs-${group}`,
          members: ids,
          style: { fill: "rgba(103,194,58,0.08)", stroke: "var(--el-color-success,#67c23a)", lineWidth: 1 },
        });
      }
    }
  }
  // history 必须在「初始 config」里，运行期 setPlugins 不会实例化新插件。
  list.push({ type: "history", key: "history", stackSize: 50, beforeAddCommand: beforeAddHistory });
  return list;
};

/** 按 group 收集节点 id（用于 hull / bubble-sets 成员） */
const groupMembers = (): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const n of graphData.value.nodes ?? []) {
    const g = n.group;
    if (!g) continue;
    const arr = map.get(g) ?? [];
    arr.push(n.id);
    map.set(g, arr);
  }
  return map;
};

/** 数据装载后刷新 set 插件的成员（hull / bubble-sets 不监听 data 变化，需手动 updateMember） */
const syncSetPlugins = (graph: any) => {
  if (!props.hull && !props.bubbleSets) return;
  const groups = groupMembers();
  for (const [group, ids] of groups) {
    if (ids.length < 2) continue;
    for (const pfx of [props.hull ? "hull" : "", props.bubbleSets ? "bs" : ""].filter(Boolean)) {
      const inst = graph?.getPluginInstance?.(`${pfx}-${group}`);
      if (inst) {
        inst.updateMember?.(ids);
      }
    }
  }
};

/**
 * 过滤纯「位置变化」命令：拖拽节点 / 布局产生的 x,y 改动不进撤销栈，
 * 否则一次布局就能塞满 50 步、把真正的数据编辑冲掉。
 *
 * @param cmd 待入库命令
 * @return false 表示不入库
 */
const beforeAddHistory = (cmd: any): boolean => {
  const categories = ["nodes", "edges", "combos"];
  const operations = ["add", "update", "remove"];
  const isAssist = (item: any) => String(item?.id ?? "").startsWith("g6-create-edge-");

  // create-edge 把临时 assist node/edge 与真实边放进同一个 G6 batch。
  // 只过滤辅助项，不能把整条 command 丢掉，否则用户新建的边也无法撤销。
  for (const side of [cmd?.current, cmd?.original]) {
    for (const operation of operations) {
      for (const category of categories) {
        const items = side?.[operation]?.[category];
        if (Array.isArray(items)) {
          side[operation][category] = items.filter((item: any) => !isAssist(item));
        }
      }
    }
  }

  const c = cmd?.current;
  const o = cmd?.original;
  if (!c || !o) return true;

  const hasChanges = (side: any) => operations.some(operation =>
    categories.some(category => (side?.[operation]?.[category]?.length ?? 0) > 0),
  );
  if (!hasChanges(c)) return false;

  const stripPosition = (changes: any) => {
    const out: any = {};
    for (const category of categories) {
      out[category] = (changes?.[category] ?? []).map((item: any) => {
        const style = { ...(item.style ?? {}) };
        delete style.x;
        delete style.y;
        return { ...item, style };
      });
    }
    return out;
  };
  const same = (a: any, b: any) => JSON.stringify(stripPosition(a)) === JSON.stringify(stripPosition(b));

  // 只有 update 且去掉 x/y 后完全一致 = 纯位移，剔除。
  const noAdd = !(c.add?.nodes?.length || c.add?.edges?.length || c.add?.combos?.length);
  const noRemove = !(c.remove?.nodes?.length || c.remove?.edges?.length || c.remove?.combos?.length);
  const updateIsPosOnly =
    (c.update?.nodes?.length || c.update?.edges?.length || c.update?.combos?.length) &&
    same(c.update, o.update);
  return !(noAdd && noRemove && updateIsPosOnly);
};

/** 安全读取元素状态：id 不在模型时返回空数组（getElementState 对缺失 id 会抛 "Node not found for id"） */
const safeGetElementState = (graph: any, id: string): string[] => {
  if (!graph || !id) {
    return [];
  }
  try {
    return (graph.getElementState?.(id) ?? []) as string[];
  } catch (e) {
    return [];
  }
};

/** 取节点上除高亮状态外的既有状态（如 selected），避免整表替换时被抹掉 */
const baseStates = (graph: any, id: string): string[] =>
  safeGetElementState(graph, id).filter((s: string) => s !== "active" && s !== "inactive");

/**
 * 安全地批量设置元素状态。
 *
 * <p>setElementState 对「不在模型里的 id」会抛 "Node not found for id: xxx"。
 * 组件里多处状态表是异步构建的（悬停高亮、3D 回写、路径快照等），
 * 与 doSetData 的「先删后加」存在竞态：删节点刚完成、状态表还在飞过来时，
 * 旧 id 就会命中这个异常（KB 刷新图谱时偶发）。这里先按当前模型过滤，
 * 再包一层兜底，让竞态只丢一次状态更新而不是把整个交互打断。</p>
 */
const safeSetElementState = async (graph: any, map: Record<string, string[]>, enable: boolean) => {
  if (!graph || !map || !Object.keys(map).length) {
    return;
  }
  const live = new Set<string>([
    ...(graph.getNodeData?.() ?? []).map((x: any) => x.id),
    ...(graph.getEdgeData?.() ?? []).map((x: any) => x.id),
    ...(graph.getComboData?.() ?? []).map((x: any) => x.id),
  ]);
  const filtered: Record<string, string[]> = {};
  for (const [id, states] of Object.entries(map)) {
    if (live.has(id)) {
      filtered[id] = states;
    }
  }
  if (!Object.keys(filtered).length) {
    return;
  }
  try {
    await graph.setElementState(filtered as any, enable);
  } catch (e) {
    log("设置元素状态失败（元素可能已变更）", e);
  }
};

/** 安全地聚焦元素：id 已不在模型时静默跳过（focusElement 对缺失 id 会 reject） */
const safeFocusElement = async (graph: any, id: string, animate: boolean) => {
  if (!graph || !id) {
    return;
  }
  try {
    const live = (graph.getNodeData?.() ?? []).some((x: any) => x.id === id);
    if (!live) {
      return;
    }
    await graph.focusElement(id, animate as any);
  } catch (e) {
    log("聚焦元素失败", e);
  }
};

/**
 * 依据 highlight 配置，在悬停时高亮相关元素（相邻节点 / 同组节点）并淡出其余。
 *
 * <p>早期实现依赖 G6 内置 {@code hover-activate} behavior，但在图片节点 / 密集
 * 大图上事件触发不稳定（用户实测三国图谱无高亮反馈）。这里改为 node :pointerenter/leave
 * 上手动计算目标集合并 {@code setElementState}——与 3D 分支同一套思路，效果确定。</p>
 *
 * <p>高亮目标：命中节点本身 + 相邻节点（adjacent）和/或同 group 节点（group）。
 * 仅相邻时额外把命中节点相连的边置亮；其余节点/边置 inactive（淡出）。</p>
 */
const applyHoverHighlight = async (nodeId: string | null, on: boolean) => {
  const graph = graphRef.value;
  if (!graph) return;
  const mode = highlightMode.value;
  if (mode === "none" || !on || !nodeId) {
    // 只清除高亮状态（active/inactive），保留 selected 等其它状态：
    // setElementState 是「整表替换」语义，早先的 setElementState({}) 实际是空操作，
    // 而进入分支的整体替换会把选中态一并抹掉。
    const clearMap: Record<string, string[]> = {};
    (graphData.value.nodes ?? []).forEach(n => {
      const cur: string[] = safeGetElementState(graph, n.id);
      if (cur.includes("active") || cur.includes("inactive")) {
        clearMap[n.id] = baseStates(graph, n.id);
      }
    });
    (graphData.value.edges ?? []).forEach(e => {
      const eid = e.id ?? `${e.source}->${e.target}`;
      const cur: string[] = safeGetElementState(graph, eid);
      if (cur.includes("active") || cur.includes("inactive")) {
        clearMap[eid] = baseStates(graph, eid);
      }
    });
    if (Object.keys(clearMap).length) {
      await safeSetElementState(graph, clearMap, false);
    }
    return;
  }

  const node = nodeById(nodeId);
  const hoverGroup = node?.group;
  const wantAdj = mode === "adjacent" || mode === "both";
  const wantGroup = mode === "group" || mode === "both";

  const nodeTargets = new Set<string>([nodeId]);
  const edgeTargets = new Set<string>();
  const groupNodes = new Set<string>();
  for (const e of graphData.value.edges ?? []) {
    const s = e.source;
    const t = e.target;
    const sideOther = s === nodeId ? t : (t === nodeId ? s : undefined);
    const eid = e.id ?? `${s}->${t}`;
    if (sideOther !== undefined && wantAdj) {
      // 相邻：命中节点与邻居都亮，相邻边亮
      nodeTargets.add(sideOther);
      nodeTargets.add(nodeId);
      edgeTargets.add(eid);
      // 相邻节点的同组也纳入（both 才有意义；adjacent 只做一行时跳过）
      if (wantGroup && hoverGroup && (nodeById(sideOther)?.group === hoverGroup)) {
        groupNodes.add(sideOther);
      }
    }
    if (wantGroup && hoverGroup) {
      const sGroup = nodeById(s)?.group;
      const tGroup = nodeById(t)?.group;
      if ((s === nodeId && tGroup === hoverGroup) || (t === nodeId && sGroup === hoverGroup)) {
        groupNodes.add(s);
        groupNodes.add(t);
        edgeTargets.add(eid);
      }
    }
  }
  if (wantGroup) groupNodes.forEach(id => nodeTargets.add(id));

  const stateMap: Record<string, string[]> = {};
  (graphData.value.nodes ?? []).forEach(n => {
    const base = baseStates(graph, n.id);
    stateMap[n.id] = nodeTargets.has(n.id) ? [...base, "active"] : [...base, "inactive"];
  });
  (graphData.value.edges ?? []).forEach(e => {
    const eid = e.id ?? `${e.source}->${e.target}`;
    const base = baseStates(graph, eid);
    stateMap[eid] = edgeTargets.has(eid) ? [...base, "active"] : [...base, "inactive"];
  });
  await safeSetElementState(graph, stateMap, false);
};

/**
 * 显示/隐藏单条边的标签（edgeLabelMode="onHover" 时用）。
 *
 * <p>G6 v5 里改元素样式要走 {@code updateEdgeData} 再触发重绘，
 * 直接改 data.style 不会立即反映到画布。</p>
 *
 * @param id 边 id
 * @param visible 是否显示标签
 */
const setEdgeLabelVisible = async (id: string, visible: boolean) => {
  const graph = graphRef.value;
  if (!graph || edgeLabelsShown.value) {
    return;
  }
  const edge = edgeById(id);
  if (!edge) {
    return;
  }
  const text = visible ? (edge.label ?? "") : "";
  graph.updateEdgeData([{ id, style: { labelText: text } }]);
};

/** 边标签显隐的当前目标（记录以便移出时还原） */
let lastRevealedEdge: string | null = null;

/**
 * 悬停/移出边时切换该边标签的显隐。
 *
 * @param id 边 id（移出时传 null 表示清除）
 */
const revealEdgeLabel = async (id: string | null) => {
  if (edgeLabelsShown.value) {
    return;
  }
  if (lastRevealedEdge && lastRevealedEdge !== id) {
    await setEdgeLabelVisible(lastRevealedEdge, false);
  }
  lastRevealedEdge = id;
  if (id) {
    await setEdgeLabelVisible(id, true);
  }
};

/**
 * 切换「全部边标签常显」。
 *
 * <p>打开时给每条边补回 labelText；关闭时清空，并把当前悬停揭示的那条也一并收回。</p>
 *
 * @param v 开关新值（ReSwitch 的 update 事件签名是 string | number | boolean）
 */
const onToggleAllEdgeLabels = async (v: string | number | boolean) => {
  const next = v === true || v === "true";
  edgeLabelsShownOverride.value = next;
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  if (!next) {
    lastRevealedEdge = null;
  }
  const updates = (graphData.value.edges ?? []).map((e) => {
    const id = e.id ?? `${e.source}->${e.target}`;
    return { id, style: { labelText: next ? (e.label ?? "") : "" } };
  });
  if (updates.length) {
    graph.updateEdgeData(updates);
  }
};

/** 把已固定节点在布局后钉回原位（G6 的固定语义靠节点自身 x/y 保持） */
const pinFixedNodes = async () => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  const fixed = (graphData.value.nodes ?? []).filter(n => n.fixed);
  if (!fixed.length) {
    return;
  }
  const pins: any[] = [];
  fixed.forEach(n => {
    const d: any = graph.getElementData(n.id);
    const x = d?.style?.x ?? d?.x;
    const y = d?.style?.y ?? d?.y;
    if (x != null && y != null) {
      pins.push({ id: n.id, style: { x, y } });
    }
  });
  if (pins.length) {
    log("pin fixed nodes", pins.length);
  }
};

/** 节点/边状态样式。用函数生成，让 hoverFocus 开关重建图实例时生效。 */
const buildStateStyle = () => ({
  node: {
    selected: { lineWidth: 3, stroke: "var(--el-color-primary)", halo: true },
    active: { lineWidth: 2, stroke: "var(--el-color-primary)", halo: true, haloOpacity: 0.3 },
    inactive: { opacity: hoverFocusOn.value ? 0.04 : 0.1 },
  },
  edge: {
    selected: { lineWidth: 2, stroke: "var(--el-color-primary)" },
    active: { lineWidth: 2, opacity: 1 },
    inactive: { opacity: hoverFocusOn.value ? 0.02 : 0.08 },
  },
});

/** 创建图实例 */
/** 已装载数据的指纹（节点 id 列表 + 边 id 列表），用于跳过无实质变化的更新 */
let appliedKey = "";

/**
 * 模型代数：每次模型被整体重装（initGraph 首装 / doSetData 重装 / 扩线追加）
 * 或被就地变更（增删改、G6 用户编辑）后自增。
 *
 * <p>布局指纹带上它：模型重装后即使数据指纹与布局参数都没变，节点坐标也已被
 * G6 重置为默认随机位，必须重排；而「同一份模型 + 同一套布局参数」的重复
 * 请求（典型如页面 ready 回调里再 setLayout 一次、后台设置回放 applyLayoutTuning）
 * 纯属重复劳动——248 节点 force-atlas2 同步布局一次要阻塞主线程约 2s，
 * 初始化链路上叠 6 次就是 12s 的「非常卡」。</p>
 */
let modelGeneration = 0;

/**
 * 上一次成功布局的指纹：模型代数 + 数据指纹 + 布局名 + 生效参数。
 *
 * <p>三者全同的下一次布局请求直接跳过（仍会走 fitView 等轻量收尾）。
 * 调用方确需强制重排时传 {@code force}。</p>
 */
let lastLayoutStamp = "";

/**
 * 布局执行链：把 layoutForGraph 的所有调用串行化。
 *
 * <p>初始化窗口内 loadData / applyLayoutTuning / setLayout 可能交叉到达，
 * G6 在同一实例上并发 setLayout + layout 会让先到的请求执行后到的配置，
 * 指纹比较也会读到中间态。串行化后每次请求都在上一次真正结束后求值。</p>
 */
let layoutChain: Promise<unknown> = Promise.resolve();

/**
 * 计算数据指纹。
 *
 * @param d 图数据
 * @return 指纹字符串
 */
const keyOf = (d: RelationGraphData) =>
  (d.nodes ?? []).map(n => n.id).join("|") + "#" +
  (d.edges ?? []).map(e => e.id ?? `${e.source}->${e.target}`).join("|");

/**
 * 力导向（force 系）布局的默认细分参数。
 *
 * <p>底层 d3-force 的默认值节点斥力很弱（{@code manyBody.strength:-30}）、
 * 且默认 {@code preventOverlap:false}、{@code nodeSpacing:0}——连了边的节点
 * 会因为斥力不足、又不防重叠而紧紧挤成一团。这里给一组更松、更防重叠的默认值，
 * 让「连接线」两侧节点保持可读间距；调用方仍可用 {@code layoutOptions} 覆盖任意项。</p>
 *
 * <p><b>力导向系判定</b>：{@code force} / {@code force-atlas2} / {@code d3-force} /
 * {@code d3-force-directed} 都是 d3 力的变体，必须共享同一套防重叠默认值。
 * 早期实现只判全等 {@code === "force"}，导致业务侧改用 {@code force-atlas2}
 * （知识图谱 248 节点即用此布局）时默认值全部失效、节点挤成一团。</p>
 */
const FORCE_LAYOUT_DEFAULTS: Record<string, unknown> = {
  // 连接距离：一条边两端的目标间距（越大越松）
  linkDistance: 120,
  // ---- d3-force 系（force / d3-force / d3-force-directed）----
  // 节点斥力（顶层入口，等价 manyBody.strength，默认仅 -30）：负值越大彼此推得越开
  nodeStrength: -600,
  // ---- atlas2 系（force-atlas2）----
  // 注意：atlas2 并不认 nodeRepulsion / edgeRepulsion / preventOverlapLayout / maxIterations
  // 这类从旧版 G6 v4 传下来的参数名，它真正的力学旋钮是 kr（斥力，越大越松散）
  // 与 kg（重力，越大越向中心聚）。kr 大 + kg 小 = 图铺开；反之挤成一团。
  kr: 60,
  kg: 3,
  // 关掉自动剪枝：G6 在节点数 >100 时会默认 prune=true，
  // 而 prune 的行为是「把出度≤1 的叶子节点坐标直接写成父节点坐标」——
  // 248 节点的关系图里叶子占多数，一开剪枝它们就全部叠在父节点上，
  // 这才是节点糊成一团的真正元凶（调 kr/kg 根本救不回来）。
  prune: false,
  // ---- 收敛上限（大图防卡）----
  // force-atlas2 默认 maxIteration=0（自动迭代到 minMovement 收敛），
  // 300+ 节点在桌面浏览器上要跑上万步、阻塞主线程十几秒。
  // 这里给一个合理上限，让布局「够用即可收敛」：宁可多留一点距离感，
  // 也不能让首屏卡死在物理迭代里。首帧渲染 → 布局快速铺开 → fitView。
  maxIteration: 800,
  minMovement: 1.2,
  // ---- 两者共用 ----
  // 防重叠：按 nodeSize + nodeSpacing 做碰撞分离，避免节点/边叠在一起。
  // atlas2 的 preventOverlap 必须同时给 nodeSize 才会真正做碰撞检测，这里已给。
  preventOverlap: true,
  nodeSize: 40,
  nodeSpacing: 24,
};

/**
 * 是否为 d3 力导向系布局（force / force-atlas2 / d3-force / d3-force-directed）。
 *
 * <p>用包含匹配而非全等：G6 v5 注册的力导向布局还有 {@code d3-force}、
 * {@code d3-force-directed} 等变体，全等判断会让它们拿不到
 * {@link FORCE_LAYOUT_DEFAULTS} 的防重叠参数。</p>
 *
 * @param layoutType 布局类型
 * @return 是否属于力导向系
 */
const isForceLayout = (layoutType: string): boolean =>
  typeof layoutType === "string" && layoutType.includes("force");

/**
 * 合并布局参数：把 force 默认值与调用方 layoutOptions 做深合并（调用方可覆盖任意项）。
 *
 * <p>只对 force 系布局注入默认值；其它布局（radial/circular/...）原样透传，
 * 避免给不相关的布局塞进无效参数。</p>
 *
 * @param layoutType 布局类型
 * @param override 调用方传入的 layoutOptions
 * @return 合并后的布局参数
 */
const resolveLayoutOptions = (layoutType: string, override?: Record<string, unknown>): Record<string, unknown> => {
  // 分组聚簇：交给 G6 原生 combo-combined（参数默认值在 toGroupedLayoutDesc 里兜）
  if (layoutType === GROUPED_LAYOUT) {
    return toGroupedLayoutDesc(override);
  }
  const base = isForceLayout(layoutType) ? FORCE_LAYOUT_DEFAULTS : {};
  if (!override) {
    return base;
  }
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(override)) {
    const bv = base[k];
    const ov = override[k];
    out[k] = bv && ov && typeof bv === "object" && typeof ov === "object" && !Array.isArray(bv)
      ? { ...(bv as object), ...(ov as object) }
      : ov;
  }
  return out;
};

/**
 * 元素数阈值：超过它就放弃布局动画，改走同步布局。
 *
 * <p>G6 v5 的「动画布局」每个 tick 都会 {@code getLayoutResult + updateElementPosition}
 * 全量重绘全部节点与边——几百个元素时单 tick 即几十毫秒、300 次迭代要分钟级，
 * 组件表现为永远停在「暂无数据」（{@code empty} 一直是 true、{@code @ready} 不触发）。</p>
 */
const LAYOUT_ANIMATION_MAX_ELEMENTS = 150;

/**
 * 大图布局降级：元素数超过 {@link LAYOUT_ANIMATION_MAX_ELEMENTS} 时，
 * 显式给布局参数补 {@code animation:false}，让 G6 走 execute/stop/tick 的同步分支——
 * 纯物理迭代（实测 298 节点 + 487 边约 1s）+ 一次终态重绘，收敛结果与动画路径一致。
 * 小图保持动画布局（观察力导收敛过程）不变。
 *
 * @param graph 本次要执行布局的 G6 实例
 */
/**
 * 计算当前图模型的布局指纹（数据指纹 + 布局名 + 生效参数，剔除随运行态变化的
 * {@code animation} 开关——大图降级会给布局补 {@code animation:false}，
 * 同一份配置首次运行前后只有这一位不同，不应影响指纹判定）。
 *
 * @param graph 本次要执行布局的 G6 实例
 * @return 指纹字符串
 */
const layoutStampOf = (graph: Graph): string => {
  const nodes = graph.getNodeData?.() ?? [];
  const edges = graph.getEdgeData?.() ?? [];
  const dataKey = keyOf({ nodes, edges } as any);
  const cur = graph.getLayout?.();
  const first: any = Array.isArray(cur) ? cur[0] : cur;
  const optsKey = first && typeof first === "object"
    ? Object.keys(first)
      .filter(k => k !== "animation")
      .sort()
      .map(k => `${k}=${JSON.stringify(first[k])}`)
      .join(",")
    : "";
  return `${modelGeneration}|${dataKey}|${first?.type ?? ""}|${optsKey}`;
};

/**
 * 执行一次布局（内部实现）。
 *
 * <p>指纹未变且未显式 force 时直接跳过：模型没变、参数没变的重排是纯浪费。</p>
 *
 * @param graph 本次要执行布局的 G6 实例
 * @param from 调用来源（仅用于日志）
 * @param force 忽略指纹强制重排
 */
const runLayoutForGraph = async (graph: Graph, from: string, force: boolean): Promise<void> => {
  const nodes = graph.getNodeData?.() ?? [];
  const edges = graph.getEdgeData?.() ?? [];
  const stamp = layoutStampOf(graph);
  if (!force && stamp === lastLayoutStamp) {
    log(`布局指纹未变（${from}），跳过重复重排`);
    return;
  }
  // 分组聚簇布局（groupedLayout=true）由自定义布局 rrg-cluster 一次算好终态坐标，
  // 无需预写力导向种子坐标。
  if (nodes.length + edges.length <= LAYOUT_ANIMATION_MAX_ELEMENTS) {
    await graph.layout();
    lastLayoutStamp = stamp;
    return;
  }
  const cur = graph.getLayout?.();
  const withAnimationOff = Array.isArray(cur)
    ? cur.map((l: any) => ({ ...l, animation: false }))
    : { ...(cur && typeof cur === "object" ? cur : {}), animation: false };
  await graph.layout(withAnimationOff as any);
  lastLayoutStamp = stamp;
};

const layoutForGraph = (graph: Graph, from = "?", force = false): Promise<void> => {
  const run = layoutChain.then(() => runLayoutForGraph(graph, from, force));
  layoutChain = run.catch(() => {});
  return run;
};

/**
 * 装载数据：走 addNodeData / addEdgeData 追加路径。
 *
 * @param d 图数据
 */
const loadData = async (d: RelationGraphData) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  // 模型重装：坐标已被 G6 重置，后续布局必须真正执行
  modelGeneration++;
  const nodes = (d.nodes ?? []).map(toNodeData);
  const edges = (d.edges ?? []).map(toEdgeData);
  // combo 必须先于节点注册：节点通过 combo 字段引用容器（rrg-group:*），
  // G6 v5 若先 addNodeData 再 addComboData，draw/render 解析节点 combo 引用时会抛
  // "Node not found for id: rrg-group:xxx"。故先补 combo，再节点，最后边。
  (d.combos ?? []).forEach(c => graph.addComboData([c as any]));
  if (nodes.length) {
    graph.addNodeData(nodes as any);
  }
  if (edges.length) {
    graph.addEdgeData(edges as any);
  }
  await graph.draw();
  // 装载后必须真跑一次布局：draw() 只画不排，节点坐标一直缺省（全堆在图原点），
  // 随后的 fitView 会把这一小簇按「适配」放大到 maxZoom——观感就是巨大的节点与边互相重叠。
  // setLayout 走的正是 layout() → fitView 这条链路，这里对齐它。
  try {
    await layoutForGraph(graph, "loadData");
  } catch (e) {
    // 树布局（dendrogram / indented / mindmap / compact-box）要求树形数据，
    // 用在普通关系图上 G6 会抛 "Tree structure not found"：如实记日志，不让它变成未捕获异常
    log("装载后布局失败（树布局需要树形数据）：", e);
  }
  appliedKey = keyOf(d);
  empty.value = nodes.length === 0;
  await fitAfterLoad(graph);
  pinFixedNodes();
  // 首装 / 重装不属于「可撤销的编辑」：清空撤销栈，保证 undo 回到的是本次装载前的状态。
  clearHistoryStack();
  // 节点内容插槽：装载后把每个 html 节点的 DOM 容器渲染并挂载好
  attachSlots();
  // 放在 loadData 末尾而非各 mutator：initGraph 首装、doSetData 重装都走这里，
  // 保证「以 mode=3d 首次挂载」时 3D 层也能拿到首份快照
  sync3d();
  syncSetPlugins(graph);
};

/** 取得 History 插件实例（key='history'）并挂上 change 监听 */
const setupHistory = (graph: Graph) => {
  try {
    historyInst.value = (graph as any).getPluginInstance?.("history") ?? null;
  } catch {
    historyInst.value = null;
  }
  const h = historyInst.value;
  if (h?.on) {
    h.on("change", () => {
      refreshHistoryState();
    });
  }
  refreshHistoryState();
};

/** 刷新 canUndo / canRedo + 对外事件 */
const refreshHistoryState = () => {
  const h = historyInst.value;
  canUndo.value = !!h?.canUndo?.();
  canRedo.value = !!h?.canRedo?.();
  emit("history-change", { canUndo: canUndo.value, canRedo: canRedo.value });
};

/** 清空撤销 / 重做栈（不可撤销的装载后调用） */
const clearHistoryStack = () => {
  historyInst.value?.clear?.();
  refreshHistoryState();
};

/** 创建图实例 */
const initGraph = async () => {
  if (!containerRef.value) {
    return;
  }
  const graph = new Graph({
    container: containerRef.value,
    autoResize: true,
    // 关键：不要开 autoFit: "view"。它在**每次 render** 都按当前包围盒执行 fitView，
    // 而空图（数据未到 / 弹窗 v-loading 期间先挂载）的包围盒是原点处的零面积簇，
    // G6 会把它「适配」放大到接近 maxZoom（实测 zoom 4.7~10）——业务页看到的巨大点边重叠。
    // 更糟的是 G6 v5 的 fitView 默认 when:'overflow'：一旦被放大到「填满视口」，后续真数据
    // render 时判定「内容不超出、无需适配」，缩放就永久卡在那个放大值上。
    // 视口适配改由 loadData 末尾的 fitAfterLoad（when:'always' + 空数据守卫）统一负责。
    autoFit: false,
    animation: true,
    data: { nodes: [], edges: [], combos: [] },
    node: {
      style: { fill: "#e8f3ff", stroke: "#2992ff", lineWidth: 1.5 },
      // G6 v5 的状态样式必须挂在 node.state（顶层 nodeState 是无效键，悬停高亮才不生效）
      state: buildStateStyle().node,
    },
    edge: {
      style: { stroke: "#c3cbd8", lineWidth: 1.2 },
      state: buildStateStyle().edge,
    },
    combo: {
      // 原生圆形组合：容器尺寸由子节点包围盒自动推导（CircleCombo），
      // 视觉上是一团一气泡，不是矩形框
      type: "circle",
      style: { fill: "rgba(109,93,252,0.06)", stroke: "#c9c2ff", lineWidth: 1.5, lineDash: [4, 6] },
    },
    // 分组聚簇的布局描述自带 type（combo-combined），不能再前置 { type } 展开覆盖
    layout: (currentLayout.value === GROUPED_LAYOUT
      ? toGroupedLayoutDesc(props.layoutOptions)
      : { type: currentLayout.value, ...resolveLayoutOptions(currentLayout.value, props.layoutOptions) }) as any,
    behaviors: buildBehaviors(),
    plugins: buildPlugins(),
  } as any);

  graphRef.value = graph;
  bindEvents(graph);
  bindAssistCleanup();
  await graph.render();
  // history 插件在 render 时实例化，取出实例用于 undo/redo 与状态刷新
  setupHistory(graph);
  await loadData(graphData.value);
  ready.value = true;
  // 初始化是异步的：父组件若在 render 期间取到数并更新了 props，那次更新会落在 ready 之前，
  // 被 watcher 跳过（实测就是这里丢了节点）。这里按指纹补一次最终同步。
  if (keyOf(graphData.value) !== appliedKey) {
    log("init 期间数据已更新，补一次同步");
    await setData(graphData.value);
  }
  // Neo4j 式部分加载：只拉 depth 层局部子图，后续靠右键扩线继续展开。
  // 只在「配置了 loadPartial 且尚未加载过」时执行一次，避免和 props 数据来回重装。
  if (props.partial && props.loadPartial && !partialLoaded.value) {
    try {
      const partialData = await props.loadPartial(props.expandDepth);
      partialLoaded.value = true;
      if (partialData) {
        await setData(partialData);
      }
    } catch (e) {
      log("部分加载失败", e);
    }
  }
  log("rendered; model", (graph.getNodeData?.() ?? []).length, "nodes");
  emit("ready", graph);
};

/**
 * 装载（首装 / 换数据）完成后的视口适配。
 *
 * <p>调用时机在 layout() resolve 之后（见 loadData），此时布局已把节点铺开，
 * fitView 计算的是真实内容包围盒。此前是 400ms 定时抢跑：布局尚未铺开，
 * 会把聚簇包围盒按「适配」放大到 maxZoom（10），观感即巨大的点边重叠。</p>
 *
 * <p><strong>when:'always'</strong>：G6 v5 的 fitView 默认 {@code when:'overflow'}，
 * 只在内容超出视口时才适配。空图阶段（数据未到 / 弹窗先挂载）包围盒是原点零面积簇，
 * 一旦被放大到「填满视口」，后续真数据来了会被判定「不超出、无需适配」而原样卡死——
 * 这正是业务页看到节点巨大且缩放再也回不去的根因。这里强制按真实包围盒重算。</p>
 *
 * @param graph 本次装载使用的 G6 实例（identity 守卫：期间若被 rebuild 替换则跳过）
 */
const fitAfterLoad = async (graph: Graph) => {
  if (graphRef.value !== graph) {
    log("装载后适配跳过：graph 实例已被替换或已卸载");
    return;
  }
  // 空图不 fit：没有节点时包围盒退化到原点零面积簇，G6 会把它放大到接近 maxZoom，
  // 反而制造出「巨大点」的假象。等数据真正进来再 fit。
  if (!(graph.getNodeData?.() ?? []).length) {
    return;
  }
  try {
    await graph.fitView?.({ when: "always" } as any, false)?.catch?.(() => {});
    pinFixedNodes();
  } catch (e) {
    log("装载后适配失败", e);
  }
};

const syncSelected = (graph: Graph) => {
  // click-select 行为的状态应用是异步的（先同步 updateData，再 yield 等待渲染动画），
  // 在 node:click / canvas:click 里同步读会读到点击前的旧状态（永远慢一拍、发空数组）。
  // 推迟到微任务：事件分发结束时行为的同步段已完成，读到的是本次交互后的真实选中。
  // 节点与边都要读：点击边时 G6 同样会打 selected 态（并清掉节点选中），
  // 只读 node 会让「删除边 / 更新边」按钮永不出现、selection-change 收不到边 id。
  queueMicrotask(() => {
    const nodeIds = graph.getElementDataByState?.("node", "selected")?.map((x: any) => x.id) ?? [];
    const edgeIds = graph.getElementDataByState?.("edge", "selected")?.map((x: any) => x.id) ?? [];
    const ids = [...nodeIds, ...edgeIds];
    selectedIds.value = ids;
    emit("selection-change", ids);
    // 选中态变了：让插槽 scope 里的 selected 跟着更新
    attachSlots();
  });
};

/** 绑定交互事件 */
const bindEvents = (graph: Graph) => {
  graph.on("node:click", (ev: any) => {
    const n = nodeById(idOf(ev));
    if (n) {
      emit("node-click", n, ev);
    }
    syncSelected(graph);
  });
  graph.on("node:contextmenu", (ev: any) => {
    const n = nodeById(idOf(ev));
    if (n) {
      emit("node-right-click", n, ev);
      if (props.contextMenu) {
        openMenu(ev, "node", n.id);
      }
    }
  });
  graph.on("node:dblclick", (ev: any) => {
    const n = nodeById(idOf(ev));
    if (n) {
      emit("node-dblclick", n, ev);
    }
  });
  graph.on("node:pointerenter", async (ev: any) => {
    const n = nodeById(idOf(ev)) ?? null;
    hovered.value = n;
    emit("node-hover", n, ev);
    // 指针转到节点上时收起边标签，否则上一条边的标签会一直挂着
    void revealEdgeLabel(null);
    await applyHoverHighlight(n?.id ?? null, true);
  });
  graph.on("node:pointerleave", async (ev: any) => {
    hovered.value = null;
    emit("node-hover", null, ev);
    await applyHoverHighlight(null, false);
  });
  graph.on("edge:click", (ev: any) => {
    const e = edgeById(idOf(ev));
    if (e) {
      emit("edge-click", e, ev);
    }
    // 点击边同样要同步选中态：否则 selectedIds 停留在上一个节点，
    // 「删除边 / 更新边」工具栏按钮（依赖 selectedIds + isEdgeId）永远不出现，
    // 父组件也收不到 selection-change。
    syncSelected(graph);
  });
  graph.on("edge:pointerenter", (ev: any) => {
    void revealEdgeLabel(idOf(ev));
  });
  graph.on("edge:pointerleave", () => {
    void revealEdgeLabel(null);
  });
  graph.on("edge:contextmenu", (ev: any) => {
    const e = edgeById(idOf(ev));
    if (e) {
      emit("edge-right-click", e, ev);
      if (props.contextMenu) {
        openMenu(ev, "edge", e.id ?? `${e.source}->${e.target}`);
      }
    }
  });
  graph.on("edge:dblclick", (ev: any) => {
    const e = edgeById(idOf(ev));
    if (e) {
      emit("edge-dblclick", e, ev);
    }
  });
  graph.on("canvas:click", (ev: any) => {
    menu.value.visible = false;
    emit("canvas-click", ev);
    syncSelected(graph);
  });
  graph.on("canvas:contextmenu", (ev: any) => {
    if (props.contextMenu && props.editable) {
      openMenu(ev, "canvas", "");
    }
  });
};

/** 打开右键菜单（坐标取客户端坐标，菜单用 fixed 定位） */
const openMenu = (ev: any, kind: "node" | "edge" | "canvas", id: string) => {
  const oe = ev?.originalEvent ?? ev;
  const x = (oe?.clientX ?? oe?.canvas?.x ?? 0) as number;
  const y = (oe?.clientY ?? oe?.canvas?.y ?? 0) as number;
  menu.value = { visible: true, x, y, kind, id };
};

// ==================== 对外 API ====================

/** 应用一份新数据（保持布局与视口） */
/** 装载串行化链：并发装载会重复 addNodeData，抛 "Node already exists" */
let applyChain: Promise<void> = Promise.resolve();

/**
 * 清空并重新装载（对外 setData 的实现体）。
 *
 * @param d 图数据
 */
const doSetData = async (d: RelationGraphData) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  // 显式先删后加：实测 setData({nodes:[],...}) 并不会真正把已有节点清掉，
  // 紧接着 addNodeData 会报 "Node already exists"。
  const prevEdges = (graph.getEdgeData?.() ?? []).map((x: any) => x.id);
  const prevNodes = (graph.getNodeData?.() ?? []).map((x: any) => x.id);
  const prevCombos = (graph.getComboData?.() ?? []).map((x: any) => x.id);
  if (prevEdges.length) {
    graph.removeEdgeData(prevEdges);
  }
  if (prevNodes.length) {
    graph.removeNodeData(prevNodes);
  }
  if (prevCombos.length) {
    graph.removeComboData(prevCombos);
  }
  // 被移除节点的插槽容器要显式卸载：否则 slotEls / 手工 render 的实例会随每次
  // setData 累积（G6 只销毁自己的 html DOM，不管我们挂进去的子元素与 Vue 实例）。
  prevNodes.forEach(id => unmountSlot(id));
  await graph.draw();
  await loadData(d);
  clearHistoryStack();
  emit("data-change", d);
};

/**
 * 更新整图数据（串行执行，避免与初始化补同步并发）。
 *
 * @param d 图数据
 */
const setData = async (d: RelationGraphData) => {
  const run = applyChain.then(() => doSetData(d)).catch(e => {
    log("setData 失败", e);
  });
  applyChain = run;
  return run;
};

const addNode = async (n: RelationNode) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.addNodeData([toNodeData(n)]);
  empty.value = false;
  // 先广播数据变更再等渲染：draw() 会等状态过渡动画播完（默认约 1s），
  // 把 emitDataChange 排在它后面等于给 data-change 事件人为加一秒延迟
  emitDataChange();
  sync3d();
  await graph.draw();
  attachSlots();
};

const addEdge = async (e: RelationEdge) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.addEdgeData([toEdgeData(e)]);
  emitDataChange();
  sync3d();
  await graph.draw();
};

const updateNode = async (n: RelationNode) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.updateNodeData([toNodeData(n)] as any);
  // 先广播数据变更再等渲染：draw() 会等状态过渡动画播完（默认约 1s），
  // 把 emitDataChange 排在它后面等于给 data-change 事件人为加一秒延迟
  emitDataChange();
  sync3d();
  await graph.draw();
  attachSlots();
};

const updateEdge = async (e: RelationEdge) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.updateEdgeData([toEdgeData(e)] as any);
  emitDataChange();
  sync3d();
  await graph.draw();
};

const removeNode = async (id: string) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.removeNodeData([id]);
  unmountSlot(id);
  empty.value = (graph.getNodeData?.() ?? []).length === 0;
  // 先广播数据变更再等渲染：draw() 会等状态过渡动画播完（默认约 1s），
  // 把 emitDataChange 排在它后面等于给 data-change 事件人为加一秒延迟
  emitDataChange();
  sync3d();
  await graph.draw();
};

const removeEdge = async (id: string) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.removeEdgeData([id]);
  emitDataChange();
  sync3d();
  await graph.draw();
};

/**
 * 更新当前选中的单个节点（工具栏「更新节点」按钮）。
 *
 * <p>内联编辑的最小实现：label 追加 _udt 并写入 __updated 标记，
 * 全程复用公开 API {@link updateNode}（含撤销栈与 3D 同步）；
 * 业务需要自定义编辑表单时，按同样方式调用 updateNode 即可。</p>
 */
const updateSelectedNode = async () => {
  const ids = selectedIds.value;
  if (ids.length !== 1) {
    return;
  }
  const node = nodeById(ids[0]);
  if (!node) {
    return;
  }
  await updateNode({
    ...node,
    label: `${node.label ?? node.id}_udt`,
    data: { ...(node.data ?? {}), __updated: true },
  });
};

/**
 * 更新当前选中的单条边（工具栏「更新边」按钮）。
 *
 * <p>语义与 {@link updateSelectedNode} 对称。</p>
 */
const updateSelectedEdge = async () => {
  const ids = selectedIds.value;
  if (ids.length !== 1) {
    return;
  }
  const edge = edgeById(ids[0]);
  if (!edge) {
    return;
  }
  await updateEdge({
    ...edge,
    label: `${edge.label ?? edge.id}_udt`,
    data: { ...(edge.data ?? {}), __updated: true },
  });
};

/** 删除当前选中的单个节点（工具栏「删除节点」按钮） */
const removeSelectedNode = async () => {
  const ids = selectedIds.value;
  if (ids.length !== 1) {
    return;
  }
  await removeNode(ids[0]);
};

/** 删除当前选中的单条边（工具栏「删除边」按钮） */
const removeSelectedEdge = async () => {
  const ids = selectedIds.value;
  if (ids.length !== 1) {
    return;
  }
  await removeEdge(ids[0]);
};

/** 切换布局 */
const setLayout = async (name: RelationLayoutName, options?: Record<string, unknown>, force = false) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  currentLayout.value = name;
  try {
    const desc: any = name === GROUPED_LAYOUT
      ? toGroupedLayoutDesc(options ?? perLayoutTuningValues.value[name] ?? props.layoutOptions)
      : { type: name, ...resolveLayoutOptions(name, options ?? perLayoutTuningValues.value[name] ?? props.layoutOptions) };
    graph.setLayout(desc);
    await layoutForGraph(graph, "setLayout", force);
  } catch (e) {
    // 树布局（dendrogram / indented / mindmap / compact-box）要求树形数据，
    // 用在普通关系图上 G6 会抛 "Tree structure not found"。这里优雅失败并如实记日志，
    // 不让它变成一个未捕获异常。
    log("布局失败（树布局需要树形数据）：" + name, e);
    emit("layout-change", name + ":failed");
    return;
  }
  await graph.fitView?.({ when: "always" } as any, false)?.catch?.(() => {});
  pinFixedNodes();
  emit("layout-change", name);
};

/**
 * 「布局调参」面板的状态。
 *
 * <p>面板里的每个参数都直接对应 {@link FORCE_LAYOUT_DEFAULTS} 的同名项；
 * 改动后调用 {@link applyLayoutTuning} 以新参数重跑一次布局，做到实时生效。
 * 非力向布局下列表为空，面板会自动提示「当前布局不支持调参」。</p>
 */
interface LayoutTuningField {
  /** 传给 G6 布局的参数键 */
  key: string;
  /** 界面标签 */
  label: string;
  /** range 控件范围 */
  min?: number;
  max?: number;
  step?: number;
  /**
   * 控件类型。
   *
   * <p>不能靠 {@code step === 1} 判定「是否开关」——{@code kr}/{@code kg}
   * 的步长也是 1 却是有界数值，会被误渲染成 on/off 开关而丢掉全部调节能力。</p>
   */
  control: "switch" | "range" | "select";
  /** 默认值；缺省时按 range 取 min */
  defaultValue?: number | string;
  /** select 控件的选项 */
  options?: Array<{ label: string; value: string }>;
}

/**
 * 各布局独立的面板调参表。
 *
 * <p>布局切换后面板只显示当前布局自己的字段；每个布局的参数单独保存，
 * 切走再切回仍在原值上。</p>
 */
const LAYOUT_SETTING_FIELDS: Record<string, LayoutTuningField[]> = {
  "force": [
    { key: "nodeStrength", label: "节点斥力", min: -2000, max: -100, step: 100, control: "range" },
    { key: "linkDistance", label: "连线距离", min: 40, max: 400, step: 10, control: "range" },
    { key: "nodeSize", label: "碰撞半径", min: 10, max: 120, step: 5, control: "range" },
    { key: "preventOverlap", label: "防重叠", min: 0, max: 1, step: 1, control: "switch", defaultValue: 0 },
  ],
  "d3-force": [
    { key: "nodeStrength", label: "节点斥力", min: -2000, max: -100, step: 100, control: "range" },
    { key: "linkDistance", label: "连线距离", min: 40, max: 400, step: 10, control: "range" },
    { key: "nodeSize", label: "碰撞半径", min: 10, max: 120, step: 5, control: "range" },
    { key: "preventOverlap", label: "防重叠", min: 0, max: 1, step: 1, control: "switch", defaultValue: 0 },
  ],
  "force-atlas2": [
    { key: "kr", label: "斥力系数", min: 1, max: 200, step: 1, control: "range" },
    { key: "kg", label: "重力系数", min: 1, max: 100, step: 1, control: "range" },
    { key: "prune", label: "剪枝贴附", min: 0, max: 1, step: 1, control: "switch", defaultValue: 0 },
  ],
  "fruchterman": [
    { key: "gravity", label: "重力系数", min: 1, max: 20, step: 1, control: "range" },
    { key: "linkDistance", label: "连线距离", min: 40, max: 400, step: 10, control: "range" },
    { key: "nodeSize", label: "节点尺寸", min: 10, max: 120, step: 5, control: "range" },
  ],
  "circular": [
    { key: "radius", label: "圆半径", min: 60, max: 800, step: 20, control: "range" },
    { key: "startAngle", label: "起始角度", min: 0, max: 360, step: 10, control: "range" },
    { key: "endAngle", label: "结束角度", min: 0, max: 360, step: 10, control: "range" },
    { key: "clockwise", label: "顺时针", min: 0, max: 1, step: 1, control: "switch", defaultValue: 1 },
  ],
  "grid": [
    { key: "cols", label: "列数", min: 1, max: 20, step: 1, control: "range" },
    { key: "rows", label: "行数", min: 1, max: 20, step: 1, control: "range" },
    { key: "nodeSize", label: "节点尺寸", min: 10, max: 120, step: 5, control: "range" },
    { key: "preventOverlap", label: "防重叠", min: 0, max: 1, step: 1, control: "switch", defaultValue: 1 },
  ],
  "concentric": [
    { key: "minNodeSpacing", label: "最小间距", min: 0, max: 200, step: 5, control: "range" },
    { key: "nodeSpacing", label: "节点间距", min: 0, max: 120, step: 2, control: "range" },
    { key: "nodeSize", label: "节点尺寸", min: 10, max: 120, step: 5, control: "range" },
    { key: "preventOverlap", label: "防重叠", min: 0, max: 1, step: 1, control: "switch", defaultValue: 1 },
  ],
  "radial": [
    { key: "linkDistance", label: "连线距离", min: 40, max: 400, step: 10, control: "range" },
    { key: "nodeSize", label: "节点尺寸", min: 10, max: 120, step: 5, control: "range" },
    { key: "preventOverlap", label: "防重叠", min: 0, max: 1, step: 1, control: "switch", defaultValue: 1 },
  ],
  "dagre": [
    { key: "rankdir", label: "方向", control: "select", defaultValue: "TB", options: [
      { label: "上→下", value: "TB" }, { label: "下→上", value: "BT" }, { label: "左→右", value: "LR" }, { label: "右→左", value: "RL" },
    ] },
    { key: "nodesep", label: "同级间距", min: 10, max: 200, step: 5, control: "range" },
    { key: "ranksep", label: "层级间距", min: 10, max: 240, step: 5, control: "range" },
    { key: "nodeSize", label: "节点尺寸", min: 10, max: 120, step: 5, control: "range" },
  ],
  "antv-dagre": [
    { key: "rankdir", label: "方向", control: "select", defaultValue: "TB", options: [
      { label: "上→下", value: "TB" }, { label: "下→上", value: "BT" }, { label: "左→右", value: "LR" }, { label: "右→左", value: "RL" },
    ] },
    { key: "nodesep", label: "同级间距", min: 10, max: 200, step: 5, control: "range" },
    { key: "ranksep", label: "层级间距", min: 10, max: 240, step: 5, control: "range" },
  ],
  // 原生 combo-combined 的三个旋钮：组内节点间距、组合内边距、组间间距
  "rrg-cluster": [
    { key: "nodeSpacing", label: "组内节点间距", min: 0, max: 80, step: 2, control: "range", defaultValue: 12 },
    { key: "comboPadding", label: "组内边距", min: 0, max: 80, step: 2, control: "range", defaultValue: 18 },
    { key: "comboSpacing", label: "组间间距", min: 0, max: 240, step: 4, control: "range", defaultValue: 40 },
  ],
};

/**
 * 当前布局实际支持的调参项。
 *
 * <p>atlas2 的力学旋钮是 {@code kr}/{@code kg}，d3-force 是 {@code nodeStrength}，
 * 两者互不通用；只暴露当前布局真正认的那个，
 * 免得用户拖了一个被 G6 静默忽略的参数还以为没生效。</p>
 */
const availableTuningFields = computed(
  () => LAYOUT_SETTING_FIELDS[currentLayout.value] ?? [],
);

/** 面板展开状态 */
const tuningOpen = ref(false);
/** 每个布局独立保存的调参值（未改动时为空，表示用默认值） */
const perLayoutTuningValues = ref<Record<string, Record<string, number | string>>>({});

/** 当前布局生效的调参值 */
const tuningValues = computed(() => perLayoutTuningValues.value[currentLayout.value] ?? {});

/** 当前布局是否支持面板调参 */
const tuningAvailable = computed(() => availableTuningFields.value.length > 0);

/**
 * 面板上每个输入框的显示值：优先当前布局用户调过的值，否则回落到字段默认值。
 *
 * @param f 参数字段定义
 * @returns 显示值
 */
const tuningValueOf = (f: LayoutTuningField): number | string => {
  const v = tuningValues.value[f.key];
  if (v !== undefined) return v;
  if (f.defaultValue !== undefined) return f.defaultValue;
  return f.min ?? 0;
};

/**
 * 写入当前布局的某个调参值（每个布局独立备份）。
 */
const setTuningValue = (key: string, val: number | string) => {
  perLayoutTuningValues.value = {
    ...perLayoutTuningValues.value,
    [currentLayout.value]: {
      ...(perLayoutTuningValues.value[currentLayout.value] ?? {}),
      [key]: val,
    },
  };
};

/**
 * 重置某一项调参（回到 G6 默认值）。
 *
 * @param key 参数键
 */
const resetTuningOne = (key: string) => {
  const next = { ...(perLayoutTuningValues.value[currentLayout.value] ?? {}) };
  delete next[key];
  perLayoutTuningValues.value = {
    ...perLayoutTuningValues.value,
    [currentLayout.value]: next,
  };
};

/** 重置当前布局全部调参 */
const resetTuningAll = () => {
  const next = { ...perLayoutTuningValues.value };
  delete next[currentLayout.value];
  perLayoutTuningValues.value = next;
};

/**
 * 展开调参面板。
 *
 * <p>对外暴露给自带工具栏的调用方（{@code toolbar=false}），
 * 让它们在自己的工具栏上放一个「调参」按钮来驱动本组件的面板。</p>
 */
const openTuning = () => {
  if (!props.tunable) {
    return;
  }
  tuningOpen.value = true;
};

/** 收起调参面板 */
const closeTuning = () => {
  tuningOpen.value = false;
};

/** 切换调参面板开合 */
const toggleTuning = () => {
  if (tuningOpen.value) {
    closeTuning();
  } else {
    openTuning();
  }
};

/**
 * 以当前调参值重跑一次布局，实现「改参数 → 立刻看到效果」。
 *
 * <p>大图（元素数超 {@link LAYOUT_ANIMATION_MAX_ELEMENTS}）走同步布局，
 * 避免动画布局的分钟级卡顿；结束后 {@code fitView} 把新布局重新框进视口，
 * 否则节点散开后会跑到画布外看不见。</p>
 */
const applyLayoutTuning = async () => {
  const graph = graphRef.value;
  if (!graph || !tuningAvailable.value) {
    return;
  }
  graph.setLayout((currentLayout.value === GROUPED_LAYOUT
    ? toGroupedLayoutDesc(tuningValues.value)
    : {
      type: currentLayout.value,
      ...resolveLayoutOptions(currentLayout.value, tuningValues.value),
    }) as any);
  await layoutForGraph(graph, "tuning");
  await graph.fitView?.({ when: "always" } as any, false)?.catch?.(() => {});
  pinFixedNodes();
  // 调参改动也要持久化到后台（每布局独立）。这里经 scheduleTuningApply 220ms 防抖，
  // 连续拖动滑块只会在停下来后保存一次；applyingSettings 期间 emitSettingsChange 会
  // 自行跳过，避免「应用后台设置 → 反存」的回路。
  emitSettingsChange();
};

/**
 * 单个参数变化回调：写入值后防抖重排。
 *
 * <p>滑块连续拖动会产生大量 input 事件，直接重排会让 G6 每帧全量重绘；
 * 用 220ms 防抖把一串拖动合并成最后一次重排。</p>
 *
 * @param key 参数键
 * @param val 新值
 */
const onTuningInput = (key: string, val: number | string) => {
  setTuningValue(key, val);
  scheduleTuningApply();
};

const scheduleTuningApply = useDebounceFn(() => {
  void applyLayoutTuning();
}, 220);

/**
 * G6 create-edge 行为的内部辅助元素 id 前缀。
 *
 * <p>拖拽连线过程中 G6 会放一条预览边（assist edge）；松手落在无效目标
 * （如画布外）时它的清理不会触发，这条边会残留在模型里。它不属于业务数据，
 * 一旦漏进 exportData 快照就会以幽灵边出现在详情面板 / 计数 / 导出结果里，
 * 所以导出处一律过滤。</p>
 */
const G6_INTERNAL_ID_PREFIX = 'g6-create-edge-assist-';

const isG6InternalId = (id: unknown): boolean =>
  typeof id === 'string' && id.startsWith(G6_INTERNAL_ID_PREFIX);

/** 清掉模型里残留的 G6 内部辅助元素（如拖拽连线中断留下的预览边/预览节点） */
const purgeG6InternalElements = (graph: any) => {
  if (!graph) {
    return;
  }
  try {
    // 逐个删并容错：删辅助边可能触发 G6 create-edge 行为连带清理辅助节点，
    // 此时再删该节点会抛 "Node not found"——元素已不在即为目的达成，忽略即可
    (graph.getNodeData?.() ?? [])
      .filter((d: any) => isG6InternalId(d.id))
      .forEach((d: any) => {
        try {
          graph.removeNodeData([d.id]);
        } catch (e) {
          /* 已被 G6 自身清理 */
        }
      });
    (graph.getEdgeData?.() ?? [])
      .filter((d: any) => isG6InternalId(d.id) || isG6InternalId(d.source) || isG6InternalId(d.target))
      .forEach((d: any) => {
        try {
          graph.removeEdgeData([d.id]);
        } catch (e) {
          /* 已被 G6 自身清理 */
        }
      });
  } catch (e) {
    log("清理 G6 内部辅助元素失败", e);
  }
};

/**
 * 延迟调度辅助元素清理。
 *
 * <p>成功连线后 G6 会在 onFinish 之后自行清理预览节点/边；同步抢删会与它的清理
 * 竞态并让它二次删除时抛 "Node not found"。延迟 500ms 执行，等 G6 清理落地后
 * 再兜底——此时成功连线场景下已无残留（no-op），只有拖拽中止（G6 不清理）的
 * 幽灵元素会被真正移除。多次变更只跑一次，避免高频拖拽下反复触发。</p>
 */
let purgeTimer: ReturnType<typeof setTimeout> | null = null;
/** 指针是否处于按下状态：拖拽进行中时不清辅助元素，避免打断正在画的连线 */
let pointerActive = false;
/** 文档级监听的卸载函数，组件销毁时统一摘除 */
const assistCleanupFns: Array<() => void> = [];
const schedulePurgeG6Internal = () => {
  if (purgeTimer) {
    clearTimeout(purgeTimer);
  }
  purgeTimer = setTimeout(() => {
    purgeTimer = null;
    // 新一轮按下进行中（可能正在拖拽连线）：预览元素属于活跃交互，不扰动
    if (pointerActive) {
      return;
    }
    purgeG6InternalElements(graphRef.value);
  }, 500);
};

/**
 * 挂文档级指针监听，兜底「连线拖拽松手落在画布外」的残留清理。
 *
 * <p>G6 的 create-edge 只在画布内收 pointerup：用户把连线拖到工具栏 / 侧栏 /
 * 甚至窗口外松手时，预览边与预览节点不会收到清理事件，会以幽灵元素留在模型里
 * （画布上可见、可被点选）。落点在画布外时延迟调度清理；与 emitDataChange 的
 * 调度共用同一防抖定时器，成功连线（G6 自清）场景下均为 no-op。</p>
 */
const bindAssistCleanup = () => {
  const canvasOf = () => wrapRef.value?.querySelector(".rrg__canvas") ?? null;
  const onPointerDown = () => {
    pointerActive = true;
  };
  const onPointerUp = (ev: PointerEvent) => {
    pointerActive = false;
    const el = canvasOf();
    if (el && ev.target instanceof Node && el.contains(ev.target)) {
      // 松手在画布内：成功连线由 G6 自行清理，中止拖拽也会触发其它路径，无需抢删
      return;
    }
    schedulePurgeG6Internal();
  };
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointerup", onPointerUp, true);
  assistCleanupFns.push(() => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointerup", onPointerUp, true);
  });
};

const exportData = (): RelationGraphData => ({
  nodes: (graphRef.value?.getNodeData?.() ?? [])
    .filter((d: any) => !isG6InternalId(d.id))
    .map((d: any) => ({
      id: d.id,
      label: d.data?.__label,
      group: d.data?.__group,
      fixed: d.data?.__fixed,
      image: d.data?.__image,
      type: d.type,
      data: d.data,
    })) as RelationNode[],
  edges: (graphRef.value?.getEdgeData?.() ?? [])
    .filter((d: any) => !isG6InternalId(d.id) && !isG6InternalId(d.source) && !isG6InternalId(d.target))
    .map((d: any) => ({
      id: d.id,
      source: d.source,
      target: d.target,
      label: d.data?.__label,
      directed: d.data?.__directed,
      animated: d.data?.__animated,
      type: d.type,
      data: d.data,
    })) as RelationEdge[],
});

/**
 * 广播一次数据变更。
 *
 * <p>把 G6 实时模型导出为业务快照后 emit，并同步 id 指纹（appliedKey）。
 * 两个细节：</p>
 * <ul>
 *   <li>不能 emit props 派生数据 —— add/update/remove 之后父组件拿到的
 *       必须是包含本次变更的完整模型，否则回写 props 会丢掉动态节点/边；</li>
 *   <li>appliedKey 跟着模型走，让「父组件把回调数据原样回传 props」的
 *       回声不会触发整图重装（重装会清空撤销栈）。</li>
 * </ul>
 */
const emitDataChange = () => {
  // 模型被就地变更（增删改 / G6 用户编辑）：坐标指纹已过期，后续布局必须真正执行
  modelGeneration++;
  // 辅助元素清理交给延迟调度：成功连线时 G6 自身会在 onFinish 之后清理预览元素，
  // 同步抢删会让它的二次删除抛 "Node not found"；拖拽中止（松手在画布外）时 G6 不清理，
  // 此时延迟 purge 负责兜底移除残留，避免幽灵边/幽灵节点留在画布上
  schedulePurgeG6Internal();
  const snapshot = exportData();
  appliedKey = keyOf(snapshot);
  emit("data-change", snapshot);
};

// ==================== 3D 视图 ====================

/**
 * 从 G6 模型导出 3D 快照（**带 style 色值**）。
 *
 * <p>不复用 {@link exportData}：它刻意丢掉 style（对外契约是纯业务字段），
 * 而 3D 层需要 style.fill/stroke 还原球体与边的颜色，否则切到 3D 会全变默认色。</p>
 *
 * @return 3D 层可用的图数据（combos 不支持 3D，丢弃）
 */
const build3dData = (): RelationGraphData => {
  const g = graphRef.value;
  if (!g) {
    return { nodes: [...(graphData.value.nodes ?? [])], edges: [...(graphData.value.edges ?? [])] };
  }
  return {
    // 与 exportData 一致过滤 G6 内部辅助元素：3D 快照同样不能带幽灵节点/边
    nodes: (g.getNodeData?.() ?? [])
      .filter((d: any) => !isG6InternalId(d.id))
      .map((d: any) => ({
        id: d.id,
        label: d.data?.__label,
        group: d.data?.__group,
        fixed: d.data?.__fixed,
        image: d.data?.__image,
        type: d.type,
        size: typeof d.style?.size === "number" ? d.style.size : undefined,
        style: d.style ? { fill: d.style.fill, stroke: d.style.stroke } : undefined,
        data: d.data,
      })) as RelationNode[],
    edges: (g.getEdgeData?.() ?? [])
      .filter((d: any) => !isG6InternalId(d.id) && !isG6InternalId(d.source) && !isG6InternalId(d.target))
      .map((d: any) => ({
        id: d.id,
        source: typeof d.source === "object" ? (d.source as any)?.id ?? "" : d.source,
        target: typeof d.target === "object" ? (d.target as any)?.id ?? "" : d.target,
        label: d.data?.__label,
        directed: d.data?.__directed,
        animated: d.data?.__animated,
        style: d.style ? { stroke: d.style.stroke } : undefined,
        data: d.data,
      })) as RelationEdge[],
  };
};

/**
 * 把 G6 最新模型同步进 3D 层（仅 3D 模式下有实际动作）。
 *
 * <p>所有数据变更入口（doSetData / add* / update* / remove*）末尾都会调它，
 * 保证 3D 层与 G6 单一数据源一致。</p>
 */
const sync3d = () => {
  if (!is3d.value) {
    return;
  }
  data3d.value = build3dData();
};

/**
 * 切换 2D/3D 视图。
 *
 * <p>2D→3D：先做快照再显示；3D→2D：直接隐藏 3D 层，G6 全程保活无需恢复。
 * 切到 3D 时顺带把 G6 的选中状态搬过来，切回去时把 3D 的选中写回 G6，
 * 两个模式的选中语义保持连续。</p>
 *
 * @param m 目标模式
 */
const setMode = async (m: RelationViewMode) => {
  if (m === mode.value) {
    return;
  }
  if (m === "3d") {
    // 快照要在 G6 可见（有真实尺寸）时做：此时模型里已带最新坐标与样式
    data3d.value = build3dData();
    selected3d.value = graphRef.value?.getElementDataByState?.("node", "selected")?.map((x: any) => x.id) ?? [];
    mode.value = "3d";
    await nextTick();
    // 3D 力导收敛后自动适配一次（组件内部 onEngineStop 兜底，这里再补一次）
    window.setTimeout(() => {
      try {
        fg3dRef.value?.fitView?.(600);
      } catch (e) {
        log("3D fitView 失败", e);
      }
    }, 500);
  } else {
    // 回 2D：把 3D 期间的选中写回 G6。merge=false —— 传空表即全清，
    // 避免「3D 里清空了选中、切回 2D 还残留旧高亮」的错位
    const m2: Record<string, string[]> = {};
    selected3d.value.forEach(id => {
      m2[id] = ["selected"];
    });
    void safeSetElementState(graphRef.value, m2, false);
    hovered.value = null;
    highlight3d.value = null;
    hoverHl3d.value = null;
    menu.value.visible = false;
    mode.value = "2d";
    await nextTick();
    // 隐藏期间 G6 尺寸没变（visibility 不触发 resize），这里只需重新适配一次视角
    graphRef.value?.fitView?.({ when: "always" } as any, false)?.catch?.(() => {});
  }
  emit("mode-change", m);
  log("mode ->", m);
};

/**
 * 3D 层的高亮集合：API 高亮与悬停高亮取并集。
 *
 * <p>分开维护是因为 2D 下 hover-activate 是 G6 自己管的，而 3D 需要手动算。</p>
 */
const highlight3dEff = computed(() => {
  const a = highlight3d.value;
  const b = hoverHl3d.value;
  if (!a && !b) {
    return null;
  }
  return [...new Set([...(a ?? []), ...(b ?? [])])];
});

/**
 * 悬停时按 highlight 模式算出 3D 高亮集合（group/adjacent/both 的 3D 等价实现）。
 *
 * @param n 悬停节点，null 表示离开
 */
const apply3dHoverHighlight = (n: RelationNode | null) => {
  if (!n || highlightMode.value === "none") {
    hoverHl3d.value = null;
    return;
  }
  const wantGroup = highlightMode.value === "group" || highlightMode.value === "both";
  const wantAdj = highlightMode.value === "adjacent" || highlightMode.value === "both";
  const ids = new Set<string>();
  if (wantGroup && n.group) {
    (data3d.value.nodes ?? []).forEach(x => {
      if (x.group === n.group) {
        ids.add(x.id);
      }
    });
  }
  if (wantAdj) {
    ids.add(n.id);
    (data3d.value.edges ?? []).forEach(e => {
      if (e.source === n.id) {
        ids.add(e.target);
      }
      if (e.target === n.id) {
        ids.add(e.source);
      }
    });
  }
  hoverHl3d.value = ids.size ? [...ids] : null;
};

// ==================== 3D 事件（复用 2D 的对外事件契约） ====================

const on3dNodeClick = (n: RelationNode, ev: any) => {
  emit("node-click", n, ev);
  if (n) {
    selected3d.value = [n.id];
  }
  emit("selection-change", [...selected3d.value]);
};

const on3dNodeRightClick = (n: RelationNode, ev: any) => {
  emit("node-right-click", n, ev);
  if (props.contextMenu && n) {
    openMenu(ev, "node", n.id);
  }
};

const on3dNodeHover = (n: RelationNode | null) => {
  hovered.value = n;
  emit("node-hover", n, null);
  apply3dHoverHighlight(n);
};

const on3dEdgeClick = (e: RelationEdge, ev: any) => {
  emit("edge-click", e, ev);
};

const on3dEdgeRightClick = (e: RelationEdge, ev: any) => {
  emit("edge-right-click", e, ev);
  if (props.contextMenu && e) {
    openMenu(ev, "edge", e.id ?? `${e.source}->${e.target}`);
  }
};

const on3dCanvasClick = (ev: any) => {
  menu.value.visible = false;
  emit("canvas-click", ev);
  emit("selection-change", []);
};

const on3dCanvasRightClick = (ev: any) => {
  if (props.contextMenu && props.editable) {
    openMenu(ev, "canvas", "");
  }
};

const api = {
  addNode,
  addEdge,
  updateNode,
  updateEdge,
  removeNode,
  removeEdge,
  setData,
  getData: exportData,
  setLayout,
  getLayout: () => currentLayout.value,
  openTuning,
  closeTuning,
  toggleTuning,
  applyLayoutTuning,
  setMode,
  getMode: () => mode.value,
  fitView: async () => {
    if (is3d.value) {
      fg3dRef.value?.fitView?.(600);
      return;
    }
    await graphRef.value?.fitView?.({ when: "always" } as any, true as any);
  },
  zoomIn: async () => {
    if (is3d.value) {
      fg3dRef.value?.zoomBy?.(1.25);
      return;
    }
    await graphRef.value?.zoomBy?.(1.2, true as any);
  },
  zoomOut: async () => {
    if (is3d.value) {
      fg3dRef.value?.zoomBy?.(0.8);
      return;
    }
    await graphRef.value?.zoomBy?.(0.8, true as any);
  },
  zoomTo: async (r: number) => {
    if (is3d.value) {
      fg3dRef.value?.zoomTo?.(r);
      return;
    }
    await graphRef.value?.zoomTo?.(r, true as any);
  },
  centerOn: async (id: string) => {
    if (is3d.value) {
      fg3dRef.value?.centerOn?.(id);
      return;
    }
    await graphRef.value?.focusElement?.(id, true as any);
  },
  select: (ids: string[]) => {
    if (is3d.value) {
      selected3d.value = [...ids];
      return;
    }
    const m: Record<string, string[]> = {};
    ids.forEach(id => {
      m[id] = ["selected"];
    });
    void safeSetElementState(graphRef.value, m, false);
    selectedIds.value = [...ids];
    attachSlots();
  },
  getSelection: () => {
    if (is3d.value) {
      return [...selected3d.value];
    }
    // 节点与边的选中态都要返回：点击边时 G6 打的是 edge 的 selected
    const g = graphRef.value;
    const nodeIds = g?.getElementDataByState?.("node", "selected")?.map((x: any) => x.id) ?? [];
    const edgeIds = g?.getElementDataByState?.("edge", "selected")?.map((x: any) => x.id) ?? [];
    return [...nodeIds, ...edgeIds];
  },
  clearSelection: () => {
    if (is3d.value) {
      selected3d.value = [];
      return;
    }
    graphRef.value?.setElementState({} as any, false);
    selectedIds.value = [];
    attachSlots();
  },
  highlight: (ids: string[]) => {
    if (is3d.value) {
      highlight3d.value = ids.length ? [...ids] : null;
      return;
    }
    const set = new Set(ids);
    const m: Record<string, string[]> = {};
    (graphData.value.nodes ?? []).forEach(n => {
      m[n.id] = set.has(n.id) ? ["active"] : ["inactive"];
    });
    void safeSetElementState(graphRef.value, m, false);
  },
  clearHighlight: () => {
    if (is3d.value) {
      highlight3d.value = null;
      return;
    }
    graphRef.value?.setElementState({} as any, false);
  },
  getInstance: () => (is3d.value ? (fg3dRef.value?.getInstance?.() ?? graphRef.value) : graphRef.value),

  // ===== 2026-10-07 补齐 =====
  search: (keyword: string) => {
    runSearch(keyword);
    return [...searchMatches.value];
  },
  locate: async (id: string) => {
    if (is3d.value) {
      fg3dRef.value?.centerOn?.(id);
      selected3d.value = [id];
      emit("selection-change", [id]);
      return;
    }
    await locateNode(id);
  },
  exportImage: (type = "png", quality = 1) => exportImage(type, quality),
  setConnectMode,
  getConnectMode,
  undo: async () => {
    if (is3d.value || !historyInst.value?.canUndo?.()) {
      return;
    }
    historyInst.value.undo();
    await nextTick();
    refreshHistoryState();
    syncSelected(graphRef.value as Graph);
    sync3d();
    emitDataChange();
  },
  redo: async () => {
    if (is3d.value || !historyInst.value?.canRedo?.()) {
      return;
    }
    historyInst.value.redo();
    await nextTick();
    refreshHistoryState();
    syncSelected(graphRef.value as Graph);
    sync3d();
    emitDataChange();
  },
  canUndo: () => canUndo.value,
  canRedo: () => canRedo.value,
  clearHistory: () => clearHistoryStack(),
} as RelationGraphApi;

defineExpose(api);

// ==================== 工具栏动作 ====================

// 布局名走 i18n（tLayout 未命中时回退到 zh 标签），随应用语言切换
const layoutOptions = computed(() =>
  RELATION_LAYOUTS.map(l => ({ label: tLayout(l.value, l.label), value: l.value })),
);
const layoutValue = ref<string>(props.layout);

watch(currentLayout, v => {
  layoutValue.value = v;
});

const onLayoutChange = async (v: unknown) => {
  const name = String(v) as RelationLayoutName;
  layoutValue.value = name;
  await setLayout(name);
};

/** 工具栏 2D/3D 切换 */
const toggleMode = async () => {
  await setMode(is3d.value ? "2d" : "3d");
};

/** 工具栏导出：生成 dataURL 并触发下载 */
const onExport = async () => {
  try {
    const url = await exportImage("png", 1);
    if (url) {
      downloadDataURL(url, "relation-graph");
    }
  } catch (e) {
    log("导出失败", e);
  }
};

/** 工具栏键盘无障碍：左右方向键在控件间移动焦点（roving tabindex） */
const rovingFocus = (dir: number, ev?: Event) => {
  const bar = (ev?.currentTarget as HTMLElement | undefined)
    ?? wrapRef.value?.querySelector<HTMLElement>(".rrg__toolbar");
  if (!bar) return;
  const items = Array.from(
    bar.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);
  if (!items.length) return;
  const active = document.activeElement as HTMLElement;
  const idx = items.indexOf(active);
  const next = items[(idx + dir + items.length) % items.length];
  next?.focus();
};

/** Esc：退出连线模式 / 清空搜索 / 关闭菜单 */
const onEsc = () => {
  if (connectMode.value) {
    setConnectMode(false);
    return;
  }
  if (searchText.value) {
    clearSearch();
    return;
  }
  menu.value.visible = false;
};

/** Ctrl+F：聚焦搜索框（键盘可达） */
const focusSearch = () => {
  wrapRef.value?.querySelector<HTMLInputElement>(".rrg__search input")?.focus();
};

/** Alt+方向键：键盘平移画布（无障碍） */
const panBy = async (dx: number, dy: number) => {
  const g = graphRef.value;
  if (!g || is3d.value) return;
  const pos = g.getPosition?.();
  if (pos) {
    await g.translateTo?.([pos[0] + dx, pos[1] + dy], true as any);
  }
};

const toggleMinimap = async (on: boolean) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  // setPlugins 会让 G6 走 setExtensions → arrayDiff → destroyExtensions(exit)，
  // 也就是**内部**把旧插件实例 destroy() 掉（插件基类会把 context 清成 {}）。
  // 那条路径不经过我们的 safeDestroy，所以这里必须自己先把挂起的
  // debounce 尾随调用取消掉，否则小地图那一帧会在 context 已被清空后执行 ->
  // "Cannot read properties of undefined (reading 'getData')"（未捕获异常）。
  for (const plugin of collectPluginInstances(graph)) {
    cancelPluginPending(plugin);
  }
  graph.setPlugins(buildPluginsFor(on));
};

const minimapOn = ref(props.minimap);
const buildPluginsFor = (withMinimap: boolean) => {
  const list: any[] = [];
  if (withMinimap) {
    list.push({ type: "minimap", size: [200, 128], padding: 8, position: "right-bottom" });
  }
  // history 必须留在列表里：setPlugins 走 ExtensionController.setExtensions，
  // 列表里没有的扩展会被 destroyExtensions(exit) 真正销毁（instance.destroy() 且
  // context 被清空），此后 undo/redo 静默失效。若这里漏掉 history，
  // 用户点一次内置工具栏的「小地图」按钮就会丢掉撤销能力。
  list.push({ type: "history", key: "history", stackSize: 50, beforeAddCommand: beforeAddHistory });
  return list;
};

/**
 * 安全销毁 G6 实例。
 *
 * <p><b>为什么不能直接 {@code graph.destroy()}</b>：{@code @antv/g6@5.1.1} 的
 * {@code Minimap} 用 debounce 把自己挂在 {@code AFTER_RENDER}/{@code AFTER_ANIMATE} 上：</p>
 *
 * <pre>{@code
 * this.onRender = debounce(() => { this.renderMinimap(); this.renderMask(); }, delay);
 * graph.on(GraphEvent.AFTER_ANIMATE, this.onRender);
 * }</pre>
 *
 * <p>而它的 {@code destroy()} 只做了 {@code unbindEvents()}（拦住**后续**事件），
 * <b>从不取消已经排好的 debounce 尾随调用</b>。力导布局 + {@code animation:true}
 * 是异步的，所以完全可能：动画结束排下尾随调用 → 组件卸载把 graph 销毁
 * （{@code super.destroy()} 已把 {@code context.model} 置空）→ 定时器才到点执行
 * {@code renderMinimap()} → {@code getElements()} 里 {@code model.getData()}
 * 抛 {@code "Cannot read properties of undefined (reading 'getData')"}。</p>
 *
 * <p>那是**未捕获**的异步异常，会直接冒泡成页面级 PAGEERROR。
 * 低负载下偶发、负载高时更容易撞上（ER 图批量验收里 6 次里能碰 1~2 次）。</p>
 *
 * <p>所以销毁前先把插件身上挂起的 debounce/throttle 定时器取消掉：
 * lodash 的 debounce/throttle 都带 {@code .cancel()}。
 * 这里是「拆除」，没必要把尾随那一帧补渲染出来（画在一个正在消失的 DOM 上也没意义）。</p>
 *
 * @param graph 待销毁的实例，可为空
 */
/**
 * 取出图上**插件实例**列表。
 *
 * <p><b>坑：{@code graph.getPlugins()} 返回的是配置数组，不是实例。</b>
 * G6 源码里就是 {@code return this.options.plugins || []} ——
 * 拿到的是 {@code [{ type: 'minimap', size: [200, 128], ... }]} 这种纯配置对象，
 * 上面当然没有 debounce 函数的 {@code .cancel}。
 * 本组件第一版 {@code safeDestroy} 就栽在这里：遍历了一堆配置对象、
 * 一个 cancel 都没找到、**静默什么都没做**，于是「已修复」的假象一直持续到
 * 压测仍然偶发才暴露出来。</p>
 *
 * <p>真正的实例在 {@code graph.context.plugin.extensionMap} 里，
 * 官方也提供了 {@code graph.getPluginInstance(key)}。两条路都留着，
 * 前者优先（一次拿全），后者兜底。</p>
 *
 * @param graph G6 实例
 * @return 插件实例数组（取不到时为空数组）
 */
const collectPluginInstances = (graph: any): any[] => {
  const out: any[] = [];
  const map = graph?.context?.plugin?.extensionMap;
  if (map && typeof map === "object") {
    for (const k of Object.keys(map)) {
      if (map[k]) {
        out.push(map[k]);
      }
    }
    return out;
  }
  for (const cfg of graph?.getPlugins?.() ?? []) {
    const inst = graph?.getPluginInstance?.(cfg?.key ?? cfg?.type);
    if (inst) {
      out.push(inst);
    }
  }
  return out;
};

/** 取消插件身上所有挂起的 debounce/throttle 定时器 */
const cancelPluginPending = (plugin: any) => {
  for (const key of Object.keys(plugin ?? {})) {
    const fn = plugin?.[key];
    // lodash debounce/throttle 才有 cancel；普通方法没有，正好天然跳过
    if (typeof fn?.cancel === "function") {
      fn.cancel();
    }
  }
};

/**
 * 安全销毁 G6 实例。
 *
 * <p><b>为什么不能直接 {@code graph.destroy()}</b>：{@code @antv/g6@5.1.1} 的
 * {@code Minimap} 用 debounce 把自己挂在 {@code AFTER_RENDER}/{@code AFTER_ANIMATE} 上：</p>
 *
 * <pre>{@code
 * this.onRender = debounce(() => { this.renderMinimap(); this.renderMask(); }, delay);
 * graph.on(GraphEvent.AFTER_ANIMATE, this.onRender);
 * }</pre>
 *
 * <p>而它的 {@code destroy()} 只做了 {@code unbindEvents()}（拦住**后续**事件），
 * <b>从不取消已经排好的 debounce 尾随调用</b>。力导布局 + {@code animation:true}
 * 是异步的，所以完全可能：动画结束排下尾随调用 → 图被销毁
 * （插件基类 {@code destroy()} 里 {@code this.context = {}}，{@code model} 变 undefined）
 * → 定时器才到点执行 {@code renderMinimap()} → {@code getElements()} 里
 * {@code model.getData()} 抛
 * {@code "Cannot read properties of undefined (reading 'getData')"}。</p>
 *
 * <p>那是**未捕获**的异步异常，会直接冒泡成页面级 PAGEERROR。
 * 低负载下偶发、负载高时更容易撞上（实测 8 次里能碰 1 次）。</p>
 *
 * <p>所以销毁前先取消插件挂起的定时器：lodash 的 debounce/throttle 都带
 * {@code .cancel()}。这里是「拆除」，没必要把尾随那一帧补渲染出来
 * （画在一个正在消失的 DOM 上也没意义）。</p>
 *
 * @param graph 待销毁的实例，可为空
 */
const safeDestroy = (graph: any) => {
  if (!graph) {
    return;
  }
  try {
    for (const plugin of collectPluginInstances(graph)) {
      cancelPluginPending(plugin);
    }
  } catch (e) {
    log("取消插件挂起任务失败", e);
  }
  try {
    graph.destroy?.();
  } catch (e) {
    log("destroy 失败", e);
  }
  // G6 v5 实测 destroy() 不会移除容器里的 canvas 节点：连续 rebuild（切换高亮 /
  // 悬停聚焦 / 小地图、回放后台设置）后容器内 canvas 逐个堆积，最新实例新建的
  // 空白画布盖在旧实例有内容的画布之上——用户看到的就是整屏空白的知识图谱。
  // 这里显式清空容器内全部子节点，保证新实例从干净容器起步。
  const el = containerRef.value;
  if (el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
};

/**
 * 重建图实例（小地图这类「只能在创建时生效」的配置变更走这里）。
 */
const rebuild = async () => {
  const old = graphRef.value;
  graphRef.value = null;
  ready.value = false;
  appliedKey = "";
  safeDestroy(old);
  await nextTick();
  await initGraph();
};

// ==================== 2026-10-13 新能力：地图式工具栏 / 分组 / 高亮 / 扩线 / 详情 / 设置 ====================

/** 工具栏按钮过滤：toolbarItems 缺省时全部显示 */
const toolbarItemVisible = (name: RelationToolbarItem): boolean =>
  !Array.isArray(props.toolbarItems) || props.toolbarItems.includes(name);

/**
 * 工具栏收缩状态：写入 localStorage（per-user key），刷新/重载后保持。
 *
 * <p>默认展开；仅在用户显式点过收缩钮后才写入。读写在 try/catch 内，
 * 隐私模式 / SSR 下静默降级为「仅本次会话生效、默认展开」。</p>
 */
const TOOLBAR_COLLAPSE_KEY = getStorageKey("rrg-toolbar-collapsed");
const toolbarCollapsed = ref(false);
try {
  const saved = localStorage.getItem(TOOLBAR_COLLAPSE_KEY);
  if (saved !== null) toolbarCollapsed.value = saved === "true";
} catch {
  /* 隐私模式 / SSR：忽略读取，默认展开 */
}

/** 切换工具栏收缩并持久化 */
const toggleToolbarCollapse = (): void => {
  toolbarCollapsed.value = !toolbarCollapsed.value;
  try {
    localStorage.setItem(TOOLBAR_COLLAPSE_KEY, String(toolbarCollapsed.value));
  } catch {
    /* 隐私模式：忽略写入失败，仅本次会话生效 */
  }
};

/** 高亮模式循环顺序：相邻 -> 分组 -> 两者 -> 关闭 -> 相邻 */
const HIGHLIGHT_MODE_CYCLE: RelationHighlightMode[] = ["adjacent", "group", "both", "none"];

/**
 * 切换「显示分组容器」。
 *
 * <p>开启时把带 {@code group} 的节点归入浅色背景 combo，关闭后回到普通节点图。
 * 因为 combo 是图数据的一部分，这里走一次 {@code setData} 重装，确保 G6 模型里
 * 既没有残留容器也没有缺容器。</p>
 */
const toggleGroups = async (on: boolean) => {
  showGroupsOn.value = on;
  emitSettingsChange();
  if (graphRef.value) {
    await setData(graphData.value);
  }
};

/** 循环切换悬停高亮模式 */
const toggleHighlightMode = async () => {
  const idx = HIGHLIGHT_MODE_CYCLE.indexOf(highlightMode.value);
  await setHighlightMode(HIGHLIGHT_MODE_CYCLE[(idx + 1) % HIGHLIGHT_MODE_CYCLE.length]);
};

/** 设置悬停高亮模式（重建图实例，让 hover-activate 行为生效） */
const setHighlightMode = async (mode: RelationHighlightMode) => {
  highlightMode.value = mode;
  emitSettingsChange();
  if (graphRef.value) {
    await rebuild();
  }
};

/** 切换「悬停隐藏其它节点」（重建图实例，让 inactive 状态样式生效） */
const setHoverFocus = async (on: boolean) => {
  hoverFocusOn.value = on;
  emitSettingsChange();
  if (graphRef.value) {
    await rebuild();
  }
};

/** 设置小地图开关（重建图实例，G6 v5 运行期无法实例化新插件） */
const setMinimap = async (on: boolean) => {
  minimapOn.value = on;
  emitSettingsChange();
  if (graphRef.value) {
    await rebuild();
  }
};

/** 工具栏小地图按钮 */
const toggleMinimapButton = async () => {
  await setMinimap(!minimapOn.value);
};

/**
 * 取一份元素状态快照（用于最短路径恢复）。
 */
const snapshotElementStates = (graph: any): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  for (const d of graph.getNodeData?.() ?? []) {
    out[d.id] = graph.getElementState?.(d.id) ?? [];
  }
  for (const d of graph.getEdgeData?.() ?? []) {
    out[d.id] = graph.getElementState?.(d.id) ?? [];
  }
  return out;
};

/**
 * 在多选节点之间显示最短路径。
 *
 * <p>以第一个节点为源、其余选中节点为目标做 BFS，找到最近的目标后回推路径。
 * 找到后先快照当前元素状态，再整体替换为「路径节点高亮 / 其它节点置灰」，
 * 供 {@link restorePath} 原样恢复。</p>
 */
const showShortestPath = async (ids?: string[]): Promise<string[]> => {
  const graph = graphRef.value;
  if (!graph) {
    return [];
  }
  const targets = (ids ?? selectedIds.value).filter(Boolean);
  if (targets.length < 2) {
    return [];
  }
  const source = targets[0];
  const goals = new Set(targets.slice(1));
  const adjacency = new Map<string, Array<{ id: string; edgeId: string }>>();
  for (const e of graph.getEdgeData?.() ?? []) {
    const s = typeof e.source === "object" ? (e.source as any)?.id : e.source;
    const t = typeof e.target === "object" ? (e.target as any)?.id : e.target;
    const eid = e.id ?? `${s}->${t}`;
    if (!adjacency.has(s)) adjacency.set(s, []);
    if (!adjacency.has(t)) adjacency.set(t, []);
    adjacency.get(s)!.push({ id: t, edgeId: eid });
    adjacency.get(t)!.push({ id: s, edgeId: eid });
  }

  const prev = new Map<string, { id: string; edgeId: string } | null>();
  const queue = [source];
  prev.set(source, null);
  let found: string | null = null;
  while (queue.length) {
    const cur = queue.shift()!;
    if (goals.has(cur)) {
      found = cur;
      break;
    }
    for (const next of adjacency.get(cur) ?? []) {
      if (!prev.has(next.id)) {
        prev.set(next.id, { id: cur, edgeId: next.edgeId });
        queue.push(next.id);
      }
    }
  }
  if (!found) {
    return [];
  }

  const nodePath: string[] = [found];
  const edgePath: string[] = [];
  let cursor = found;
  while (true) {
    const p = prev.get(cursor);
    if (!p) break;
    nodePath.push(p.id);
    if (p.edgeId) edgePath.push(p.edgeId);
    cursor = p.id;
  }
  nodePath.reverse();

  pathStateSnapshot = snapshotElementStates(graph);
  const pathNodeSet = new Set(nodePath);
  const pathEdgeSet = new Set(edgePath);
  const map: Record<string, string[]> = {};
  for (const d of graph.getNodeData?.() ?? []) {
    map[d.id] = pathNodeSet.has(d.id) ? ["active"] : ["inactive"];
  }
  for (const d of graph.getEdgeData?.() ?? []) {
    map[d.id!] = pathEdgeSet.has(d.id!) ? ["active"] : ["inactive"];
  }
  void safeSetElementState(graph, map, false);
  pathIds.value = [...nodePath];
  emit("path-change", [...nodePath]);
  return [...nodePath];
};

/** 清除最短路径高亮，恢复原图显示 */
const restorePath = async () => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  if (Object.keys(pathStateSnapshot).length) {
    void safeSetElementState(graph, pathStateSnapshot, false);
  } else {
    // 没有快照时至少把 active/inactive 清掉，不影响 selected 等状态
    const map: Record<string, string[]> = {};
    for (const d of graph.getNodeData?.() ?? []) {
      const cur: string[] = graph.getElementState?.(d.id) ?? [];
      if (cur.includes("active") || cur.includes("inactive")) {
        map[d.id] = cur.filter(s => s !== "active" && s !== "inactive");
      }
    }
    for (const d of graph.getEdgeData?.() ?? []) {
      const cur: string[] = graph.getElementState?.(d.id!) ?? [];
      if (cur.includes("active") || cur.includes("inactive")) {
        map[d.id!] = cur.filter(s => s !== "active" && s !== "inactive");
      }
    }
    if (Object.keys(map).length) {
      void safeSetElementState(graph, map, false);
    }
  }
  pathStateSnapshot = {};
  pathIds.value = [];
  emit("path-change", []);
};

/** 打开节点详情面板（默认开启懒加载） */
const openDetail = async (id: string) => {
  const node = nodeById(id);
  if (!node) {
    return;
  }
  detailNode.value = node;
  detailData.value = null;
  if (props.lazyDetails && props.loadNodeDetail) {
    detailLoading.value = true;
    try {
      const loaded = await props.loadNodeDetail(node);
      detailData.value = loaded ?? node.data ?? {};
    } catch (e) {
      log("节点详情加载失败", e);
      detailData.value = node.data ?? {};
    } finally {
      detailLoading.value = false;
    }
  } else {
    detailData.value = node.data ?? {};
  }
  emit("node-detail", node, detailData.value);
};

/** 关闭节点详情面板 */
const closeDetail = () => {
  detailNode.value = null;
  detailData.value = null;
  detailLoading.value = false;
};

/** 详情面板默认展示值的格式化（数组/对象/原始值都能安全显示） */
const displayDetailValue = (v: unknown): string => {
  if (v === null || v === undefined) {
    return "";
  }
  if (Array.isArray(v)) {
    return v.map(displayDetailValue).join("、");
  }
  if (typeof v === "object") {
    return JSON.stringify(v);
  }
  return String(v);
};

/**
 * 把扩线返回的邻居子图合并进当前 G6 模型。
 *
 * <p>不做全量 setData：先过滤已存在的节点/边/容器，再 addNodeData/addEdgeData/addComboData，
 * 避免 "Node already exists"，并保留已有的布局与选中状态。</p>
 */
const mergeNeighborData = async (incoming: RelationGraphData) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  const existingNodes = new Set((graph.getNodeData?.() ?? []).map((x: any) => x.id));
  const existingEdges = new Set((graph.getEdgeData?.() ?? []).map((x: any) => x.id));
  const existingCombos = new Set((graph.getComboData?.() ?? []).map((x: any) => x.id));

  const incomingNodes = (incoming.nodes ?? []).map(aliasNode).map((n) => {
    if (showGroupsOn.value && !n.combo && n.group) {
      return { ...n, combo: groupComboId(n.group) };
    }
    return n;
  }).filter(n => !existingNodes.has(n.id));

  const incomingEdges = (incoming.edges ?? []).map(aliasEdge).map((e) => ({
    ...e,
    id: e.id ?? `${e.source}->${e.target}`,
  })).filter(e => !existingEdges.has(e.id!));

  const incomingCombos = [...(incoming.combos ?? [])];
  if (showGroupsOn.value) {
    const groups = [...new Set(incomingNodes.map(n => n.group).filter((g): g is string => !!g))];
    groups.forEach((group, index) => {
      const cid = groupComboId(group);
      if (!existingCombos.has(cid)) {
        incomingCombos.push({ id: cid, label: group, type: props.groupShape, style: groupComboStyle(group, index) });
      }
    });
  }
  incomingCombos.push(...(graphData.value.combos ?? []).filter(c => !existingCombos.has(c.id)));

  if (incomingNodes.length) {
    graph.addNodeData(incomingNodes.map(toNodeData) as any);
  }
  if (incomingEdges.length) {
    graph.addEdgeData(incomingEdges.map(toEdgeData) as any);
  }
  if (incomingCombos.length) {
    graph.addComboData(incomingCombos as any);
  }
  await graph.draw();
  // 扩线追加了新节点：坐标是 G6 默认位，必须重排
  modelGeneration++;
  try {
    await layoutForGraph(graph, "expand");
  } catch (e) {
    log("扩线后布局失败", e);
  }
  await graph.fitView?.({ when: "always" } as any, false)?.catch?.(() => {});
  pinFixedNodes();
  attachSlots();
  sync3d();
  emitDataChange();
  empty.value = (graph.getNodeData?.() ?? []).length === 0;
  syncSetPlugins(graph);
};

/**
 * 右键扩线：拉取某节点的邻居数据并合并进当前子图。
 */
const expandNode = async (id: string, depth = 1): Promise<boolean> => {
  const node = nodeById(id);
  if (!node) {
    return false;
  }
  if (expandingIds.value.includes(id)) {
    return false;
  }
  if (!props.loadNeighbors) {
    emit("node-expand", node, depth);
    return false;
  }
  expandingIds.value = [...expandingIds.value, id];
  try {
    const incoming = await props.loadNeighbors(node, depth);
    if (incoming) {
      await mergeNeighborData(incoming);
      expandedIds.value = new Set(expandedIds.value).add(id);
      return true;
    }
    return false;
  } catch (e) {
    log("扩线失败", e);
    return false;
  } finally {
    expandingIds.value = expandingIds.value.filter(x => x !== id);
  }
};

/** 当前右键菜单上下文（供自定义菜单项使用） */
const menuContext = computed<RelationContextMenuContext>(() => ({
  kind: menu.value.kind,
  id: menu.value.id,
  node: menu.value.kind === "node" ? (nodeById(menu.value.id) ?? null) : null,
  edge: menu.value.kind === "edge" ? (edgeById(menu.value.id) ?? null) : null,
  selectedIds: [...selectedIds.value],
  api,
}));

/** 当前应显示的自定义菜单项 */
const visibleMenuItems = computed(() => {
  const ctx = menuContext.value;
  return (props.menuItems ?? []).filter((item) => {
    const show = item.show;
    return typeof show === "function" ? show(ctx) : show !== false;
  });
});

/** 菜单项是否禁用 */
const menuItemDisabled = (item: RelationContextMenuItem): boolean => {
  const disabled = item.disabled;
  return typeof disabled === "function" ? disabled(menuContext.value) : !!disabled;
};

/** 点击自定义菜单项 */
const onMenuItemClick = async (item: RelationContextMenuItem) => {
  if (menuItemDisabled(item)) {
    return;
  }
  await item.handler?.(menuContext.value);
  emit("menu-item-click", item, menuContext.value);
  menu.value.visible = false;
};

/**
 * 收集当前视图偏好（可持久化到后台）。
 */
const collectSettings = (): RelationGraphSettings => ({
  layout: currentLayout.value as RelationLayoutName,
  layoutOptions: { ...tuningValues.value },
  layoutSettingsByLayout: { ...perLayoutTuningValues.value },
  showGroups: showGroupsOn.value,
  minimap: minimapOn.value,
  highlight: highlightMode.value,
  hoverFocus: hoverFocusOn.value,
  expandDepth: expandDepthOn.value,
  maxDepth: maxDepthOn.value,
  partial: partialOn.value,
});

/** 对外派发设置变化，同时按需触发 saveSettings 回调 */
const emitSettingsChange = () => {
  const settings = collectSettings();
  emit("settings-change", settings);
  if (applyingSettings.value || !props.saveSettings) {
    return;
  }
  void Promise.resolve(props.saveSettings(settings)).catch((e) => {
    log("保存图谱设置失败", e);
  });
};

/**
 * 应用一份从后台读出的偏好设置。
 *
 * <p><b>批量应用，不要逐个触发</b>：早期实现把每个开关都走各自的 setter
 * （{@code toggleGroups} → 整图 setData 重装、{@code setMinimap} /
 * {@code setHighlightMode} / {@code setHoverFocus} → 销毁重建图实例），
 * 248 节点的知识图谱上每个都是 2-3s 的全量主线程阻塞，串起来就是十几秒的卡顿。
 * 现在先把所有开关一次写入（纯 ref 赋值，无副作用），再统一决定需要哪种
 * 昂贵操作：涉及行为/插件类开关（高亮 / 悬停聚焦 / 小地图）只需一次
 * {@link rebuild}；只涉及分组展示时一次 {@code setData} 重装即可；
 * 两者都无需时零成本。布局放最后应用——重建 / 重装内部已经跑过一次布局，
 * 参数与已跑过的相同时会被布局指纹去重跳过。</p>
 */
const applySettings = async (settings: RelationGraphSettings) => {
  if (!settings) {
    return;
  }
  applyingSettings.value = true;
  try {
    if (settings.layoutSettingsByLayout) {
      perLayoutTuningValues.value = { ...perLayoutTuningValues.value, ...settings.layoutSettingsByLayout };
    }
    // ---- 第一步：所有开关一次写入，暂不触发各自的重建 / 重装 ----
    let needRebuild = false;
    let needReload = false;
    // 聚簇布局依赖组合容器：这种模式下后台存的 showGroups 一律不采纳，强制为真，
    // 否则旧设置（showGroups:false）会把组拆掉，布局退化成一圈互相压盖的散点。
    const wantGroups = props.groupedLayout || currentLayout.value === GROUPED_LAYOUT ? true : settings.showGroups;
    if (wantGroups !== undefined && wantGroups !== showGroupsOn.value) {
      showGroupsOn.value = wantGroups;
      needReload = true;
    }
    if (settings.minimap !== undefined && settings.minimap !== minimapOn.value) {
      minimapOn.value = settings.minimap;
      needRebuild = true;
    }
    if (settings.highlight !== undefined && settings.highlight !== highlightMode.value) {
      highlightMode.value = settings.highlight;
      needRebuild = true;
    }
    if (settings.hoverFocus !== undefined && settings.hoverFocus !== hoverFocusOn.value) {
      hoverFocusOn.value = settings.hoverFocus;
      needRebuild = true;
    }
    // ---- 第二步：统一执行最多一次昂贵操作 ----
    // groupedLayout 是业务方显式指定的聚簇布局，优先级最高：忽略后台保存的 layout
    // 偏好（否则旧偏好如 d3-force 会把聚簇覆盖掉，看起来「没生效」）。
    const desiredLayout = props.groupedLayout ? ("rrg-cluster" as string) : settings.layout;
    if (needRebuild) {
      // 布局名先落到 currentLayout：initGraph 用它建图，避免重建后再跑一次布局
      if (desiredLayout && desiredLayout !== currentLayout.value) {
        currentLayout.value = desiredLayout;
      }
      await rebuild();
    } else if (needReload) {
      await setData(graphData.value);
    }
    // ---- 第三步：布局放最后（指纹相同则被去重跳过）----
    if (desiredLayout && desiredLayout !== currentLayout.value) {
      await setLayout(desiredLayout as RelationLayoutName, settings.layoutSettingsByLayout?.[desiredLayout] ?? settings.layoutOptions);
    } else if (settings.layoutOptions) {
      const next = { ...(perLayoutTuningValues.value[currentLayout.value] ?? {}) };
      for (const [k, v] of Object.entries(settings.layoutOptions)) {
        next[k] = v as number | string;
      }
      perLayoutTuningValues.value = { ...perLayoutTuningValues.value, [currentLayout.value]: next };
      await applyLayoutTuning();
    }

    if (settings.expandDepth !== undefined) expandDepthOn.value = settings.expandDepth;
    if (settings.maxDepth !== undefined) maxDepthOn.value = settings.maxDepth;
    if (settings.partial !== undefined) partialOn.value = settings.partial;
  } finally {
    applyingSettings.value = false;
  }
};

/** 保存当前偏好到后台 */
const saveSettings = async () => {
  const settings = collectSettings();
  emit("settings-change", settings);
  if (props.saveSettings) {
    await Promise.resolve(props.saveSettings(settings));
  }
};

/** 加载并应用后台偏好 */
const loadAndApplySettings = async () => {
  if (!props.loadSettings) {
    return;
  }
  try {
    const settings = await props.loadSettings();
    if (settings) {
      await applySettings(settings);
    }
  } catch (e) {
    log("读取图谱设置失败", e);
  }
};

Object.assign(api, {
  setShowGroups: toggleGroups,
  getShowGroups: () => showGroupsOn.value,
  setMinimap,
  getMinimap: () => minimapOn.value,
  setHighlightMode,
  getHighlightMode: () => highlightMode.value,
  setHoverFocus,
  getHoverFocus: () => hoverFocusOn.value,
  expandNode,
  showShortestPath,
  restorePath,
  openDetail,
  closeDetail,
  getSettings: collectSettings,
  applySettings,
  saveSettings,
});

/** 生命周期 */

// ==================== 生命周期 ====================

// 外部通过 mode prop 控制切换（组件内部工具栏走 setMode，两条路都收敛到这里）
watch(
  () => props.mode,
  async v => {
    if (v !== mode.value) {
      await setMode(v);
    }
  },
);

watch(
  () => [props.data, props.nodes, props.edges, props.lines],
  async () => {
    const d = graphData.value;
    if (!graphRef.value) {
      return;
    }
    if (keyOf(d) === appliedKey) {
      return;
    }
    await setData(d);
  },
  { deep: true },
);

onMounted(async () => {
  await nextTick();
  await initGraph();
  // 后台已存偏好：挂载后应用一次，避免每次都从默认布局重新开始
  await loadAndApplySettings();
});

// groupedLayout 切换：原生 combo-combined 依赖 combo 容器，所以分组容器随之一并开关
watch(() => props.groupedLayout, async v => {
  if (v && !showGroupsOn.value) {
    await toggleGroups(true);
  }
  const want = v ? GROUPED_LAYOUT : props.layout;
  if (want !== currentLayout.value) {
    await setLayout(want as any);
  }
});

// 外部 prop 变化时同步到运行时开关（避免调用方改了 prop 但界面还是旧状态）
watch(() => props.highlight, async v => {
  if (v !== highlightMode.value) {
    await setHighlightMode(v);
  }
});

watch(() => props.showGroups, async v => {
  if (v !== showGroupsOn.value) {
    await toggleGroups(v);
  }
});

watch(() => props.hoverFocus, async v => {
  if (v !== hoverFocusOn.value) {
    await setHoverFocus(v);
  }
});

watch(() => props.minimap, async v => {
  if (v !== minimapOn.value) {
    await setMinimap(v);
  }
});

// 节点内容插槽：数据变化后重新把 slot 渲染并挂载到各 html 节点容器，
// 保证 scope 里的 node 数据是最新的（选中态变化在 syncSelected 里同步）。
watch(
  () => graphData.value,
  () => {
    if (ready.value) {
      attachSlots();
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  // 走 safeDestroy：直接 destroy() 会漏掉插件挂起的 debounce 尾随调用，
  // 那会在 context 已被拆掉之后炸出未捕获异常（详见 safeDestroy 的注释）。
  safeDestroy(graphRef.value);
  graphRef.value = null;
  // 挂起的辅助元素清理不再需要，避免卸载后还触发一次无谓的模型操作
  if (purgeTimer) {
    clearTimeout(purgeTimer);
    purgeTimer = null;
  }
  // 摘掉文档级指针监听，避免组件销毁后还挂在 document 上
  assistCleanupFns.forEach((fn) => fn());
  assistCleanupFns.length = 0;
  // 卸载手工挂载进 G6 的插槽，避免内存泄漏
  for (const id of Array.from(slotEls.keys())) {
    unmountSlot(id);
  }
});
</script>

<template>
  <div ref="wrapRef" class="rrg" :style="{ width: typeof width === 'number' ? width + 'px' : width, height: typeof height === 'number' ? height + 'px' : height }">
    <!-- 悬浮提示 / 详情面板 / 右键菜单已拆分为 internals/components -->
    <GraphToolbar
      v-if="toolbar"
      :collapsed="toolbarCollapsed"
      :position="toolbarPosition"
      :layout-value="layoutValue"
      :layout-select-options="layoutOptions"
      :layout-disabled="is3d"
      :search-text="searchText"
      :searchable="searchable"
      :search-placeholder="t('toolbar.searchPlaceholder', '搜索节点…')"
      :tunable="tunable"
      :tuning-open="tuningOpen"
      :show-groups-on="showGroupsOn"
      :highlight-mode="highlightMode"
      :hover-focus-on="hoverFocusOn"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :connect-mode="connectMode"
      :editable="editable"
      :exportable="exportable"
      :minimap-on="minimapOn"
      :is-3d="is3d"
      :selected-ids="selectedIds"
      :selected-is-node="selectedIds.length === 1 && isNodeId(selectedIds[0])"
      :selected-is-edge="selectedIds.length === 1 && isEdgeId(selectedIds[0])"
      :toolbar-items="toolbarItems"
      :slot-api="api"
      :slot-nodes="graphData.nodes"
      :slot-mode="mode"
      @toggle-collapse="toggleToolbarCollapse"
      @layout-change="onLayoutChange"
      @search="(kw: unknown) => runSearch(String(kw))"
      @search-clear="clearSearch"
      @toggle-tuning="toggleTuning()"
      @toggle-groups="(on: boolean) => toggleGroups(on)"
      @toggle-highlight="toggleHighlightMode()"
      @toggle-hover-focus="(on: boolean) => setHoverFocus(on)"
      @fit="api.fitView()"
      @undo="api.undo()"
      @redo="api.redo()"
      @toggle-connect="setConnectMode(!connectMode)"
      @export="onExport"
      @toggle-minimap="toggleMinimapButton()"
      @toggle-mode="toggleMode"
      @update-selected-node="updateSelectedNode"
      @update-selected-edge="updateSelectedEdge"
      @remove-selected-node="removeSelectedNode"
      @remove-selected-edge="removeSelectedEdge"
    >
      <template #toolbar-extra="{ api, nodes, mode }">
        <slot name="toolbar-extra" :api="api" :nodes="nodes" :mode="mode" />
      </template>
    </GraphToolbar>

    <!-- 布局调参面板：已拆分为 internals/components/GraphTuningPanel.vue -->
    <GraphTuningPanel
      :open="tunable && tuningOpen"
      :available="tuningAvailable"
      :fields="availableTuningFields"
      :edge-labels-shown="edgeLabelsShown"
      :get-value="(f: any) => tuningValueOf(f)"
      @close="closeTuning()"
      @input="(key: string, value: unknown) => onTuningInput(key, value as any)"
      @apply="applyLayoutTuning()"
      @reset-one="(key: string) => resetTuningOne(key)"
      @reset-all="resetTuningAll()"
      @toggle-edge-labels="(on: boolean) => onToggleAllEdgeLabels(on)"
    />

    <!-- 画布：2D(G6) 与 3D(vue-force-graph-3d) 双层，未激活的一层隐藏但不销毁 -->
    <div
      class="rrg__canvas"
      tabindex="0"
      role="application"
      :aria-label="t('canvas.aria', '关系图画布，Ctrl+加号放大、Ctrl+减号缩小、Ctrl+Z 撤销、Ctrl+Y 重做、Ctrl+F 搜索、Esc 取消')"
      @keydown.esc="onEsc"
      @keydown.ctrl.z.prevent="api.undo()"
      @keydown.ctrl.y.prevent="api.redo()"
      @keydown.ctrl.f.prevent="focusSearch"
      @keydown.alt.left.prevent="panBy(80, 0)"
      @keydown.alt.right.prevent="panBy(-80, 0)"
      @keydown.alt.up.prevent="panBy(0, 80)"
      @keydown.alt.down.prevent="panBy(0, -80)"
    >
      <div ref="containerRef" class="rrg__g6" :class="{ 'is-hidden': is3d }" />
      <ForceGraph3DComp
        v-if="is3d"
        ref="fg3dRef"
        :data="data3d"
        :node-size="nodeSize"
        :directed="directed"
        :drag="drag"
        :zoom="zoom"
        :selected-ids="selected3d"
        :highlight-ids="highlight3dEff"
        @node-click="on3dNodeClick"
        @node-right-click="on3dNodeRightClick"
        @node-hover="on3dNodeHover"
        @edge-click="on3dEdgeClick"
        @edge-right-click="on3dEdgeRightClick"
        @canvas-click="on3dCanvasClick"
        @canvas-right-click="on3dCanvasRightClick"
      />
      <div v-if="empty" class="rrg__empty">{{ emptyText }}</div>

      <!-- 悬浮提示：由子组件 GraphHoverTip 渲染，支持 #hover 插槽穿透。
           KB 图谱等大数据场景关闭（hoverTip=false），只保留节点自带 label，避免左上角浮层 -->
      <GraphHoverTip v-if="hoverTipOn" :node="hovered">
        <template #hover="{ node }">
          <slot name="hover" :node="node" />
        </template>
      </GraphHoverTip>

      <!-- 节点详情面板：由子组件 GraphDetailPanel 渲染，支持 #node-detail 插槽穿透 -->
      <GraphDetailPanel
        :node="detailNode"
        :loading="detailLoading"
        :data="detailData"
        @close="closeDetail()"
      >
        <template #node-detail="{ node, data, loading, close }">
          <slot name="node-detail" :node="node" :data="data" :loading="loading" :close="close">
            <div class="rrg__detail-body">
              <div v-for="(v, k) in data ?? {}" :key="String(k)" class="rrg__detail-row">
                <span class="rrg__detail-key">{{ k }}</span>
                <span class="rrg__detail-value">{{ displayDetailValue(v) }}</span>
              </div>
            </div>
          </slot>
        </template>
      </GraphDetailPanel>
    </div>

    <!-- 右键菜单：由子组件 GraphContextMenu 渲染，菜单项/事件从父级传入 -->
    <GraphContextMenu
      v-if="contextMenu"
      :menu="menu"
      :details="details"
      :load-neighbors="!!props.loadNeighbors"
      :expanded-ids="expandedIds"
      :expanding-ids="expandingIds"
      :selected-count="selectedIds.length"
      :has-path="pathIds.length > 0"
      :editable="editable"
      :node="menu.kind === 'node' ? (nodeById(menu.id) ?? null) : null"
      :items="visibleMenuItems.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        danger: false,
        disabled: menuItemDisabled(item),
      }))"
      @close="menu.visible = false"
      @node-right-click="(n: RelationNode | null) => n && emit('node-right-click', n, null)"
      @item-click="(item) => { const src = visibleMenuItems.find((x) => x.key === item.key); if (src) void onMenuItemClick(src); }"
      @detail="(id: string) => { openDetail(id); menu.visible = false; }"
      @expand="(id: string) => { void expandNode(id, expandDepthOn); menu.visible = false; }"
      @shortest-path="() => { void showShortestPath(); menu.visible = false; }"
      @restore-path="() => { void restorePath(); menu.visible = false; }"
      @remove-node="(id: string) => { void removeNode(id); menu.visible = false; }"
      @remove-edge="(id: string) => { void removeEdge(id); menu.visible = false; }"
    >
      <template #menu="{ kind, id }">
        <slot name="menu" :kind="kind" :id="id" :api="api" />
      </template>
    </GraphContextMenu>
  </div>
</template>

<style scoped lang="scss">
.rrg {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  overflow: hidden;
}

/* 地图式浮岛工具栏：半透明毛玻璃底 + 圆角 + 投影，所有控件收进一颗"悬浮药丸"。
   收缩后除收缩钮外的控件全部 display:none，整条收成角上一颗圆钮（见下方 is-collapsed）。 */
.rrg__toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
  max-width: calc(100% - 24px);
  padding: 4px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 10px;
  /* 半透明毛玻璃底：color-mix 从主题底色调出 82% 不透明度，配合 blur 透出画布；
     不支持 color-mix 的浏览器回落为上一行的不透明白，观感仍是浮岛药丸。 */
  background: var(--el-bg-color-overlay, #fff);
  background: color-mix(in srgb, var(--el-bg-color-overlay, #fff) 82%, transparent);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: box-shadow 0.25s ease, padding 0.25s ease;
}

/* 收缩态：只留收缩钮，其余控件收起（display:none 不占位、不进 tab 序） */
.rrg__toolbar.is-collapsed {
  padding: 3px;
}

.rrg__toolbar.is-collapsed > *:not(.rrg__toolbar-collapse) {
  display: none;
}

/* 收缩开关：圆形图标钮，箭头随状态旋转 180° */
.rrg__toolbar-collapse {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular, #475569);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.18s ease;
}

.rrg__toolbar-collapse:hover {
  color: var(--el-color-primary, #409eff);
  background: var(--el-fill-color-light, #f1f5f9);
  transform: translateY(-1px);
}

.rrg__toolbar-collapse:active {
  transform: translateY(0);
  transition-duration: 0.06s;
}

.rrg__toolbar-collapse:focus-visible {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: 1px;
}

.rrg__toolbar-collapse svg {
  transition: transform 0.25s ease;
}

.rrg__toolbar-collapse.is-collapsed svg {
  transform: rotate(180deg);
}

/* 折叠后只剩这一颗钮：主色填充 + 白箭头，明确提示"可点击展开" */
.rrg__toolbar.is-collapsed .rrg__toolbar-collapse {
  color: #fff;
  background: var(--el-color-primary, #409eff);
}

.rrg__toolbar.is-collapsed .rrg__toolbar-collapse:hover {
  color: #fff;
  background: var(--el-color-primary-light-3, #79bbff);
}

/* 工具栏定位：地图式工具条支持四角与顶部居中 */
.rrg__toolbar--top-left {
  top: 12px;
  left: 12px;
  right: auto;
  justify-content: flex-start;
}

.rrg__toolbar--bottom-left {
  top: auto;
  right: auto;
  left: 12px;
  bottom: 12px;
  justify-content: flex-start;
}

.rrg__toolbar--bottom-right {
  top: auto;
  right: 12px;
  bottom: 12px;
  justify-content: flex-end;
}

.rrg__toolbar--top-center {
  top: 12px;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  justify-content: center;
}

/* 节点详情面板 */
.rrg__detail {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 18;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 280px;
  max-height: calc(100% - 24px);
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.18);
  font-size: 12px;
  color: var(--el-text-color-primary, #0f172a);
}

.rrg__detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.rrg__detail-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary, #0f172a);
}

.rrg__detail-close {
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary, #94a3b8);
  font-size: 13px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

.rrg__detail-close:hover {
  color: var(--el-color-primary, #3b82f6);
  background: var(--el-fill-color-light, #f1f5f9);
}

.rrg__detail-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rrg__detail-row {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 8px;
  align-items: start;
}

.rrg__detail-key {
  color: var(--el-text-color-secondary, #64748b);
  white-space: nowrap;
}

.rrg__detail-value {
  color: var(--el-text-color-primary, #0f172a);
  word-break: break-word;
}

/* 右键菜单图标与禁用态 */
.rrg__menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rrg__menu-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 布局调参面板：浮在画布右上角，独立于工具栏，toolbar=false 时同样可用 */
.rrg__tuning {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 300px;
  padding: 14px 14px 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color-overlay, #fff) 96%, transparent);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16), 0 2px 8px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(6px);
  font-size: 12px;
  color: var(--el-text-color-primary, #0f172a);
}

.rrg__tuning-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.rrg__tuning-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary, #0f172a);
  display: flex;
  align-items: center;
  gap: 6px;
}

.rrg__tuning-title::before {
  content: "";
  display: inline-block;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--el-color-primary, #409eff);
}

.rrg__tuning-close {
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary, #94a3b8);
  font-size: 13px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

.rrg__tuning-close:hover {
  color: var(--el-color-primary, #3b82f6);
  background: var(--el-fill-color-light, #f1f5f9);
}

.rrg__tuning-close:focus-visible {
  outline: 2px solid var(--el-color-primary, #3b82f6);
  outline-offset: 1px;
}

.rrg__tuning-tip {
  margin: 0;
  line-height: 1.6;
  color: var(--el-text-color-secondary, #64748b);
}

/* label / 控件 / 数值 / 重置 四列网格，控件行与滑块行对齐 */
.rrg__tuning-row {
  display: grid;
  grid-template-columns: 62px 1fr auto 24px;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  margin: 0 -6px;
  border-radius: 8px;
  transition: background-color 0.15s;
}

.rrg__tuning-row:hover {
  background: color-mix(in srgb, var(--el-fill-color-light, #f1f5f9) 60%, transparent);
}

.rrg__tuning-label {
  white-space: nowrap;
  color: var(--el-text-color-regular, #475569);
}

/* 滑块：accent-color 跟随主题色，避免为原生控件写整套暗色样式 */
.rrg__tuning-range {
  width: 100%;
  height: 16px;
  margin: 0;
  accent-color: var(--el-color-primary, #3b82f6);
  cursor: pointer;
}

.rrg__tuning-range:focus-visible {
  outline: 2px solid var(--el-color-primary, #3b82f6);
  outline-offset: 2px;
}

.rrg__tuning-value {
  min-width: 38px;
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: var(--el-color-primary, #3b82f6);
  background: color-mix(in srgb, var(--el-color-primary, #3b82f6) 8%, transparent);
  border-radius: 5px;
  padding: 1px 4px;
}

.rrg__tuning-reset {
  border: none;
  background: transparent;
  color: var(--el-text-color-placeholder, #94a3b8);
  font-size: 13px;
  line-height: 1;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

.rrg__tuning-reset:hover {
  color: var(--el-color-primary, #3b82f6);
  background: var(--el-fill-color-light, #f1f5f9);
}

.rrg__tuning-reset:focus-visible {
  outline: 2px solid var(--el-color-primary, #3b82f6);
  outline-offset: 1px;
}

.rrg__tuning-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  color: var(--el-text-color-regular, #475569);
  cursor: pointer;
}

.rrg__tuning-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
}

/* ReSelect / ReInput 的根节点带上的是子组件自己的 scope 标记，
   普通 scoped 选择器打不中；用 :deep 强制宽度，避免两个控件在悬浮工具栏里各占满一行。 */
.rrg__toolbar :deep(.rrg__layout) {
  width: 132px;
}

.rrg__toolbar :deep(.rrg__search) {
  width: 132px;
}

/* Element Plus 给相邻按钮加 margin-left:12px，和 flex gap 会叠加成 18px 并挤出一行；
   悬浮工具栏统一交给 gap 控制间距。 */
.rrg__toolbar :deep(.el-button + .el-button) {
  margin-left: 0;
}

/* 按钮微交互（对齐地图工具栏质感）：hover 轻微抬升、按下快速回落 */
.rrg__toolbar :deep(.el-button) {
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.rrg__toolbar :deep(.el-button:hover:not(:disabled):not(.is-loading)) {
  transform: translateY(-1px);
}

.rrg__toolbar :deep(.el-button:active:not(:disabled):not(.is-loading)) {
  transform: translateY(0);
  transition-duration: 0.06s;
}

/* 激活(primary)态柔和脉冲：提示"该模式已开启"，仅作强调不改变布局 */
.rrg__toolbar :deep(.el-button--primary:not(:disabled)) {
  animation: rrg-toolbar-pulse 3s ease-out infinite;
}

@keyframes rrg-toolbar-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.18);
  }
  70% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

/* 减少动态偏好：关掉脉冲与箭头旋转 */
@media (prefers-reduced-motion: reduce) {
  .rrg__toolbar :deep(.el-button--primary:not(:disabled)) {
    animation: none;
  }

  .rrg__toolbar-collapse svg {
    transition: none;
  }
}

/* 工具栏键盘可达：给可聚焦控件一个清晰的 focus ring */
.rrg__toolbar :deep(button:focus-visible),
.rrg__toolbar :deep(input:focus-visible) {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: 1px;
}

.rrg__canvas:focus-visible {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: -2px;
}

/* 节点内容插槽（G6 html 节点）：
   G6 把外层 div 的左上角定位到节点坐标（原点），并给它设置 transform(视口+节点)；
   我们的插槽容器作为其子元素，用 -50% 偏移把内容盒中心对齐到节点坐标。 */
.rrg__node-content {
  position: absolute;
  left: -50%;
  top: -50%;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: 12px;
  color: var(--el-text-color-primary, #303133);
  pointer-events: auto;
  user-select: none;
}

.rrg__node-content--plain {
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color, #dcdfe6);
  white-space: nowrap;
}

.rrg__canvas {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.rrg__g6 {
  width: 100%;
  height: 100%;
}

/* 3D 模式下隐藏 2D 层：用 visibility 而非 display:none ——
   G6 的 autoResize 观察容器尺寸，display:none 会量到 0×0 把画布搞花，
   visibility:hidden 保留布局尺寸，切回 2D 无需重建实例。pointer-events 由 hidden 自动断开。 */
.rrg__g6.is-hidden {
  visibility: hidden;
}

.rrg__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder, #a8abb2);
  font-size: 13px;
  pointer-events: none;
}

.rrg__tip {
  position: absolute;
  right: 12px;
  top: 12px;
  max-width: 260px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  box-shadow: var(--el-box-shadow-light, 0 0 12px rgba(0, 0, 0, 0.12));
  font-size: 12px;
  color: var(--el-text-color-primary, #303133);
  pointer-events: none;
}

.rrg__tip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.rrg__tip-row {
  color: var(--el-text-color-regular, #606266);
}

.rrg__menu {
  position: fixed;
  z-index: 3000;
  min-width: 148px;
  padding: 4px;
  border-radius: 6px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  box-shadow: var(--el-box-shadow-light, 0 0 12px rgba(0, 0, 0, 0.12));
  font-size: 13px;
}

.rrg__menu-item {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--el-text-color-regular, #606266);

  &:hover {
    background: var(--el-fill-color-light, #f5f7fa);
    color: var(--el-color-primary, #2992ff);
  }

  &.is-danger:hover {
    background: var(--el-color-danger-light-9, #fef0f0);
    color: var(--el-color-danger, #f56c6c);
  }
}
</style>
