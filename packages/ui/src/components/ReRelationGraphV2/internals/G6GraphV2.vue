<script setup lang="ts">
/**
 * ReRelationGraphV2 · G6 5.1.1 原生核心画布
 *
 * <p>以 G6 官方示例
 * {@link https://g6.antv.antgroup.com/zh/examples/plugin/bubble-sets/basic/ Bubblesets 气泡集}
 * 为地基，逐行对照官方写法（Graph + force 布局防重叠 + bubble-sets 分组 +
 * 缩放/拖拽行为 + autoFit），不做任何包装层。</p>
 *
 * <p>分组轮廓支持两种包裹方式（{@code groupType}）：bubble-sets 气泡集 与
 * plugin/hull 凹包轮廓（{@link https://g6.antv.antgroup.com/zh/examples/plugin/hull/basic/}）；
 * 内置工具栏见 {@link ./GraphToolbarV2.vue}，布局参数表见 {@link ./layoutSettings}。</p>
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
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Graph } from "@antv/g6";
import { DEFAULT_LAYOUT, isGroupLayout, type V2GroupType, type V2LayoutType } from "./layouts";
import GraphToolbarV2 from "./GraphToolbarV2.vue";

/** 对外节点契约 */
export interface V2Node {
  id: string;
  label?: string;
  /** 势力 / 分组字段：驱动气泡集分组与配色 */
  group?: string;
  /** 节点类型：circle / image / rect …（缺省 circle） */
  type?: string;
  /** 节点尺寸（直径，缺省 40） */
  size?: number;
  [key: string]: unknown;
}

/** 对外边契约 */
export interface V2Edge {
  source: string;
  target: string;
  label?: string;
  [key: string]: unknown;
}

/** 气泡集配色（沿用官方示例） */
const CLUSTER_COLORS = ["#1783FF", "#00C9C9", "#F08F56", "#D580FF", "#786CFF", "#FF85C0"];

/** 由 group 名称取稳定色 */
const colorOf = (group: string, palette: string[]): string => {
  let h = 0;
  for (let i = 0; i < group.length; i++) h = (h * 31 + group.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

const props = withDefaults(
  defineProps<{
    /** 节点列表 */
    nodes?: V2Node[];
    /** 边列表 */
    edges?: V2Edge[];
    /** 画布高度（px 或 css 长度，缺省 100%） */
    height?: string | number;
    /**
     * 布局：缺省 {@code "group"}（分组布局，每组自动占据画布独立区域）；
     * 也可传 G6 全部内置布局名（force / d3-force / circular / grid / dagre …），
     * 或传完整对象 {@code { type: "force", linkDistance: 150 }}。
     */
    layout?: V2LayoutType | { type: string; [key: string]: unknown };
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
    groupType?: V2GroupType;
    /** 分组轮廓是否显示（关掉只留配色，类型与参数保留） */
    groupVisible?: boolean;
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
    /** 是否启用节点/边悬浮提示（默认开启） */
    tooltip?: boolean;
    /**
     * Tooltip 配置：透传 G6 tooltip 插件
     * （position / offset / enterable / enable…），另支持：
     * {@code getContent?: (data, kind) => string} 自定义内容。
     */
    tooltipOptions?: {
      getContent?: (data: Record<string, unknown>, kind: "node" | "edge") => string;
      [key: string]: unknown;
    };
  }>(),
  {
    nodes: () => [],
    edges: () => [],
    height: "100%",
    layout: DEFAULT_LAYOUT,
    layoutOptions: () => ({}),
    groupType: "bubble",
    groupVisible: true,
    groupOptions: () => ({}),
    toolbar: false,
    toolbarVariant: "pill",
    toolbarPosition: "top-right",
    toolbarCollapsible: true,
    tooltip: true,
    tooltipOptions: () => ({}),
  },
);

const containerRef = ref<HTMLDivElement | null>(null);
let graph: Graph | null = null;

/**
 * 当前布局（可被 {@code setLayout} 命令式覆盖；props.layout 变化时同步）
 * 用 ref 而非直接读 props，是因为 setLayout 需要在不改父组件数据的情况下切布局。
 */
const layoutState = ref<V2LayoutType | { type: string; [key: string]: unknown }>(
  props.layout ?? DEFAULT_LAYOUT,
);

/** 当前布局参数（工具栏可在运行中改，父组件传值优先同步） */
const layoutOptionsState = ref<Record<string, unknown>>({ ...(props.layoutOptions ?? {}) });

/** 当前分组轮廓类型 / 显隐 / 参数 */
const groupTypeState = ref<V2GroupType>(props.groupType ?? "bubble");
const groupVisibleState = ref<boolean>(props.groupVisible ?? true);
const groupOptionsState = ref<Record<string, unknown>>({ ...(props.groupOptions ?? {}) });

/**
 * 内部数据副本。
 *
 * <p>为什么不全用 props：组件要对外提供节点/边的增删改（{@code addNode} 等），
 * 命令式改动先落到这份副本上并立即重绘，父组件若用 {@code :nodes} 单向绑定也能看到
 * 效果；父组件改了 props 时再由 watch 回灌。</p>
 */
const nodesState = ref<V2Node[]>([...(props.nodes ?? [])]);
const edgesState = ref<V2Edge[]>([...(props.edges ?? [])]);

/**
 * 对外事件（已接通 G6 底层）：
 * - node-mouseover / node-mouseout：节点鼠标移入/移出（G6 node:pointerenter/pointerleave）
 * - edge-mouseover / edge-mouseout：边鼠标移入/移出（G6 edge:pointerenter/pointerleave）
 *
 * 事件载荷统一为 { id, data, ... }：id 是元素 id，data 是元素业务数据
 * （节点为 { cluster, __label, ... }，边为 { label }）。
 */
const emit = defineEmits<{
  (e: "node-mouseover", detail: { id: string; data?: unknown }): void;
  (e: "node-mouseout", detail: { id: string; data?: unknown }): void;
  (e: "edge-mouseover", detail: { id: string; source: string; target: string; data?: unknown }): void;
  (e: "edge-mouseout", detail: { id: string; source: string; target: string; data?: unknown }): void;
  /** 工具栏/命令式改动后的同步事件（配合 v-model:xxx 使用） */
  (e: "update:layout", value: string): void;
  (e: "update:layoutOptions", value: Record<string, unknown>): void;
  (e: "update:groupType", value: V2GroupType): void;
  (e: "update:groupVisible", value: boolean): void;
  (e: "update:groupOptions", value: Record<string, unknown>): void;
  /** 数据变更通知（命令式增删改后发出，父组件可据此同步自己的数据源） */
  (e: "nodes-change", nodes: V2Node[]): void;
  (e: "edges-change", edges: V2Edge[]): void;
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
    g.fitView({ when: "overflow" }).catch(() => {});
  });
  // 真实 G6 事件里 ev.target 是 shape 对象（Circle / Line）：
  // - 元素 id 在 target.id（节点=节点 id；边=以 "source-target" 命名的 id）
  // - 业务数据不在 target 顶层，需用 graph.getNodeData / getEdgeData 回查
  g.on("node:pointerenter", (ev) => {
    const id = String(((ev as { target?: { id?: unknown } }).target ?? {}).id ?? "");
    emit("node-mouseover", { id, data: g.getNodeData(id) as unknown });
  });
  g.on("node:pointerleave", (ev) => {
    const id = String(((ev as { target?: { id?: unknown } }).target ?? {}).id ?? "");
    emit("node-mouseout", { id, data: g.getNodeData(id) as unknown });
  });
  g.on("edge:pointerenter", (ev) => {
    const id = String(((ev as { target?: { id?: unknown } }).target ?? {}).id ?? "");
    // G6 边的 id 形如 "source-target"，直接拆出两端；data 用 edge data 回查
    const [source = "", target = ""] = id.split("-");
    emit("edge-mouseover", {
      id,
      source,
      target,
      data: g.getEdgeData(id) as unknown,
    });
  });
  g.on("edge:pointerleave", (ev) => {
    const id = String(((ev as { target?: { id?: unknown } }).target ?? {}).id ?? "");
    const [source = "", target = ""] = id.split("-");
    emit("edge-mouseout", {
      id,
      source,
      target,
      data: g.getEdgeData(id) as unknown,
    });
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

/** 组装 G6 layout 配置；分组布局返回 undefined（位置由数据坐标决定） */
const buildLayout = (): Record<string, unknown> | undefined => {
  const { type, options } = resolveLayout();
  if (isGroupLayout(type)) return undefined;
  return { type, ...(LAYOUT_BASE_OPTIONS[type] ?? {}), ...options };
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

/** 单个业务节点 → G6 节点（分组布局时带上预算坐标） */
const toG6Node = (n: V2Node, p?: { x: number; y: number }) => {
  const palette = CLUSTER_COLORS;
  const cluster = n.group || "";
  return {
    id: String(n.id),
    data: { cluster, type: n.type || "circle", __label: n.label ?? n.id },
    style: {
      size: n.size ?? 40,
      // 分组布局：坐标直接写在数据里，G6 不再跑布局
      ...(p ? { x: p.x, y: p.y } : {}),
      labelText: n.label ?? n.id,
      labelPlacement: "bottom",
      labelBackground: true,
      labelBackgroundFill: "rgba(0,0,0,0.55)",
      labelBackgroundRadius: 4,
      labelPadding: [2, 6],
      labelFill: "#fff",
      labelFontSize: 11,
      ...(cluster ? { fill: colorOf(cluster, palette), stroke: colorOf(cluster, palette) } : {}),
    },
  } as any;
};

/** 单条业务边 → G6 边 */
const toG6Edge = (e: V2Edge) =>
  ({
    source: String(e.source),
    target: String(e.target),
    data: { label: e.label ?? "" },
  }) as any;

/** 把业务节点归一化成 G6 数据（id / data.cluster / style.size / style.labelText / 分组坐标） */
const toG6Data = () => {
  const { type, options } = resolveLayout();
  const groupLayout = isGroupLayout(type) ? computeGroupPositions(options) : null;
  return {
    nodes: nodesState.value.map((n) => toG6Node(n, groupLayout?.pos.get(String(n.id)))),
    edges: edgesState.value.map(toG6Edge),
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
 * 节点仍按 group 配色，只是不画轮廓。</p>
 */
const buildGroupPlugins = () => {
  if (groupTypeState.value === "none" || !groupVisibleState.value) return [];
  const entries = membersByGroup();
  if (!entries.length) return [];

  const opts = groupOptionsState.value ?? {};
  const num = (key: string, fallback: number) => {
    const n = Number(opts[key]);
    return Number.isFinite(n) ? n : fallback;
  };
  const palette = CLUSTER_COLORS;

  // 所有节点 id：bubble-sets 用来声明「别的组的节点要避开」，
  // 否则等值线场会把邻近的异组节点也圈进来，两组轮廓叠在一起（hull 无此参数）
  const allIds = nodesState.value.map((n) => String(n.id));

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
      // 异组节点声明为「避开」，避免气泡把邻组节点圈进来造成两组轮廓重叠
      avoidMembers: allIds.filter((id) => !members.includes(id)),
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

/**
 * Tooltip 插件（默认开启，可用 {@code :tooltip="false"} 关掉）。
 *
 * <p>内容优先用 {@code tooltipOptions.getContent}，否则用内置的节点/边模板；
 * 其余 {@code tooltipOptions} 原样透传给 G6 tooltip 插件（position / offset / enterable…）。</p>
 */
const buildTooltipPlugin = () => {
  if (!props.tooltip) return null;
  const { getContent: customContent, ...rest } = props.tooltipOptions ?? {};
  return {
    type: "tooltip",
    key: "tooltip",
    ...rest,
    enable: (ev: { targetType?: string }) => ev.targetType === "node" || ev.targetType === "edge",
    getContent: async (ev: { targetType?: string }, items: Array<Record<string, unknown>>) => {
      const item = items?.[0] ?? {};
      const data = (item.data ?? {}) as Record<string, unknown>;
      const kind = ev.targetType === "edge" ? "edge" : "node";
      if (typeof customContent === "function") return customContent(data, kind);
      return kind === "edge" ? defaultEdgeTooltip(data, item) : defaultNodeTooltip(data);
    },
  };
};

/** 当前实例是否仍存活（G6 destroy 后异步回调仍可能触发） */
let graphAlive = false;

const initGraph = () => {
  if (!containerRef.value || graph) return;
  graph = new Graph({
    container: containerRef.value,
    data: toG6Data(),
    behaviors: ["zoom-canvas", "drag-canvas", "drag-element"],
    node: {
      palette: { field: "cluster" },
    },
    // 分组布局返回 undefined：G6 不跑布局，直接使用数据里的 style.x / style.y
    layout: buildLayout() as any,
    plugins: [...buildGroupPlugins(), buildTooltipPlugin()].filter(Boolean) as any[],
    // "view" = 缩放到完整可见（"center" 只居中不缩放，内容大会超出视口）
    autoFit: "view",
    // 视口留白：气泡上方的分组标签不会被画布边缘裁掉
    padding: 28,
  });
  graphAlive = true;
  bindEvents(graph, () => graphAlive);
  graph.render();
};

/** 重建画布：布局切换时必须整图重建，否则 G6 会沿用上一次布局的算法状态 */
const recreateGraph = () => {
  graphAlive = false;
  graph?.destroy();
  graph = null;
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
  layoutState.value = options ? { type, ...options } : (type as V2LayoutType);
  emit("update:layout", type);
};

/** 切换分组轮廓类型（等价于改 groupType prop） */
const setGroupType = (type: V2GroupType) => {
  groupTypeState.value = type;
  emit("update:groupType", type);
};

/** 显示 / 隐藏分组轮廓 */
const setGroupVisible = (visible: boolean) => {
  groupVisibleState.value = visible;
  emit("update:groupVisible", visible);
};

/** 适应画布 */
const fitView = () => {
  if (!graph || !graphAlive) return;
  graph.fitView({ when: "always" }).catch(() => {});
};

/* ============================ 节点 / 边 的增删改查 ============================ */

/** 当前是否分组布局（分组布局的位置由本组件算，任何数据变化都要重算坐标） */
const isGroupMode = () => isGroupLayout(resolveLayout().type);

/** 整图数据重推（分组布局改数据后必须重算坐标，只能整体重推） */
const pushFullData = () => {
  if (!graph || !graphAlive) return;
  graph.setData(toG6Data());
  graph.render();
};

/** 数据变更后的统一收尾：重绘 + 通知父组件 */
const afterDataChange = () => {
  if (isGroupMode()) pushFullData();
  else if (graph && graphAlive) graph.render();
  emit("nodes-change", nodesState.value.map((n) => ({ ...n })));
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 覆盖式设置节点（等价于改 nodes prop） */
const setNodes = (nodes: V2Node[]) => {
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
const setEdges = (edges: V2Edge[]) => {
  edgesState.value = edges.map((e) => ({ ...e }));
  if (graph && graphAlive) pushFullData();
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 新增节点（单个或数组，id 已存在则跳过） */
const addNodes = (input: V2Node | V2Node[]) => {
  const list = (Array.isArray(input) ? input : [input]).filter(Boolean);
  if (!list.length) return;
  const existed = new Set(nodesState.value.map((n) => String(n.id)));
  const fresh = list.filter((n) => !existed.has(String(n.id))).map((n) => ({ ...n }));
  if (!fresh.length) return;
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
};

/** 删除节点（连带删除与它相连的边），支持 id 数组 */
const removeNodes = (id: string | string[]) => {
  const ids = new Set((Array.isArray(id) ? id : [id]).map(String));
  if (!ids.size) return;
  const before = nodesState.value.length;
  nodesState.value = nodesState.value.filter((n) => !ids.has(String(n.id)));
  if (nodesState.value.length === before) return;
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
};

/** 更新节点（浅合并 patch；不能改 id） */
const updateNode = (id: string, patch: Partial<V2Node>) => {
  const key = String(id);
  let hit = false;
  nodesState.value = nodesState.value.map((n) => {
    if (String(n.id) !== key) return n;
    hit = true;
    return { ...n, ...patch, id: n.id };
  });
  if (!hit) return;
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
const addEdges = (input: V2Edge | V2Edge[]) => {
  const list = (Array.isArray(input) ? input : [input]).filter(Boolean);
  if (!list.length) return;
  const nodeIds = new Set(nodesState.value.map((n) => String(n.id)));
  const edgeKey = (e: V2Edge) => `${e.source}__${e.target}`;
  const existed = new Set(edgesState.value.map(edgeKey));
  const fresh = list
    .filter((e) => nodeIds.has(String(e.source)) && nodeIds.has(String(e.target)))
    .filter((e) => !existed.has(edgeKey(e)))
    .map((e) => ({ ...e }));
  if (!fresh.length) return;
  edgesState.value = [...edgesState.value, ...fresh];
  if (graph && graphAlive) {
    if (isGroupMode()) pushFullData();
    else {
      graph.addEdgeData(fresh.map(toG6Edge));
      graph.render();
    }
  }
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 删除边：可传边 id（"source-target"）或 { source, target } */
const removeEdges = (target: string | Array<string | { source: string; target: string }>) => {
  const arr = Array.isArray(target) ? target : [target];
  const keys = new Set(
    arr.map((t) =>
      typeof t === "string" ? t.replace("__", "-") : `${String(t.source)}-${String(t.target)}`,
    ),
  );
  const before = edgesState.value.length;
  edgesState.value = edgesState.value.filter(
    (e) => !keys.has(`${String(e.source)}-${String(e.target)}`),
  );
  if (edgesState.value.length === before) return;
  if (graph && graphAlive) {
    if (isGroupMode()) pushFullData();
    else {
      graph.removeEdgeData([...keys] as any);
      graph.render();
    }
  }
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 更新边（按 source-target 定位） */
const updateEdge = (
  target: string | { source: string; target: string },
  patch: Partial<V2Edge>,
) => {
  const key =
    typeof target === "string"
      ? target.replace("__", "-")
      : `${String(target.source)}-${String(target.target)}`;
  let hit = false;
  edgesState.value = edgesState.value.map((e) => {
    if (`${String(e.source)}-${String(e.target)}` !== key) return e;
    hit = true;
    return { ...e, ...patch, source: e.source, target: e.target };
  });
  if (!hit) return;
  if (graph && graphAlive) pushFullData();
  emit("edges-change", edgesState.value.map((e) => ({ ...e })));
};

/** 清空图 */
const clear = () => {
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
const setData = (data: { nodes?: V2Node[]; edges?: V2Edge[] }) => {
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
const onToolbarGroupType = (value: V2GroupType) => {
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

onMounted(() => {
  // 等容器尺寸就绪再建图（分组布局要用容器宽高比决定网格列数）
  requestAnimationFrame(() => initGraph());
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

/** props 数据变化 → 回灌内部副本（命令式改动只管自己那一份） */
watch(
  () => props.nodes,
  (v) => {
    nodesState.value = [...(v ?? [])];
  },
  { deep: true },
);
watch(
  () => props.edges,
  (v) => {
    edgesState.value = [...(v ?? [])];
  },
  { deep: true },
);

/**
 * 布局 / 布局参数 / 分组轮廓变化 → 整图重建。
 * 布局与插件都挂在 Graph 实例上，G6 5 没有「清空插件 + 换算法」的干净入口，
 * 重建最稳；图规模不大，重建代价可接受。
 */
watch(
  () => [
    layoutState.value,
    layoutOptionsState.value,
    groupTypeState.value,
    groupVisibleState.value,
    groupOptionsState.value,
  ],
  () => {
    if (!graph) return;
    scheduleRecreate();
  },
  { deep: true },
);

/** 数据变化 → 重新算坐标并重绘 */
watch(
  () => [props.nodes, props.edges],
  () => {
    if (!graph || !graphAlive) return;
    graph.setData(toG6Data());
    graph.render();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  graphAlive = false;
  graph?.destroy();
  graph = null;
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
  /** 命令式切换分组轮廓类型 */
  setGroupType,
  /** 命令式显示 / 隐藏分组轮廓 */
  setGroupVisible,
  /** 适应画布 */
  fitView,
  /**
   * 聚焦一组节点：先按子集包围盒定缩放，再平移到视口中心。
   *
   * <p>G6 的 {@code focusElement} 只做平移（{@code viewport.focus} 内部只有
   * translate，不改 zoom），所以这里先 {@code zoomTo} 再 {@code focusElement}，
   * 否则「聚焦某势力」只会把视口挪过去、节点依旧很小。</p>
   */
  async focus(id: string | string[]) {
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
  },
});
</script>

<template>
  <div class="rrgv2" :style="{ height: typeof height === 'number' ? height + 'px' : height }">
    <div ref="containerRef" class="rrgv2__canvas"></div>
    <GraphToolbarV2
      v-if="toolbar"
      class="rrgv2__toolbar"
      :class="`rrgv2__toolbar--${toolbarVariant}`"
      :layout="resolveLayout().type"
      :layout-options="layoutOptionsState"
      :group-type="groupTypeState"
      :group-visible="groupVisibleState"
      :group-options="groupOptionsState"
      :variant="toolbarVariant"
      @update:layout="onToolbarLayout"
      @update:layoutOptions="onToolbarLayoutOptions"
      @update:groupType="onToolbarGroupType"
      @update:groupVisible="onToolbarGroupVisible"
      @update:groupOptions="onToolbarGroupOptions"
      @fit="fitView"
    >
      <!-- 业务自定义工具位：透传到内置工具栏右侧 -->
      <template v-if="$slots['toolbar-extra']" #extra>
        <slot name="toolbar-extra" />
      </template>
    </GraphToolbarV2>
  </div>
</template>

<style lang="scss" scoped>
.rrgv2 {
  position: relative;
  width: 100%;
  min-height: 300px;
}

.rrgv2__canvas {
  width: 100%;
  height: 100%;
  min-height: 300px;
  overflow: hidden;
}

/* 工具栏浮在画布之上：pill / card 靠右上，rail 靠左中 */
.rrgv2__toolbar {
  position: absolute;
  z-index: 10;
}
.rrgv2__toolbar--pill,
.rrgv2__toolbar--card {
  top: 12px;
  right: 12px;
}
.rrgv2__toolbar--rail {
  top: 12px;
  left: 12px;
}
</style>
