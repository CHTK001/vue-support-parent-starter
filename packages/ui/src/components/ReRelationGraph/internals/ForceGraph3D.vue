<script setup lang="ts">
/**
 * ForceGraph3D —— ReRelationGraph 的 3D 视图内核（vue-force-graph-3d / 3d-force-graph）。
 *
 * <p>与 G6Graph.vue（2D）并列，由 G6Graph 按 mode 懒加载挂载（three.js 不进首屏包）。
 * 本组件只做两件事：</p>
 * <ul>
 *   <li>把 {@link RelationGraphData} 翻译成 3d-force-graph 的 {@code {nodes, links}}，
 *       并**按 id 复用**节点/边对象：力导坐标（x/y/z）写在对象上，
 *       每次数据变更都换新对象会整图重新发散；</li>
 *   <li>把子组件事件里的 3D 对象经 {@code __rel} 还原成业务对象后上抛，
 *       让 G6Graph 复用同一套 hovered / 右键菜单 / 选中状态逻辑（2D、3D 行为一致）。</li>
 * </ul>
 *
 * <p><strong>相对 2D 的能力子集（如实声明，避免调用方误以为行为一致）：</strong></p>
 * <ul>
 *   <li>布局固定为 3D 力导向，18 种 G6 布局与小地图仅 2D 生效；</li>
 *   <li>无 combo 容器、无双击事件（3d-force-graph 不提供）；</li>
 *   <li>{@code zoom=false} 会关掉整个轨道控制器（旋转/缩放/平移耦合），比 2D 的
 *       「只禁滚轮缩放」更严格。</li>
 * </ul>
 *
 * <p><strong>选中 / 高亮的颜色由 accessor 函数计算</strong>（nodeColor/linkColor），
 * 改变颜色访问器只触发 three-forcegraph 的对象重绘，**不会**重加热力导模拟；
 * 因此选中、悬停高亮都不会引起 3D 图抖动。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, nextTick, onMounted, ref } from "vue";
import ForceGraph3DLib from "vue-force-graph-3d";
import type { RelationEdge, RelationGraphData, RelationNode } from "./types";

defineOptions({ name: "ReRelationGraphForceGraph3D" });

const props = withDefaults(
  defineProps<{
    /** 图数据（G6Graph 从 G6 模型导出的快照，含 style 色值） */
    data?: RelationGraphData;
    /** 节点缺省大小（正方形边长），用于推导 3D 球半径 */
    nodeSize?: number;
    /** 边缺省是否带方向箭头 */
    directed?: boolean;
    /** 是否允许拖拽节点 */
    drag?: boolean;
    /** 是否允许相机交互（3D 下旋转/缩放/平移耦合，false 会整体禁用） */
    zoom?: boolean;
    /** 选中节点 id 集合（选中 = 主题主色实心球） */
    selectedIds?: string[];
    /** 高亮节点 id 集合；null 表示不高亮（其余节点不会淡出） */
    highlightIds?: string[] | null;
  }>(),
  {
    data: () => ({ nodes: [], edges: [] }),
    nodeSize: 32,
    directed: true,
    drag: true,
    zoom: true,
    selectedIds: () => [],
    highlightIds: undefined,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: RelationNode, ev: unknown): void;
  (e: "node-right-click", node: RelationNode, ev: unknown): void;
  (e: "node-hover", node: RelationNode | null, ev: unknown): void;
  (e: "edge-click", edge: RelationEdge, ev: unknown): void;
  (e: "edge-right-click", edge: RelationEdge, ev: unknown): void;
  (e: "canvas-click", ev: unknown): void;
  (e: "canvas-right-click", ev: unknown): void;
}>();

// ==================== 颜色 ====================

/** 分组配色（刻意不含蓝色系：默认球是浅蓝、选中是主题蓝，避免撞色误判选中） */
const PALETTE = ["#67c23a", "#e6a23c", "#f56c6c", "#9a6fe0", "#13c2c2", "#eb6f9a", "#8a94a6", "#5d7092"];
const DEFAULT_NODE_COLOR = "#9ec1ff";
const SELECTED_NODE_COLOR = "#2992ff";
const DIM_NODE_COLOR = "#e4e7ed";
const DEFAULT_EDGE_COLOR = "#c3cbd8";
const DIM_EDGE_COLOR = "#eef1f6";

/** 稳定散列（同名分组恒定映射到同一色号） */
const hashOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

/**
 * 节点基础色：显式 style.fill 优先，其次按 group 取调色板，最后用缺省浅蓝。
 *
 * @param n 业务节点
 * @return 颜色字符串
 */
const baseColorOf = (n: RelationNode): string => {
  const fill = (n.style as Record<string, unknown> | undefined)?.fill;
  if (typeof fill === "string" && fill) {
    return fill;
  }
  if (n.group) {
    return PALETTE[hashOf(n.group) % PALETTE.length];
  }
  return DEFAULT_NODE_COLOR;
};

/**
 * 业务节点大小 -> 3D 球半径对应的 nodeVal。
 *
 * <p>three-forcegraph 的球半径 {@code r = nodeRelSize * cbrt(val)}，nodeRelSize 缺省 4；
 * 想让直径等于业务 size（s），即 r = s/2，解得 {@code val = (s/8)^3}。</p>
 *
 * @param n 业务节点
 * @return nodeVal（>= (1/8)^3，避免 0 半径球不可见）
 */
const valOf = (n: RelationNode): number => {
  const raw = typeof n.size === "number" ? n.size : Array.isArray(n.size) ? n.size[0] : props.nodeSize;
  const s = typeof raw === "number" && raw > 0 ? raw : props.nodeSize;
  return Math.max(Math.pow(s / 8, 3), 0.002);
};

// ==================== 数据映射（按 id 复用对象，保住力导坐标） ====================

const nodeCache = new Map<string, Record<string, unknown>>();
const linkCache = new Map<string, Record<string, unknown>>();

const graph3d = computed(() => {
  const d = props.data;
  const nodes = (d?.nodes ?? []).map((n: RelationNode) => {
    let o = nodeCache.get(n.id) as any;
    if (!o) {
      o = { id: n.id };
      nodeCache.set(n.id, o);
    }
    o.id = n.id;
    o.label = n.label ?? n.id;
    o.val = valOf(n);
    o.baseColor = baseColorOf(n);
    o.__rel = n;
    return o;
  });
  const aliveNodes = new Set(nodes.map(x => x.id as string));
  for (const k of [...nodeCache.keys()]) {
    if (!aliveNodes.has(k)) {
      nodeCache.delete(k);
    }
  }

  const links = (d?.edges ?? []).map((e: RelationEdge) => {
    const id = e.id ?? `${e.source}->${e.target}`;
    let o = linkCache.get(id) as any;
    if (!o) {
      o = { id };
      linkCache.set(id, o);
    }
    o.id = id;
    // 首次给字符串 id，力导解析成节点对象后这里会读到对象——差值不同就回落成业务 id，
    // 下一次 graphData 装载由 d3 重新解析，避免边改指向后仍连着旧节点。
    if (o.source !== e.source) {
      o.source = e.source;
    }
    if (o.target !== e.target) {
      o.target = e.target;
    }
    o.label = e.label ?? "";
    const directed = e.directed ?? props.directed;
    o.arrow = directed ? 6 : 0;
    o.particles = e.animated === true ? 3 : 0;
    const stroke = (e.style as Record<string, unknown> | undefined)?.stroke;
    o.baseColor = typeof stroke === "string" && stroke ? stroke : DEFAULT_EDGE_COLOR;
    o.__rel = e;
    return o;
  });
  const aliveLinks = new Set(links.map(x => x.id as string));
  for (const k of [...linkCache.keys()]) {
    if (!aliveLinks.has(k)) {
      linkCache.delete(k);
    }
  }

  return { nodes, links };
});

// ==================== 颜色访问器（身份只随选中/高亮变化） ====================

const nodeColorFn = computed(() => {
  const sel = new Set(props.selectedIds ?? []);
  const hl = props.highlightIds ? new Set(props.highlightIds) : null;
  return (n: any) => {
    if (sel.has(n.id)) {
      return SELECTED_NODE_COLOR;
    }
    if (hl && !hl.has(n.id)) {
      return DIM_NODE_COLOR;
    }
    return (n.baseColor as string) ?? DEFAULT_NODE_COLOR;
  };
});

const linkColorFn = computed(() => {
  const sel = new Set(props.selectedIds ?? []);
  const hl = props.highlightIds ? new Set(props.highlightIds) : null;
  const endId = (v: unknown): string => (typeof v === "object" && v !== null ? String((v as any).id ?? "") : String(v ?? ""));
  return (l: any) => {
    if (hl) {
      if (!hl.has(endId(l.source)) && !hl.has(endId(l.target))) {
        return DIM_EDGE_COLOR;
      }
      if (sel.has(endId(l.source)) && sel.has(endId(l.target))) {
        return SELECTED_NODE_COLOR;
      }
    }
    return (l.baseColor as string) ?? DEFAULT_EDGE_COLOR;
  };
});

// 访问器保持稳定身份：每次渲染都新建箭头/粒子函数会让 three-forcegraph 反复重绘 links。
const nodeValFn = (n: any) => (typeof n.val === "number" && n.val > 0 ? n.val : 1);
const nodeLabelFn = (n: any) => n.label ?? n.id;
const linkLabelFn = (l: any) => l.label ?? "";
const arrowLenFn = (l: any) => (typeof l.arrow === "number" ? l.arrow : 0);
const particlesFn = (l: any) => (typeof l.particles === "number" ? l.particles : 0);

// ==================== 事件还原 ====================

/** 把 3D 对象还原成业务对象（找不到 __rel 时原样返回，至少保住 id） */
const relOf = (o: any): any => (o && typeof o === "object" && o.__rel) || o;

const onNodeClick = (n: any, ev: MouseEvent) => emit("node-click", relOf(n) as RelationNode, ev);
const onNodeRightClick = (n: any, ev: MouseEvent) => emit("node-right-click", relOf(n) as RelationNode, ev);
const onNodeHover = (n: any, prev: any) => emit("node-hover", n ? ((relOf(n) as RelationNode) ?? null) : null, prev ?? null);
const onLinkClick = (l: any, ev: MouseEvent) => emit("edge-click", relOf(l) as RelationEdge, ev);
const onLinkRightClick = (l: any, ev: MouseEvent) => emit("edge-right-click", relOf(l) as RelationEdge, ev);
const onBackgroundClick = (ev: MouseEvent) => emit("canvas-click", ev);
const onBackgroundRightClick = (ev: MouseEvent) => emit("canvas-right-click", ev);
const onResize = () => notifyReady();

// ==================== 对外小 API ====================

const fgRef = ref<any>(null);
let fitted = false;
let readySent = false;

const notifyReady = () => {
  if (readySent) {
    return;
  }
  readySent = true;
  emit("ready", fgRef.value);
};

/**
 * 相机沿「当前视线方向」整体靠近 / 远离。
 *
 * <p>factor 与 G6 的 zoomBy 语义对齐：{@code >1 放大}（距离除以 factor）、
 * {@code <1 缩小}。</p>
 *
 * @param factor 距离缩放系数
 * @param transitionMs 相机移动过渡毫秒
 */
const zoomBy = (factor: number, transitionMs = 200) => {
  const fg = fgRef.value;
  if (!fg || !factor || factor <= 0) {
    return;
  }
  try {
    const cam = fg.camera?.();
    const ctl = fg.controls?.();
    const t = ctl?.target ?? { x: 0, y: 0, z: 0 };
    const p = cam?.position;
    if (!p) {
      return;
    }
    fg.cameraPosition?.(
      { x: t.x + (p.x - t.x) / factor, y: t.y + (p.y - t.y) / factor, z: t.z + (p.z - t.z) / factor },
      { x: t.x, y: t.y, z: t.z },
      transitionMs,
    );
  } catch (e) {
    console.warn("[ReRelationGraph] 3D zoomBy 失败", e);
  }
};

const fitView = (durationMs = 600) => {
  try {
    fgRef.value?.zoomToFit?.(durationMs, 40);
  } catch (e) {
    console.warn("[ReRelationGraph] 3D fitView 失败", e);
  }
};

/**
 * 聚焦到某个节点（保持当前观察方向与距离，把视点平移到节点上）。
 *
 * <p>节点坐标由力导写在复用的缓存对象上；模拟还没跑出坐标时退化为整体适配。</p>
 *
 * @param id 节点 id
 */
const centerOn = (id: string) => {
  const fg = fgRef.value;
  if (!fg) {
    return;
  }
  const n = (graph3d.value.nodes as any[]).find(x => x.id === id);
  if (!n || typeof n.x !== "number" || typeof n.y !== "number" || typeof n.z !== "number") {
    fitView();
    return;
  }
  try {
    const cam = fg.camera?.();
    const ctl = fg.controls?.();
    const t = ctl?.target ?? { x: 0, y: 0, z: 0 };
    const p = cam?.position;
    const dx = p ? p.x - t.x : 0;
    const dy = p ? p.y - t.y : 0;
    const dz = p ? p.z - t.z : -200;
    fg.cameraPosition?.({ x: n.x + dx, y: n.y + dy, z: n.z + dz }, { x: n.x, y: n.y, z: n.z }, 600);
  } catch (e) {
    console.warn("[ReRelationGraph] 3D centerOn 失败", e);
  }
};

/**
 * 按倍率缩放（近似实现：先适配到基准 1.0，再按倍率调整距离）。
 *
 * <p>3D 没有 2D 那种「绝对缩放比」概念，这里以 fitView 结果为 1.0 基准，
 * {@code ratio>1} 表示放大到 1/ratio 距离。用途多为调用方传 1 重置视角。</p>
 *
 * @param ratio 相对适配视角的倍率
 */
const zoomTo = (ratio: number) => {
  const fg = fgRef.value;
  if (!fg || !ratio || ratio <= 0) {
    return;
  }
  try {
    fg.zoomToFit?.(0, 40);
  } catch (e) {
    console.warn("[ReRelationGraph] 3D zoomTo(fit) 失败", e);
  }
  window.setTimeout(() => zoomBy(ratio, 300), 60);
};

/**
 * 导出当前 3D 画面为 dataURL。
 *
 * <p>同步在同一个任务里 {@code renderer.render(scene, camera)} 再读画布，
 * 这样无需开启 {@code preserveDrawingBuffer}（只要渲染与读取之间不发生
 * 浏览器合成/清屏，WebGL drawingBuffer 里的像素还在）。</p>
 *
 * <p>限制：只能拿到 WebGL 画布像素，DOM 覆盖层（节点插槽）不在其中。</p>
 *
 * @param type    'png' | 'jpeg'
 * @param quality jpeg 品质 (0-1)
 * @return dataURL；失败时为空串
 */
const toDataURL = (type: "png" | "jpeg" = "png", quality = 1): string => {
  const fg = fgRef.value;
  try {
    const renderer = fg?.renderer?.();
    const scene = fg?.scene?.();
    const camera = fg?.camera?.();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
    const dom: HTMLCanvasElement | undefined = renderer?.domElement;
    if (dom?.toDataURL) {
      return dom.toDataURL(`image/${type}`, quality);
    }
  } catch (e) {
    console.warn("[ReRelationGraph] 3D toDataURL 失败", e);
  }
  return "";
};

defineExpose({
  fitView,
  zoomBy,
  zoomTo,
  centerOn,
  toDataURL,
  getInstance: () => fgRef.value,
});

onMounted(async () => {
  await nextTick();
  const fg = fgRef.value;
  if (!fg) {
    return;
  }
  notifyReady();
  // 初次适配：等力导冷却（布局收敛）再 zoomToFit，否则按初始散点适配完图又会漂开。
  // onEngineStop 是子组件内部事件（未在它的 emits 里声明，走 Vue emit 会刷
  // 「not declared in emits」告警），直接向实例注册即可；setTimeout 兜底
  // （数据为空或引擎在注册前已停时 onEngineStop 可能不再触发）。
  const fitOnce = () => {
    if (fitted) {
      return;
    }
    fitted = true;
    fitView(600);
  };
  try {
    fg.onEngineStop?.(fitOnce);
  } catch (e) {
    console.warn("[ReRelationGraph] 3D 注册 onEngineStop 失败", e);
  }
  window.setTimeout(fitOnce, 1500);
});
</script>

<template>
  <div class="fg3d" @contextmenu.prevent>
    <ForceGraph3DLib
      ref="fgRef"
      :graph-data="graph3d"
      :node-val="nodeValFn"
      :node-label="nodeLabelFn"
      :node-color="nodeColorFn"
      :link-label="linkLabelFn"
      :link-color="linkColorFn"
      :link-directional-arrow-length="arrowLenFn"
      :link-directional-particles="particlesFn"
      :enable-node-drag="drag"
      :enable-navigation-controls="zoom"
      @node-click="onNodeClick"
      @node-right-click="onNodeRightClick"
      @node-hover="onNodeHover"
      @link-click="onLinkClick"
      @link-right-click="onLinkRightClick"
      @background-click="onBackgroundClick"
      @background-right-click="onBackgroundRightClick"
      @resize="onResize"
    />
  </div>
</template>

<style scoped lang="scss">
/* 相对 .rrg__canvas（position: relative）铺满；不能用 display:none 收起——
   3D 层由 G6Graph 用 v-if 控制挂载/卸载，卸载时 vue-force-graph-3d 自己会跑 _destructor 释放 WebGL。 */
.fg3d {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
</style>
