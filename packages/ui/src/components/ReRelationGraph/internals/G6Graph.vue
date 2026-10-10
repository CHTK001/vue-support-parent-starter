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
import ReButton from "../../ReButton";
import ReInput from "../../ReInput";
import ReSelect from "../../ReSelect";
import { t, tLayout } from "./i18n";
import {
  type RelationEdge,
  type RelationGraphApi,
  type RelationGraphData,
  type RelationHighlightMode,
  type RelationLayoutName,
  type RelationNode,
  type RelationViewMode,
  RELATION_LAYOUTS,
} from "./types";

// Minimap 不在 G6 的 build-in 注册表里（build-in 只注册了 bubble-sets / edge-bundling /
// edge-filter-lens / grid-line），必须显式注册后才能用 { type: 'minimap' } 声明。
// 另：Minimap 的构造函数是 (context, options) 两参，不能在这里预构造实例。
// 加 once 守卫：热更新会重复执行模块体，重复注册会刷 "[G6] extension ... registered before" 警告。
let minimapRegistered = false;
if (!minimapRegistered) {
  register(ExtensionCategory.PLUGIN, "minimap", Minimap);
  minimapRegistered = true;
}

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
  }>(),
  {
    data: undefined,
    nodes: undefined,
    edges: undefined,
    lines: undefined,
    layout: "force",
    layoutOptions: undefined,
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
}>();

const wrapRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const graphRef = shallowRef<Graph | null>(null);
const ready = ref(false);
const currentLayout = ref<string>(props.layout);
const empty = ref(true);

/** 右键菜单状态 */
const menu = ref<{ visible: boolean; x: number; y: number; kind: "node" | "edge" | "canvas"; id: string }>(
  { visible: false, x: 0, y: 0, kind: "canvas", id: "" },
);
/** 悬浮详情（供父级 tooltip 或内置气泡使用） */
const hovered = ref<RelationNode | null>(null);

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
    g?.setElementState(map as any, true);
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
  graphRef.value?.focusElement(ids[i], true as any).catch(() => {});
  graphRef.value?.setElementState({ [ids[i]]: ["active"] } as any, true);
};

/** 定位 + 选中一个节点 */
async function locateNode(id: string) {
  const g = graphRef.value;
  if (!g || is3d.value) {
    return;
  }
  await g.focusElement(id, true as any).catch(() => {});
  g.setElementState({} as any, false);
  g.setElementState({ [id]: ["selected"] } as any, true);
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
 * @return 归一化后的图数据
 */
const graphData = computed<RelationGraphData>(() => {
  const rawNodes = props.data?.nodes ?? props.nodes ?? [];
  const rawEdges = props.data?.edges ?? props.edges ?? props.lines ?? [];
  const combos = props.data?.combos ?? [];
  return { nodes: rawNodes.map(aliasNode), edges: rawEdges.map(aliasEdge), combos };
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

/** 边 -> G6 EdgeData */
const toEdgeData = (e: RelationEdge) => {
  const directed = e.directed ?? props.directed;
  const style: Record<string, unknown> = {
    labelText: e.label ?? "",
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
  if (props.highlight === "adjacent" || props.highlight === "both") {
    list.push({ type: "hover-activate", degree: 1, state: "active", inactiveState: "inactive" });
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
  if (props.minimap) {
    list.push({ type: "minimap", size: [200, 128], padding: 8, position: "right-bottom" });
  }
  // history 必须在「初始 config」里，运行期 setPlugins 不会实例化新插件。
  list.push({ type: "history", key: "history", stackSize: 50, beforeAddCommand: beforeAddHistory });
  return list;
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

/** 取节点上除高亮状态外的既有状态（如 selected），避免整表替换时被抹掉 */
const baseStates = (graph: any, id: string): string[] =>
  (graph.getElementState?.(id) ?? []).filter((s: string) => s !== "active" && s !== "inactive");

/** 依据 highlight 配置，在悬停时高亮同组 / 淡出其余 */
const applyGroupHighlight = async (nodeId: string | null, on: boolean) => {
  const graph = graphRef.value;
  if (!graph || props.highlight !== "group" && props.highlight !== "both") {
    return;
  }
  if (!on || !nodeId) {
    // 只清除高亮状态（active/inactive），保留 selected 等其它状态：
    // setElementState 是「整表替换」语义，早先的 setElementState({}) 实际是空操作，
    // 而进入分支的整体替换会把选中态一并抹掉。
    const clearMap: Record<string, string[]> = {};
    (graphData.value.nodes ?? []).forEach(n => {
      const cur: string[] = (graph as any).getElementState?.(n.id) ?? [];
      if (cur.includes("active") || cur.includes("inactive")) {
        clearMap[n.id] = baseStates(graph, n.id);
      }
    });
    if (Object.keys(clearMap).length) {
      await graph.setElementState(clearMap as any, false);
    }
    return;
  }
  const node = nodeById(nodeId);
  const group = node?.group;
  if (!group) {
    return;
  }
  const ids = new Set<string>();
  (graphData.value.nodes ?? []).forEach(n => {
    if (n.group === group) {
      ids.add(n.id);
    }
  });
  const stateMap: Record<string, string[]> = {};
  (graphData.value.nodes ?? []).forEach(n => {
    const base = baseStates(graph, n.id);
    stateMap[n.id] = ids.has(n.id) ? [...base, "active"] : [...base, "inactive"];
  });
  await graph.setElementState(stateMap as any, false);
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

const stateStyle = {
  node: {
    selected: { lineWidth: 3, stroke: "var(--el-color-primary)", halo: true },
    active: { lineWidth: 2, stroke: "var(--el-color-primary)" },
    inactive: { opacity: 0.18 },
  },
  edge: {
    selected: { lineWidth: 2, stroke: "var(--el-color-primary)" },
    active: { lineWidth: 2, opacity: 1 },
    inactive: { opacity: 0.12 },
  },
};

/** 创建图实例 */
/** 已装载数据的指纹（节点 id 列表 + 边 id 列表），用于跳过无实质变化的更新 */
let appliedKey = "";

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
 * 力导向（force / d3-force）布局的默认细分参数。
 *
 * <p>底层 d3-force 的默认值节点斥力很弱（{@code manyBody.strength:-30}）、
 * 且默认 {@code preventOverlap:false}、{@code nodeSpacing:0}——连了边的节点
 * 会因为斥力不足、又不防重叠而紧紧挤成一团。这里给一组更松、更防重叠的默认值，
 * 让「连接线」两侧节点保持可读间距；调用方仍可用 {@code layoutOptions} 覆盖任意项。</p>
 */
const FORCE_LAYOUT_DEFAULTS: Record<string, unknown> = {
  // 连接距离：一条边两端的目标间距（越大越松）
  linkDistance: 140,
  // 节点斥力（顶层入口，等价 manyBody.strength，默认仅 -30）：负值越大彼此推得越开
  nodeStrength: -320,
  // 防重叠：按 nodeSize + nodeSpacing 做碰撞分离，避免节点/边叠在一起
  preventOverlap: true,
  nodeSize: 40,
  nodeSpacing: 18,
};

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
  const base = layoutType === "force" ? FORCE_LAYOUT_DEFAULTS : {};
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
const layoutForGraph = async (graph: Graph) => {
  const nodes = graph.getNodeData?.() ?? [];
  const edges = graph.getEdgeData?.() ?? [];
  if (nodes.length + edges.length <= LAYOUT_ANIMATION_MAX_ELEMENTS) {
    await graph.layout();
    return;
  }
  const cur = graph.getLayout?.();
  const withAnimationOff = Array.isArray(cur)
    ? cur.map((l: any) => ({ ...l, animation: false }))
    : { ...(cur && typeof cur === "object" ? cur : {}), animation: false };
  await graph.layout(withAnimationOff as any);
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
  const nodes = (d.nodes ?? []).map(toNodeData);
  const edges = (d.edges ?? []).map(toEdgeData);
  if (nodes.length) {
    graph.addNodeData(nodes as any);
  }
  if (edges.length) {
    graph.addEdgeData(edges as any);
  }
  (d.combos ?? []).forEach(c => graph.addComboData([c as any]));
  await graph.draw();
  // 装载后必须真跑一次布局：draw() 只画不排，节点坐标一直缺省（全堆在图原点），
  // 随后的 fitView 会把这一小簇按「适配」放大到 maxZoom——观感就是巨大的节点与边互相重叠。
  // setLayout 走的正是 layout() → fitView 这条链路，这里对齐它。
  try {
    await layoutForGraph(graph);
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
    node: { style: { fill: "#e8f3ff", stroke: "#2992ff", lineWidth: 1.5 } },
    edge: { style: { stroke: "#c3cbd8", lineWidth: 1.2 } },
    combo: { type: "rect", style: { fill: "rgba(109,93,252,0.06)", stroke: "#c9c2ff", lineWidth: 1, labelText: "" } },
    layout: { type: props.layout, ...resolveLayoutOptions(props.layout, props.layoutOptions) } as any,
    behaviors: buildBehaviors(),
    plugins: buildPlugins(),
    nodeState: stateStyle.node,
    edgeState: stateStyle.edge,
  } as any);

  graphRef.value = graph;
  bindEvents(graph);
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
  queueMicrotask(() => {
    const ids = graph.getElementDataByState?.("node", "selected")?.map((x: any) => x.id) ?? [];
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
    if (props.highlight === "group" || props.highlight === "both") {
      await applyGroupHighlight(n?.id ?? null, true);
    }
  });
  graph.on("node:pointerleave", async (ev: any) => {
    hovered.value = null;
    emit("node-hover", null, ev);
    if (props.highlight === "group" || props.highlight === "both") {
      await applyGroupHighlight(null, false);
    }
  });
  graph.on("edge:click", (ev: any) => {
    const e = edgeById(idOf(ev));
    if (e) {
      emit("edge-click", e, ev);
    }
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
  await graph.draw();
  empty.value = false;
  attachSlots();
  emitDataChange();
  sync3d();
};

const addEdge = async (e: RelationEdge) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.addEdgeData([toEdgeData(e)]);
  await graph.draw();
  emitDataChange();
  sync3d();
};

const updateNode = async (n: RelationNode) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.updateNodeData([toNodeData(n)] as any);
  await graph.draw();
  attachSlots();
  emitDataChange();
  sync3d();
};

const updateEdge = async (e: RelationEdge) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.updateEdgeData([toEdgeData(e)] as any);
  await graph.draw();
  emitDataChange();
  sync3d();
};

const removeNode = async (id: string) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.removeNodeData([id]);
  await graph.draw();
  unmountSlot(id);
  empty.value = (graph.getNodeData?.() ?? []).length === 0;
  emitDataChange();
  sync3d();
};

const removeEdge = async (id: string) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.removeEdgeData([id]);
  await graph.draw();
  emitDataChange();
  sync3d();
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
const setLayout = async (name: RelationLayoutName, options?: Record<string, unknown>) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  currentLayout.value = name;
  try {
    graph.setLayout({ type: name, ...resolveLayoutOptions(name, options ?? props.layoutOptions) } as any);
    await layoutForGraph(graph);
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

const exportData = (): RelationGraphData => ({
  nodes: (graphRef.value?.getNodeData?.() ?? []).map((d: any) => ({
    id: d.id,
    label: d.data?.__label,
    group: d.data?.__group,
    fixed: d.data?.__fixed,
    image: d.data?.__image,
    type: d.type,
    data: d.data,
  })) as RelationNode[],
  edges: (graphRef.value?.getEdgeData?.() ?? []).map((d: any) => ({
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
    nodes: (g.getNodeData?.() ?? []).map((d: any) => ({
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
    edges: (g.getEdgeData?.() ?? []).map((d: any) => ({
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
    graphRef.value?.setElementState(m2 as any, false);
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
  if (!n || props.highlight === "none") {
    hoverHl3d.value = null;
    return;
  }
  const wantGroup = props.highlight === "group" || props.highlight === "both";
  const wantAdj = props.highlight === "adjacent" || props.highlight === "both";
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

const api: RelationGraphApi = {
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
    graphRef.value?.setElementState(m as any, false);
    selectedIds.value = [...ids];
    attachSlots();
  },
  getSelection: () => {
    if (is3d.value) {
      return [...selected3d.value];
    }
    return graphRef.value?.getElementDataByState?.("node", "selected")?.map((x: any) => x.id) ?? [];
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
    graphRef.value?.setElementState(m as any, false);
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
};

defineExpose(api);

// ==================== 工具栏动作 ====================

// 布局名走 i18n（tLayout 未命中时回退到 zh 标签），随应用语言切换
const layoutOptions = computed(() =>
  RELATION_LAYOUTS.map(l => ({ label: tLayout(l.value, l.label), value: l.value })),
);
const layoutValue = ref<string>(props.layout);

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
  ).filter(el => !el.hasAttribute("disabled"));
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
 * 拿到的�� {@code [{ type: 'minimap', size: [200, 128], ... }]} 这种纯配置对象，
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

/** 生命周期 */

// ==================== 生命周期 ====================

watch(
  () => props.minimap,
  async v => {
    if (v === minimapOn.value) {
      return;
    }
    minimapOn.value = v;
    if (!graphRef.value) {
      return;
    }
    // 实测 G6 v5 的 setPlugins 只更新配置列表，**不会在运行时实例化新增插件**
    // （getPlugins() 里有了 minimap，但 DOM 里始终不出现小地图）。因此只能重建实例。
    await rebuild();
  },
);

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
  // 卸载手工挂载进 G6 的插槽，避免内存泄漏
  for (const id of Array.from(slotEls.keys())) {
    unmountSlot(id);
  }
});
</script>

<template>
  <div ref="wrapRef" class="rrg" :style="{ width: typeof width === 'number' ? width + 'px' : width, height: typeof height === 'number' ? height + 'px' : height }">
    <!-- 工具栏：布局切换 / 搜索 / 缩放 / 适配 / 撤销重做 / 导出 / 连线 / 小地图 / 2D-3D 切换 -->
    <div
      v-if="toolbar"
      class="rrg__toolbar"
      role="toolbar"
      :aria-label="t('toolbar.aria', '关系图工具栏')"
      @keydown.left.prevent="rovingFocus(-1, $event)"
      @keydown.right.prevent="rovingFocus(1, $event)"
    >
      <ReSelect
        ref="layoutSelectRef"
        :model-value="layoutValue"
        class="rrg__layout"
        size="small"
        :options="layoutOptions"
        :disabled="is3d"
        :placeholder="t('toolbar.layout', '选择布局')"
        @update:model-value="onLayoutChange"
      />
      <ReInput
        v-if="searchable"
        v-model="searchText"
        class="rrg__search"
        size="small"
        clearable
        :placeholder="t('toolbar.searchPlaceholder', '搜索节点…')"
        :aria-label="t('toolbar.search', '搜索节点')"
        :title="t('toolbar.search', '搜索节点')"
        @keyup.enter="runSearch(searchText)"
        @clear="clearSearch"
      />
      <ReButton size="small" :title="t('toolbar.fit', '适配视口')" :aria-label="t('toolbar.fit', '适配视口')" @click="api.fitView()">适配</ReButton>
      <ReButton
        v-if="editable"
        size="small"
        :disabled="is3d || !canUndo"
        :title="t('toolbar.undo', '撤销')"
        :aria-label="t('toolbar.undo', '撤销')"
        @click="api.undo()"
      >
        ↶
      </ReButton>
      <ReButton
        v-if="editable"
        size="small"
        :disabled="is3d || !canRedo"
        :title="t('toolbar.redo', '重做')"
        :aria-label="t('toolbar.redo', '重做')"
        @click="api.redo()"
      >
        ↷
      </ReButton>
      <ReButton
        v-if="editable"
        size="small"
        :type="connectMode ? 'primary' : ''"
        :disabled="is3d"
        :title="connectMode ? t('toolbar.connectOff', '退出连线模式') : t('toolbar.connect', '连线模式')"
        :aria-label="t('toolbar.connect', '连线模式')"
        :aria-pressed="connectMode"
        @click="setConnectMode(!connectMode)"
      >
        {{ t('toolbar.connect', '连线') }}
      </ReButton>
      <ReButton
        v-if="exportable"
        size="small"
        :title="t('toolbar.export', '导出图片')"
        :aria-label="t('toolbar.export', '导出图片')"
        @click="onExport"
      >
        {{ t('toolbar.export', '导出') }}
      </ReButton>
      <ReButton
        size="small"
        :type="minimapOn ? 'primary' : ''"
        :disabled="is3d"
        :title="minimapOn ? t('toolbar.minimapOn', '隐藏小地图') : t('toolbar.minimapOff', '显示小地图')"
        :aria-label="t('toolbar.minimap', '小地图')"
        :aria-pressed="minimapOn"
        @click="() => { minimapOn = !minimapOn; toggleMinimap(minimapOn); }"
      >
        {{ t('toolbar.minimap', '小地图') }}
      </ReButton>
      <ReButton size="small" :type="is3d ? 'primary' : ''" :title="is3d ? t('toolbar.modeTitle2d', '切回 2D 画布') : t('toolbar.modeTitle3d', '切换到 3D 力导向视图')" :aria-label="is3d ? t('toolbar.modeTitle2d', '切回 2D 画布') : t('toolbar.modeTitle3d', '切换到 3D 力导向视图')" @click="toggleMode">
        {{ is3d ? t('toolbar.toggleMode2d', '2D') : t('toolbar.toggleMode3d', '3D') }}
      </ReButton>
      <ReButton
        v-if="editable && !is3d && selectedIds.length === 1 && isNodeId(selectedIds[0])"
        size="small"
        :title="t('toolbar.updateNodeTip', '更新选中节点')"
        :aria-label="t('toolbar.updateNodeTip', '更新选中节点')"
        @click="updateSelectedNode"
      >
        {{ t('toolbar.updateNode', '更新节点') }}
      </ReButton>
      <ReButton
        v-if="editable && !is3d && selectedIds.length === 1 && isEdgeId(selectedIds[0])"
        size="small"
        :title="t('toolbar.updateEdgeTip', '更新选中边')"
        :aria-label="t('toolbar.updateEdgeTip', '更新选中边')"
        @click="updateSelectedEdge"
      >
        {{ t('toolbar.updateEdge', '更新边') }}
      </ReButton>
      <ReButton
        v-if="editable && !is3d && selectedIds.length === 1 && isNodeId(selectedIds[0])"
        size="small"
        type="danger"
        :title="t('toolbar.removeNodeTip', '删除选中节点')"
        :aria-label="t('toolbar.removeNodeTip', '删除选中节点')"
        @click="removeSelectedNode"
      >
        {{ t('toolbar.removeNode', '删除节点') }}
      </ReButton>
      <ReButton
        v-if="editable && !is3d && selectedIds.length === 1 && isEdgeId(selectedIds[0])"
        size="small"
        type="danger"
        :title="t('toolbar.removeEdgeTip', '删除选中边')"
        :aria-label="t('toolbar.removeEdgeTip', '删除选中边')"
        @click="removeSelectedEdge"
      >
        {{ t('toolbar.removeEdge', '删除边') }}
      </ReButton>
      <slot name="toolbar-extra" :api="api" :nodes="graphData.nodes" :mode="mode" />
    </div>

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

      <!-- 悬浮详情：鼠标经过或点击时显示（ZooKeeper 集群信息即用这个） -->
      <div v-if="hovered" class="rrg__tip">
        <slot name="hover" :node="hovered">
          <div class="rrg__tip-title">{{ hovered.label ?? hovered.id }}</div>
          <div v-if="hovered.group" class="rrg__tip-row">分组：{{ hovered.group }}</div>
        </slot>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu && menu.visible"
      class="rrg__menu"
      :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
      @click.stop
    >
      <div class="rrg__menu-item" @click="menu.visible = false; emit('node-right-click', nodeById(menu.id) as RelationNode, null)">
        <slot name="menu" :kind="menu.kind" :id="menu.id" :api="api">
          <span v-if="menu.kind === 'node'">节点：{{ nodeById(menu.id)?.label ?? menu.id }}</span>
          <span v-else-if="menu.kind === 'edge'">边：{{ menu.id }}</span>
          <span v-else>空白处</span>
        </slot>
      </div>
      <template v-if="editable">
        <div v-if="menu.kind === 'node'" class="rrg__menu-item is-danger" @click="removeNode(menu.id); menu.visible = false">删除该节点</div>
        <div v-if="menu.kind === 'edge'" class="rrg__menu-item is-danger" @click="removeEdge(menu.id); menu.visible = false">删除该边</div>
      </template>
      <div class="rrg__menu-item" @click="menu.visible = false">关闭</div>
    </div>
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

.rrg__toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  /* 去底悬浮工具栏：不要半透明底/圆角/边框/阴影/模糊，
     按钮直接浮在画布上，仅保留 2px 间距。 */
  gap: 2px;
  max-width: calc(100% - 24px);
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
