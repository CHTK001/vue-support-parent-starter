<script setup lang="ts">
/**
 * ReRelationGraphV2 · G6 5.1.1 原生核心画布（第一版：bubble-sets 基础）
 *
 * <p>以 G6 官方示例
 * {@link https://g6.antv.antgroup.com/zh/examples/plugin/bubble-sets/basic/ Bubblesets 气泡集}
 * 为地基，逐行对照官方写法（Graph + force 布局防重叠 + bubble-sets 分组 +
 * 缩放/拖拽行为 + autoFit），不做任何包装层。</p>
 *
 * <p>对外数据契约（与业务端一致）：</p>
 * <ul>
 *   <li>{@code nodes}: {@code { id, label, group, type, size }} ——
 *       {@code group} 即势力/分组字段，驱动 bubble-sets 与节点配色；</li>
 *   <li>{@code edges}: {@code { source, target, label }}。</li>
 * </ul>
 *
 * <p>后续功能（悬停高亮、势力分组微调、小地图、工具栏、图例、入场动画…）
 * 在本文件上逐个添加，每加一个都过一遍验收。</p>
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Graph } from "@antv/g6";

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
    /** 是否显示工具栏（保留 prop 占位，第一版未实现） */
    toolbar?: boolean;
  }>(),
  {
    nodes: () => [],
    edges: () => [],
    height: "100%",
    toolbar: false,
  },
);

const containerRef = ref<HTMLDivElement | null>(null);
let graph: Graph | null = null;

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
}>();

/** 绑定 G6 事件 → Vue emit（在 graph 创建后调用一次） */
const bindEvents = (g: Graph) => {
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

/** 把业务节点归一化成 G6 数据（id / data.cluster / style.size / style.labelText） */
const toG6Data = () => {
  const palette = CLUSTER_COLORS;
  return {
    nodes: props.nodes.map((n) => {
      const cluster = n.group || "";
      return {
        id: String(n.id),
        data: { cluster, type: n.type || "circle", __label: n.label ?? n.id },
        style: {
          size: n.size ?? 40,
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
      };
    }),
    edges: props.edges.map((e) => ({
      source: String(e.source),
      target: String(e.target),
      data: { label: e.label ?? "" },
    })),
  } as any;
};

/** 按 group 归组节点 id，生成 bubble-sets 插件 */
const buildBubblePlugins = () => {
  const grouped: Record<string, string[]> = {};
  for (const n of props.nodes) {
    const g = n.group || "";
    if (!g) continue;
    (grouped[g] ||= []).push(String(n.id));
  }
  const palette = CLUSTER_COLORS;
  return Object.entries(grouped).map(([group, members], index) => {
    const color = colorOf(group, palette);
    return {
      key: `bubble-${index}`,
      type: "bubble-sets",
      members,
      labelText: group,
      // 泡泡：按分组取色，半透明填充 + 同色描边，一眼区分各势力
      // 注意：fill 必须 6 位 hex（8 位 #rrggbbaa 不被 G6 颜色解析器识别，会变透明）
      fill: color,
      fillOpacity: 0.16,
      stroke: color,
      strokeOpacity: 0.9,
      lineWidth: 2,
      labelFill: color,
      labelPadding: 2,
      labelBackgroundFill: "#ffffff",
      labelBackgroundRadius: 5,
      labelFontSize: 12,
      labelFontWeight: "bold",
    };
  });
};

const initGraph = () => {
  if (!containerRef.value || graph) return;
  graph = new Graph({
    container: containerRef.value,
    data: toG6Data(),
    behaviors: ["zoom-canvas", "drag-canvas", "drag-element"],
    node: {
      palette: { field: "cluster" },
    },
    layout: {
      type: "force",
      preventOverlap: true,
      // 聚类：用 centripetalOptions 显式给每个势力分配独立引力中心（环形排布），
      // 同组节点被持续拉向本组中心 → 自然聚成一块。
      // 注意：不能用内置 clustering=true —— 它取的是布局初始化**前**的节点坐标
      // 求组内均值作中心，所有组引力中心重叠，拉了等于没拉。
      gravity: 15,
      linkDistance: (d: any) => 130,
      centripetalOptions: buildCentripetalOptions(),
    },
    plugins: buildBubblePlugins(),
    autoFit: "center",
  });
  bindEvents(graph);
  graph.render();
};

/**
 * 构建向心力配置：把每个势力映射到圆周上互不重叠的目标中心，
 * 并按组内节点数放大引力，让同组节点持续聚拢。
 */
const buildCentripetalOptions = () => {
  // 统计各势力节点数，大的组中心靠外
  const groups: Record<string, number> = {};
  for (const n of props.nodes) {
    const g = n.group || "";
    if (g) groups[g] = (groups[g] || 0) + 1;
  }
  const names = Object.keys(groups).sort();
  const count = names.length;
  return {
    // 引力强度：按组内节点数（人多的势力更紧实）
    single: 30,
    leaf: (node: any) => (node?.data?.cluster ? 45 : 0),
    others: (node: any) => (node?.data?.cluster ? 45 : 0),
    center: (node: any) => {
      const cluster = String(node?.data?.cluster ?? "");
      const idx = names.indexOf(cluster);
      if (idx < 0) return { x: 0, y: 0, z: 0, centerStrength: 0 };
      // 半径：人多的组靠外；角度均匀铺开（首个组在正上方，避免与 force 外围节点重叠）
      const radius = 120 + (groups[cluster] || 1) * 14;
      const angle = (idx / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
        z: 0,
        // 向心力：基线 0.8 + 组内节点数加成；地点/事件这类「枢纽组」连线多、
        // 会被跨组边拉散，给更高的引力把它们收回来
        centerStrength:
          0.8 +
          Math.min((groups[cluster] || 1) * 0.04, 0.5) +
          (cluster === "地点" || cluster === "事件" ? 0.6 : 0),
      };
    },
  };
};

onMounted(() => {
  // 等容器尺寸就绪再建图
  requestAnimationFrame(() => initGraph());
});

watch(
  () => [props.nodes, props.edges],
  () => {
    if (!graph) return;
    graph.setData(toG6Data());
    graph.render();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  graph?.destroy();
  graph = null;
});

/** 对外暴露的实例 API（供工具栏 / 验收脚本使用） */
defineExpose({
  /** 底层 G6 Graph 实例（只读句柄，用于高级调用） */
  get graph() {
    return graph;
  },
  /** 聚焦一组节点（可选：带透明过渡） */
  async focus(id: string | string[]) {
    return graph?.focusElement?.(id, false);
  },
});
</script>

<template>
  <div class="rrgv2" :style="{ height: typeof height === 'number' ? height + 'px' : height }">
    <div ref="containerRef" class="rrgv2__canvas"></div>
  </div>
</template>

<style lang="scss" scoped>
.rrgv2 {
  width: 100%;
  min-height: 300px;
}

.rrgv2__canvas {
  width: 100%;
  height: 100%;
  min-height: 300px;
  overflow: hidden;
}
</style>
