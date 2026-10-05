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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { Graph, Minimap, register, ExtensionCategory } from "@antv/g6";

// Minimap 不在 G6 的 build-in 注册表里（build-in 只注册了 bubble-sets / edge-bundling /
// edge-filter-lens / grid-line），必须显式注册后才能用 { type: 'minimap' } 声明。
// 另：Minimap 的构造函数是 (context, options) 两参，不能在这里预构造实例。
// 加 once 守卫：热更新会重复执行模块体，重复注册会刷 "[G6] extension ... registered before" 警告。
let minimapRegistered = false;
if (!minimapRegistered) {
  register(ExtensionCategory.PLUGIN, "minimap", Minimap);
  minimapRegistered = true;
}
import ReButton from "../../ReButton";
import ReSelect from "../../ReSelect";
import type {
  RelationEdge,
  RelationGraphApi,
  RelationGraphData,
  RelationHighlightMode,
  RelationLayoutName,
  RelationNode,
} from "./types";
import { RELATION_LAYOUTS } from "./types";

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
  const size = n.size ?? props.nodeSize;
  const style: Record<string, unknown> = {
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
  return {
    id: n.id,
    type: n.type ?? (n.image ? "image" : props.nodeType),
    combo: n.combo,
    data: { ...(n.data ?? {}), __label: n.label ?? n.id, __group: n.group, __fixed: n.fixed === true, __image: n.image },
    style: { ...style, ...(n.style ?? {}) },
  };
};

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

/** 按 id 找回业务节点（事件回调要把业务对象交回给调用方） */
const nodeById = (id: string): RelationNode | undefined => graphData.value.nodes?.find(n => n.id === id);
const edgeById = (id: string): RelationEdge | undefined =>
  (graphData.value.edges ?? []).find(e => (e.id ?? `${e.source}->${e.target}`) === id);

/** 构建 behaviors */
const buildBehaviors = () => {
  const list: any[] = ["drag-canvas"];
  if (props.zoom) {
    list.push("zoom-canvas");
  }
  if (props.drag) {
    list.push({ type: "drag-element", shadow: true });
  }
  list.push({
    type: "click-select",
    multiple: props.multiSelect,
    // ShortcutKey 是 string[]（默认 ['shift']）；写成字符串 "ctrl" 会让
    // Shortcut.match -> lowerCaseKeys 里 keys.map 抛 "keys.map is not a function"
    trigger: ["ctrl"],
    state: "selected",
    unselectedState: undefined,
  });
  if (props.highlight === "adjacent" || props.highlight === "both") {
    list.push({ type: "hover-activate", degree: 1, state: "active", inactiveState: "inactive" });
  }
  return list;
};

/** 构建 plugins */
const buildPlugins = () => {
  const list: any[] = [];
  if (props.minimap) {
    list.push({ type: "minimap", size: [200, 128], padding: 8, position: "right-bottom" });
  }
  return list;
};

/** 依据 highlight 配置，在悬停时高亮同组 / 淡出其余 */
const applyGroupHighlight = async (nodeId: string | null, on: boolean) => {
  const graph = graphRef.value;
  if (!graph || props.highlight !== "group" && props.highlight !== "both") {
    return;
  }
  if (!on || !nodeId) {
    await graph.setElementState({}, false);
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
    stateMap[n.id] = ids.has(n.id) ? ["active"] : ["inactive"];
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
  appliedKey = keyOf(d);
  empty.value = nodes.length === 0;
  pinFixedNodes();
};

/** 创建图实例 */
const initGraph = async () => {
  if (!containerRef.value) {
    return;
  }
  const graph = new Graph({
    container: containerRef.value,
    autoResize: true,
    autoFit: "view",
    animation: true,
    data: { nodes: [], edges: [], combos: [] },
    node: { style: { fill: "#e8f3ff", stroke: "#2992ff", lineWidth: 1.5 } },
    edge: { style: { stroke: "#c3cbd8", lineWidth: 1.2 } },
    combo: { type: "rect", style: { fill: "rgba(109,93,252,0.06)", stroke: "#c9c2ff", lineWidth: 1, labelText: "" } },
    layout: { type: props.layout, ...(props.layoutOptions ?? {}) } as any,
    behaviors: buildBehaviors(),
    plugins: buildPlugins(),
    nodeState: stateStyle.node,
    edgeState: stateStyle.edge,
  } as any);

  graphRef.value = graph;
  bindEvents(graph);
  await graph.render();
  await loadData(graphData.value);
  awaitingFit();
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

const awaitingFit = () => {
  // 力导等异步布局结束后再适配一次视口，避免首帧只看到一小块
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  window.setTimeout(() => {
    // 这个闭包捕获的是 400ms **之前**的 graph 实例。
    // 若期间发生了 rebuild()（小地图这类「只能重建生效」的变更）或组件卸载，
    // 该实例已被 destroy()；此时再调 fitView，G6 会去摸已拆掉的内部控制器，
    // 抛 "Cannot read properties of undefined (reading 'getData')"。
    // 那是**未捕获**的异步异常，会直接冒泡成页面级 PAGEERROR，
    // 在低负载下不出现、批量跑时才偶发（切换时机正好落进这 400ms 窗口）。
    // 只有「捕获的实例仍是当前实例」时才动手。
    // 顺带说明：同一个闭包里 pinFixedNodes() 读的是实时 graphRef，
    // 两者不一致正是这个 bug 的破绽。
    if (graphRef.value !== graph) {
      log("awaitingFit 跳过：graph 实例已被替换或已卸载");
      return;
    }
    try {
      graph.fitView?.(undefined as any, false as any)?.catch?.(() => {});
      pinFixedNodes();
    } catch (e) {
      log("awaitingFit 失败", e);
    }
  }, 400);
};

/** 绑定交互事件 */
const bindEvents = (graph: Graph) => {
  graph.on("node:click", (ev: any) => {
    const n = nodeById(idOf(ev));
    if (n) {
      emit("node-click", n, ev);
    }
    emit("selection-change", graph.getElementDataByState?.("node", "selected")?.map((x: any) => x.id) ?? []);
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
    emit("selection-change", graph.getElementDataByState?.("node", "selected")?.map((x: any) => x.id) ?? []);
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
  await graph.draw();
  await loadData(d);
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
  emit("data-change", graphData.value);
};

const addEdge = async (e: RelationEdge) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.addEdgeData([toEdgeData(e)]);
  await graph.draw();
  emit("data-change", graphData.value);
};

const updateNode = async (n: RelationNode) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.updateNodeData([toNodeData(n)] as any);
  await graph.draw();
  emit("data-change", graphData.value);
};

const updateEdge = async (e: RelationEdge) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.updateEdgeData([toEdgeData(e)] as any);
  await graph.draw();
  emit("data-change", graphData.value);
};

const removeNode = async (id: string) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.removeNodeData([id]);
  await graph.draw();
  empty.value = (graph.getNodeData?.() ?? []).length === 0;
  emit("data-change", graphData.value);
};

const removeEdge = async (id: string) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  graph.removeEdgeData([id]);
  await graph.draw();
  emit("data-change", graphData.value);
};

/** 切换布局 */
const setLayout = async (name: RelationLayoutName, options?: Record<string, unknown>) => {
  const graph = graphRef.value;
  if (!graph) {
    return;
  }
  currentLayout.value = name;
  try {
    graph.setLayout({ type: name, ...(options ?? props.layoutOptions ?? {}) } as any);
    await graph.layout();
  } catch (e) {
    // 树布局（dendrogram / indented / mindmap / compact-box）要求树形数据，
    // 用在普通关系图上 G6 会抛 "Tree structure not found"。这里优雅失败并如实记日志，
    // 不让它变成一个未捕获异常。
    log("布局失败（树布局需要树形数据）：" + name, e);
    emit("layout-change", name + ":failed");
    return;
  }
  await graph.fitView?.(undefined as any, false as any)?.catch?.(() => {});
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
  fitView: async () => {
    await graphRef.value?.fitView?.(undefined as any, true as any);
  },
  zoomIn: async () => {
    await graphRef.value?.zoomBy?.(1.2, true as any);
  },
  zoomOut: async () => {
    await graphRef.value?.zoomBy?.(0.8, true as any);
  },
  zoomTo: async (r: number) => {
    await graphRef.value?.zoomTo?.(r, true as any);
  },
  centerOn: async (id: string) => {
    await graphRef.value?.focusElement?.(id, true as any);
  },
  select: (ids: string[]) => {
    const m: Record<string, string[]> = {};
    ids.forEach(id => {
      m[id] = ["selected"];
    });
    graphRef.value?.setElementState(m as any, false);
  },
  getSelection: () => graphRef.value?.getElementDataByState?.("node", "selected")?.map((x: any) => x.id) ?? [],
  clearSelection: () => {
    graphRef.value?.setElementState({} as any, false);
  },
  highlight: (ids: string[]) => {
    const set = new Set(ids);
    const m: Record<string, string[]> = {};
    (graphData.value.nodes ?? []).forEach(n => {
      m[n.id] = set.has(n.id) ? ["active"] : ["inactive"];
    });
    graphRef.value?.setElementState(m as any, false);
  },
  clearHighlight: () => {
    graphRef.value?.setElementState({} as any, false);
  },
  getInstance: () => graphRef.value,
};

defineExpose(api);

// ==================== 工具栏动作 ====================

const layoutOptions = RELATION_LAYOUTS.map(l => ({ label: l.label, value: l.value }));
const layoutValue = ref<string>(props.layout);

const onLayoutChange = async (v: unknown) => {
  const name = String(v) as RelationLayoutName;
  layoutValue.value = name;
  await setLayout(name);
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

onBeforeUnmount(() => {
  // 走 safeDestroy：直接 destroy() 会漏掉插件挂起的 debounce 尾随调用，
  // 那会在 context 已被拆掉之后炸出未捕获异常（详见 safeDestroy 的注释）。
  safeDestroy(graphRef.value);
  graphRef.value = null;
});
</script>

<template>
  <div ref="wrapRef" class="rrg" :style="{ width: typeof width === 'number' ? width + 'px' : width, height: typeof height === 'number' ? height + 'px' : height }">
    <!-- 工具栏：布局切换 / 缩放 / 适配 / 小地图 / 新增 -->
    <div v-if="toolbar" class="rrg__toolbar">
      <ReSelect
        :model-value="layoutValue"
        class="rrg__layout"
        size="small"
        :options="layoutOptions"
        placeholder="选择布局"
        @update:model-value="onLayoutChange"
      />
      <ReButton size="small" title="放大" @click="api.zoomIn()">＋</ReButton>
      <ReButton size="small" title="缩小" @click="api.zoomOut()">－</ReButton>
      <ReButton size="small" title="适配视口" @click="api.fitView()">适配</ReButton>
      <ReButton size="small" :type="minimapOn ? 'primary' : ''" title="小地图" @click="() => { minimapOn = !minimapOn; toggleMinimap(minimapOn); }">
        小地图
      </ReButton>
      <slot name="toolbar-extra" :api="api" :nodes="graphData.nodes" />
    </div>

    <!-- 画布 -->
    <div class="rrg__canvas">
      <div ref="containerRef" class="rrg__g6" />
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
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-fill-color-lighter, #fafafa);
  flex: 0 0 auto;
}

.rrg__layout {
  width: 148px;
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
