<script setup lang="ts">
/**
 * ReRelationGraph · G6 5.1.1 原生核心画布
 *
 * <p>以 G6 官方示例
 * {@link https://g6.antv.antgroup.com/zh/examples/plugin/bubble-sets/basic/ Bubblesets 气泡集}
 * 为地基，逐行对照官方写法（Graph + force 布局防重叠 + bubble-sets 分组 +
 * 缩放/拖拽行为 + autoFit），不做任何包装层。</p>
 *
 * <p>分组轮廓支持两种包裹方式（{@code groupType}）：bubble-sets 气泡集 与
 * plugin/hull 凹包轮廓（{@link https://g6.antv.antgroup.com/zh/examples/plugin/hull/basic/}）；
 * 内置工具栏见 {@link ./GraphToolbar.vue}，布局参数表见 {@link ./layoutSettings}。</p>
 *
 * <p>对外数据契约（与业务端一致）：</p>
 * <ul>
 *   <li>{@code nodes}: {@code { id, label, group, type, size }} ——
 *       {@code group} 即势力/分组字段，驱动分组轮廓与节点配色；</li>
 *   <li>{@code edges}: {@code { source, target, label }}。</li>
 * </ul>
 *
 * <p>后续功能（悬停高亮、小地图、右键菜单、图例、入场动画…）
 * 在本文件上逐个添加，每加一个都过一遍验收。</p>
 */
import {
  Fragment,
  computed,
  createVNode,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  render,
  useSlots,
  watch,
} from "vue";
import { Graph } from "@antv/g6";
import {
  DEFAULT_LAYOUT,
  isGroupLayout,
  isTreeLayoutType,
  type GroupType,
  type LayoutType,
} from "./layouts";
import { GROUP_PALETTE, groupColorOf } from "./palette";
import GraphToolbar from "./GraphToolbar.vue";

/** 对外节点契约 */
export interface RelationNode {
  id: string;
  label?: string;
  /** 势力 / 分组字段：驱动气泡集分组与配色 */
  group?: string;
  /** 节点类型：circle / image / rect …（缺省 circle；给了 {@code image} 时自动按 image 画） */
  type?: string;
  /** 节点尺寸（直径，缺省取组件级 {@code nodeSize}）；html 节点可给 [宽, 高] */
  size?: number | [number, number];
  /**
   * 头像 / 图标地址（http(s) 或 data URI）。给了就按图片节点渲染
   * （圆形裁剪由 {@code imageRadius} 控制，缺省自动取一半 = 圆形）。
   */
  image?: string;
  /** 图片节点的圆角（px，缺省按 size 的一半 = 圆形） */
  imageRadius?: number;
  /** 徽标文字（画在节点右上角，如「主公」「军师」） */
  badge?: string;
  /** 徽标背景色（缺省按分组色） */
  badgeColor?: string;
  [key: string]: unknown;
}

/** 对外边契约 */
export interface RelationEdge {
  /**
   * 边 id（缺省 `${source}-${target}`）。
   *
   * <p>同一对节点之间有多条边时必须显式给（例如数据库的复合外键：同一对表之间
   * 会有多条 FK）。G6 的边 id 必须唯一，缺省值重复时后一条会被静默丢弃
   * （控制台报 {@code Edge already exists}）。</p>
   */
  id?: string;
  source: string;
  target: string;
  label?: string;
  /** 线宽（缺省取组件级 {@code edgeWidth}） */
  width?: number;
  /** 虚线（缺省取组件级 {@code edgeDashed}） */
  dashed?: boolean;
  /** 箭头：true = 终点箭头，`"both"` = 双向（缺省取组件级 {@code edgeArrow}） */
  arrow?: boolean | "both";
  /** 线色（缺省用主题默认描边色） */
  color?: string;
  [key: string]: unknown;
}

/**
 * 右键菜单（contextmenu）的回参。
 *
 * <p>右键永远会 emit {@code contextmenu}；只有在给了 {@code #context-menu} 插槽时，
 * 组件才会额外在光标位置浮出一层容器，把这份对象原样喂给插槽，业务想画什么菜单都行。</p>
 */
export interface ContextMenuDetail {
  /** 右键命中的元素类型（空白处 = canvas） */
  targetType: "node" | "edge" | "combo" | "canvas";
  /** 元素 id（canvas 时为 ""）；combo 用的是带前缀的内部 id（__group__蜀汉），分组名见 group */
  id: string;
  /** 边专用：起点 */
  source?: string;
  /** 边专用：终点 */
  target?: string;
  /** combo 专用：分组名（如「蜀汉」） */
  group?: string;
  /** 业务数据：节点 → RelationNode；边 → RelationEdge；combo → { group }；canvas → undefined */
  data?: unknown;
  /** 右键瞬间的选中集合（右键元素会自动加入选择，见 rightClickSelect） */
  selection: { nodes: string[]; edges: string[]; combos: string[] };
  /** 光标位置：相对组件根元素的像素坐标（浮层直接用这个定位） */
  client: { x: number; y: number };
  /** 光标位置：相对浏览器视口的 clientX / clientY */
  page: { x: number; y: number };
  /** 光标位置：画布坐标系 */
  canvas: { x: number; y: number };
  /** 原始 DOM 事件（要读 shiftKey / 阻止默认行为时用） */
  native?: MouseEvent | null;
}

/**
 * 编辑历史状态（`history-change` 事件的载荷，也是 `canUndo` / `canRedo` 的取数来源）。
 */
export interface HistoryState {
  /** 还能撤销吗 */
  canUndo: boolean;
  /** 还能重做吗 */
  canRedo: boolean;
  /** 撤销栈深度 */
  undoCount: number;
  /** 重做栈深度 */
  redoCount: number;
  /** 栈顶这次改动做了什么（`add-node` / `remove-nodes` / `delete-selection` …） */
  lastAction: string;
}

/** 分组调色板与取色（唯一来源见 {@link ./palette}） */
const CLUSTER_COLORS = GROUP_PALETTE;

/** 分组 → combo id（加前缀，避免和业务节点 id 撞车） */
const comboIdOf = (group: string) => `__group__${group}`;

/** 组名 hash → 调色板颜色（同组同色，改数据也不会变色） */
const colorOf = (group: string, palette: readonly string[]): string => groupColorOf(group, palette);

const props = withDefaults(
  defineProps<{
    /** 节点列表 */
    nodes?: RelationNode[];
    /** 边列表 */
    edges?: RelationEdge[];
    /** 画布高度（px 或 css 长度，缺省 100%） */
    height?: string | number;
    /**
     * 布局：缺省 {@code "group"}（分组布局，每组自动占据画布独立区域）；
     * 也可传 G6 全部内置布局名（force / d3-force / circular / grid / dagre …），
     * 或传完整对象 {@code { type: "force", linkDistance: 150 }}。
     */
    layout?: LayoutType | { type: string; [key: string]: unknown };
    /**
     * 布局参数：透传给 G6 对应布局（按布局类型不同）；
     * 分组布局支持 spacing（组内间距）/ gap（组间留白）/ minRadius（单组最小半径）。
     */
    layoutOptions?: Record<string, unknown>;
    /**
     * 分组轮廓包裹方式：
     * - {@code "bubble"}（默认）BubbleSets 云状气泡集；
     * - {@code "hull"} Hull 轮廓（凹包，贴合节点集形状）；
     * - {@code "none"} 不画轮廓（节点仍按 group 配色）。
     */
    groupType?: GroupType;
    /** 分组轮廓是否显示（关掉只留配色，类型与参数保留） */
    groupVisible?: boolean;
    /**
     * 非分组布局下自动隐藏分组轮廓（默认开启）。
     *
     * <p>轮廓是「按 group 圈节点」画出来的：只有分组布局会把同一势力聚成一块，
     * 换成 force / grid / circular 等布局后各组节点互相穿插，轮廓必然彼此重叠、
     * 还会把别组节点圈进来。默认在非分组布局下自动不画（节点仍按势力配色）；
     * 确实需要在散布局里看轮廓时置 false。</p>
     */
    groupAutoHide?: boolean;
    /**
     * 分组轮廓参数：hull 支持 padding / concavity，bubble 支持 nodeR1，
     * 两者共用 fillOpacity / lineWidth / strokeOpacity。
     */
    groupOptions?: Record<string, unknown>;
    /** 是否显示内置工具栏（布局 / 分组 / 布局设置 / 适应画布） */
    toolbar?: boolean;
    /** 工具栏外观变体：pill（悬浮胶囊）/ card（卡片）/ rail（竖向轨） */
    toolbarVariant?: "pill" | "card" | "rail";
    /** 工具栏停靠角（四个角）；rail 变体可选左右两侧 */
    toolbarPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left" | "right";
    /** 工具栏是否可折叠（折叠后只留一个展开按钮） */
    toolbarCollapsible?: boolean;
    /** 是否启用节点/边悬浮提示的总开关（默认开启；关掉 = 两者都不显示） */
    tooltip?: boolean;
    /**
     * 节点悬浮提示独立开关（默认开启）。与 {@code tooltip} 是「与」关系：
     * {@code tooltip=false} 时这里就算 true 也不显示。
     */
    nodeTooltip?: boolean;
    /** 边悬浮提示独立开关（默认开启），规则同 {@code nodeTooltip} */
    edgeTooltip?: boolean;
    /**
     * Tooltip 配置：透传 G6 tooltip 插件
     * （position / offset / enterable / enable…），另支持：
     * {@code getContent?: (data, kind) => string} 自定义内容。
     *
     * <p>内容优先级：{@code #node-tooltip / #edge-tooltip} 插槽 &gt;
     * 这里的 {@code getContent} &gt; 内置模板。</p>
     */
    tooltipOptions?: {
      getContent?: (data: Record<string, unknown>, kind: "node" | "edge") => string;
      [key: string]: unknown;
    };
    /**
     * 右键时是否把命中的元素加入选中集合（默认开启）。
     * 右键回参里的 {@code selection} 就是「加入之后」的集合，业务菜单可直接用。
     */
    rightClickSelect?: boolean;
    /* ---------------- 节点 / 边 外观 ---------------- */
    /** 节点缺省直径（px）；节点数据里给了 {@code size} 时以数据为准。默认 40 */
    nodeSize?: number;
    /** 画布为空（无节点）时显示的占位文案；空字符串表示不显示 */
    emptyText?: string;
    /** 是否显示节点徽标（数据里给了 {@code badge} 才有效，默认开） */
    nodeBadge?: boolean;
    /** 边是否画箭头：false / true（终点）/ "both"（双向），缺省 false */
    edgeArrow?: boolean | "both";
    /** 边是否虚线（缺省 false） */
    edgeDashed?: boolean;
    /** 边线宽（缺省 1.4） */
    edgeWidth?: number;
    /** 是否显示边标签（边数据里有 {@code label} 才有效，缺省 true） */
    edgeLabel?: boolean;
    /** 点选：单击节点 / 边 / combo 选中（G6 click-select 行为） */
    clickSelect?: boolean;
    /** 框选：拖拽空白处拉框多选（G6 brush-select 行为） */
    brushSelect?: boolean;
    /**
     * 悬停高亮：鼠标移到节点上时高亮它和它的 1 度邻居，其余元素淡化
     * （G6 hover-activate 行为），默认开启。
     */
    highlight?: boolean;
    /** 小地图（G6 minimap 插件），默认关闭 */
    minimap?: boolean;
    /**
     * 分组折叠：把每个 group 渲染成 combo 容器，点击 combo 可折叠 / 展开组内节点。
     * 默认关闭（= 不折叠，节点平铺展示）。
     */
    combo?: boolean;
    /**
     * 初始就折叠的分组名列表（配合 {@code combo} 使用），
     * 例如 {@code ["曹魏", "东吴"]}。默认空 = 全部展开（不折叠）。
     */
    collapsedGroups?: string[];
    /* ---------------- 编辑体验：撤销/重做 + 键盘快捷键 ---------------- */
    /**
     * 是否记录编辑历史（撤销 / 重做）。默认开。
     *
     * <p>所有命令式增删改（addNode / removeNode / updateNode / addEdge / … / clear，
     * 以及快捷键删除）都会在改动前压一份快照，关掉就不占内存也不响应撤销。</p>
     */
    history?: boolean;
    /** 历史栈深度上限（超出丢弃最老的），默认 50 */
    historyLimit?: number;
    /** 是否开启组件内键盘快捷键（容器获得焦点时生效），默认开 */
    keyboard?: boolean;
    /**
     * 快捷键映射覆盖：动作 → 组合键（`false` 表示关掉该动作）。
     *
     * <p>内置动作：`undo` / `redo` / `redo-alt` / `select-all` / `delete` /
     * `clear-selection`。组合键写法：`mod+z`（mod = Ctrl 或 ⌘）、`ctrl+shift+k`、
     * `delete`（Delete 或 Backspace）、`esc`。</p>
     */
    shortcuts?: Record<string, string | false>;
  }>(),
  {
    nodes: () => [],
    edges: () => [],
    height: "100%",
    layout: DEFAULT_LAYOUT,
    layoutOptions: () => ({}),
    groupType: "bubble",
    groupVisible: true,
    groupAutoHide: true,
    groupOptions: () => ({}),
    toolbar: false,
    toolbarVariant: "pill",
    toolbarPosition: "top-right",
    toolbarCollapsible: true,
    tooltip: true,
    nodeTooltip: true,
    edgeTooltip: true,
    tooltipOptions: () => ({}),
    rightClickSelect: true,
    nodeSize: 40,
    emptyText: "暂无数据",
    nodeBadge: true,
    edgeArrow: false,
    edgeDashed: false,
    edgeWidth: 1.4,
    edgeLabel: true,
    clickSelect: false,
    brushSelect: false,
    highlight: true,
    minimap: false,
    combo: false,
    collapsedGroups: () => [],
    history: true,
    historyLimit: 50,
    keyboard: true,
    shortcuts: () => ({}),
  },
);

const containerRef = ref<HTMLDivElement | null>(null);
/** 组件根元素（右键浮层按它做定位基准） */
const rootRef = ref<HTMLDivElement | null>(null);
let graph: Graph | null = null;

/** 插槽：node-content / node-tooltip / edge-tooltip / context-menu / toolbar-extra */
const slots = useSlots();

/* ---------------- 节点内容插槽（#node-content → G6 html 节点） ---------------- */

const hasNodeSlot = computed(() => !!slots["node-content"]);

/** 每个节点对应的 Vue 渲染容器（G6 html 节点只当挂载点用） */
const slotEls = new Map<string, HTMLElement>();

/** 取 / 建某个节点的插槽容器元素 */
const ensureSlotEl = (id: string): HTMLElement => {
  let el = slotEls.get(id);
  if (!el) {
    el = document.createElement("div");
    el.className = "rrg__node-content";
    slotEls.set(id, el);
  }
  return el;
};

/** 把 #node-content 插槽渲染进某个节点的容器 */
const renderSlotNode = (node: RelationNode) => {
  if (!hasNodeSlot.value) return;
  const el = ensureSlotEl(String(node.id));
  const selected = selectedNodes.value.includes(String(node.id));
  const vnodes = slots["node-content"]!({ node, id: String(node.id), selected });
  render(vnodes.length ? h(Fragment, null, vnodes as never) : h(Fragment), el);
};

/** 卸载某个节点的插槽容器（节点被移除 / 组件卸载） */
const unmountSlot = (id: string) => {
  const el = slotEls.get(String(id));
  if (!el) return;
  render(null, el);
  el.remove();
  slotEls.delete(String(id));
};

/**
 * 把已渲染的插槽容器挂进 G6 html 节点的关键图形 DOM。
 *
 * <p>不能通过 style.innerHTML 传 DOM 元素：History 插件会深度遍历命令数据，
 * DOM 的循环引用会让它无限递归爆栈。所以模型里 innerHTML 只放字符串，
 * 真正的 DOM 在这里按元素实例 {@code getShape('key').getDomElement()} 挂载。</p>
 */
const attachSlots = () => {
  if (!hasNodeSlot.value || !graph || !graphAlive) return;
  for (const n of nodesState.value) {
    const id = String(n.id);
    if ((n.type ?? "") !== "html") continue;
    const el = ensureSlotEl(id);
    renderSlotNode(n);
    try {
      const inst = (graph as unknown as {
        context?: { element?: { getElement?: (id: string) => unknown } };
      }).context?.element?.getElement?.(id) as
        | { getShape?: (key: string) => { getDomElement?: () => HTMLElement | undefined } }
        | undefined;
      const host = inst?.getShape?.("key")?.getDomElement?.();
      if (host && el.parentElement !== host) host.appendChild(el);
    } catch {
      /* 元素还没 draw 完时取不到 DOM，下次 render 完会再挂 */
    }
  }
};

/**
 * 当前布局（可被 {@code setLayout} 命令式覆盖；props.layout 变化时同步）
 * 用 ref 而非直接读 props，是因为 setLayout 需要在不改父组件数据的情况下切布局。
 */
const layoutState = ref<LayoutType | { type: string; [key: string]: unknown }>(
  props.layout ?? DEFAULT_LAYOUT,
);

/** 当前布局参数（工具栏可在运行中改，父组件传值优先同步） */
const layoutOptionsState = ref<Record<string, unknown>>({ ...(props.layoutOptions ?? {}) });

/** 当前分组轮廓类型 / 显隐 / 参数 */
const groupTypeState = ref<GroupType>(props.groupType ?? "bubble");
const groupVisibleState = ref<boolean>(props.groupVisible ?? true);
const groupOptionsState = ref<Record<string, unknown>>({ ...(props.groupOptions ?? {}) });

/**
 * 内部数据副本。
 *
 * <p>为什么不全用 props：组件要对外提供节点/边的增删改（{@code addNode} 等），
 * 命令式改动先落到这份副本上并立即重绘，父组件若用 {@code :nodes} 单向绑定也能看到
 * 效果；父组件改了 props 时再由 watch 回灌。</p>
 */
const nodesState = ref<RelationNode[]>([...(props.nodes ?? [])]);
const edgesState = ref<RelationEdge[]>([...(props.edges ?? [])]);

/**
 * 交互开关的状态副本（工具栏切了就改这里，父组件用 v-model:xxx 也能同步）。
 * 这些都是「要重建 Graph 才生效」的开关：behavior / plugin 只能在实例上挂。
 */
const tooltipState = ref<boolean>(props.tooltip ?? true);
/** 节点 / 边悬浮提示的独立开关（与总开关是「与」关系） */
const nodeTooltipState = ref<boolean>(props.nodeTooltip ?? true);
const edgeTooltipState = ref<boolean>(props.edgeTooltip ?? true);
const clickSelectState = ref<boolean>(props.clickSelect ?? false);
const brushSelectState = ref<boolean>(props.brushSelect ?? false);
const highlightState = ref<boolean>(props.highlight ?? true);
const minimapState = ref<boolean>(props.minimap ?? false);
const comboState = ref<boolean>(props.combo ?? false);

/**
 * 对外事件（已接通 G6 底层）：
 * - node-mouseover / node-mouseout：节点鼠标移入/移出（G6 node:pointerenter/pointerleave）
 * - edge-mouseover / edge-mouseout：边鼠标移入/移出（G6 edge:pointerenter/pointerleave）
 *
 * 事件载荷统一为 { id, data, ... }：id 是元素 id，data 是元素业务数据
 * （节点为 { cluster, __label, ... }，边为 { label }）。
 */
const emit = defineEmits<{
  /** 首帧渲染完成（参数为底层 G6 Graph 实例），可在此后调用 centerOn / fitView 等 */
  (e: "ready", graph: Graph): void;
  (e: "node-click", detail: { id: string; data?: unknown }): void;
  (e: "node-dblclick", detail: { id: string; data?: unknown }): void;
  (e: "edge-click", detail: { id: string; source: string; target: string; data?: unknown }): void;
  (e: "node-mouseover", detail: { id: string; data?: unknown }): void;
  (e: "node-mouseout", detail: { id: string; data?: unknown }): void;
  (e: "edge-mouseover", detail: { id: string; source: string; target: string; data?: unknown }): void;
  (e: "edge-mouseout", detail: { id: string; source: string; target: string; data?: unknown }): void;
  /** 工具栏/命令式改动后的同步事件（配合 v-model:xxx 使用） */
  (e: "update:layout", value: string): void;
  (e: "update:layoutOptions", value: Record<string, unknown>): void;
  (e: "update:groupType", value: GroupType): void;
  (e: "update:groupVisible", value: boolean): void;
  (e: "update:groupOptions", value: Record<string, unknown>): void;
  (e: "update:tooltip", value: boolean): void;
  (e: "update:nodeTooltip", value: boolean): void;
  (e: "update:edgeTooltip", value: boolean): void;
  (e: "update:clickSelect", value: boolean): void;
  (e: "update:brushSelect", value: boolean): void;
  (e: "update:highlight", value: boolean): void;
  (e: "update:minimap", value: boolean): void;
  (e: "update:combo", value: boolean): void;
  /** 选中集合变化（点选 / 框选 / 命令式 select 都走这里） */
  (e: "selection-change", detail: { nodes: string[]; edges: string[]; combos: string[] }): void;
  /** 分组折叠状态变化（点 combo / 命令式 collapseGroup 都会发） */
  (e: "combo-collapse-change", detail: { group: string; collapsed: boolean }): void;
  /** 最短路径计算结果 */
  (e: "path-change", detail: { from: string; to: string; found: boolean; nodes: string[]; edges: string[] }): void;
  /** 「最短路径」选择模式开关变化（工具栏按钮 / 右键取消都会发） */
  (e: "update:pathPick", value: boolean): void;
  /** 右键菜单回参（命中元素 + 当前选中集合 + 三套坐标） */
  (e: "contextmenu", detail: ContextMenuDetail): void;
  /** 右键浮层被关闭（点空白 / Esc / 点了菜单里的按钮调 close 都走这里） */
  (e: "context-menu-close"): void;
  /** 数据变更通知（命令式增删改后发出，父组件可据此同步自己的数据源） */
  (e: "nodes-change", nodes: RelationNode[]): void;
  (e: "edges-change", edges: RelationEdge[]): void;
  /** 编辑历史状态变化（能不能撤销 / 重做、栈深、最近一次动作） */
  (e: "history-change", detail: HistoryState): void;
  /** 命中并执行了一条内置快捷键（业务可据此做埋点或额外联动） */
  (e: "shortcut", detail: { action: string; combo: string; native: KeyboardEvent }): void;
  /* ---------------- 增删回调：业务侧监听即可同步自己的数据源 ---------------- */
  /** 新增了节点（含命令式 addNode / addNodes） */
  (e: "node-created", detail: { node: RelationNode }): void;
  /** 新增了边（拖拽连线 / 命令式 addEdge 都会抛） */
  (e: "edge-created", detail: { edge: RelationEdge }): void;
  /** 删除了节点（因删节点而连带删掉的边，会另外单独抛 edge-deleted） */
  (e: "node-deleted", detail: { id: string; node: RelationNode }): void;
  /** 删除了边 */
  (e: "edge-deleted", detail: { id: string; edge: RelationEdge }): void;
  /** 连线模式状态变化（进入 / 建成一条 / 取消） */
  (e: "connect-change", detail: { active: boolean; from: string }): void;
}>();

/** 绑定 G6 事件 → Vue emit（在 graph 创建后调用一次） */
const bindEvents = (g: Graph, isAlive: () => boolean) => {
  // 动画型布局（force / d3-force / fruchterman …）在 render 时 autoFit 算的是
  // 初始位置，布局跑完后节点会跑到视口外 —— 布局结束再补一次 fitView，
  // 且只在内容确实超框时缩放（when: 'overflow'），不打扰用户手动缩放后的视图。
  g.on("afterlayout", () => {
    // 布局是异步的：切布局/切分组会整图重建，旧实例的 afterlayout 仍会触发，
    // 此时再调 fitView 会打 G6 的「graph has been destroyed」错误，先判存活
    if (!isAlive()) return;
    // 树类布局在「图不连通」时会把每个连通分量都从原点开始排 → 叠在一起，这里摊开
    separateComponents(g);
    // 兜底：仍有精确重合的节点（MDS 等）绕圈错开，避免叠成一团
    nudgeCoincidentNodes(g);
    // 通用防重叠后处理：只沿圆心连线推开重叠对，保留布局原本的形状。
    // 分组布局不跑 G6 布局（afterlayout 不会来）；四种 @antv/hierarchy 树由布局自己
    // 按 nodeSize / nodeSep 保证间距，再推会把层级推歪；鱼骨是自研坐标，节点会挤，
    // 所以要跑。
    const layoutType = resolveLayout().type;
    const skipRelax =
      isGroupLayout(layoutType) ||
      (isTreeLayoutType(layoutType) && layoutType !== "fishbone");
    if (!skipRelax) relaxOverlaps(g);
    g.fitView({ when: "overflow" }).catch(() => {});
    // 轮廓插件只在 AFTER_RENDER 时按「当时」的节点位置算一次路径；
    // 动画型布局渲染完还会继续挪节点，不刷新的话轮廓会留在初始位置 ——
    // 表现为轮廓与节点错位、相邻两组的轮廓叠在一起。布局落定后强制重算一次。
    refreshContours();
  });
  // 真实 G6 事件里 ev.target 是 shape 对象（Circle / Line）：
  // - 元素 id 在 target.id（节点=节点 id；边=以 "source-target" 命名的 id）
  // - 业务数据不在 target 顶层，需用 graph.getNodeData / getEdgeData 回查
  g.on("node:pointerenter", (ev) => {
    const id = String(((ev as { target?: { id?: unknown } }).target ?? {}).id ?? "");
    // 事件回参里的 data 一律是「业务节点」本身（不是 G6 内部 datum），
    // 业务侧才能直接读自己塞进去的字段（kind / role / props …）
    emit("node-mouseover", { id, data: businessNodeOf(id) });
    // 最短路径模式期间悬停高亮让位：拾取端点靠 highlightElements 单独点亮
    if (pathPickState.value || pathModeState.value) return;
    hoverNode(id);
  });
  g.on("node:pointerleave", (ev) => {
    const id = String(((ev as { target?: { id?: unknown } }).target ?? {}).id ?? "");
    emit("node-mouseout", { id, data: businessNodeOf(id) });
    if (pathPickState.value || pathModeState.value) return;
    clearHoverHighlight(id);
  });
  g.on("edge:pointerenter", (ev) => {
    const id = String(((ev as { target?: { id?: unknown } }).target ?? {}).id ?? "");
    // 边的两端从业务边表反查（业务 id 可能自带连字符，不能直接拆）
    const { source, target } = edgeEndsOf(id);
    emit("edge-mouseover", {
      id,
      source,
      target,
      data: businessEdgeOf(id),
    });
    if (pathPickState.value || pathModeState.value) return;
    hoverEdge(id);
  });
  g.on("edge:pointerleave", (ev) => {
    const id = String(((ev as { target?: { id?: unknown } }).target ?? {}).id ?? "");
    const { source, target } = edgeEndsOf(id);
    emit("edge-mouseout", {
      id,
      source,
      target,
      data: businessEdgeOf(id),
    });
    if (pathPickState.value || pathModeState.value) return;
    clearHoverHighlight(id);
  });

  /* ---------- 点选（自研：单击加入选择 / 再点取消 / 点空白清空） ---------- */
  const targetIdOf = (ev: unknown) =>
    String(((ev as { target?: { id?: unknown } })?.target ?? {}).id ?? "");

  g.on("node:click", (ev) => {
    if (consumeBrushClick()) return;
    const id = targetIdOf(ev);
    // 连线模式：左键点另一个节点 = 把关系落到它身上（点自己则取消）
    if (connectFromState.value) {
      if (!id) return;
      finishConnect(id);
      return;
    }
    // 最短路径模式（拾取中 / 已在看结果）：左键只用来点起点 / 终点，点选让位。
    // 看结果时再点一个节点 = 开始新一轮（见 pickPathEndpoint）。
    if (pathPickState.value || pathModeState.value) {
      if (!id) return;
      pickPathEndpoint(id);
      return;
    }
    if (id) emit("node-click", { id, data: businessNodeOf(id) });
    if (!clickSelectState.value) return;
    // 追加式多选：点第二个节点不会把第一个顶掉（算最短路径要选两个）
    if (id) toggleSelect(id, "node", true);
  });
  g.on("node:dblclick", (ev) => {
    if (pathPickState.value || pathModeState.value) return;
    const id = targetIdOf(ev);
    if (id) emit("node-dblclick", { id, data: businessNodeOf(id) });
  });
  g.on("edge:click", (ev) => {
    if (consumeBrushClick()) return;
    // 最短路径模式：边不参与端点选择，左键直接忽略
    if (pathPickState.value || pathModeState.value) return;
    const id = targetIdOf(ev);
    if (id) {
      const { source, target } = edgeEndsOf(id);
      emit("edge-click", { id, source, target, data: businessEdgeOf(id) });
    }
    if (!clickSelectState.value) return;
    if (id) toggleSelect(id, "edge", true);
  });
  g.on("combo:click", (ev) => {
    if (consumeBrushClick()) return;
    if (pathPickState.value) return;
    const id = targetIdOf(ev);
    if (!id) return;
    // 点 combo：折叠 / 展开该分组（开启分组折叠时）
    if (comboState.value) toggleGroupCollapsed(id.replace(/^__group__/, ""));
    else if (clickSelectState.value) toggleSelect(id, "combo", true);
  });
  g.on("canvas:click", () => {
    if (consumeBrushClick()) return;
    // 连线模式下点空白 = 取消拉线
    if (connectFromState.value) {
      cancelConnect();
      return;
    }
    // 最短路径模式期间点空白不清选中（此时本来就没有选中集合）
    if (pathPickState.value || pathModeState.value) return;
    if (clickSelectState.value || brushSelectState.value) clearSelection();
  });

  /* ---------- 框选（自研覆盖层）---------- */
  g.on("pointerdown", onBrushDown as never);
  g.on("pointermove", onBrushMove as never);
  g.on("pointerup", onBrushUp as never);
  // 鼠标移出画布时兜底清一次悬停态，避免「移出去还留着高亮」
  g.on("canvas:pointerleave", () => clearHoverHighlight());

  /* ---------- 右键（contextmenu）：回参 + 可选浮层 ---------- */
  // 最短路径模式（拾取中或已在看结果）下右键 = 取消，不再弹业务菜单：
  // 开启期间右键只服务最短路径，避免两套手势互相打架。
  // （pathBusy 是模块级的：框选的 pointerdown 也要用它让位）
  g.on("node:contextmenu", (ev) => {
    // 连线模式：右键 = 取消拉线（不再弹业务菜单）
    if (connectFromState.value) {
      ((ev as { native?: MouseEvent }).native)?.preventDefault?.();
      cancelConnect();
      return;
    }
    if (pathBusy()) {
      cancelPathPick(ev);
      return;
    }
    handleContextMenu(ev, "node");
  });
  g.on("edge:contextmenu", (ev) => {
    if (connectFromState.value) {
      ((ev as { native?: MouseEvent }).native)?.preventDefault?.();
      cancelConnect();
      return;
    }
    if (pathBusy()) {
      cancelPathPick(ev);
      return;
    }
    handleContextMenu(ev, "edge");
  });
  g.on("combo:contextmenu", (ev) => {
    if (pathBusy()) {
      cancelPathPick(ev);
      return;
    }
    handleContextMenu(ev, "combo");
  });
  g.on("canvas:contextmenu", (ev) => {
    if (connectFromState.value) {
      ((ev as { native?: MouseEvent }).native)?.preventDefault?.();
      cancelConnect();
      return;
    }
    if (pathBusy()) {
      cancelPathPick(ev);
      return;
    }
    handleContextMenu(ev, "canvas");
  });
  // 右键同时按下左键拖拽开始 / 关掉菜单时，都把浮层收掉
  g.on("pointerdown", () => closeContextMenu());
  // 连线模式：橡皮筋线跟着光标走（pointermove 在画布任意位置都要跟）
  g.on("pointermove", (ev) => {
    if (!connectFromState.value) return;
    const p = (ev as { canvas?: unknown }).canvas;
    if (!p) return;
    rubberPointer = pointOf(p);
    drawRubber();
  });
};

/** 分组布局可调参数 */
interface GroupLayoutOptions {
  /** 组内节点间距基准（px），决定单组区域半径 */
  spacing?: number;
  /** 组与组之间的留白（px） */
  gap?: number;
  /** 单组最小半径（px） */
  minRadius?: number;
}

/**
 * 归一化布局配置：{@code layout} 支持字符串或 { type, ...options } 对象，
 * {@code layoutOptions} 中的同名键优先。
 */
const resolveLayout = (): { type: string; options: Record<string, unknown> } => {
  const raw = layoutState.value ?? DEFAULT_LAYOUT;
  const base: Record<string, unknown> =
    typeof raw === "string" ? { type: raw } : { ...(raw as Record<string, unknown>) };
  const type = String(base.type ?? DEFAULT_LAYOUT);
  delete base.type;
  return { type, options: { ...base, ...(layoutOptionsState.value ?? {}) } };
};

/**
 * 各 G6 布局的推荐默认参数。
 *
 * <p>原则：**不覆盖 G6 自身默认值**（force 的 nodeStrength=1000 是斥力正值，
 * 之前误写成负值会导致节点全部吸到一起），只在 G6 默认不开启防重叠的布局上补
 * {@code preventOverlap}。用户 {@code layoutOptions} 仍可覆盖任意键。</p>
 */
const LAYOUT_BASE_OPTIONS: Record<string, Record<string, unknown>> = {
  // force / grid / fruchterman / force-atlas2 / mds 的 G6 默认值已可用
  "d3-force": { preventOverlap: true, nodeSize: 30 },
  circular: { preventOverlap: true, nodeSize: 30 },
  concentric: { preventOverlap: true, nodeSize: 30 },
  radial: { preventOverlap: true, nodeSize: 30 },
  dagre: { nodesep: 30, ranksep: 60 },
  "antv-dagre": { nodesep: 30, ranksep: 60 },
};

/**
 * 组装 G6 layout 配置。
 *
 * <p>「分组布局」和「鱼骨布局」都返回 undefined —— 这两种的位置由本组件自己算
 * （写在节点数据的 style.x / style.y 里），不交给 G6。</p>
 *
 * <p>树类布局（@antv/hierarchy）有两处契约差异要在这里抹平：</p>
 * <ul>
 *   <li>{@code getVGap / getHGap} 要的是 {@code (node) => number} 函数，
 *       面板里给的是数字 —— 不转会在布局里抛 {@code getHGap is not a function}，
 *       整个布局静默失败、节点全叠在原点；</li>
 *   <li>{@code nodeSize} 要的是 {@code [宽, 高]} 数组，数字会被当成单边长度。</li>
 * </ul>
 */
const buildLayout = (): Record<string, unknown> | undefined => {
  const { type, options } = resolveLayout();
  if (isGroupLayout(type) || type === "fishbone") return undefined;
  const merged: Record<string, unknown> = { type, ...(LAYOUT_BASE_OPTIONS[type] ?? {}), ...options };
  if (isTreeLayoutType(type)) {
    // 数字 → 函数（面板给的是数字）
    for (const key of ["getVGap", "getHGap"] as const) {
      const raw = merged[key];
      if (typeof raw === "number") {
        const gap = raw;
        merged[key] = () => gap;
      }
    }
    // 数字 → [宽, 高]
    if (typeof merged.nodeSize === "number") {
      const side = merged.nodeSize;
      merged.nodeSize = [side, side];
    }
  }
  return merged;
};

/**
 * 【鱼骨布局】自研实现。
 *
 * <p>为什么不用 G6 的 {@code fishbone}：它读 {@code model.getRootsData()} 拿树根、
 * 再调 {@code getRelatedEdgesData(id,'in')} 找父边，在「边表 + 环形关系」的业务数据上
 * 直接算不出坐标（实测 44 个节点全部落在 (0,0)，也就是用户看到的「鱼骨不显示」）。
 * 这里用同一棵 BFS 生成树自己排：鱼头在左，一级节点沿脊柱左右交替，二级节点沿 45°
 * 长成肋骨，更深的继续往外延伸 —— 效果稳定、与数据无关。</p>
 */
const computeFishbonePositions = (options: Record<string, unknown>) => {
  const pos = new Map<string, { x: number; y: number }>();
  const tree = buildTreeChildren();
  if (!tree.size) return { pos };

  // 骨头沿脊柱的间距 / 肋骨长度（都可在「布局设置」里调）
  const hGap = Number(options.hGap ?? 90);
  const vGap = Number(options.vGap ?? 70);
  const step = hGap + vGap * 1.4;

  const childIds = new Set<string>();
  tree.forEach((kids) => kids.forEach((k) => childIds.add(k)));
  const root = [...tree.keys()].find((id) => !childIds.has(id)) ?? [...tree.keys()][0];

  const place = (id: string, x: number, y: number) =>
    pos.set(id, { x: Math.round(x), y: Math.round(y) });

  // 鱼头
  place(root, 0, 0);

  const bones = tree.get(root) ?? [];
  bones.forEach((boneId, i) => {
    const dir = i % 2 === 0 ? -1 : 1; // 上下交替，避免全挤在一侧
    const bx = (i + 1) * step;
    place(boneId, bx, 0);

    const ribs = tree.get(boneId) ?? [];
    ribs.forEach((ribId, j) => {
      const d = (j + 1) * vGap;
      const rx = bx - d * 0.6; // 45° 斜向：往回退一点，视觉上挂到脊柱上
      const ry = dir * d;
      place(ribId, rx, ry);

      // 三级及更深的节点：沿同一条肋骨方向继续往外
      let subY = ry;
      let subX = rx;
      let level: string[] = tree.get(ribId) ?? [];
      let k = 0;
      while (level.length && k < 40) {
        const s = vGap * 0.8;
        subX -= s * 0.6;
        subY += dir * s;
        level.forEach((id, index) => place(id, subX - index * vGap * 0.9, subY));
        level = level.flatMap((id) => tree.get(id) ?? []);
        k += 1;
      }
    });
  });

  // 兜底：理论上生成树覆盖所有节点，万一有漏的排到脊柱尾部
  let extra = 0;
  for (const n of nodesState.value) {
    const id = String(n.id);
    if (!pos.has(id)) place(id, (bones.length + 1) * step + extra++ * (hGap * 0.5), 0);
  }
  return { pos };
};

/**
 * 【分组布局】确定性布局：每个 group 占据画布网格中的一个独立单元，
 * 组内节点按黄金角螺旋均布在圆面内，组间留 gap。
 *
 * <p>与力导向不同，这里不跑任何模拟：位置算一次即定，因此不会出现
 * 「地点 / 事件这类跨势力枢纽节点被多组边拉散」的问题 —— 每组必定成团，
 * 且各组区域互不重叠，随后由 autoFit 统一缩放居中。</p>
 */
const computeGroupPositions = (raw: Record<string, unknown>) => {
  const opts = raw as GroupLayoutOptions;
  const spacing = Number(opts.spacing ?? 100);
  const gap = Number(opts.gap ?? 170);
  const minRadius = Number(opts.minRadius ?? 70);

  // 按 group 归集节点 id（保持数据中的势力顺序）
  const grouped = new Map<string, string[]>();
  for (const n of nodesState.value) {
    const g = n.group || "";
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(String(n.id));
  }
  const entries = [...grouped.entries()];
  const empty = { pos: new Map<string, { x: number; y: number }>(), width: 0, height: 0 };
  if (!entries.length) return empty;

  // 单组半径随组内节点数增长（面积随人数增长 → 半径 ∝ √k）
  const radiusOf = (k: number) => Math.max(minRadius, spacing * Math.sqrt(Math.max(k, 1)) * 0.85);

  // 大势力先放（视觉重心靠前），每组占一块 (2r+gap) 见方的专属区域
  const items = entries
    .map(([, ids]) => {
      const r = radiusOf(ids.length);
      return { ids, r, w: 2 * r + gap, h: 2 * r + gap };
    })
    .sort((a, b) => b.r - a.r);

  // 货架式装箱：行宽目标按画布宽高比反推，整体形状贴近视口，
  // 避免 autoFit 后为迁就超宽/超高而把内容缩得过小。
  const w = containerRef.value?.clientWidth || 1200;
  const h = containerRef.value?.clientHeight || 800;
  const aspect = w > 0 && h > 0 ? w / h : 1.6;
  const totalArea = items.reduce((s, it) => s + it.w * it.h, 0);
  const targetRowW = Math.max(
    items[0].w,
    Math.sqrt(totalArea * aspect) * 1.05,
  );

  const rows: Array<{ items: typeof items; h: number }> = [];
  let rowItems: typeof items = [];
  let rowW = 0;
  for (const it of items) {
    if (rowItems.length && rowW + it.w > targetRowW) {
      rows.push({ items: rowItems, h: Math.max(...rowItems.map((c) => c.h)) });
      rowItems = [];
      rowW = 0;
    }
    rowItems.push(it);
    rowW += it.w;
  }
  if (rowItems.length) rows.push({ items: rowItems, h: Math.max(...rowItems.map((c) => c.h)) });

  // 平衡末行：若最后一行只剩一个组而上行还有富余，下移一个，避免底部孤零零一行
  if (rows.length > 1) {
    const last = rows[rows.length - 1];
    const prev = rows[rows.length - 2];
    if (last.items.length === 1 && prev.items.length > 2) {
      const moved = prev.items.pop()!;
      last.items.unshift(moved);
      prev.h = Math.max(...prev.items.map((c) => c.h));
      last.h = Math.max(...last.items.map((c) => c.h));
    }
  }

  const totalWidth = Math.max(...rows.map((r) => r.items.reduce((s, i) => s + i.w, 0)));

  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.399963，黄金角
  const pos = new Map<string, { x: number; y: number }>();
  let y = 0;
  for (const row of rows) {
    const usedW = row.items.reduce((s, i) => s + i.w, 0);
    let x = (totalWidth - usedW) / 2; // 行内居中，整体更对称
    for (const it of row.items) {
      const cx = x + it.w / 2;
      const cy = y + row.h / 2;
      it.ids.forEach((id, j) => {
        // t ∈ (0,1)：面积均匀 → 半径取 √t；角度用黄金角错开，避免对齐成放射状
        const t = (j + 0.5) / it.ids.length;
        const r = it.r * Math.sqrt(t);
        const angle = j * GOLDEN_ANGLE;
        pos.set(id, {
          x: Math.round(cx + Math.cos(angle) * r),
          y: Math.round(cy + Math.sin(angle) * r),
        });
      });
      x += it.w;
    }
    y += row.h;
  }
  return { pos, width: totalWidth, height: y };
};

/** G6 5 内置节点类型白名单（业务类型名如 person / location 一律回落 circle） */
const G6_NODE_TYPES = new Set([
  "circle",
  "rect",
  "ellipse",
  "diamond",
  "hexagon",
  "star",
  "triangle",
  "donut",
  "image",
  "html",
]);

/** 单个业务节点 → G6 节点（分组布局时带上预算坐标） */
const toG6Node = (
  n: RelationNode,
  p?: { x: number; y: number },
  extra?: { children?: string[]; combo?: string },
) => {
  const palette = CLUSTER_COLORS;
  const cluster = n.group || "";
  const businessType = n.type || "circle";
  // html 节点：给了 #node-content 插槽就用自定义 DOM，否则回落到纯文本块
  const isHtml = businessType === "html";
  const size = n.size ?? (isHtml ? ([160, 64] as [number, number]) : (props.nodeSize ?? 40));
  const clusterColor = cluster ? colorOf(cluster, palette) : "";
  // 业务 type（person / location …）只用来展示；画什么形状走形状白名单，
  // 否则 G6 建不出元素（未知类型会被静默跳过，连带分组轮廓报错）
  const shapeType = isHtml
    ? "html"
    : n.image
      ? "image"
      : G6_NODE_TYPES.has(businessType)
        ? businessType
        : "circle";
  const badgeText = String(n.badge ?? "");
  return {
    id: String(n.id),
    type: shapeType,
    // children 只给树类布局用（G6 据此建 TREE 结构，鱼骨/树图都依赖它）
    ...(extra?.children ? { children: extra.children } : {}),
    // combo 只在「分组折叠」模式给（节点归属到势力 combo）
    ...(extra?.combo ? { combo: extra.combo } : {}),
    data: { cluster, type: businessType, shape: shapeType, __label: n.label ?? n.id },
    style: {
      size,
      // 分组布局：坐标直接写在数据里，G6 不再跑布局
      ...(p ? { x: p.x, y: p.y } : {}),
      // html 节点不设 label*：G6 的 HTML 关键图形自带 label 定位，和自定义 DOM
      // 互相递归会抛 "Maximum call stack size exceeded"，名称交给插槽内容渲染
      ...(isHtml
        ? {
            // 模型里只存字符串占位，真正的 DOM 由 attachSlots() 挂上去
            innerHTML: hasNodeSlot.value
              ? ""
              : `<div class="rrg__node-content rrg__node-content--plain">${escapeHtml(
                  String(n.label ?? n.id),
                )}</div>`,
          }
        : {
            labelText: n.label ?? n.id,
            labelPlacement: "bottom",
            labelBackground: true,
            labelBackgroundFill: "rgba(0,0,0,0.55)",
            labelBackgroundRadius: 4,
            labelPadding: [2, 6],
            labelFill: "#fff",
            labelFontSize: 11,
          }),
      ...(clusterColor ? { fill: clusterColor, stroke: clusterColor } : {}),
      // 图片节点：src + 圆角（缺省圆形裁剪）+ 分组色描边环
      ...(n.image
        ? {
            src: n.image,
            img: n.image,
            radius: n.imageRadius ?? (typeof size === "number" ? size / 2 : 20),
            lineWidth: 2,
            ...(clusterColor ? { stroke: clusterColor } : {}),
          }
        : {}),
      // 徽标：右上角小标签（文字 + 分组色底）
      ...(badgeText && props.nodeBadge
        ? {
            badge: true,
            badges: [
              {
                text: badgeText,
                placement: "right-top",
                fill: "#fff",
                backgroundFill: n.badgeColor || clusterColor || "#1677ff",
                backgroundRadius: 4,
                fontSize: 9,
                padding: [1, 4],
                offsetX: 2,
                offsetY: 2,
              },
            ],
          }
        : {}),
      // 合并业务侧 style（fill / stroke / lineWidth / fillOpacity …），覆盖分组配色
      ...((n as { style?: Record<string, unknown> }).style || {}),
    },
  } as any;
};

/**
 * 从边推一棵 BFS 生成树（树类布局需要）。
 *
 * <p>为什么必须有：G6 的 TREE 层次结构只由节点数据上的 {@code children} 建立，
 * 鱼骨布局读的是 {@code model.getRootsData()}，拿不到根就整张图不画 ——
 * 这是「鱼骨布局不显示」的根因。根默认取度数最大的枢纽节点，
 * 也可用 {@code layoutOptions.root} 指定。</p>
 */
const buildTreeChildren = (): Map<string, string[]> => {
  const children = new Map<string, string[]>();
  const nodes = nodesState.value;
  if (!nodes.length) return children;

  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(String(n.id), []);
  for (const e of edgesState.value) {
    const s = String(e.source);
    const t = String(e.target);
    adj.get(s)?.push(t);
    adj.get(t)?.push(s);
  }

  const wanted = String((layoutOptionsState.value ?? {}).root ?? "");
  const root =
    wanted && adj.has(wanted)
      ? wanted
      : [...adj.entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[0];
  if (!root) return children;

  const seen = new Set<string>([root]);
  const queue: string[] = [root];
  while (queue.length) {
    const id = queue.shift()!;
    const kids: string[] = [];
    for (const next of adj.get(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      kids.push(next);
      queue.push(next);
    }
    children.set(id, kids);
  }
  return children;
};

/**
 * 树类布局的「多连通分量」修复。
 *
 * <p>G6 的树布局（compact-box / mindmap / dendrogram / indented）在
 * {@code runtime/layout.ts} 里是「对每个根各跑一次布局、结果直接堆在一起」，
 * 而每个分量的坐标都从原点起算 —— 图一旦不连通（三国数据里「赤壁」就没有边），
 * 几个分量就会精确叠在同一个点上（实测 4 个节点同坐标）。</p>
 *
 * <p>这里用并查集算出连通分量：节点最多的主分量不动，其余分量整体平移成
 * 主分量下方的一行行。重复调用是幂等的（平移后再算一次偏移为 0）。</p>
 */
const separateComponents = (g: Graph) => {
  const { type } = resolveLayout();
  if (!isTreeLayoutType(type)) return;
  const ids = g.getNodeData().map((n) => String(n.id));
  if (ids.length < 2) return;

  const parentOf = new Map<string, string>(ids.map((id) => [id, id]));
  const find = (id: string): string => {
    let cur = id;
    while (parentOf.get(cur) !== cur) cur = parentOf.get(cur) as string;
    return cur;
  };
  for (const e of g.getEdgeData()) {
    const ra = find(String(e.source));
    const rb = find(String(e.target));
    if (ra !== rb) parentOf.set(ra, rb);
  }

  const buckets = new Map<string, string[]>();
  for (const id of ids) {
    const root = find(id);
    buckets.set(root, [...(buckets.get(root) ?? []), id]);
  }
  if (buckets.size <= 1) return;

  const bboxOf = (list: string[]) => {
    const pts = list.map((id) => g.getElementPosition(id));
    return {
      minX: Math.min(...pts.map((p) => p[0])),
      maxX: Math.max(...pts.map((p) => p[0])),
      minY: Math.min(...pts.map((p) => p[1])),
      maxY: Math.max(...pts.map((p) => p[1])),
    };
  };

  const groups = [...buckets.values()].sort((a, b) => b.length - a.length);
  const main = bboxOf(groups[0]);
  let cursorY = main.maxY + 140;
  const patches: Array<{ id: string; style: { x: number; y: number } }> = [];

  for (const list of groups.slice(1)) {
    const box = bboxOf(list);
    const dx = main.minX - box.minX;
    const dy = cursorY - box.minY;
    for (const id of list) {
      const [x, y] = g.getElementPosition(id);
      patches.push({ id, style: { x: Math.round(x + dx), y: Math.round(y + dy) } });
    }
    cursorY += box.maxY - box.minY + 120;
  }
  if (patches.length) g.updateNodeData(patches as never);
};

/**
 * 兜底：把「坐标完全重合」的节点轻微错开。
 *
 * <p>个别布局（MDS 尤其明显）会把多个节点算到同一个点上，叠成一个看不出数量的团。
 * 这里只对精确重合的节点按固定半径绕圈错开 —— 本来分开的节点一个都不动。</p>
 */
const nudgeCoincidentNodes = (g: Graph) => {
  const buckets = new Map<string, string[]>();
  for (const n of g.getNodeData()) {
    const id = String(n.id);
    const [x, y] = g.getElementPosition(id);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const key = `${Math.round(x)},${Math.round(y)}`;
    buckets.set(key, [...(buckets.get(key) ?? []), id]);
  }
  const patches: Array<{ id: string; style: { x: number; y: number } }> = [];
  for (const [, list] of buckets) {
    if (list.length < 2) continue;
    const [cx, cy] = g.getElementPosition(list[0]);
    const radius = Math.max(24, 12 + list.length * 6);
    list.slice(1).forEach((id, i) => {
      const angle = (Math.PI * 2 * i) / Math.max(1, list.length - 1);
      patches.push({
        id,
        style: {
          x: Math.round(cx + Math.cos(angle) * radius),
          y: Math.round(cy + Math.sin(angle) * radius),
        },
      });
    });
  }
  if (patches.length) g.updateNodeData(patches as never);
};

/**
 * 节点重叠消除（布局落定后的通用后处理）。
 *
 * <p>G6 各布局对「防重叠」的支持参差不齐：只有部分布局认 {@code preventOverlap}，
 * 树类布局只看 {@code nodeSize / nodeSep}，而 MDS / fruchterman 这类迭代布局即使开了
 * 也仍会残留重叠（实测 dagre 在节点很多时也会压在一起）。</p>
 *
 * <p>做法刻意保守：<b>只沿两节点圆心连线把重叠的一对推开</b>，不做任何吸引、
 * 不拉直边、不夹回画布边界 —— 这样环形 / 分层 / 辐射的形状全部保留，
 * 只是把挤在一起的节点顶开一点点；溢出画布的部分交给 {@code fitView({ when: "overflow" })}。
 * 迭代有上限（{@code maxRounds}），节点很多时不会卡住。</p>
 *
 * @param g 目标画布
 * @param gap 额外的间距留白（px），默认 6
 * @param maxRounds 最大迭代轮数，默认 60
 * @returns 实际发生位移的节点数
 */
const relaxOverlaps = (g: Graph, gap = 6, maxRounds = 60): number => {
  const nodes = g.getNodeData();
  if (nodes.length < 2) return 0;

  /** 节点半径：业务 size 优先（数组取较大边的一半），否则用组件级 nodeSize */
  const radiusOf = (n: (typeof nodes)[number]): number => {
    const size = (n as { style?: { size?: unknown } }).style?.size;
    if (Array.isArray(size)) return Math.max(Number(size[0]) || 0, Number(size[1]) || 0) / 2;
    const num = Number(size);
    if (Number.isFinite(num) && num > 0) return num / 2;
    return (props.nodeSize ?? 40) / 2;
  };

  const items = nodes
    .map((n) => {
      const id = String(n.id);
      const [x, y] = g.getElementPosition(id);
      return { id, x, y, r: radiusOf(n) };
    })
    .filter((it) => Number.isFinite(it.x) && Number.isFinite(it.y));

  const moved = new Set<string>();
  for (let round = 0; round < maxRounds; round++) {
    let pushed = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = a.r + b.r + gap;
        const dist = Math.hypot(dx, dy);
        if (dist >= minDist) continue;
        // 完全重合：给一个确定性的方向，避免两节点原地抖动
        const angle =
          dist > 1e-6 ? Math.atan2(dy, dx) : ((i * 37 + j * 71) % 360) * (Math.PI / 180);
        const need = (minDist - dist) / 2 + 0.5;
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        a.x -= ux * need;
        a.y -= uy * need;
        b.x += ux * need;
        b.y += uy * need;
        moved.add(a.id);
        moved.add(b.id);
        pushed = true;
      }
    }
    if (!pushed) break;
  }

  if (!moved.size) return 0;
  g.updateNodeData(
    items
      .filter((it) => moved.has(it.id))
      .map((it) => ({ id: it.id, style: { x: it.x, y: it.y } })) as never,
  );
  return moved.size;
};

/**
 * 业务边的稳定 id。
 *
 * <p>优先用业务显式给的 {@code id}（同一对节点之间有多条边时必需），
 * 缺省退化成 {@code source-target}。所有内部记账（选中 / 路径 / CRUD / 事件回参）
 * 一律走这里，避免「给了 id 但别处还按 source-target 找」的错位。</p>
 */
const edgeIdOf = (e: RelationEdge) => String(e.id ?? `${e.source}-${e.target}`);

/**
 * 由边 id 反查两端节点 id。
 *
 * <p>不能再用 {@code id.split("-")}：业务给的 id（如 {@code fk-datasync-3}）
 * 里本身带连字符，拆出来会把两端节点名截断。这里先按业务边表精确匹配，
 * 匹配不到才退回 {@code source-target} 的拆分（兼容外部直接传内部 id 的场景）。</p>
 */
const edgeEndsOf = (id: string): { source: string; target: string } => {
  const hit = edgesState.value.find((e) => edgeIdOf(e) === id);
  if (hit) return { source: String(hit.source), target: String(hit.target) };
  const dash = id.indexOf("-");
  if (dash < 0) return { source: id, target: "" };
  return { source: id.slice(0, dash), target: id.slice(dash + 1) };
};

/**
 * 计算每个节点到 BFS 根的层数（与 {@link buildTreeChildren} 用同一套规则）。
 *
 * <p>树类布局要靠它给边「定方向」：G6 的 {@code createTreeStructure} 只是把每条边
 * 的 source 记成 target 的父节点（后写覆盖先写），于是**所有没有入边的节点都会变成
 * 一棵新的树根**，每棵树又都从原点起排 —— 表现为若干节点精确叠在同一个点上
 * （三国数据里「袁绍」就是个只有出边的枢纽，和「刘备」叠在一起）。</p>
 *
 * <p>把每条边重定向成「层数小的当 source」，整张图就变成一个以 BFS 根为唯一根的
 * DAG：除根以外人人有父节点、且父节点层数严格更小 → 不可能成环、只剩一个根。</p>
 */
const buildBfsDepths = () => {
  const depths = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodesState.value) adj.set(String(n.id), []);
  for (const e of edgesState.value) {
    const s = String(e.source);
    const t = String(e.target);
    adj.get(s)?.push(t);
    adj.get(t)?.push(s);
  }
  const wanted = String((layoutOptionsState.value ?? {}).root ?? "");
  const root =
    wanted && adj.has(wanted)
      ? wanted
      : [...adj.entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[0];
  if (!root) return depths;

  depths.set(root, 0);
  const queue: string[] = [root];
  while (queue.length) {
    const id = queue.shift() as string;
    const d = depths.get(id) as number;
    for (const next of adj.get(id) ?? []) {
      if (depths.has(next)) continue;
      depths.set(next, d + 1);
      queue.push(next);
    }
  }
  return depths;
};

/**
 * 单条业务边 → G6 边。
 *
 * <p>{@code depths} 非空时（树类布局）按层数重定向：视觉完全不变（不画箭头，
 * 直线两端还是那两个点），但能让 G6 建出「只有一个根」的树，避免多棵树叠在原点。</p>
 *
 * <p>样式优先级：边数据上的 {@code width / dashed / arrow / color}
 * 高于组件级 {@code edgeWidth / edgeDashed / edgeArrow}。重定向过的边若要求箭头，
 * 箭头改画在 start 端，保证方向仍然是业务的 source → target。</p>
 */
const toG6Edge = (e: RelationEdge, depths?: Map<string, number> | null) => {
  let source = String(e.source);
  let target = String(e.target);
  let flipped = false;
  if (depths) {
    const ds = depths.get(source) ?? Number.MAX_SAFE_INTEGER;
    const dt = depths.get(target) ?? Number.MAX_SAFE_INTEGER;
    if (ds > dt) {
      const swapped = source;
      source = target;
      target = swapped;
      flipped = true;
    }
  }

  const arrow = e.arrow ?? props.edgeArrow;
  const dashed = e.dashed ?? props.edgeDashed;
  const width = e.width ?? props.edgeWidth;
  const label = String(e.label ?? "");
  const showLabel = props.edgeLabel && !!label;

  const arrowStyle =
    arrow === "both"
      ? { startArrow: true, endArrow: true, startArrowType: "triangle", endArrowType: "triangle" }
      : arrow
        ? flipped
          ? { startArrow: true, startArrowType: "triangle" }
          : { endArrow: true, endArrowType: "triangle" }
        : {};

  return {
    id: edgeIdOf(e),
    source,
    target,
    data: { label },
    style: {
      lineWidth: width,
      ...(dashed ? { lineDash: [6, 4] } : {}),
      ...(e.color ? { stroke: e.color } : {}),
      ...arrowStyle,
      ...(showLabel
        ? {
            labelText: label,
            labelFontSize: 10,
            labelFill: "#5b6470",
            labelBackground: true,
            labelBackgroundFill: "rgba(255,255,255,0.92)",
            labelBackgroundRadius: 3,
            labelPadding: [1, 4],
          }
        : {}),
    },
  } as any;
};

/** 把业务节点归一化成 G6 数据（id / data.cluster / style.size / style.labelText / 分组坐标） */
const toG6Data = () => {
  const { type, options } = resolveLayout();
  // 自研布局（分组 / 鱼骨）把坐标直接写进数据，G6 不再跑布局
  const ownLayout = isGroupLayout(type)
    ? computeGroupPositions(options)
    : type === "fishbone"
      ? computeFishbonePositions(options)
      : null;
  // 树类布局：先把生成树写进 children，G6 才建得出 TREE 结构（否则鱼骨 / 树图空白）；
  // 同时按 BFS 层数重定向边，保证 G6 只认一个根（多根会叠在原点）
  const treeLayout = isTreeLayoutType(type) && type !== "fishbone";
  const tree = isTreeLayoutType(type) ? buildTreeChildren() : null;
  const depths = treeLayout ? buildBfsDepths() : null;
  // 分组折叠模式：按势力生成 combo，节点归属到对应 combo
  // 路径模式下不建 combo —— 容器仍按全体子节点算包围盒，子节点被隐藏后会留下一个空壳方框
  const combos = comboState.value && !pathModeState.value
    ? membersByGroup().map(([group]) => ({
        id: comboIdOf(group),
        data: { cluster: group },
        style: {
          labelText: group,
          labelPlacement: "top",
          labelFill: colorOf(group, CLUSTER_COLORS),
          labelFontSize: 12,
          labelFontWeight: "bold",
          stroke: colorOf(group, CLUSTER_COLORS),
          fill: "rgba(255,255,255,0.55)",
          lineWidth: 1.5,
          radius: 12,
          padding: 18,
          collapsedMarker: true,
          collapsedMarkerType: "child-count",
          collapsedMarkerFill: colorOf(group, CLUSTER_COLORS),
        },
      }))
    : [];

  return {
    nodes: nodesState.value.map((n) =>
      toG6Node(n, ownLayout?.pos.get(String(n.id)), {
        children: tree?.get(String(n.id)),
        combo: comboState.value && !pathModeState.value && n.group ? comboIdOf(n.group) : undefined,
      }),
    ),
    edges: edgesState.value.map((e) => toG6Edge(e, depths)),
    ...(combos.length ? { combos } : {}),
  } as any;
};

/** 按 group 归组节点 id（保持数据中的势力顺序） */
const membersByGroup = (): Array<[string, string[]]> => {
  const grouped = new Map<string, string[]>();
  for (const n of nodesState.value) {
    const g = n.group || "";
    if (!g) continue;
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(String(n.id));
  }
  return [...grouped.entries()];
};

/**
 * 生成分组轮廓插件：同一种包裹方式（bubble-sets / hull）按 group 各建一份。
 *
 * <p>两种插件的「胖瘦」机制不同，所以参数分开给：
 * bubble-sets 靠等值线场（{@code nodeR1} / {@code morphBuffer}），
 * hull 靠外包多边形的 {@code padding} + 凹度 {@code concavity}。
 * 共用的是配色与描边（fill / fillOpacity / stroke / lineWidth）。</p>
 *
 * <p>{@code groupVisible=false} 或 {@code groupType="none"} 时返回空数组，
 * 节点仍按 group 配色，只是不画轮廓。非分组布局 + {@code groupAutoHide} 同样返回空数组。</p>
 */
const buildGroupPlugins = () => {
  if (groupTypeState.value === "none" || !groupVisibleState.value) return [];
  // 分组折叠模式用 combo 容器表达分组，不再叠轮廓
  if (comboState.value) return [];
  // 路径模式只留一条链路，轮廓是按 group 圈全体成员的 —— 留着会圈住一堆已隐藏的节点，
  // 成员缺失时算包围盒还会直接抛错，所以干脆不挂
  if (pathModeState.value) return [];
  // 散布局（force / grid / circular …）里各组节点互相穿插，轮廓圈出来必然互相重叠，
  // 还会把别组节点圈进来 —— 默认干脆不画，只保留势力配色
  if (props.groupAutoHide && !isGroupLayout(resolveLayout().type)) return [];
  const entries = membersByGroup();
  if (!entries.length) return [];

  const opts = groupOptionsState.value ?? {};
  const num = (key: string, fallback: number) => {
    const n = Number(opts[key]);
    return Number.isFinite(n) ? n : fallback;
  };
  const palette = CLUSTER_COLORS;

  // 轮廓公共外观 + 标签固定在轮廓上方（Contour 默认贴边旋转，缩放后难辨认）
  const common = {
    fillOpacity: num("fillOpacity", 0.16),
    strokeOpacity: num("strokeOpacity", 0.9),
    lineWidth: num("lineWidth", 2),
    labelPlacement: "top",
    labelCloseToPath: false,
    labelAutoRotate: false,
    labelOffsetY: -6,
    labelPadding: 2,
    labelBackgroundFill: "#ffffff",
    labelBackgroundRadius: 5,
    labelFontSize: 12,
    labelFontWeight: "bold",
  } as const;

  return entries.map(([group, members], index) => {
    const color = colorOf(group, palette);
    // 注意：fill 必须 6 位 hex（8 位 #rrggbbaa 不被 G6 颜色解析器识别，会变透明）
    const paint = {
      fill: color,
      stroke: color,
      labelFill: color,
      ...common,
    };
    if (groupTypeState.value === "hull") {
      return {
        key: `hull-${index}`,
        type: "hull",
        members,
        labelText: group,
        // 凹包默认 concavity=Infinity（凸包），贴不住散开的节点集；
        // 700 左右沿节点外缘凹进去又不至于扎成星形，corner 用平滑圆角更像"势力范围"
        concavity: num("concavity", 700),
        corner: "smooth",
        padding: num("padding", 18),
        ...paint,
      };
    }
    return {
      key: `bubble-${index}`,
      type: "bubble-sets",
      members,
      labelText: group,
      nodeR1: num("nodeR1", 90),
      ...paint,
    };
  });
};

/** HTML 转义（tooltip 内容是 innerHTML 渲染的） */
const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

/** 行：label + 值 */
const tooltipRow = (label: string, value: string) =>
  `<div style="display:flex;gap:8px;line-height:1.7"><span style="color:#909399">${escapeHtml(label)}</span><span style="color:#303133">${escapeHtml(value)}</span></div>`;

/** 默认节点 tooltip 内容：标题 + 势力 + 类型 */
const defaultNodeTooltip = (data: Record<string, unknown>): string => {
  const title = String(data.__label ?? data.id ?? "");
  const cluster = String(data.cluster ?? "");
  const type = String(data.type ?? "");
  return `<div style="min-width:96px;font-size:12px">
    <div style="font-size:13px;font-weight:700;margin-bottom:2px">${escapeHtml(title)}</div>
    ${cluster ? tooltipRow("势力", cluster) : ""}
    ${type ? tooltipRow("类型", type) : ""}
  </div>`;
};

/** 默认边 tooltip 内容：两端 + 关系名 */
const defaultEdgeTooltip = (data: Record<string, unknown>, meta: Record<string, unknown>): string => {
  const source = String(meta.source ?? "");
  const target = String(meta.target ?? "");
  const label = String(data.label ?? "");
  return `<div style="min-width:96px;font-size:12px">
    <div style="font-size:13px;font-weight:700;margin-bottom:2px">${escapeHtml(source)} → ${escapeHtml(target)}</div>
    ${label ? tooltipRow("关系", label) : ""}
  </div>`;
};

/** 业务节点（按 id 回查；找不到退回空对象） */
const businessNodeOf = (id: string): Record<string, unknown> =>
  (nodesState.value.find((n) => String(n.id) === id) ?? {}) as unknown as Record<string, unknown>;

/** 业务边（按边 id 回查，见 {@link edgeIdOf}） */
const businessEdgeOf = (id: string): Record<string, unknown> =>
  (edgesState.value.find((e) => edgeIdOf(e) === id) ?? {}) as unknown as Record<string, unknown>;

/** 节点 / 边悬浮提示是否生效（总开关 tooltip + 各自开关，与关系） */
const nodeTooltipOn = () => tooltipState.value && nodeTooltipState.value;
const edgeTooltipOn = () => tooltipState.value && edgeTooltipState.value;

/**
 * 把插槽内容渲染成 HTML 字符串。
 *
 * <p>G6 的 tooltip 插件 {@code getContent} 只吃 HTML 字符串，而 Vue 插槽产出的是 VNode，
 * 所以这里挂一个游离容器渲染出 VNode 再取 {@code innerHTML}，取完立刻卸载。</p>
 *
 * <p>插槽若直接返回字符串，则原样当 HTML 用（想自己拼富文本时最省事）。
 * 注意 tooltip 的 HTML 是注入到画布容器里的，样式请用内联 style 或全局 class ——
 * 父组件的 {@code scoped} 样式对深层结构不一定命中。</p>
 */
const slotToHtml = async (
  name: "node-tooltip" | "edge-tooltip",
  slotProps: Record<string, unknown>,
): Promise<string | null> => {
  const slot = slots[name];
  if (!slot) return null;
  const raw = slot(slotProps);
  if (raw.length === 1 && typeof (raw[0] as { children?: unknown }).children === "string") {
    return (raw[0] as { children: string }).children;
  }
  const host = document.createElement("div");
  render(createVNode({ render: () => slot(slotProps) }), host);
  await nextTick();
  const html = host.innerHTML;
  render(null, host);
  return html;
};

/**
 * Tooltip 插件。
 *
 * <p>开关：{@code tooltip}（总）× {@code nodeTooltip} / {@code edgeTooltip}（各自），
 * 三者都要为真才出提示 —— 只想给节点配提示、边不要，就把 {@code :edge-tooltip="false"}。</p>
 *
 * <p>内容优先级：{@code #node-tooltip / #edge-tooltip} 插槽 &gt;
 * {@code tooltipOptions.getContent} &gt; 内置模板；
 * 其余 {@code tooltipOptions} 原样透传给 G6 tooltip 插件（position / offset / enterable…）。</p>
 */
const buildTooltipPlugin = () => {
  if (!nodeTooltipOn() && !edgeTooltipOn()) return null;
  const { getContent: customContent, ...rest } = props.tooltipOptions ?? {};
  return {
    type: "tooltip",
    key: "tooltip",
    ...rest,
    enable: (ev: { targetType?: string }) =>
      (ev.targetType === "node" && nodeTooltipOn()) || (ev.targetType === "edge" && edgeTooltipOn()),
    getContent: async (ev: { targetType?: string }, items: Array<Record<string, unknown>>) => {
      const item = items?.[0] ?? {};
      const data = (item.data ?? {}) as Record<string, unknown>;
      const isEdge = ev.targetType === "edge";
      const id = String(item.id ?? (isEdge ? `${item.source}-${item.target}` : data.id ?? ""));
      const slotted = await slotToHtml(
        isEdge ? "edge-tooltip" : "node-tooltip",
        isEdge
          ? {
              edge: businessEdgeOf(id),
              id,
              source: String(item.source ?? ""),
              target: String(item.target ?? ""),
              data,
            }
          : { node: businessNodeOf(id), id, data },
      );
      if (slotted != null) return slotted;
      if (typeof customContent === "function") return customContent(data, isEdge ? "edge" : "node");
      return isEdge ? defaultEdgeTooltip(data, item) : defaultNodeTooltip(data);
    },
  };
};

/** 当前实例是否仍存活（G6 destroy 后异步回调仍可能触发） */
let graphAlive = false;

/**
 * 首帧渲染是否已落地。
 *
 * <p>G6 的 {@code render()} 是异步的：在它 resolve 之前，元素还没 draw，
 * 此时调 {@code setElementState} 会抛 {@code Cannot read properties of undefined
 * (reading 'draw')}（实测）。父组件常在 {@code onMounted} 里就 {@code select()}
 * 一批元素，正好撞在这个窗口里 —— 所以未渲染完的状态写入先排队，
 * render 落地后统一补写。</p>
 */
let renderSettled = false;

/** 渲染完成前累积的状态写入（id → 状态数组，同 id 以后写的为准） */
let pendingStates: Record<string, string[]> | null = null;

/**
 * 写元素状态（统一入口）。
 *
 * <p>所有状态写入都必须走这里，不要直接调 {@code graph.setElementState}：
 * 渲染未完成时排队，避免「组件刚挂载就点选」打出的 G6 内部异常。</p>
 */
const setElementStates = (states: Record<string, string[]>, silence = false) => {
  if (!graph || !graphAlive) return;
  if (!renderSettled) {
    pendingStates = { ...(pendingStates ?? {}), ...states };
    return;
  }
  graph.setElementState(states, silence);
};

/** 把渲染完成前排队的状态一次性补写进去 */
const flushPendingStates = () => {
  if (!pendingStates || !graph || !graphAlive) return;
  const states = pendingStates;
  pendingStates = null;
  setElementStates(states);
};

/** 小地图插件（开关由 minimapState 控制） */
const buildMinimapPlugin = () =>
  minimapState.value
    ? {
        type: "minimap",
        key: "minimap",
        size: [180, 120],
        position: "right-bottom",
        padding: 8,
        // 小地图里不画轮廓与边标签，保持干净
        filter: (id: string, elementType: string) => elementType !== "edge",
      }
    : null;

/**
 * 交互行为（behavior）只保留「画布级」的三件：缩放、拖拽元素、拖拽画布平移。
 *
 * <p><b>悬停高亮 / 点选 / 框选一律不用 G6 的 behavior</b>，改成下面自研的实现。
 * 原因都是实测复现出来的 bug：</p>
 * <ul>
 *   <li>{@code hover-activate}：状态是增量叠加的，第一个悬停过的节点会一直留着
 *       active 光晕，之后再悬停别的节点就不响应了 —— 就是用户反馈的
 *       「第一个节点还是高亮，其它都不再生效，像蒙版没删掉」；</li>
 *   <li>{@code brush-select} / {@code click-select}：无修饰键的 {@code trigger: []}
 *       依赖内部的 Shortcut 按键记录，真实鼠标操作下时灵时不灵（框选框都出不来）。</li>
 * </ul>
 *
 * <p>自研实现每次都「整图重设一遍状态」，只碰悬停 / 选中两个维度，
 * 其它状态（最短路径的 highlight）原样保留。</p>
 */
const buildBehaviors = () => {
  const list: unknown[] = ["zoom-canvas", "drag-element"];
  // 框选模式下拖拽 = 框选，所以不挂 drag-canvas（滚轮缩放仍在）
  if (!brushSelectState.value) list.push("drag-canvas");
  return list;
};

/** 节点 / 边 / combo 的交互态样式（selected / active / inactive / highlight） */
const NODE_STATE_STYLES = {
  active: { lineWidth: 3, halo: true, haloLineWidth: 14, haloStrokeOpacity: 0.22 },
  inactive: { opacity: 0.14, labelOpacity: 0.14 },
  selected: {
    lineWidth: 3,
    stroke: "#1677ff",
    halo: true,
    haloStroke: "#1677ff",
    haloLineWidth: 18,
    haloStrokeOpacity: 0.35,
  },
  highlight: {
    lineWidth: 3,
    stroke: "#fa541c",
    halo: true,
    haloStroke: "#fa541c",
    haloLineWidth: 16,
    haloStrokeOpacity: 0.35,
  },
};
const EDGE_STATE_STYLES = {
  active: { stroke: "#1677ff", lineWidth: 2.5 },
  inactive: { opacity: 0.1 },
  selected: { stroke: "#1677ff", lineWidth: 3 },
  highlight: { stroke: "#fa541c", lineWidth: 3 },
};
const COMBO_STATE_STYLES = {
  selected: { lineWidth: 2.5, stroke: "#1677ff" },
  inactive: { opacity: 0.35 },
};

/** 选中集合（点选 / 框选 / 命令式都会写这里） */
const selectedNodes = ref<string[]>([]);
const selectedEdges = ref<string[]>([]);
const selectedCombos = ref<string[]>([]);

/** 最近一次最短路径计算的文字结果（工具栏面板里显示） */
const pathInfoState = ref("");

/**
 * 当前「路径模式」是否生效（算完路径、正在只看路径）。
 *
 * <p>路径模式下<b>只显示路径上的元素</b>：路径上的节点/边保留，
 * 其余节点/边、以及分组轮廓全部隐藏 —— 不是调透明度「淡化」，
 * 是真的从画面上拿掉，避免「淡化的那些还在抢注意力」。</p>
 */
const pathModeState = ref(false);
/**
 * 路径模式下的起终点。
 *
 * <p>面板里的两个下拉直接读写这两个值，所以「算路径」不需要用户先去图上点选，
 * 清除之后也保留着 —— 接着算下一条不用重新选。</p>
 */
const pathFromState = ref("");
const pathToState = ref("");
/**
 * 「最短路径模式」开关（工具栏按钮控制）。
 *
 * <p>开启后画布进入<b>独占路径选择</b>状态：左键点节点 = 依次指定起点 / 终点
 * （两个都点齐自动算），右键 = 取消当前模式。此时点选、框选、悬停高亮、
 * 右键菜单这些常规左 / 右键功能<b>全部让位</b>，避免两套手势互相打架。</p>
 */
const pathPickState = ref(false);

/**
 * 最短路径是否正在「占用」左键与右键。
 *
 * <p>拾取中（等端点）和已出结果（在看路径）都算 —— 这两种状态下常规的
 * 点选 / 框选 / 悬停高亮 / 右键菜单都要让位，否则两套手势会互相打架。</p>
 *
 * <p>用函数而不是 computed：它在事件回调里被调用，不需要响应式依赖追踪。</p>
 */
const pathBusy = (): boolean => pathPickState.value || pathModeState.value;

/**
 * 上一轮由 {@link paintPathPicks} 画过橙框的端点。
 *
 * <p>元素状态是「往 G6 里写」而不是「替换整张表」，所以每次重画都必须先把
 * 上一次画的那批 highlight 摘掉，否则端点会一轮一轮积累下来：
 * 换起点后旧起点还亮着，退出模式后也还亮着（用户看到的就是「橙框残留」）。</p>
 */
let paintedPathPicks: string[] = [];

/** 摘掉 {@link paintPathPicks} 画过的橙框（不动其它 highlight 来源） */
const clearPathPicks = () => {
  if (!graph || !graphAlive || !paintedPathPicks.length) {
    paintedPathPicks = [];
    return;
  }
  const states: Record<string, string[]> = {};
  for (const id of paintedPathPicks) {
    // 只去掉我们自己加的那个 highlight；业务方另外打的 highlight 保留
    states[id] = statesWithoutHover(id).filter((s) => s !== "highlight");
  }
  paintedPathPicks = [];
  setElementStates(states);
};

/** 路径选择模式下已点中的端点高亮（不改选中集合，只做视觉提示） */
const paintPathPicks = () => {
  if (!graph || !graphAlive) return;
  clearPathPicks();
  const ids = [pathFromState.value, pathToState.value].filter(Boolean);
  if (!ids.length) return;
  paintedPathPicks = ids.map(String);
  highlightElements(ids);
};

/**
 * 左键点节点 → 依次指定起点 / 终点；两端齐了立刻算路径并退出选择模式。
 *
 * <p>点第一个节点是起点，点第二个是终点。已算完一次后再点，从「重新指定起点」开始，
 * 这样连着看几条链路不用先去右键取消。</p>
 */
const pickPathEndpoint = (id: string) => {
  const key = String(id);
  if (!key) return;
  // 上一轮已经算完（路径模式生效）→ 这一下当作新的一轮起点
  if (pathModeState.value) {
    clearPath();
    // 上一轮的端点橙框要跟着一起清：新一轮的起点马上会重新画
    clearPathPicks();
  }
  if (!pathFromState.value || pathToState.value) {
    pathFromState.value = key;
    pathToState.value = "";
    pathInfoState.value = `起点：${key}，再点一个节点作为终点`;
    // 等终点期间仍算「拾取中」：右键取消、工具栏点亮都要靠这个状态
    pathPickState.value = true;
    emit("update:pathPick", true);
    paintPathPicks();
    return;
  }
  if (pathFromState.value === key) {
    pathInfoState.value = "起点和终点不能是同一个节点";
    return;
  }
  pathToState.value = key;
  const result = shortestPath(pathFromState.value, key);
  // 两端都点齐 → 自动出结果，选择模式收工（结果由路径模式负责展示）
  if (result.found) {
    // 端点橙框是「挑选过程中」的提示，出结果后要让位给路径本身，
    // 否则会和路径高亮叠在一起、退出模式后还挂在上面
    clearPathPicks();
    pathPickState.value = false;
    emit("update:pathPick", false);
  }
};

/**
 * 右键取消：退出「最短路径」状态。
 *
 * <p>选择中 → 清掉端点、退出选择模式；已在看结果 → 恢复全部元素。
 * 两种情况都吞掉浏览器右键菜单，避免顺手弹出系统菜单。</p>
 */
const cancelPathPick = (ev?: unknown) => {
  const native = (ev as { native?: MouseEvent; nativeEvent?: MouseEvent })?.native
    ?? (ev as { nativeEvent?: MouseEvent })?.nativeEvent
    ?? null;
  native?.preventDefault?.();
  const wasPicking = pathPickState.value;
  const wasPath = pathModeState.value;
  pathPickState.value = false;
  pathFromState.value = "";
  pathToState.value = "";
  pathInfoState.value = "";
  // 端点橙框先摘掉再清路径：clearPath 可能重建画布，重建后旧实例上的状态已经没了，
  // 但没重建的那条路上必须显式清，否则橙框会一直留在画面上
  clearPathPicks();
  if (wasPath) clearPath();
  else clearSelection();
  if (wasPicking) emit("update:pathPick", false);
  emit("path-change", { from: "", to: "", found: false, nodes: [], edges: [] });
};

/** 工具栏按钮：开 / 关「最短路径」选择模式 */
const togglePathPick = () => {
  // 连线与最短路径互斥：开这个先把拉线收掉
  if (connectFromState.value) cancelConnect();
  if (pathPickState.value || pathModeState.value) {
    cancelPathPick();
    return;
  }
  pathPickState.value = true;
  pathFromState.value = "";
  pathToState.value = "";
  pathInfoState.value = "最短路径：左键点两个节点（起点 → 终点），右键取消";
  // 开一轮新的：上一轮如果留了端点橙框，这里先摘干净
  clearPathPicks();
  clearSelection();
  emit("update:pathPick", true);
};

/* ---------------- 连线创建（右键「创建关系」→ 拖线到目标节点） ---------------- */

/**
 * 连线模式的起点节点 id（空串 = 未在连线）。
 *
 * <p>交互：右键节点选「创建关系」进入 —— 从该节点拉出一条跟随光标的虚线，
 * 左键点另一个节点即建立关系（并抛 {@code edge-created}），点空白 / 右键 / Esc 取消。
 * 这条线只画视觉，真正的数据写入走 {@link addEdges}，所以历史、增量渲染、
 * {@code edges-change} 都与命令式加边完全一致。</p>
 */
const connectFromState = ref("");
/** 是否正处在连线模式 */
const connecting = computed(() => Boolean(connectFromState.value));

/** 橡皮筋线（SVG overlay，pointer-events: none 不挡住画布事件） */
let rubberEl: SVGSVGElement | null = null;
let rubberLine: SVGLineElement | null = null;
/** 最近一次光标位置（**画布坐标系**，画线时再换算成容器坐标） */
let rubberPointer: [number, number] | null = null;

/** 建 / 取橡皮筋覆盖层 */
const ensureRubber = () => {
  const host = containerRef.value;
  if (!host) return;
  if (!rubberEl || rubberEl.parentElement !== host) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "rrg__rubber");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    const line = document.createElementNS(NS, "line");
    line.setAttribute("class", "rrg__rubber-line");
    svg.appendChild(line);
    host.appendChild(svg);
    rubberEl = svg;
    rubberLine = line;
  }
};

/** 按「起点节点中心 → 当前光标」重画橡皮筋 */
const drawRubber = () => {
  if (!rubberLine || !graph || !graphAlive) return;
  const from = connectFromState.value;
  if (!from) {
    rubberLine.setAttribute("visibility", "hidden");
    return;
  }
  if (!rubberPointer) {
    rubberLine.setAttribute("visibility", "hidden");
    return;
  }
  const [sx, sy] = pointOf(graph.getViewportByCanvas(graph.getElementPosition(from)));
  // 光标位置也是画布坐标，要跟起点走同一套换算，否则缩放后线头会偏
  const [ex, ey] = pointOf(graph.getViewportByCanvas(rubberPointer));
  rubberLine.setAttribute("x1", String(sx));
  rubberLine.setAttribute("y1", String(sy));
  rubberLine.setAttribute("x2", String(ex));
  rubberLine.setAttribute("y2", String(ey));
  rubberLine.setAttribute("visibility", "visible");
};

/** 移除橡皮筋覆盖层 */
const destroyRubber = () => {
  rubberEl?.remove();
  rubberEl = null;
  rubberLine = null;
  rubberPointer = null;
};

/**
 * 进入连线模式（右键菜单「创建关系」调它）。
 *
 * <p>进入后临时摘掉 {@code drag-element}：否则从起点节点上划过会把节点拖走，
 * 而不是拉线。退出时按 {@link buildBehaviors} 原样恢复。</p>
 */
const startConnect = (from: string) => {
  const id = String(from ?? "");
  if (!id || !graph || !graphAlive) return;
  if (!nodesState.value.some((n) => String(n.id) === id)) return;
  // 与最短路径互斥：两套独占手势不能同时开着
  if (pathBusy()) cancelPathPick();
  connectFromState.value = id;
  // 起点自身留一个选中的视觉锚点，其余选择清掉，避免「到底连的是谁」看不清
  selectedNodes.value = [id];
  selectedEdges.value = [];
  selectedCombos.value = [];
  const states: Record<string, string[]> = {};
  states[id] = [...statesWithoutHover(id).filter((s) => s !== "selected"), "selected"];
  setElementStates(states);
  emitSelection();
  if (graph) graph.setBehaviors(["zoom-canvas", "drag-canvas"]);
  ensureRubber();
  // 线头先压在起点上，等第一次 pointermove 再跟手（不然会先闪一条从 (0,0) 拉出来的线）
  rubberPointer = graph ? pointOf(graph.getElementPosition(id)) : null;
  drawRubber();
  emit("connect-change", { active: true, from: id });
};

/** 退出连线模式（点空白 / 右键 / Esc / 建成一条之后都走这里） */
const cancelConnect = () => {
  if (!connectFromState.value) return;
  connectFromState.value = "";
  destroyRubber();
  // 恢复节点可拖拽
  if (graph && graphAlive) graph.setBehaviors(buildBehaviors() as any[]);
  clearSelection();
  emit("connect-change", { active: false, from: "" });
};

/**
 * 连线落点：在目标节点上松手 / 点击 → 建一条边。
 *
 * <p>不去重、不写死 label：重复边由 {@link addEdges} 自己跳过，
 * 业务要带关系名就在 {@code edge-created} 里给（或先改数据再连）。</p>
 */
const finishConnect = (to: string) => {
  const from = connectFromState.value;
  const target = String(to ?? "");
  if (!from || !target) return;
  // 自己连自己没意义：留在连线模式，等用户点别的节点（或右键取消）
  if (from === target) return;
  addEdges({ source: from, target });
  cancelConnect();
};


/** 路径上的节点 / 边 id（路径模式下据此判定「谁留下」） */
const pathNodesState = ref<string[]>([]);
const pathEdgesState = ref<string[]>([]);
/**
 * 重建画布后是否要聚焦路径。
 *
 * <p>进入路径模式且当时挂着分组轮廓时只能整图重建（插件在 initGraph 挂载），
 * 旧实例马上被销毁，此刻调 focus 会打在废弃实例上，所以把意图记下来、
 * 等新实例 render 完成再执行。</p>
 */
let pendingPathFocus = false;

/** 当前折叠的分组名（工具栏面板显示 + 重建后恢复用） */
const collapsedGroupsState = ref<string[]>([...(props.collapsedGroups ?? [])]);

/** 全部分组名（工具栏「分组折叠」面板用） */
const groupNames = computed(() => membersByGroup().map(([group]) => group));
/** 全部节点 id（工具栏最短路径面板的两个下拉用） */
const pathNodeIds = computed(() => nodesState.value.map((n) => String(n.id)));
const emitSelection = () => {
  emit("selection-change", {
    nodes: [...selectedNodes.value],
    edges: [...selectedEdges.value],
    combos: [...selectedCombos.value],
  });
};

/* ================= 自研交互：悬停高亮 / 点选 / 框选 / 分组折叠 ================= */

/** 当前图上的所有元素 id（节点 + 边 + combo） */
const allElementIds = (): string[] => {
  const ids: string[] = [
    ...nodesState.value.map((n) => String(n.id)),
    ...edgesState.value.map((e) => edgeIdOf(e)),
  ];
  // 路径模式下 combo 容器没有建出来，别把不存在的 id 塞给 setElementState
  if (comboState.value && !pathModeState.value) {
    for (const [group] of membersByGroup()) ids.push(comboIdOf(group));
  }
  return ids;
};

/** 元素当前状态去掉「悬停维度」（active / inactive），selected / highlight 原样保留 */
const statesWithoutHover = (id: string): string[] => {
  try {
    return (graph?.getElementState(id) ?? []).filter((s) => s !== "active" && s !== "inactive");
  } catch {
    return [];
  }
};

/** 1 度邻居：节点集合 + 相连的边集合 */
const neighborsOf = (id: string) => {
  const nodes = new Set<string>([id]);
  const edges = new Set<string>();
  for (const e of edgesState.value) {
    const s = String(e.source);
    const t = String(e.target);
    if (s === id || t === id) {
      nodes.add(s);
      nodes.add(t);
      edges.add(edgeIdOf(e));
    }
  }
  return { nodes, edges };
};

/** 把「悬停高亮」整图重设一遍：hot 的高亮（active），其余淡化（inactive） */
const setHoverStates = (hotNodes: Set<string>, hotEdges: Set<string>) => {
  if (!graph || !graphAlive) return;
  const states: Record<string, string[]> = {};
  for (const nid of nodesState.value.map((n) => String(n.id))) {
    const rest = statesWithoutHover(nid);
    states[nid] = hotNodes.has(nid) ? [...rest, "active"] : [...rest, "inactive"];
  }
  for (const e of edgesState.value) {
    const eid = edgeIdOf(e);
    const rest = statesWithoutHover(eid);
    states[eid] = hotEdges.has(eid) ? [...rest, "active"] : [...rest, "inactive"];
  }
  if (comboState.value) {
    for (const [group] of membersByGroup()) {
      const cid = comboIdOf(group);
      const keep = statesWithoutHover(cid);
      if (!keep.includes("selected")) states[cid] = keep;
    }
  }
  setElementStates(states);
};

/** 当前悬停中的元素 id（节点或边）。用于挡掉「快速从 A 划到 B 时 A 的 pointerleave 迟到」 */
let hoverTarget = "";

/** 悬停节点：高亮它 + 1 度邻居 + 相连边 */
const hoverNode = (id: string) => {
  if (!highlightState.value) return;
  // 最短路径模式：悬停高亮让位给端点选择，避免「点一个节点满屏变色」
  if (pathPickState.value) return;
  hoverTarget = id;
  const { nodes, edges } = neighborsOf(id);
  setHoverStates(nodes, edges);
};

/** 悬停边：高亮边的两端 + 这条边 */
const hoverEdge = (id: string) => {
  if (!highlightState.value) return;
  if (pathPickState.value) return;
  hoverTarget = id;
  const { source, target } = edgeEndsOf(id);
  setHoverStates(new Set([source, target]), new Set([id]));
};

/**
 * 取消悬停：把 active / inactive 全摘掉（其它状态保留）。
 *
 * <p>{@code onlyIfCurrent}：G6 的元素事件在快速划动时顺序不保证 ——
 * 从 A 划到 B，{@code pointerleave(A)} 可能晚于 {@code pointerenter(B)} 到达，
 * 这时候如果无条件清一遍，就会把刚点亮的 B 整片抹掉（表现为「悬停没反应」）。
 * 所以离开时只在「离开的正是当前悬停对象」时才清。</p>
 */
const clearHoverHighlight = (onlyIfCurrent?: string) => {
  if (!graph || !graphAlive) return;
  if (onlyIfCurrent !== undefined) {
    // 迟到的事件：当前已经悬停到别的元素上了，忽略
    if (hoverTarget && hoverTarget !== onlyIfCurrent) return;
    if (hoverTarget === onlyIfCurrent) hoverTarget = "";
  } else {
    hoverTarget = "";
  }
  const states: Record<string, string[]> = {};
  for (const id of allElementIds()) states[id] = statesWithoutHover(id);
  setElementStates(states);
};

/** 清空选择（点空白处 / 命令式） */
const clearSelection = () => {
  if (!graph || !graphAlive) return;
  const states: Record<string, string[]> = {};
  for (const id of allElementIds()) {
    states[id] = statesWithoutHover(id).filter((s) => s !== "selected");
  }
  setElementStates(states);
  selectedNodes.value = [];
  selectedEdges.value = [];
  selectedCombos.value = [];
  emitSelection();
};

/** 点选：单击选中 / 再点取消；additive（按住 Shift）= 追加多选 */
const toggleSelect = (id: string, kind: "node" | "edge" | "combo", additive = false) => {
  if (!graph || !graphAlive) return;
  const wasSelected = statesWithoutHover(id).includes("selected");
  const states: Record<string, string[]> = {};

  if (!additive) {
    for (const other of [...selectedNodes.value, ...selectedEdges.value, ...selectedCombos.value]) {
      if (other === id) continue;
      states[other] = statesWithoutHover(other).filter((s) => s !== "selected");
    }
    selectedNodes.value = [];
    selectedEdges.value = [];
    selectedCombos.value = [];
  }

  const rest = statesWithoutHover(id).filter((s) => s !== "selected");
  states[id] = wasSelected ? rest : [...rest, "selected"];

  const flip = (list: string[]) =>
    wasSelected ? list.filter((x) => x !== id) : [...list.filter((x) => x !== id), id];
  if (kind === "edge") selectedEdges.value = flip(selectedEdges.value);
  else if (kind === "combo") selectedCombos.value = flip(selectedCombos.value);
  else selectedNodes.value = flip(selectedNodes.value);

  setElementStates(states);
  emitSelection();
};

/* ---------- 框选：覆盖层 div + 包含判定（不依赖 brush-select） ---------- */
let brushEl: HTMLDivElement | null = null;
let brushFrom: [number, number] | null = null;
let brushTo: [number, number] | null = null;
/**
 * 刚结束一次「真正的框选」，下一次 click 事件要吃掉。
 *
 * <p>G6 的 click 是在 pointerup 之后补发的，而且它的 targetType 取决于
 * <b>松开瞬间指针落在哪</b>：落在空白就是 {@code canvas:click}，
 * 落在节点上就是 {@code node:click}。两种情况都会把刚框中的结果冲掉
 * （canvas:click 直接 clearSelection；node:click 走 toggleSelect 把节点取消掉），
 * 表现为「框选时灵时不灵、有时框住了又没了」。</p>
 */
let brushClickGuard = false;

/** 消费一次框选后的「幽灵 click」；返回 true 表示这次 click 应当忽略 */
const consumeBrushClick = (): boolean => {
  if (!brushClickGuard) return false;
  brushClickGuard = false;
  return true;
};

/** G6 的点既可能是 [x, y] 也可能是 { x, y }，统一取值 */
const pointOf = (p: unknown): [number, number] => {
  if (Array.isArray(p)) return [Number(p[0]) || 0, Number(p[1]) || 0];
  const o = (p ?? {}) as { x?: number; y?: number };
  return [Number(o.x) || 0, Number(o.y) || 0];
};

/** 把画布坐标系里的框换算成容器内的 DOM 位置，画出蓝色选框 */
const drawBrush = () => {
  if (!brushEl || !brushFrom || !brushTo || !graph) return;
  const [ax, ay] = pointOf(graph.getViewportByCanvas(brushFrom));
  const [bx, by] = pointOf(graph.getViewportByCanvas(brushTo));
  brushEl.style.left = `${Math.min(ax, bx)}px`;
  brushEl.style.top = `${Math.min(ay, by)}px`;
  brushEl.style.width = `${Math.abs(bx - ax)}px`;
  brushEl.style.height = `${Math.abs(by - ay)}px`;
};

const onBrushDown = (ev: { targetType?: string; canvas?: unknown; button?: number }) => {
  if (!brushSelectState.value || !graph || !graphAlive) return;
  // 最短路径模式（拾取中或已出结果）期间左键只服务端点拾取，框选必须让位
  if (pathBusy()) return;
  // 连线模式期间左键只服务「落点」，框选同样让位
  if (connectFromState.value) return;
  if ((ev.targetType ?? "canvas") !== "canvas") return; // 从节点/边上按下不启动框选
  if (typeof ev.button === "number" && ev.button !== 0) return; // 右键 / 中键不拉框
  brushFrom = pointOf(ev.canvas);
  brushTo = brushFrom;
  if (!brushEl && containerRef.value) {
    brushEl = document.createElement("div");
    brushEl.className = "rrg__brush";
    containerRef.value.appendChild(brushEl);
  }
  if (brushEl) brushEl.style.display = "block";
  drawBrush();
};

const onBrushMove = (ev: { canvas?: unknown }) => {
  if (!brushFrom || !brushEl) return;
  brushTo = pointOf(ev.canvas);
  drawBrush();
};

const onBrushUp = () => {
  if (!brushFrom || !brushTo || !graph) return;
  const [x1, y1] = brushFrom;
  const [x2, y2] = brushTo;
  brushFrom = null;
  brushTo = null;
  if (brushEl) brushEl.style.display = "none";

  // 拖得太小当作点击，不动选择
  if (Math.abs(x2 - x1) < 6 && Math.abs(y2 - y1) < 6) return;

  // 真正的框选：挡住 G6 随后补发的那个 click（否则会把刚选中的结果冲掉）
  brushClickGuard = true;
  setTimeout(() => {
    brushClickGuard = false;
  }, 400);

  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const inside = (id: string) => {
    const [px, py] = pointOf(graph!.getElementPosition(id));
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  };

  const pickedNodes = nodesState.value.map((n) => String(n.id)).filter(inside);
  const pickedEdges = edgesState.value
    .filter((e) => pickedNodes.includes(String(e.source)) && pickedNodes.includes(String(e.target)))
    .map((e) => edgeIdOf(e));

  const states: Record<string, string[]> = {};
  for (const id of allElementIds()) states[id] = statesWithoutHover(id).filter((s) => s !== "selected");
  for (const id of [...pickedNodes, ...pickedEdges]) {
    states[id] = [...(states[id] ?? []).filter((s) => s !== "selected"), "selected"];
  }
  setElementStates(states);

  selectedNodes.value = pickedNodes;
  selectedEdges.value = pickedEdges;
  selectedCombos.value = [];
  emitSelection();
};

/* ---------- 右键菜单（contextmenu）---------- */

/** 右键浮层当前的回参（非空 = 浮层打开） */
const contextMenuState = ref<ContextMenuDetail | null>(null);
const contextMenuEl = ref<HTMLDivElement | null>(null);

/** 关闭右键浮层 */
const closeContextMenu = () => {
  if (!contextMenuState.value) return;
  contextMenuState.value = null;
  emit("context-menu-close");
};

/** 定位浮层：贴光标，靠近右/下边缘时向左/上翻，避免出框 */
const placeContextMenu = async () => {
  await nextTick();
  const root = rootRef.value;
  const box = contextMenuEl.value;
  const detail = contextMenuState.value;
  if (!root || !box || !detail) return;
  const rect = root.getBoundingClientRect();
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  let x = detail.client.x;
  let y = detail.client.y;
  if (x + w > rect.width - 4) x = Math.max(4, rect.width - w - 4);
  if (y + h > rect.height - 4) y = Math.max(4, rect.height - h - 4);
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
};

/** 点别处关浮层（capture 阶段，避免被画布自己的事件吞掉） */
const onDocPointerDown = (e: Event) => {
  if (!contextMenuState.value) return;
  const box = contextMenuEl.value;
  if (box && e.target instanceof Node && box.contains(e.target)) return;
  closeContextMenu();
};
const onDocKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") closeContextMenu();
};

/**
 * 右键统一入口：拼回参 →（可选）把命中元素补进选择 → emit → 有 `#context-menu` 插槽时开浮层。
 *
 * <p>画布内的浏览器原生右键菜单已在 {@code initGraph} 里拦掉（否则会盖在我们的浮层上），
 * 组件外的右键不受影响。</p>
 */
const handleContextMenu = (ev: unknown, targetType: ContextMenuDetail["targetType"]) => {
  if (!graph || !graphAlive) return;
  const e = ev as {
    target?: { id?: unknown };
    client?: unknown;
    canvas?: unknown;
    native?: MouseEvent;
    nativeEvent?: MouseEvent;
  };
  const native = e.native ?? e.nativeEvent ?? null;
  native?.preventDefault?.();

  const rawId = String(e.target?.id ?? "");
  const isCombo = targetType === "combo";
  const id = targetType === "canvas" ? "" : rawId;
  const group = isCombo ? rawId.replace(/^__group__/, "") : "";
  const edgeEnds = targetType === "edge" ? edgeEndsOf(id) : { source: "", target: "" };
  const edgeSource = edgeEnds.source;
  const edgeTarget = edgeEnds.target;

  // 右键元素默认把它补进选择 —— 用户右键时指的就是「这个」
  if (props.rightClickSelect && id) {
    const picked = [...selectedNodes.value, ...selectedEdges.value, ...selectedCombos.value];
    if (!picked.includes(id)) {
      toggleSelect(id, targetType === "edge" ? "edge" : isCombo ? "combo" : "node", true);
    }
  }

  const root = rootRef.value;
  const rect = root?.getBoundingClientRect();
  const fallback = pointOf(e.client);
  const page = {
    x: native?.clientX ?? fallback[0],
    y: native?.clientY ?? fallback[1],
  };
  const [canvasX, canvasY] = pointOf(e.canvas);

  const detail: ContextMenuDetail = {
    targetType,
    id,
    source: targetType === "edge" ? edgeSource : undefined,
    target: targetType === "edge" ? edgeTarget : undefined,
    group: isCombo ? group : undefined,
    data:
      targetType === "node"
        ? businessNodeOf(id)
        : targetType === "edge"
          ? businessEdgeOf(id)
          : isCombo
            ? { group }
            : undefined,
    selection: {
      nodes: [...selectedNodes.value],
      edges: [...selectedEdges.value],
      combos: [...selectedCombos.value],
    },
    client: { x: page.x - (rect?.left ?? 0), y: page.y - (rect?.top ?? 0) },
    page,
    canvas: { x: canvasX, y: canvasY },
    native,
  };

  emit("contextmenu", detail);
  if (slots["context-menu"]) {
    contextMenuState.value = detail;
    placeContextMenu().catch(() => {});
  }
};

/* ---------- 分组折叠（combo）---------- */

/** 某个分组当前是否折叠 */
const isGroupCollapsed = (group: string): boolean => {
  if (!graph || !graphAlive) return false;
  try {
    const data = graph.getElementData(comboIdOf(group)) as
      | { style?: { collapsed?: boolean } }
      | undefined;
    return Boolean(data?.style?.collapsed);
  } catch {
    return false;
  }
};

/** 折叠 / 展开指定分组（group = 业务分组名，如「蜀汉」） */
const setGroupCollapsed = async (group: string, collapsed: boolean) => {
  if (!graph || !graphAlive) return;
  if (collapsed === isGroupCollapsed(group)) {
    syncCollapsedState(group, collapsed);
    return;
  }
  try {
    if (collapsed) await graph.collapseElement(comboIdOf(group), false);
    else await graph.expandElement(comboIdOf(group), false);
    syncCollapsedState(group, collapsed);
    emit("combo-collapse-change", { group, collapsed });
  } catch {
    // 当前布局没有 combo（未开启分组折叠）时忽略
  }
};

/** 维护内部折叠清单（工具栏面板据此显示开关状态） */
const syncCollapsedState = (group: string, collapsed: boolean) => {
  const set = new Set(collapsedGroupsState.value);
  if (collapsed) set.add(group);
  else set.delete(group);
  collapsedGroupsState.value = [...set];
};

const collapseGroup = (group: string) => setGroupCollapsed(group, true);
const expandGroup = (group: string) => setGroupCollapsed(group, false);
const toggleGroupCollapsed = (group: string) => setGroupCollapsed(group, !isGroupCollapsed(group));

/** 当前被折叠的分组名列表 */
const getCollapsedGroups = (): string[] =>
  membersByGroup()
    .map(([group]) => group)
    .filter((group) => isGroupCollapsed(group));

/** 初始折叠：combo 建好后按 collapsedGroups 折叠一次（重建后也会恢复） */
const applyInitialCollapsed = async () => {
  if (!graph || !graphAlive || !comboState.value) return;
  for (const group of [...collapsedGroupsState.value]) await setGroupCollapsed(group, true);
};

/**
 * 当前是否因为「散布局 / 分组折叠模式 / groupAutoHide」而不画轮廓。
 *
 * <p>工具栏据此在分组面板里给一句说明，免得用户以为轮廓功能坏了。</p>
 */
const contoursAutoHidden = computed(
  () =>
    groupVisibleState.value &&
    groupTypeState.value !== "none" &&
    (comboState.value ||
      (Boolean(props.groupAutoHide) && !isGroupLayout(resolveLayout().type))),
);

/**
 * 强制重算所有分组轮廓路径。
 *
 * <p>hull / bubble-sets 只在 {@code AFTER_RENDER} 时按当时的节点坐标算一次路径，
 * 渲染之后节点还会被动画型布局搬走（force / d3-force / fruchterman …），
 * 轮廓就停在初始位置上 —— 视觉上表现为「轮廓跟节点错位」「几组轮廓堆在一起」。
 * 布局结束（{@code afterlayout}）时调一次插件的 {@code updateMember}，
 * 让它按新坐标重画。</p>
 */
const refreshContours = () => {
  if (!graph || !graphAlive) return;
  if (groupTypeState.value === "none" || !groupVisibleState.value) return;
  if (contoursAutoHidden.value) return;
  const prefix = groupTypeState.value === "hull" ? "hull-" : "bubble-";
  for (let index = 0; index < membersByGroup().length; index++) {
    try {
      const plugin = graph.getPluginInstance(`${prefix}${index}`) as {
        getMember?: () => string[];
        updateMember?: (members: string[]) => void;
      } | null;
      const members = plugin?.getMember?.();
      if (members?.length) plugin?.updateMember?.(members);
    } catch {
      // 插件没挂上（分组关闭 / 重建中间态）时忽略
    }
  }
};

/** 拦掉容器内的原生右键菜单（右键功能由 {@link handleContextMenu} 接管） */
const preventNativeContextMenu = (e: Event) => e.preventDefault();

/**
 * 按容器实测尺寸校正画布。
 *
 * <p>G6 在 {@code new Graph()} 时按当时容器大小建画布：页面入场动画、标签页（KeepAlive）
 * 从隐藏切到可见、侧栏折叠等场景下，容器在那一刻可能还很窄，画布就停在旧尺寸，
 * 内容被 fitView 缩进左上角的一小块里。这里把画布拉回容器大小并重新适配视口。</p>
 *
 * <p>尺寸一致时直接返回，不会打断用户当前的缩放 / 平移。</p>
 */
const syncCanvasToContainer = () => {
  if (!graph || !graphAlive || !containerRef.value) return;
  const el = containerRef.value;
  const width = el.clientWidth;
  const height = el.clientHeight;
  if (!width || !height) return;
  const canvasEl = el.querySelector("canvas") as HTMLCanvasElement | null;
  if (
    canvasEl &&
    Math.abs(canvasEl.clientWidth - width) <= 2 &&
    Math.abs(canvasEl.clientHeight - height) <= 2
  ) {
    return;
  }
  try {
    graph.resize(width, height);
    graph.fitView();
  } catch {
    /* 画布已销毁（快速切换路由 / 组件卸载），忽略即可 */
  }
};

/** 跟随容器尺寸变化（窗口缩放、侧栏折叠、标签页显隐） */
let canvasResizeObserver: ResizeObserver | null = null;

const initGraph = () => {
  if (!containerRef.value || graph) return;
  // 画布内的浏览器原生右键菜单会盖在我们的浮层上，先拦掉（组件外部右键不受影响）
  containerRef.value.addEventListener("contextmenu", preventNativeContextMenu);
  graph = new Graph({
    container: containerRef.value,
    data: toG6Data(),
    behaviors: buildBehaviors() as any[],
    node: {
      palette: { field: "cluster" },
      // G6 5.1.1 的坑：状态样式是「合并叠加」的，摘掉状态时并不会把上一次
      // 状态写进去的属性回滚 —— 它只是不再参与合并，元素身上那份旧值还在。
      // inactive 的 opacity: 0.14 一旦写进去就永久留着，于是「悬停过一次的
      // 节点移开后永远是灰的」（实测：state 已清空，opacity 仍是 0.14）。
      // 解法：把 normal 值写进默认样式，让它每次合并都参与，从而能盖掉残留值。
      // 用回调按节点自己的数据取值，业务给节点写了 opacity 也不会被这里抹平。
      // 只放状态里用到的键，别碰 size / fill（会盖掉节点自己的数据样式）。
      style: {
        opacity: function (this: unknown, d: { style?: Record<string, unknown> }) {
          return (d?.style?.opacity as number) ?? 1;
        },
        labelOpacity: function (this: unknown, d: { style?: Record<string, unknown> }) {
          return (d?.style?.labelOpacity as number) ?? 1;
        },
      } as any,
      // 交互态样式：悬停高亮 / 点选 / 框选 / 最短路径共用这套
      state: NODE_STATE_STYLES as any,
    },
    edge: {
      // 同上：EDGE_STATE_STYLES.inactive 会写 opacity，这里给个可复位的基线
      style: {
        opacity: function (this: unknown, d: { style?: Record<string, unknown> }) {
          return (d?.style?.opacity as number) ?? 1;
        },
      } as any,
      state: EDGE_STATE_STYLES as any,
    },
    combo: {
      type: "rect",
      style: {
        radius: 12,
        padding: 18,
        lineWidth: 1.5,
        fillOpacity: 0.5,
        // 同上：COMBO_STATE_STYLES.inactive 会写 opacity，这里给个可复位的基线
        opacity: 1,
        collapsedMarker: true,
        collapsedMarkerType: "child-count",
        labelFontSize: 12,
        labelFontWeight: "bold",
        labelPlacement: "top",
      },
      state: COMBO_STATE_STYLES as any,
    },
    // 分组布局返回 undefined：G6 不跑布局，直接使用数据里的 style.x / style.y
    layout: buildLayout() as any,
    plugins: [
      ...buildGroupPlugins(),
      buildTooltipPlugin(),
      buildMinimapPlugin(),
    ].filter(Boolean) as any[],
    // "view" = 缩放到完整可见（"center" 只居中不缩放，内容大会超出视口）
    autoFit: "view",
    // 视口留白：气泡上方的分组标签不会被画布边缘裁掉
    padding: 28,
  });
  graphAlive = true;
  renderSettled = false;
  pendingStates = null;
  bindEvents(graph, () => graphAlive);
  graph.render().then(() => {
    if (!graphAlive) return;
    renderSettled = true;
    flushPendingStates();
    // html 节点的 DOM 宿主在首次渲染后才存在，插槽内容此刻才能挂上去
    attachSlots();
    // combo 建好之后按 collapsedGroups 折叠初始分组（默认不折叠）
    applyInitialCollapsed().catch(() => {});
    // 路径模式重建（进入 / 退出时摘挂轮廓）后，可见性要按当前模式补一次
    if (pathModeState.value) {
      applyPathVisibilityNow();
      if (pendingPathFocus) {
        pendingPathFocus = false;
        focusElements(pathNodesState.value);
      }
    }
    // 连线模式重建后：橡皮筋覆盖层跟着新容器重挂，起点选中态补回
    if (connectFromState.value) {
      ensureRubber();
      drawRubber();
      setElementStates({ [connectFromState.value]: ["selected"] });
    }
    // 画布尺寸兜底：G6 在 `new Graph()` 时用 rAF 时刻的容器尺寸建画布，
    // 若那一刻容器还没铺开（路由入场 / 标签页切换 / 折叠面板），画布会停在旧尺寸且不再变大。
    // 渲染落定后按容器实测尺寸校正一次，之后交给 ResizeObserver 跟随。
    syncCanvasToContainer();
    if (graph) emit("ready", graph);
  });
};

/** 重建画布：布局切换时必须整图重建，否则 G6 会沿用上一次布局的算法状态 */
const recreateGraph = () => {
  graphAlive = false;
  graph?.destroy();
  graph = null;
  // 画布重建后橡皮筋要按新实例重挂（否则它还挂在被清空的旧容器里）
  destroyRubber();
  initGraph();
};

/**
 * 合并同一帧内的多次重建请求（拖参数滑块会每帧发一次改动）：
 * 逐次销毁重建既浪费，又容易让上一实例的异步回调落在已销毁的画布上。
 */
let recreateScheduled = false;
const scheduleRecreate = () => {
  if (recreateScheduled) return;
  recreateScheduled = true;
  requestAnimationFrame(() => {
    recreateScheduled = false;
    if (!graph) return;
    recreateGraph();
  });
};

/** 切换布局（等价于改 layout prop；供业务/工具栏命令式调用） */
const setLayout = (type: string, options?: Record<string, unknown>) => {
  layoutState.value = options ? { type, ...options } : (type as LayoutType);
  emit("update:layout", type);
};

/** 切换分组轮廓类型（等价于改 groupType prop） */
const setGroupType = (type: GroupType) => {
  groupTypeState.value = type;
  emit("update:groupType", type);
};

/** 显示 / 隐藏分组轮廓 */
const setGroupVisible = (visible: boolean) => {
  groupVisibleState.value = visible;
  emit("update:groupVisible", visible);
};

/* ---------- 交互开关（点选 / 框选 / 高亮 / 小地图 / tooltip / 分组折叠） ---------- */

/** 通用开关构造：改状态 + 回传父组件（重建由监听统一处理） */
const toggleOf = <K extends string>(
  state: { value: boolean },
  key: K,
) => {
  return (value: boolean) => {
    state.value = value;
    emit(`update:${key}` as never, value as never);
  };
};

const setClickSelect = toggleOf(clickSelectState, "clickSelect");
const setBrushSelect = toggleOf(brushSelectState, "brushSelect");
const setHighlight = toggleOf(highlightState, "highlight");
const setMinimap = toggleOf(minimapState, "minimap");
const setCombo = toggleOf(comboState, "combo");
const setTooltip = toggleOf(tooltipState, "tooltip");

/**
 * 节点 / 边提示开关：单独关一边不影响另一边。
 * 总开关「tooltip」是关闭态时，打开任意一边会自动把总开关也打开（否则开关像是失灵）。
 */
const setNodeTooltip = (value: boolean) => {
  nodeTooltipState.value = value;
  emit("update:nodeTooltip", value);
  if (value && !tooltipState.value) setTooltip(true);
};
const setEdgeTooltip = (value: boolean) => {
  edgeTooltipState.value = value;
  emit("update:edgeTooltip", value);
  if (value && !tooltipState.value) setTooltip(true);
};

/**
 * 最短路径（BFS，按边数最少）。
 *
 * <p>参考 G6 {@code examples/algorithm/case/shortest-path}：图上算出一条路径，
 * 然后把「不在路径上」的元素<b>隐藏掉</b>，只留这条链路 —— 不是调透明度淡化，
 * 是真的从画面拿掉，路径之外的东西不再抢注意力。</p>
 *
 * <p>起终点由调用方直接给（工具栏面板里两个下拉 / 右键菜单「以它为起点」），
 * 不依赖「先点选两个节点」—— 点选是交互，路径是独立功能，两者不该耦合。</p>
 *
 * @param source 起点 id
 * @param target 终点 id
 * @param options.highlight 是否进入路径模式（默认 true）
 * @param options.directed 是否只沿边方向走（默认无向）
 * @param options.focus 是否自动缩放到路径（默认 true）
 * @returns 路径上的节点 id（按顺序）与边 id（"source-target"）；找不到返回空
 */
const shortestPath = (
  source: string,
  target: string,
  options?: { highlight?: boolean; directed?: boolean; focus?: boolean },
) => {
  const from = String(source);
  const to = String(target);
  const result = { nodes: [] as string[], edges: [] as string[], found: false };

  if (!graph || !graphAlive || !from || !to) return result;

  // 邻接表（默认无向，directed=true 时只走 source → target）
  const adj = new Map<string, Array<{ id: string; next: string }>>();
  for (const e of edgesState.value) {
    const s = String(e.source);
    const t = String(e.target);
    const edgeId = edgeIdOf(e);
    if (!adj.has(s)) adj.set(s, []);
    adj.get(s)!.push({ id: edgeId, next: t });
    if (!options?.directed) {
      if (!adj.has(t)) adj.set(t, []);
      adj.get(t)!.push({ id: edgeId, next: s });
    }
  }

  // BFS：parents 记录 (上一跳节点, 边 id)
  const parents = new Map<string, { prev: string; edge: string }>();
  const seen = new Set<string>([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const { id, next } of adj.get(cur) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      parents.set(next, { prev: cur, edge: id });
      queue.push(next);
    }
  }
  if (!seen.has(to)) {
    pathInfoState.value = `没有找到 ${from} → ${to} 的路径`;
    emit("path-change", { from, to, found: false, nodes: [], edges: [] });
    return result;
  }

  // 回溯路径
  const nodes: string[] = [to];
  const edges: string[] = [];
  let cursor = to;
  while (cursor !== from) {
    const step = parents.get(cursor);
    if (!step) break;
    edges.unshift(step.edge);
    nodes.unshift(step.prev);
    cursor = step.prev;
  }

  result.nodes = nodes;
  result.edges = edges;
  result.found = true;

  if (options?.highlight !== false) {
    pathFromState.value = from;
    pathToState.value = to;
    pathNodesState.value = [...nodes];
    pathEdgesState.value = [...edges];
    pathModeState.value = true;
    // 轮廓插件与 combo 容器都是「按全体成员算包围盒」的，路径模式下成员被隐藏后
    // 会留下空壳；两者都只能在 initGraph 时决定，所以要重建画布
    const contourOn =
      groupTypeState.value !== "none" &&
      groupVisibleState.value &&
      !contoursAutoHidden.value &&
      !comboState.value;
    if (contourOn || comboState.value) {
      pendingPathFocus = options?.focus !== false;
      recreateGraph();
    } else {
      applyPathVisibilityNow();
      if (options?.focus !== false) focusElements(nodes);
    }
  }

  pathInfoState.value = `${from} → ${to}：${result.nodes.length} 节点 / ${result.edges.length} 边（${result.nodes.join(" → ")}）`;
  emit("path-change", {
    from,
    to,
    found: result.found,
    nodes: result.nodes,
    edges: result.edges,
  });

  return result;
};

/**
 * 设置最短路径的起点 / 终点（右键菜单「以它为起点 / 终点」用）。
 *
 * <p>两端都齐了就直接算一次 —— 用户右键设完两个端点，期望是路径自己出来，
 * 不该再让他去工具栏点「计算」。只设了一端就静默等着，不算失败。</p>
 *
 * @param id 节点 id
 * @param end 设为哪一端
 * @returns 两端齐全时返回路径结果，否则 null
 */
const setPathEndpoint = (id: string, end: "from" | "to") => {
  const key = String(id);
  if (end === "from") pathFromState.value = key;
  else pathToState.value = key;
  const from = pathFromState.value;
  const to = pathToState.value;
  if (!from || !to || from === to) return null;
  return shortestPath(from, to);
};

/**
 * 按「路径模式」重设可见性（不重建画布，供重建后的回调与无轮廓场景复用）。
 *
 * <p>用 {@code setElementVisibility} 而不是改 opacity：淡化的元素仍然占着画布、
 * 仍然能被鼠标命中，视觉上也还是一片东西；用户要的是「只看到路径」。</p>
 */
const applyPathVisibilityNow = () => {
  if (!graph || !graphAlive) return;
  const keepNodes = new Set(pathNodesState.value);
  const keepEdges = new Set(pathEdgesState.value);
  const vis: Record<string, "visible" | "hidden"> = {};
  for (const n of nodesState.value) {
    const id = String(n.id);
    vis[id] = keepNodes.has(id) ? "visible" : "hidden";
  }
  for (const e of edgesState.value) {
    const id = edgeIdOf(e);
    vis[id] = keepEdges.has(id) ? "visible" : "hidden";
  }
  graph.setElementVisibility(vis, false).catch(() => {});
};

/** 恢复所有元素的可见性（退出路径模式时调用） */
const restoreAllVisibility = () => {
  if (!graph || !graphAlive) return;
  const vis: Record<string, "visible"> = {};
  for (const n of nodesState.value) vis[String(n.id)] = "visible";
  for (const e of edgesState.value) vis[edgeIdOf(e)] = "visible";
  graph.setElementVisibility(vis, false).catch(() => {});
};

/**
 * 清除路径模式：恢复全部元素、重新挂回轮廓 / combo、适配视口。
 *
 * <p>如果进入路径模式时因为摘轮廓或摘 combo 重建过画布，退出时也要重建一次挂回去。</p>
 *
 * <p>面板里选好的起点 / 终点保留 —— 用户多半还要再算另一条，
 * 每次都清空等于强迫他重新点两遍下拉。</p>
 *
 * @returns 是否重建了画布（重建后新元素尚未 draw 完，调用方不能再 setElementState）
 */
const clearPath = () => {
  if (!pathModeState.value) {
    pathInfoState.value = "";
    return false;
  }
  pathModeState.value = false;
  pathNodesState.value = [];
  pathEdgesState.value = [];
  pathInfoState.value = "";
  const contourShouldBeOn =
    groupTypeState.value !== "none" &&
    groupVisibleState.value &&
    !contoursAutoHidden.value &&
    !comboState.value;
  // 进入时摘了什么，退出就补回来
  if (contourShouldBeOn || comboState.value) {
    recreateGraph();
    emit("path-change", { from: "", to: "", found: false, nodes: [], edges: [] });
    return true;
  }
  restoreAllVisibility();
  fitView();
  emit("path-change", { from: "", to: "", found: false, nodes: [], edges: [] });
  return false;
};

/**
 * 用当前选中的两个节点算最短路径（保留给右键菜单 / 业务调用）。
 *
 * <p>工具栏面板已改成自己选起终点，这里只是便捷入口，不再是唯一路径。</p>
 */
const shortestPathFromSelection = () => {
  const picks = selectedNodes.value;
  if (picks.length < 2) {
    pathInfoState.value = "先在图上点选两个节点（开启「点选」后单击即可），或用工具栏面板自己选起终点";
    return { nodes: [] as string[], edges: [] as string[], found: false };
  }
  return shortestPath(picks[0], picks[1]);
};

/** 清掉所有元素状态（高亮 / 选中 / 淡化），并退出路径模式 */
const clearStates = () => {
  if (!graph || !graphAlive) return;
  // 路径模式下元素是「隐藏」而非「淡化」，只清状态恢复不出来；且 clearPath 可能重建画布，
  // 重建后新元素还没 draw 完，此刻 setElementState 会抛 "reading 'draw'"，
  // 所以先退出路径模式，重建过就直接收尾（新画布本来就没有状态）
  if (pathModeState.value && clearPath()) {
    selectedNodes.value = [];
    selectedEdges.value = [];
    selectedCombos.value = [];
    pathInfoState.value = "";
    emitSelection();
    return;
  }
  const states: Record<string, string[]> = {};
  for (const id of allElementIds()) states[id] = [];
  setElementStates(states);
  selectedNodes.value = [];
  selectedEdges.value = [];
  selectedCombos.value = [];
  pathInfoState.value = "";
  emitSelection();
};

/**
 * 统计当前布局下「边与边交叉」的数量。
 *
 * <p>「能不能做到边完全不交叉」—— 只有当图是<b>平面图</b>时才可能；
 * 三国这种含大量跨势力枢纽的图是非平面的，几何上不可能零交叉。
 * 能做的就是「尽量少」：分层布局（dagre / antv-dagre）按层做交叉最小化，
 * 树类布局只有树边，交叉自然少。这个计数用来横向比较各布局。</p>
 */
const countEdgeCrossings = () => {
  if (!graph || !graphAlive) return 0;
  const segments = edgesState.value
    .map((e) => {
      const [x1, y1] = pointOf(graph!.getElementPosition(String(e.source)));
      const [x2, y2] = pointOf(graph!.getElementPosition(String(e.target)));
      return {
        id: edgeIdOf(e),
        ends: [String(e.source), String(e.target)] as const,
        a: [x1, y1] as const,
        b: [x2, y2] as const,
      };
    })
    .filter((s) => Number.isFinite(s.a[0]) && Number.isFinite(s.b[0]));

  const cross = (
    p1: readonly [number, number],
    p2: readonly [number, number],
    p3: readonly [number, number],
    p4: readonly [number, number],
  ) => {
    const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
    if (Math.abs(d) < 1e-9) return false;
    const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
    const u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
    return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98;
  };

  let total = 0;
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const s1 = segments[i];
      const s2 = segments[j];
      // 共用端点的两条边不算交叉（按两端节点 id 判定，边 id 里可能自带连字符）
      if (s1.ends.some((id) => s2.ends.includes(id))) continue;
      if (cross(s1.a, s1.b, s2.a, s2.b)) total += 1;
    }
  }
  return total;
};

/** 命令式选中一批元素（配合点选 / 框选的高亮态） */
const select = (ids: string[], state: "selected" | "highlight" | "inactive" = "selected") => {
  if (!graph || !graphAlive) return;
  const states: Record<string, string[]> = {};
  for (const id of ids.map(String)) {
    states[id] = [...statesWithoutHover(id).filter((s) => s !== state), state];
  }
  setElementStates(states);
  selectedNodes.value = [...ids];
  emitSelection();
};

/** 当前选中集合 */
const getSelection = () => ({
  nodes: [...selectedNodes.value],
  edges: [...selectedEdges.value],
  combos: [...selectedCombos.value],
});

/**
 * 只给这批元素上 {@code active} 态（不动选择集合）。
 *
 * <p>和 {@link select} 的区别：{@code select} 是「选中」，会改 selection-change 回参；
 * 这里只做视觉强调（业务侧点清单某一行 → 图上那一块亮一下），
 * 用户的选中集合不该被这种「看一眼」的动作改写。</p>
 */
const highlightElements = (ids: string[]) => {
  if (!graph || !graphAlive) return;
  const states: Record<string, string[]> = {};
  for (const id of ids.map(String)) {
    states[id] = [...statesWithoutHover(id).filter((s) => s !== "highlight"), "highlight"];
  }
  setElementStates(states);
};

/**
 * 平移到某个元素（不缩放）。
 *
 * <p>要连缩放一起做用 {@link focusElements}；这里只挪视口 ——
 * 「点侧栏清单，图上跟着走」这种场景不该突然放大。</p>
 */
const centerOn = async (id: string) => {
  if (!graph || !graphAlive) return;
  const key = String(id);
  if (!key) return;
  await graph.focusElement([key], false).catch(() => {});
};

/** 适应画布 */
const fitView = () => {
  if (!graph || !graphAlive) return;
  graph.fitView({ when: "always" }).catch(() => {});
};

/**
 * 聚焦一组节点：先按子集包围盒定缩放，再平移到视口中心。
 *
 * <p>G6 的 {@code focusElement} 只做平移（{@code viewport.focus} 内部只有
 * translate，不改 zoom），所以这里先 {@code zoomTo} 再 {@code focusElement}，
 * 否则「聚焦某势力」只会把视口挪过去、节点依旧很小。</p>
 */
const focusElements = async (id: string | string[]) => {
  if (!graph || !graphAlive) return;
  const ids = Array.isArray(id) ? id : [id];
  const boxes = ids
    .map((el) => graph?.getElementRenderBounds(el))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  if (!boxes.length) return;
  const minX = Math.min(...boxes.map((b) => b.min[0]));
  const minY = Math.min(...boxes.map((b) => b.min[1]));
  const maxX = Math.max(...boxes.map((b) => b.max[0]));
  const maxY = Math.max(...boxes.map((b) => b.max[1]));
  const [cw, ch] = graph.getSize();
  const pad = 70;
  const zoom = Math.min(
    2,
    Math.max(0.05, Math.min((cw - pad * 2) / Math.max(maxX - minX, 1), (ch - pad * 2) / Math.max(maxY - minY, 1))),
  );
  await graph.zoomTo(zoom, false).catch(() => {});
  await graph.focusElement(ids, false).catch(() => {});
};

/* ============================ 编辑历史（撤销 / 重做）与键盘快捷键 ============================ */

/**
 * 一条历史快照。
 *
 * <p>只存节点 + 边，不存选中态和视口：撤销一次「删节点」不该把用户的缩放、平移、
 * 选中一起回退（那个体验非常糟）。所以历史 = 纯数据历史。</p>
 */
export interface HistoryEntry {
  nodes: RelationNode[];
  edges: RelationEdge[];
  /** 这条快照对应的动作（`add-node` / `remove-nodes` …，撤销时回显用） */
  action: string;
}

const undoStack = ref<HistoryEntry[]>([]);
const redoStack = ref<HistoryEntry[]>([]);
/** 撤销 / 重做过程中不再记新历史（否则「撤销」这个动作自己又变成一条新历史，栈会爆） */
let historyLock = false;

const snapshotOf = (action: string): HistoryEntry => ({
  nodes: nodesState.value.map((n) => ({ ...n })),
  edges: edgesState.value.map((e) => ({ ...e })),
  action,
});

const historyState = (): HistoryState => ({
  canUndo: undoStack.value.length > 0,
  canRedo: redoStack.value.length > 0,
  undoCount: undoStack.value.length,
  redoCount: redoStack.value.length,
  lastAction: undoStack.value[undoStack.value.length - 1]?.action ?? "",
});

const emitHistory = () => emit("history-change", historyState());

/**
 * 改动前压栈。必须**在状态被改之前**调用（存的是改动前的样子）。
 *
 * <p>关掉 {@code history} 或正在撤销 / 重做时什么都不做，所以同一个 API 既能被业务
 * 命令式调用、也能被快捷键调用，不用到处判断「这次要不要记」。</p>
 */
const recordHistory = (action: string) => {
  if (!props.history || historyLock) return;
  const limit = Math.max(1, props.historyLimit);
  undoStack.value = [...undoStack.value, snapshotOf(action)].slice(-limit);
  // 产生新分支：重做栈作废（标准编辑器语义）
  redoStack.value = [];
  emitHistory();
};

/**
 * 只清选择记账，不碰画布。
 *
 * <p>撤销 / 删除选中时数据已经换成新的一份，而画布还是旧的 —— 这时候如果走
 * {@code clearSelection()} 去 {@code setElementState}，G6 会因为「新 id 在旧模型里
 * 不存在」抛 {@code Unknown element type}。所以这里先只改记账，等数据推完再让
 * 画布自然重建。</p>
 */
const resetSelectionState = () => {
  selectedNodes.value = [];
  selectedEdges.value = [];
  selectedCombos.value = [];
  emitSelection();
};

/** 把快照灌回内部状态并整体重绘（撤销 / 重做共用一条路径） */
const applyHistoryEntry = (entry: HistoryEntry) => {
  nodesState.value = entry.nodes.map((n) => ({ ...n }));
  edgesState.value = entry.edges.map((e) => ({ ...e }));
  // 快照里可能没有刚才选中的元素了，先把选择记账清掉避免悬空 id
  resetSelectionState();
  pushFullData();
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 撤销一步；返回是否真的撤销了（快捷键据此决定要不要 preventDefault） */
const undo = (): boolean => {
  if (!props.history || !undoStack.value.length) return false;
  const stack = [...undoStack.value];
  const entry = stack.pop()!;
  historyLock = true;
  redoStack.value = [...redoStack.value, snapshotOf(entry.action)];
  undoStack.value = stack;
  applyHistoryEntry(entry);
  historyLock = false;
  emitHistory();
  return true;
};

/** 重做一步 */
const redo = (): boolean => {
  if (!props.history || !redoStack.value.length) return false;
  const stack = [...redoStack.value];
  const entry = stack.pop()!;
  historyLock = true;
  undoStack.value = [...undoStack.value, snapshotOf(entry.action)];
  redoStack.value = stack;
  applyHistoryEntry(entry);
  historyLock = false;
  emitHistory();
  return true;
};

/** 清空历史（父组件整体换数据后建议调一次，避免撤销跳回上一份数据） */
const clearHistory = () => {
  undoStack.value = [];
  redoStack.value = [];
  emitHistory();
};

/** 工具栏 / 模板用：历史总开关与两端可用性 */
const historyEnabled = computed(() => props.history);
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

/** 点组件任意位置就把焦点收到容器上 —— 快捷键需要一个接收者 */
const focusRoot = () => {
  const el = rootRef.value;
  if (!el || document.activeElement === el) return;
  el.focus({ preventScroll: true });
};

/** 删除当前选中元素（节点连带其边），一条历史记录搞定 */
const deleteSelection = (): boolean => {
  const nodeIds = new Set(selectedNodes.value.map(String));
  const edgeKeys = new Set(selectedEdges.value.map(String));
  if (!nodeIds.size && !edgeKeys.size) return false;
  recordHistory("delete-selection");
  // 先记下要删的对象，删完才能把完整数据抛给业务回调
  const removedNodes = nodesState.value.filter((n) => nodeIds.has(String(n.id)));
  const removedEdges = edgesState.value.filter(
    (e) =>
      nodeIds.has(String(e.source)) || nodeIds.has(String(e.target)) || edgeKeys.has(edgeIdOf(e)),
  );
  if (nodeIds.size) {
    nodesState.value = nodesState.value.filter((n) => !nodeIds.has(String(n.id)));
    edgesState.value = edgesState.value.filter(
      (e) => !nodeIds.has(String(e.source)) && !nodeIds.has(String(e.target)),
    );
  }
  if (edgeKeys.size) {
    edgesState.value = edgesState.value.filter((e) => !edgeKeys.has(edgeIdOf(e)));
  }
  // 同上：数据已经变了，画布还没推，别再拿新 id 去 setElementState
  resetSelectionState();
  pushFullData();
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
  for (const e of removedEdges) emit("edge-deleted", { id: edgeIdOf(e), edge: { ...e } });
  for (const n of removedNodes) emit("node-deleted", { id: String(n.id), node: { ...n } });
  return true;
};

/** 全选（节点 + 边） */
const selectAll = (): boolean => {
  if (!graph || !graphAlive) return false;
  const nodeIds = nodesState.value.map((n) => String(n.id));
  const edgeIds = edgesState.value.map((e) => edgeIdOf(e));
  const states: Record<string, string[]> = {};
  for (const id of [...nodeIds, ...edgeIds]) states[id] = ["selected"];
  setElementStates(states);
  selectedNodes.value = nodeIds;
  selectedEdges.value = edgeIds;
  emitSelection();
  return true;
};

/**
 * 内置快捷键（业务可用 {@code shortcuts} 覆盖任意一条，或设 false 关掉）。
 *
 * <p>`mod` = Ctrl（Windows/Linux）或 ⌘（macOS），其它写法：`ctrl` / `meta` / `shift` / `alt`。</p>
 */
const DEFAULT_SHORTCUTS: Record<string, string | false> = {
  undo: "mod+z",
  redo: "mod+shift+z",
  "redo-alt": "mod+y",
  "select-all": "mod+a",
  delete: "delete",
  "clear-selection": "esc",
};

/** 这些键名有多个物理键写法，统一成一组别名比对 */
const KEY_ALIASES: Record<string, string[]> = {
  delete: ["delete", "backspace"],
  del: ["delete", "backspace"],
  esc: ["escape"],
  escape: ["escape"],
  enter: ["enter"],
  space: [" ", "spacebar"],
  up: ["arrowup"],
  down: ["arrowdown"],
  left: ["arrowleft"],
  right: ["arrowright"],
};

/** 判断一次 keydown 是否命中某个组合键写法（如 `mod+shift+z`） */
const matchShortcut = (e: KeyboardEvent, combo: string): boolean => {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return false;
  const keyToken = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));

  const wantMod = mods.has("mod");
  const wantCtrl = mods.has("ctrl") || mods.has("control");
  const wantMeta = mods.has("meta") || mods.has("cmd") || mods.has("command");
  const wantShift = mods.has("shift");
  const wantAlt = mods.has("alt") || mods.has("option");

  // mod 是「Ctrl 或 ⌘」；显式写了 ctrl / meta 就精确匹配那一个
  const modOk = wantMod ? e.ctrlKey || e.metaKey : e.ctrlKey === wantCtrl && e.metaKey === wantMeta;
  if (!modOk || e.shiftKey !== wantShift || e.altKey !== wantAlt) return false;

  const pressed = String(e.key ?? "").toLowerCase();
  const aliases = KEY_ALIASES[keyToken];
  return aliases ? aliases.includes(pressed) : pressed === keyToken;
};

/** 执行一个内置动作；返回 false 表示这次没什么可做（此时不拦浏览器默认行为） */
const runShortcut = (action: string, combo: string, e: KeyboardEvent) => {
  let handled = false;
  if (action === "undo") handled = undo();
  else if (action === "redo" || action === "redo-alt") handled = redo();
  else if (action === "select-all") handled = selectAll();
  else if (action === "delete" || action === "delete-selection") handled = deleteSelection();
  else if (action === "clear-selection") {
    closeContextMenu();
    // 连线模式优先消化 Esc：先退出拉线，再清选择
    if (connectFromState.value) {
      cancelConnect();
      handled = true;
    } else {
      clearSelection();
      handled = true;
    }
  }
  if (!handled) return;
  e.preventDefault();
  e.stopPropagation();
  emit("shortcut", { action, combo, native: e });
};

/**
 * 组件内 keydown 处理。
 *
 * <p>绑在组件根节点上（根节点有 {@code tabindex="0"}，点画布即获得焦点），
 * 不用 window 级监听，避免同一页面多个图谱互相抢 Ctrl+Z；输入框 / 可编辑区域内
 * 一律不拦（否则在搜索框里按退格会删掉图上的节点）。</p>
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.keyboard || e.defaultPrevented) return;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName ?? ""))) return;
  const map: Record<string, string | false> = { ...DEFAULT_SHORTCUTS, ...(props.shortcuts ?? {}) };
  for (const [action, combo] of Object.entries(map)) {
    if (!combo) continue;
    if (!matchShortcut(e, combo)) continue;
    runShortcut(action, combo, e);
    return;
  }
};

/* ============================ 节点 / 边 的增删改查 ============================ */

/** 当前是否分组布局（分组布局的位置由本组件算，任何数据变化都要重算坐标） */
const isGroupMode = () => isGroupLayout(resolveLayout().type);

/** 整图数据重推（分组布局改数据后必须重算坐标，只能整体重推） */
const pushFullData = () => {
  if (!graph || !graphAlive) return;
  // 数据可能刚删掉一些元素：先把选中记账里已经不存在的 id 剔掉，
  // 否则后续 setElementState / 右键回参里会出现悬空 id
  pruneSelection();
  graph.setData(toG6Data());
  // setData 会按数据里的 style 重建元素，可见性回到默认值 —— 路径模式下要补一次，
  // 否则一改数据（拖动、增删、撤销）路径之外的节点就全冒出来了
  graph.render().then(() => {
    if (!graphAlive) return;
    // 元素重建后 html 节点的 DOM 宿主是新的，插槽内容要重新挂一遍，
    // 否则 ER 表卡 / 自定义节点会在数据变更后变成空白占位
    attachSlots();
    if (pathModeState.value) applyPathVisibilityNow();
  });
};

/**
 * 把选中记账裁剪到「当前数据里真实存在的 id」（只改记账，不动画布）。
 * @returns 是否真的裁掉了东西（有变化才 emit，避免每次重推都刷一次 selection-change）
 */
const pruneSelection = (): boolean => {
  const nodeIds = new Set(nodesState.value.map((n) => String(n.id)));
  const edgeIds = new Set(edgesState.value.map((e) => edgeIdOf(e)));
  const nodes = selectedNodes.value.filter((id) => nodeIds.has(id));
  const edges = selectedEdges.value.filter((id) => edgeIds.has(id));
  const changed = nodes.length !== selectedNodes.value.length || edges.length !== selectedEdges.value.length;
  if (!changed) return false;
  selectedNodes.value = nodes;
  selectedEdges.value = edges;
  emitSelection();
  return true;
};

/** 数据变更后的统一收尾：重绘 + 通知父组件 */
const afterDataChange = () => {
  if (isGroupMode()) pushFullData();
  else if (graph && graphAlive) graph.render();
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 覆盖式设置节点（等价于改 nodes prop） */
const setNodes = (nodes: RelationNode[]) => {
  recordHistory("set-nodes");
  nodesState.value = nodes.map((n) => ({ ...n }));
  // 清掉悬空的边
  const existed = new Set(nodesState.value.map((n) => String(n.id)));
  edgesState.value = edgesState.value.filter(
    (e) => existed.has(String(e.source)) && existed.has(String(e.target)),
  );
  if (graph && graphAlive) pushFullData();
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 覆盖式设置边（等价于改 edges prop） */
const setEdges = (edges: RelationEdge[]) => {
  recordHistory("set-edges");
  edgesState.value = edges.map((e) => ({ ...e }));
  if (graph && graphAlive) pushFullData();
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 新增节点（单个或数组，id 已存在则跳过） */
const addNodes = (input: RelationNode | RelationNode[]) => {
  const list = (Array.isArray(input) ? input : [input]).filter(Boolean);
  if (!list.length) return;
  const existed = new Set(nodesState.value.map((n) => String(n.id)));
  const fresh = list.filter((n) => !existed.has(String(n.id))).map((n) => ({ ...n }));
  if (!fresh.length) return;
  recordHistory(fresh.length > 1 ? "add-nodes" : "add-node");
  nodesState.value = [...nodesState.value, ...fresh];
  if (graph && graphAlive) {
    if (isGroupMode()) pushFullData();
    else {
      // 增量加节点：非分组布局下保留其余节点当前位置，不重跑布局
      graph.addNodeData(fresh.map((n) => toG6Node(n)) as any);
      graph.render();
    }
  }
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
  for (const n of fresh) emit("node-created", { node: { ...n } });
};

/**
 * 删除节点（连带删除与它相连的边），支持 id 数组。
 *
 * <p>业务回调分两类：{@code node-deleted} 每个被删的节点抛一次，
 * 因它而连带删掉的边另外抛 {@code edge-deleted} —— 业务侧能把两边数据都同步干净。</p>
 */
const removeNodes = (id: string | string[]) => {
  const ids = new Set((Array.isArray(id) ? id : [id]).map(String));
  if (!ids.size) return;
  // 先看一眼「真的要删东西吗」，没命中就不该留下一条空历史
  const removedNodes = nodesState.value.filter((n) => ids.has(String(n.id)));
  if (!removedNodes.length) return;
  // 连带删掉的边：先收集出来，删完再抛，业务才能拿到完整对象
  const removedEdges = edgesState.value.filter(
    (e) => ids.has(String(e.source)) || ids.has(String(e.target)),
  );
  recordHistory(ids.size > 1 ? "remove-nodes" : "remove-node");
  nodesState.value = nodesState.value.filter((n) => !ids.has(String(n.id)));
  edgesState.value = edgesState.value.filter(
    (e) => !ids.has(String(e.source)) && !ids.has(String(e.target)),
  );
  if (graph && graphAlive) {
    if (isGroupMode()) pushFullData();
    else {
      graph.removeNodeData([...ids] as any);
      graph.render();
    }
  }
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
  // ---- 业务回调：先边后节点，语义上「边随节点而亡」----
  for (const e of removedEdges) {
    emit("edge-deleted", { id: edgeIdOf(e), edge: { ...e } });
  }
  for (const n of removedNodes) {
    emit("node-deleted", { id: String(n.id), node: { ...n } });
  }
};

/** 更新节点（浅合并 patch；不能改 id） */
const updateNode = (id: string, patch: Partial<RelationNode>) => {
  const key = String(id);
  if (!nodesState.value.some((n) => String(n.id) === key)) return;
  recordHistory("update-node");
  nodesState.value = nodesState.value.map((n) => {
    if (String(n.id) !== key) return n;
    return { ...n, ...patch, id: n.id };
  });
  const next = nodesState.value.find((n) => String(n.id) === key)!;
  if (graph && graphAlive) {
    if (isGroupMode()) pushFullData();
    else {
      graph.updateNodeData([toG6Node(next)] as any);
      graph.render();
    }
  }
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
};

/** 新增边（source/target 必须存在；同向重复边跳过） */
const addEdges = (input: RelationEdge | RelationEdge[]) => {
  const list = (Array.isArray(input) ? input : [input]).filter(Boolean);
  if (!list.length) return;
  const nodeIds = new Set(nodesState.value.map((n) => String(n.id)));
  const existed = new Set(edgesState.value.map((e) => edgeIdOf(e)));
  const fresh = list
    .filter((e) => nodeIds.has(String(e.source)) && nodeIds.has(String(e.target)))
    .filter((e) => !existed.has(edgeIdOf(e)))
    .map((e) => ({ ...e }));
  if (!fresh.length) return;
  recordHistory(fresh.length > 1 ? "add-edges" : "add-edge");
  edgesState.value = [...edgesState.value, ...fresh];
  if (graph && graphAlive) {
    if (isGroupMode()) pushFullData();
    else {
      graph.addEdgeData(fresh.map((e) => toG6Edge(e)));
      graph.render();
    }
  }
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
  for (const e of fresh) emit("edge-created", { edge: { ...e } });
};

/**
 * 把「边定位参数」统一成边 id。
 *
 * <p>支持三种写法：边 id（{@link edgeIdOf} 的结果）、{@code "source-target"} 简写、
 * {@code { source, target }} 对象。对象写法按两端反查业务边表 —— 边 id 可能自带
 * 连字符（如 {@code fk-3-datasync-x}），不能靠拆字符串。</p>
 */
const edgeIdForTarget = (target: string | { source: string; target: string }): string => {
  if (typeof target === "string") {
    const exact = edgesState.value.find((e) => edgeIdOf(e) === target);
    return exact ? edgeIdOf(exact) : target;
  }
  const hit = edgesState.value.find(
    (e) => String(e.source) === String(target.source) && String(e.target) === String(target.target),
  );
  return hit ? edgeIdOf(hit) : `${String(target.source)}-${String(target.target)}`;
};

/** 删除边：可传边 id（"source-target"）或 { source, target } */
const removeEdges = (target: string | Array<string | { source: string; target: string }>) => {
  const arr = Array.isArray(target) ? target : [target];
  const keys = new Set(arr.map((t) => edgeIdForTarget(t)));
  // 先判断「真能删掉东西吗」，命中才压历史（压的是改动前的样子）
  const removedEdges = edgesState.value.filter((e) => keys.has(edgeIdOf(e)));
  if (!removedEdges.length) return;
  recordHistory(keys.size > 1 ? "remove-edges" : "remove-edge");
  edgesState.value = edgesState.value.filter((e) => !keys.has(edgeIdOf(e)));
  if (graph && graphAlive) {
    if (isGroupMode()) pushFullData();
    else {
      graph.removeEdgeData([...keys] as any);
      graph.render();
    }
  }
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
  for (const e of removedEdges) emit("edge-deleted", { id: edgeIdOf(e), edge: { ...e } });
};

/** 更新边（按边 id / source-target / { source, target } 定位） */
const updateEdge = (
  target: string | { source: string; target: string },
  patch: Partial<RelationEdge>,
) => {
  const key = edgeIdForTarget(target);
  if (!edgesState.value.some((e) => edgeIdOf(e) === key)) return;
  recordHistory("update-edge");
  edgesState.value = edgesState.value.map((e) => {
    if (edgeIdOf(e) !== key) return e;
    return { ...e, ...patch, source: e.source, target: e.target };
  });
  if (graph && graphAlive) pushFullData();
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 清空图 */
const clear = () => {
  if (nodesState.value.length || edgesState.value.length) recordHistory("clear");
  nodesState.value = [];
  edgesState.value = [];
  if (graph && graphAlive) pushFullData();
  emit("nodes-change", []);
  emit("edges-change", []);
};

/** 读取当前节点 / 边（返回副本，避免外部直接改内部状态） */
const getNodes = () => nodesState.value.map((n) => ({ ...n }));
const getEdges = () => edgesState.value.map((e) => ({ ...e }));
const getNode = (id: string) => nodesState.value.find((n) => String(n.id) === String(id)) ?? null;

/** 一次性替换整图数据 */
const setData = (data: { nodes?: RelationNode[]; edges?: RelationEdge[] }) => {
  recordHistory("set-data");
  if (data.nodes) nodesState.value = data.nodes.map((n) => ({ ...n }));
  if (data.edges) edgesState.value = data.edges.map((e) => ({ ...e }));
  if (graph && graphAlive) pushFullData();
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 工具栏回传：布局 */
const onToolbarLayout = (value: string) => {
  if (layoutState.value === value) return;
  setLayout(value);
};

/** 工具栏回传：布局参数 */
const onToolbarLayoutOptions = (value: Record<string, unknown>) => {
  layoutOptionsState.value = { ...value };
  emit("update:layoutOptions", { ...value });
};

/** 工具栏回传：分组轮廓类型 */
const onToolbarGroupType = (value: GroupType) => {
  if (groupTypeState.value === value) return;
  setGroupType(value);
};

/** 工具栏回传：分组轮廓显隐 */
const onToolbarGroupVisible = (value: boolean) => {
  if (groupVisibleState.value === value) return;
  setGroupVisible(value);
};

/** 工具栏回传：分组轮廓参数 */
const onToolbarGroupOptions = (value: Record<string, unknown>) => {
  groupOptionsState.value = { ...value };
  emit("update:groupOptions", { ...value });
};

/**
 * 工具栏回传：最短路径按钮。
 *
 * <p>按钮是「开关」：没开 → 进入选择模式（左键点两个节点自动出结果），
 * 开着 / 正在看结果 → 退出并恢复全部元素。</p>
 */
const onToolbarPathToggle = () => {
  togglePathPick();
};

/** 工具栏回传：退出路径模式，恢复显示全部元素 */
const onToolbarPathClear = () => {
  cancelPathPick();
};

onMounted(() => {
  // 右键浮层：点别处 / Esc 收起
  document.addEventListener("pointerdown", onDocPointerDown, true);
  document.addEventListener("keydown", onDocKeydown);
  // 等容器尺寸就绪再建图（分组布局要用容器宽高比决定网格列数）
  requestAnimationFrame(() => initGraph());
  // 容器尺寸可能晚于建图才稳定（路由入场 / 标签页切换 / 侧栏折叠），持续跟随
  if (typeof ResizeObserver !== "undefined") {
    canvasResizeObserver = new ResizeObserver(() => syncCanvasToContainer());
    nextTick(() => {
      if (containerRef.value) canvasResizeObserver?.observe(containerRef.value);
    });
  }
});

/** props.layout 变化 → 同步内部布局状态 */
watch(
  () => props.layout,
  (v) => {
    if (v != null) layoutState.value = v;
  },
);

/** props 中的布局参数 / 分组设置变化 → 同步内部状态（父组件是唯一数据源时） */
watch(
  () => props.layoutOptions,
  (v) => {
    layoutOptionsState.value = { ...(v ?? {}) };
  },
  { deep: true },
);
watch(
  () => props.groupType,
  (v) => {
    if (v) groupTypeState.value = v;
  },
);
watch(
  () => props.groupVisible,
  (v) => {
    if (v != null) groupVisibleState.value = v;
  },
);
watch(
  () => props.groupOptions,
  (v) => {
    groupOptionsState.value = { ...(v ?? {}) };
  },
  { deep: true },
);

/** props 里的交互开关 → 同步内部状态（父组件传值优先） */
watch(
  () => props.tooltip,
  (v) => {
    if (v != null) tooltipState.value = v;
  },
);
watch(
  () => props.nodeTooltip,
  (v) => {
    if (v != null) nodeTooltipState.value = v;
  },
);
watch(
  () => props.edgeTooltip,
  (v) => {
    if (v != null) edgeTooltipState.value = v;
  },
);
watch(
  () => props.clickSelect,
  (v) => {
    if (v != null) clickSelectState.value = v;
  },
);
watch(
  () => props.brushSelect,
  (v) => {
    if (v != null) brushSelectState.value = v;
  },
);
watch(
  () => props.highlight,
  (v) => {
    if (v != null) highlightState.value = v;
  },
);
watch(
  () => props.minimap,
  (v) => {
    if (v != null) minimapState.value = v;
  },
);
watch(
  () => props.combo,
  (v) => {
    if (v != null) comboState.value = v;
  },
);
watch(
  () => props.collapsedGroups,
  (v) => {
    collapsedGroupsState.value = [...(v ?? [])];
  },
  { deep: true },
);

/** props 数据变化 → 回灌内部副本并重绘（命令式改动只管自己那一份，不回写 props） */
watch(
  () => props.nodes,
  (v) => {
    nodesState.value = [...(v ?? [])];
    pushFullData();
  },
  { deep: true },
);
watch(
  () => props.edges,
  (v) => {
    edgesState.value = [...(v ?? [])];
    pushFullData();
  },
  { deep: true },
);

/**
 * 布局 / 布局参数 / 分组轮廓 / tooltip 变化 → 整图重建。
 * 布局与插件都挂在 Graph 实例上，G6 5 没有「清空插件 + 换算法」的干净入口，
 * 重建最稳。
 *
 * <p><b>小地图刻意不在这里</b>：它只增删一个插件，用 graph.setPlugins() 就地改即可
 * （见下方 minimapState 的独立 watch）。放在这里会导致每点一次小地图就把整张图
 * 拆掉重画 —— 节点一多就是几秒白屏，正是「开启小地图会卡」的原因。</p>
 */
watch(
  () => [
    layoutState.value,
    layoutOptionsState.value,
    groupTypeState.value,
    groupVisibleState.value,
    groupOptionsState.value,
    props.groupAutoHide,
    tooltipState.value,
    nodeTooltipState.value,
    edgeTooltipState.value,
    props.tooltipOptions,
    props.nodeBadge,
    props.edgeArrow,
    props.edgeDashed,
    props.edgeWidth,
    props.edgeLabel,
    clickSelectState.value,
    brushSelectState.value,
    highlightState.value,
    comboState.value,
    props.collapsedGroups,
  ],
  () => {
    if (!graph) return;
    scheduleRecreate();
  },
  { deep: true },
);

/**
 * 小地图开关 → 就地增删插件（不重建整图）
 *
 * <p>用 {@code graph.setPlugins} 把当前插件列表里的小地图替换/移除，
 * 其它插件（分组轮廓、tooltip）原样保留。整图重建会重跑布局、重绘全部节点，
 * 400 节点量级下是明显的卡顿源；这里只动一个 180×120 的小地图面板。</p>
 *
 * <p><b>为什么还要一次 {@code graph.render()}</b>：{@code setPlugins} 只会把插件
 * 配置写进 {@code options.plugins} 并构造实例，插件的 DOM（小地图面板）是在渲染
 * 阶段挂上去的 —— 实测只调 setPlugins 时画布 DOM 完全不变、小地图根本不出现。
 * 补一次 render() 让渲染管线把新插件挂载即可。</p>
 *
 * <p>与整图重建的区别：这里不新建 Graph、不重跑布局、不重建元素树，
 * 只是让渲染管线重新走一遍挂载流程，代价远小于 recreate。</p>
 */
watch(minimapState, (on) => {
  if (!graph || !graphAlive) return;
  const plugin = buildMinimapPlugin();
  graph.setPlugins((prev: any[]) => {
    const rest = (prev ?? []).filter((p) => p && p.key !== "minimap");
    return plugin ? [...rest, plugin] : rest;
  });
  // 让渲染管线把新插件挂上（或把已移除插件的 DOM 摘掉）
  void graph.render().catch(() => {});
  void on;
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocPointerDown, true);
  document.removeEventListener("keydown", onDocKeydown);
  canvasResizeObserver?.disconnect();
  canvasResizeObserver = null;
  graphAlive = false;
  graph?.destroy();
  graph = null;
  destroyRubber();
});

/** 对外暴露的实例 API（供工具栏 / 验收脚本使用） */
defineExpose({
  /** 底层 G6 Graph 实例（只读句柄，用于高级调用） */
  get graph() {
    return graph;
  },
  /** 当前布局名 */
  get layout() {
    return resolveLayout().type;
  },
  /** 命令式切换布局 */
  setLayout,
  /** 当前布局参数 */
  get layoutOptions() {
    return layoutOptionsState.value;
  },
  /** 当前分组轮廓类型 */
  get groupType() {
    return groupTypeState.value;
  },
  /** 当前分组轮廓显隐 */
  get groupVisible() {
    return groupVisibleState.value;
  },
  /** 非分组布局下是否已自动隐藏轮廓 */
  get groupAutoHidden() {
    return contoursAutoHidden.value;
  },
  /** 命令式切换分组轮廓类型 */
  setGroupType,
  /** 命令式显示 / 隐藏分组轮廓 */
  setGroupVisible,
  /* ---- 交互开关 ---- */
  /** 点选状态 */
  get clickSelect() {
    return clickSelectState.value;
  },
  /** 框选状态 */
  get brushSelect() {
    return brushSelectState.value;
  },
  /** 悬停高亮状态 */
  get highlight() {
    return highlightState.value;
  },
  /** 小地图状态 */
  get minimap() {
    return minimapState.value;
  },
  /** 分组折叠（combo）状态 */
  get combo() {
    return comboState.value;
  },
  /** tooltip 状态（总开关） */
  get tooltip() {
    return tooltipState.value;
  },
  /** 节点悬浮提示开关 */
  get nodeTooltip() {
    return nodeTooltipState.value;
  },
  /** 边悬浮提示开关 */
  get edgeTooltip() {
    return edgeTooltipState.value;
  },
  setClickSelect,
  setBrushSelect,
  setHighlight,
  setMinimap,
  setCombo,
  setTooltip,
  setNodeTooltip,
  setEdgeTooltip,
  /* ---- 连线创建（右键「创建关系」→ 拖线到目标节点）---- */
  /** 进入连线模式：从该节点拉一条线，左键点另一个节点即建立关系 */
  startConnect,
  /** 退出连线模式（取消拉线） */
  cancelConnect,
  /** 是否正处在连线模式 */
  get connecting() {
    return Boolean(connectFromState.value);
  },
  /** 连线模式的起点节点 id（未在连线为空串） */
  get connectFrom() {
    return connectFromState.value;
  },
  /* ---- 选择 / 状态 / 算法 ---- */
  /** 最短路径（BFS，按边数最少），算完只显示路径 */
  shortestPath,
  /** 退出路径模式，恢复显示全部元素 */
  clearPath,
  /** 是否正处在「只显示路径」模式 */
  get pathActive() {
    return pathModeState.value;
  },
  /** 是否正处在「最短路径拾取」模式（工具栏开关已点亮、等左键点两个节点） */
  get pathPicking() {
    return pathPickState.value;
  },
  /** 当前路径起点（未指定为空串） */
  get pathFrom() {
    return pathFromState.value;
  },
  /** 当前路径终点（未指定为空串） */
  get pathTo() {
    return pathToState.value;
  },
  /** 用当前选中的两个节点算最短路径 */
  shortestPathFromSelection,
  /** 设定路径起点 / 终点（右键菜单用；两端齐了自动出结果） */
  setPathEndpoint,
  /** 清空所有元素状态 */
  clearStates,
  /** 清空选择 */
  clearSelection,
  /** 命令式选中一批元素 */
  select,
  /** 当前选中集合 */
  getSelection,
  /** 当前布局下的边交叉数（用于比较「谁更不交叉」） */
  countEdgeCrossings,
  /** 只点亮一组元素（active 态），不改选中集合 */
  highlightElements,
  /** 把某个元素平移到视口中心（不改缩放） */
  centerOn,
  /** 最近一次路径计算结果文字 */
  get pathInfo() {
    return pathInfoState.value;
  },
  /* ---- 右键 ---- */
  /** 关闭右键浮层 */
  closeContextMenu,
  /** 当前右键浮层的回参（未打开为 null） */
  get contextMenu() {
    return contextMenuState.value;
  },
  /* ---- 分组折叠 ---- */
  /** 折叠某个分组（group = 业务分组名，如「蜀汉」） */
  collapseGroup,
  /** 展开某个分组 */
  expandGroup,
  /** 折叠 / 展开切换 */
  toggleGroupCollapsed,
  /** 当前被折叠的分组列表 */
  getCollapsedGroups,
  /** 当前折叠状态（按分组名） */
  isGroupCollapsed,
  /** 适应画布 */
  fitView,
  /* ---- 数据 CRUD（外部方法） ---- */
  /** 当前节点（副本） */
  getNodes,
  /** 当前边（副本） */
  getEdges,
  /** 取单个节点 */
  getNode,
  /** 覆盖式设置节点（同时清理悬空边） */
  setNodes,
  /** 覆盖式设置边 */
  setEdges,
  /** 一次性替换 { nodes, edges } */
  setData,
  /** 新增节点（单个 / 数组；id 已存在则跳过） */
  addNode: (node: RelationNode) => addNodes(node),
  /** 批量新增节点 */
  addNodes,
  /** 删除节点（连带其边） */
  removeNode: (id: string) => removeNodes(id),
  /** 批量删除节点 */
  removeNodes,
  /** 更新节点（浅合并 patch，id 不可改） */
  updateNode,
  /** 新增边（两端节点必须存在） */
  addEdge: (edge: RelationEdge) => addEdges(edge),
  /** 批量新增边 */
  addEdges,
  /** 删除边（id "source-target" 或 { source, target }） */
  removeEdge: (target: string | { source: string; target: string }) => removeEdges([target]),
  /** 批量删除边 */
  removeEdges,
  /** 更新边（按 source-target 定位） */
  updateEdge,
  /** 清空全部节点与边 */
  clear,
  /* ---- 编辑历史（撤销 / 重做） ---- */
  /** 撤销一步（返回是否真的撤销了） */
  undo,
  /** 重做一步（返回是否真的重做了） */
  redo,
  /** 清空撤销 / 重做栈（父组件整体换数据后建议调一次） */
  clearHistory,
  /** 能否撤销 */
  canUndo,
  /** 能否重做 */
  canRedo,
  /** 当前历史状态（栈深 + 最近动作） */
  get history() {
    return historyState();
  },
  /** 当前生效的快捷键映射（内置 + props.shortcuts 覆盖后的结果） */
  get shortcuts() {
    return { ...DEFAULT_SHORTCUTS, ...(props.shortcuts ?? {}) };
  },
  /** 删除当前选中元素（一条历史记录） */
  deleteSelection,
  /** 全选节点与边 */
  selectAll,
  /** 聚焦一组节点（实现见 focusElements） */
  focus: focusElements,
});
</script>

<template>
  <!-- tabindex：让容器可聚焦，点一下画布后 Ctrl+Z / Delete 才收得到（不用 window 级监听抢键） -->
  <div
    ref="rootRef"
    class="rrg"
    tabindex="0"
    :style="{ height: typeof height === 'number' ? height + 'px' : height }"
    @keydown="handleKeydown"
    @pointerdown.capture="focusRoot"
  >
    <div ref="containerRef" class="rrg__canvas"></div>
    <!-- 空态：只在「真的没有节点」时出现，不遮工具栏与右键浮层 -->
    <div v-if="!nodesState.length" class="rrg__empty">{{ emptyText }}</div>
    <GraphToolbar
      v-if="toolbar"
      class="rrg__toolbar"
      :class="[`rrg__toolbar--p-${toolbarPosition}`, `rrg__toolbar--v-${toolbarVariant}`]"
      :layout="resolveLayout().type"
      :layout-options="layoutOptionsState"
      :group-type="groupTypeState"
      :group-visible="groupVisibleState"
      :group-options="groupOptionsState"
      :group-auto-hidden="contoursAutoHidden"
      :variant="toolbarVariant"
      :collapsible="toolbarCollapsible"
      :history="historyEnabled"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :click-select="clickSelectState"
      :brush-select="brushSelectState"
      :highlight="highlightState"
      :minimap="minimapState"
      :tooltip="tooltipState"
      :node-tooltip="nodeTooltipState"
      :edge-tooltip="edgeTooltipState"
      :combo="comboState"
      :collapsed-groups="collapsedGroupsState"
      :groups="groupNames"
      :position="toolbarPosition"
      :path-nodes="pathNodeIds"
      :path-from="pathFromState"
      :path-to="pathToState"
      :path-active="pathModeState"
      :path-picking="pathPickState"
      :path-info="pathInfoState"
      @update:layout="onToolbarLayout"
      @update:layoutOptions="onToolbarLayoutOptions"
      @update:groupType="onToolbarGroupType"
      @update:groupVisible="onToolbarGroupVisible"
      @update:groupOptions="onToolbarGroupOptions"
      @update:clickSelect="setClickSelect"
      @update:brushSelect="setBrushSelect"
      @update:highlight="setHighlight"
      @update:minimap="setMinimap"
      @update:tooltip="setTooltip"
      @update:nodeTooltip="setNodeTooltip"
      @update:edgeTooltip="setEdgeTooltip"
      @update:combo="setCombo"
      @toggle-group="(g: string) => toggleGroupCollapsed(g)"
      @update:pathFrom="(v: string) => (pathFromState = v)"
      @update:pathTo="(v: string) => (pathToState = v)"
      @path-toggle="onToolbarPathToggle"
      @path-clear="onToolbarPathClear"
      @undo="undo"
      @redo="redo"
      @fit="fitView"
    >
      <!-- 业务自定义工具位：透传到内置工具栏右侧 -->
      <template v-if="$slots['toolbar-extra']" #extra>
        <slot name="toolbar-extra" />
      </template>
    </GraphToolbar>

    <!--
      右键浮层：只有业务给了 #context-menu 插槽才渲染。
      插槽回参：menu = 右键回参（命中元素 + 选中集合 + 三套坐标）、close = 关掉浮层。
      菜单长什么样、点什么按钮，全由业务决定；组件只负责定位 / 点外关闭 / Esc 关闭。
    -->
    <div
      v-if="contextMenuState && $slots['context-menu']"
      ref="contextMenuEl"
      class="rrg__ctx"
      :style="{ left: `${contextMenuState.client.x}px`, top: `${contextMenuState.client.y}px` }"
      @contextmenu.prevent
    >
      <slot name="context-menu" :menu="contextMenuState" :close="closeContextMenu" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rrg {
  position: relative;
  width: 100%;
  min-height: 300px;
}

/* 容器可聚焦只是为了接收键盘快捷键，不需要焦点框 */
.rrg:focus,
.rrg:focus-visible {
  outline: none;
}

.rrg__canvas {
  width: 100%;
  height: 100%;
  min-height: 300px;
  overflow: hidden;
}

/* 空态占位：居中、不拦截鼠标（画布仍可拖动平移） */
.rrg__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
  color: var(--el-text-color-secondary, #909399);
  pointer-events: none;
}

/* 连线模式的橡皮筋线：覆盖在画布上但完全不拦截指针事件 */
.rrg__rubber {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}
.rrg__rubber-line {
  stroke: var(--el-color-primary, #409eff);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  stroke-linecap: round;
}

/* #node-content 自定义 DOM：G6 html 节点只提供宿主，尺寸由业务卡片自己撑开 */
.rrg__node-content {
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.rrg__node-content--plain {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  font-size: 12px;
  color: var(--el-text-color-primary, #303133);
}

/* tooltip：G6 默认是一块内联样式的白卡，这里对齐设计语言（圆角 / 细边 / 轻阴影） */
.rrg__canvas :deep(.tooltip) {
  padding: 8px 10px !important;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14) !important;
  font-family: inherit !important;
  line-height: 1.5 !important;
  color: var(--el-text-color-primary, #303133) !important;
}

/* 框选覆盖层：自研框选的蓝色选框（纯 DOM，画在画布之上、工具栏之下）。
   注意这里必须用 :deep() —— 选框是 JS 里 createElement 出来的，
   拿不到 Vue 的 scoped 属性，普通 scoped 选择器对它完全不生效（实测 computed
   position 仍是 static，选框被排到画布底边外面去）。 */
.rrg__canvas :deep(.rrg__brush) {
  position: absolute;
  display: none;
  z-index: 5;
  pointer-events: none;
  border: 1px dashed var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 12%, transparent);
  border-radius: 2px;
}

/* 右键浮层：定位由组件算（贴光标、靠边翻转），外观交给插槽内容，
   这里只给一个「不挡事件、能滚动、在画布与工具栏之上」的容器 */
.rrg__ctx {
  position: absolute;
  z-index: 20;
  max-width: 280px;
  max-height: 70%;
  overflow: auto;
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
  padding: 4px;
  font-size: 12px;
}

/* 工具栏浮在画布之上，停靠角由 toolbarPosition 决定（四个角 + 左右侧）。
   间距从 12px 收到 4px —— 工具贴住组件边框，不占画布有效区域。 */.rrg__toolbar {
  position: absolute;
  z-index: 10;
}
.rrg__toolbar--p-top-left {
  top: 4px;
  left: 4px;
}
.rrg__toolbar--p-top-right {
  top: 4px;
  right: 4px;
}
.rrg__toolbar--p-bottom-left {
  bottom: 4px;
  left: 4px;
}
.rrg__toolbar--p-bottom-right {
  bottom: 4px;
  right: 4px;
}
.rrg__toolbar--p-left {
  top: 50%;
  left: 4px;
  transform: translateY(-50%);
}
.rrg__toolbar--p-right {
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
}
</style>
