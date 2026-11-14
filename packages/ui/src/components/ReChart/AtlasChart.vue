<template>
  <div
    ref="rootRef"
    class="re-chart-atlas"
    :class="{ 'is-dark': theme === 'dark' }"
    :style="{ height }"
  >
    <div v-if="!layout" class="re-chart-atlas__empty">
      <span class="re-chart-atlas__empty-title">暂无可展示的星图数据</span>
      <span class="re-chart-atlas__empty-desc">
        数据结构须为 { nodes }；来源形状不同请传入 transform 归一
      </span>
    </div>

    <template v-else>
      <div
        class="re-chart-atlas__stage"
        :class="{ 'is-zoomable': zoomable }"
        @wheel="onWheel"
      >
        <!-- 缩放层：整层做 transform，节点/连线/分组一起缩放，缩放控件自身不跟着变 -->
        <div
          class="re-chart-atlas__layer"
          :style="{ transform: `scale(${scale})` }"
        >
          <!-- 分组簇：只做视觉分区，不拦点击 -->
          <div class="re-chart-atlas__groups" aria-hidden="true">
            <div
              v-for="g in layout.groups"
              :key="g.key"
              class="re-chart-atlas__group"
              :style="{ left: g.labelX + '%', top: g.labelY + '%', '--accent': g.color }"
            >
              <i class="re-chart-atlas__group-dot" />
              <span class="re-chart-atlas__group-label">{{ g.label }}</span>
              <span class="re-chart-atlas__group-count">{{ g.count }}</span>
            </div>
          </div>

          <!-- 连线层：viewBox 与舞台同为百分比坐标，线宽用 non-scaling-stroke 保持 1px -->
          <svg
            class="re-chart-atlas__wires"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              v-for="edge in layout.edges"
              :key="edge.key"
              class="re-chart-atlas__wire"
              :class="{ 'is-active': edge.active, 'is-dashed': edge.dashed }"
              :d="edge.d"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <!-- 连线标注：放在 DOM 层，避免非等比缩放的 SVG 把文字拉变形 -->
          <span
            v-for="edge in layout.edges"
            v-show="edge.label"
            :key="`${edge.key}-label`"
            class="re-chart-atlas__wire-label"
            :style="{ left: edge.lx + '%', top: edge.ly + '%' }"
            aria-hidden="true"
          >{{ edge.label }}</span>

          <!-- 星：节点直径由 weight 决定，第一颗（权重最大）是实心主星 -->
          <button
            v-for="node in layout.nodes"
            :key="node.id"
            type="button"
            class="re-chart-atlas__node"
            :class="[
              `is-${node.state}`,
              { 'is-lead': node.lead, 'is-compact': node.compact, 'is-picked': node.id === picked },
            ]"
            :style="{
              left: node.x + '%',
              top: node.y + '%',
              width: node.size + 'px',
              height: node.size + 'px',
              '--accent': node.color,
              animationDelay: node.delay + 'ms',
            }"
            :title="node.title"
            :aria-label="node.title"
            @click="pick(node)"
          >
            <span class="re-chart-atlas__node-label">{{ node.label }}</span>
            <span v-if="node.detail" class="re-chart-atlas__node-detail">{{ node.detail }}</span>
            <span v-if="node.meta" class="re-chart-atlas__node-meta">{{ node.meta }}</span>
          </button>
        </div>

        <!-- 图内缩放控件：左上角，随图表自身存在，不依赖外层弹窗 -->
        <div v-if="zoomable" class="re-chart-atlas__zoom" role="group" aria-label="星图缩放">
          <button type="button" class="re-chart-atlas__zoom-btn" title="缩小" aria-label="缩小" :disabled="scale <= ZOOM_MIN" @click="zoomBy(-ZOOM_STEP)">−</button>
          <button type="button" class="re-chart-atlas__zoom-btn re-chart-atlas__zoom-value" title="还原 100%" @click="resetZoom">{{ Math.round(scale * 100) }}%</button>
          <button type="button" class="re-chart-atlas__zoom-btn" title="放大" aria-label="放大" :disabled="scale >= ZOOM_MAX" @click="zoomBy(ZOOM_STEP)">+</button>
        </div>
      </div>

      <div class="re-chart-atlas__legend">
        <span v-for="g in layout.groups" :key="g.key" class="re-chart-atlas__legend-item">
          <i class="re-chart-atlas__legend-dot" :style="{ background: g.color }" />
          {{ g.label }}
          <b>{{ g.count }}</b>
        </span>
        <span v-if="data?.note" class="re-chart-atlas__note">{{ data.note }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 关系星图（ReChart type="atlas"）。
 *
 * 解决的问题：列表只能看「一个个是谁」，看不出「谁和谁一类、谁最重」。
 * 这里把每个对象画成一颗星，同 `kind` 聚成一簇并共用一种颜色，
 * 节点直径 = `weight`，实心主星 = 该簇权重最大的那颗。
 *
 * 布局：
 *  - 簇用「网格分格」，每格一个簇，格内按环形散开（第一颗居中）；
 *  - 节点可用 `x` / `y`（0~100 百分比）显式指定位置，给了就优先；
 *  - 连线走二次贝塞尔并轻微外弯，标注放 DOM 层，避免非等比 SVG 拉伸文字。
 *
 * 颜色一律取 koi 令牌（--brand / --status / --metric / --proto），
 * 亮暗主题由令牌自动翻转，面板不写死色值。
 */
import { computed, ref, watch } from "vue";
import type { AtlasNode, AtlasNodeState, ReChartAtlasData } from "./types";

const props = withDefaults(
  defineProps<{
    /** 星图数据；null 时渲染空态 */
    data: ReChartAtlasData | null;
    /** 容器高度 */
    height?: string;
    /** 主题（仅用于兼容内建面板的统一入参，配色走令牌） */
    theme?: "light" | "dark";
    /** 是否显示图内缩放控件（缩放只改变图内容，不影响容器与外部布局） */
    zoomable?: boolean;
  }>(),
  { height: "100%", theme: "light", zoomable: false },
);

const emit = defineEmits<{
  /** 点了某颗星 */
  (e: "select", payload: { id: string }): void;
}>();

/** 分组配色梯次：全部是语义令牌，暗色下自动提亮 */
const GROUP_COLORS = [
  "var(--brand-500)",
  "var(--metric-net)",
  "var(--status-success)",
  "var(--status-warning)",
  "var(--proto-vnc)",
  "var(--metric-disk)",
  "var(--proto-ssh)",
  "var(--metric-jvm)",
];

/** 当前选中的星（点击高亮用，面板内部状态） */
const picked = ref<string | null>(null);

/* ==================== 图内缩放 ==================== */

const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.15;

/** 缩放只作用于星图内容层，容器尺寸不变 */
const scale = ref(1);

function zoomBy(delta: number) {
  scale.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((scale.value + delta) * 100) / 100));
}

function resetZoom() {
  scale.value = 1;
}

/**
 * 滚轮缩放：只在该图开启 zoomable 时接管滚轮，否则让页面正常滚动。
 * 一次滚动按方向走一个步长，避免触控板高频事件把图甩飞。
 */
function onWheel(event: WheelEvent) {
  if (!props.zoomable) return;
  event.preventDefault();
  if (event.deltaY === 0) return;
  zoomBy(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
}

/** 数据换了（例如换了一批角色）就回到 100%，避免上一份数据的缩放状态残留 */
watch(
  () => props.data,
  () => {
    scale.value = 1;
  },
);

const rootRef = ref<HTMLElement | null>(null);

/** FNV-1a：给分组角度与入场错峰取一个稳定扰动，避免每次渲染位置乱跳 */
function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface LaidNode {
  id: string;
  label: string;
  detail?: string;
  meta?: string;
  state: AtlasNodeState;
  color: string;
  x: number;
  y: number;
  size: number;
  compact: boolean;
  lead: boolean;
  delay: number;
  title: string;
}

interface LaidGroup {
  key: string;
  label: string;
  color: string;
  count: number;
  labelX: number;
  labelY: number;
}

interface LaidEdge {
  key: string;
  d: string;
  lx: number;
  ly: number;
  label?: string;
  active: boolean;
  dashed: boolean;
}

const layout = computed<{
  nodes: LaidNode[];
  groups: LaidGroup[];
  edges: LaidEdge[];
} | null>(() => {
  const data = props.data;
  const source = data?.nodes ?? [];
  if (!source.length) return null;

  // 1. 分组：声明顺序优先，其余按首次出现顺序补齐
  const declared = new Map(
    (data?.groups ?? []).map((g, i) => [g.key, { label: g.label, color: GROUP_COLORS[i % GROUP_COLORS.length] }]),
  );
  const buckets = new Map<string, AtlasNode[]>();
  for (const node of source) {
    const key = node.kind || "__default";
    const list = buckets.get(key);
    if (list) list.push(node);
    else buckets.set(key, [node]);
  }
  const keys = [...declared.keys()].filter((k) => buckets.has(k));
  for (const key of buckets.keys()) {
    if (!declared.has(key)) keys.push(key);
  }

  const cols = Math.max(1, Math.ceil(Math.sqrt(keys.length)));
  const rows = Math.max(1, Math.ceil(keys.length / cols));
  const cellW = 100 / cols;
  const cellH = 100 / rows;

  // 2. 权重归一：直径 48~92px，无权重时给 72px 的中号星
  //    （72 是「5 字角色名一行放得下」的下限：内宽 72-12=60 ≥ 5×11px）
  const weights = source.map((n) => (typeof n.weight === "number" && n.weight > 0 ? n.weight : 0));
  const maxWeight = Math.max(1, ...weights);

  const nodes: LaidNode[] = [];
  const groups: LaidGroup[] = [];

  keys.forEach((key, gi) => {
    const meta = declared.get(key);
    const color = meta?.color ?? GROUP_COLORS[gi % GROUP_COLORS.length];
    const list = [...(buckets.get(key) ?? [])].sort(
      (a, b) => (b.weight ?? 0) - (a.weight ?? 0) || a.label.localeCompare(b.label),
    );
    const cx = (gi % cols + 0.5) * cellW;
    const cy = (Math.floor(gi / cols) + 0.5) * cellH;

    groups.push({
      key,
      label: meta?.label ?? (key === "__default" ? "未分组" : key),
      color,
      count: list.length,
      labelX: Math.min(98, Math.max(1, (gi % cols) * cellW + 1.2)),
      labelY: Math.min(97, Math.max(1.5, Math.floor(gi / cols) * cellH + 1.5)),
    });

    const seed = hashOf(key) % 360;
    list.forEach((node, index) => {
      const weight = typeof node.weight === "number" && node.weight > 0 ? node.weight : 0;
      const size = weight > 0 ? 48 + Math.round(44 * Math.sqrt(weight / maxWeight)) : 72;

      let x: number;
      let y: number;
      if (index === 0 && node.x == null && node.y == null) {
        x = cx;
        y = cy;
      } else if (node.x != null && node.y != null) {
        x = node.x;
        y = node.y;
      } else {
        // 环形散开：每圈最多 6 颗，圈数越外半径越大
        const slot = index - 1;
        const ring = Math.floor(slot / 6);
        const inRing = slot % 6;
        const perRing = Math.max(1, Math.min(6, list.length - 1 - ring * 6));
        const angle = (inRing / perRing) * Math.PI * 2 + (seed * Math.PI) / 180;
        const radius = Math.min(cellW, cellH) * (0.24 + 0.17 * ring);
        x = cx + Math.cos(angle) * radius;
        // 纵向压扁：舞台通常是宽矩形，不压会散成椭圆
        y = cy + Math.sin(angle) * radius * 0.78;
      }

      nodes.push({
        id: node.id,
        label: node.label,
        detail: node.detail,
        meta: node.meta?.[0],
        state: node.state ?? "idle",
        color,
        x: Math.min(97, Math.max(3, x)),
        y: Math.min(94, Math.max(6, y)),
        size,
        compact: size < 64,
        lead: index === 0,
        delay: nodes.length * 16,
        title: [node.label, node.detail, node.meta?.join(" · ")].filter(Boolean).join(" · "),
      });
    });
  });

  // 3. 连线：两端都存在的才画
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const edges: LaidEdge[] = [];
  (data?.edges ?? []).forEach((edge, index) => {
    const from = pos.get(edge.from);
    const to = pos.get(edge.to);
    if (!from || !to) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    // 相邻两点交替向两侧外弯，避免多条线压成一条
    const bend = Math.min(7, 2.5 + len * 0.06) * (index % 2 === 0 ? 1 : -1);
    const qx = (from.x + to.x) / 2 + (-dy / len) * bend;
    const qy = (from.y + to.y) / 2 + (dx / len) * bend;
    edges.push({
      key: `${edge.from}->${edge.to}`,
      d: `M ${round(from.x)} ${round(from.y)} Q ${round(qx)} ${round(qy)} ${round(to.x)} ${round(to.y)}`,
      lx: round((from.x + 2 * qx + to.x) / 4),
      ly: round((from.y + 2 * qy + to.y) / 4),
      label: edge.label,
      active: edge.active === true,
      dashed: edge.dashed === true,
    });
  });

  return { nodes, groups, edges };
});

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function pick(node: LaidNode) {
  picked.value = node.id;
  emit("select", { id: node.id });
}
</script>

<style scoped>
.re-chart-atlas {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 300px;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #1f2430));
}

/* ---- 舞台：极淡点阵底，给「星图」一点空间感 ---- */
.re-chart-atlas__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 260px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef0f6));
  background:
    radial-gradient(var(--border-default, #e3e6ef) 0.7px, transparent 0.7px) 0 0 / 22px 22px,
    var(--bg-elevated, var(--el-fill-color-lighter, #fbfbff));
  overflow: hidden;
}

/* 缩放层：整层等比缩放，原点取中心 */
.re-chart-atlas__layer {
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
  transition: transform 0.2s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}

/* 图内缩放控件：左上角浮起，只有开启 zoomable 才出现 */
.re-chart-atlas__zoom {
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: 999px;
  background: var(--bg-container, #fff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 18, 33, 0.04));
}
.re-chart-atlas__zoom-btn {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 1;
  color: var(--text-secondary, #5c6270);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.re-chart-atlas__zoom-btn:hover:not(:disabled) {
  background: var(--bg-elevated, #fbfbff);
  color: var(--brand-500, #6d5efc);
}
.re-chart-atlas__zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.re-chart-atlas__zoom-value {
  min-width: 40px;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary, #6b7280);
}

/* ---- 分组标题 ---- */
.re-chart-atlas__group {
  position: absolute;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px 1px 5px;
  border-radius: 999px;
  background: var(--bg-container, var(--el-bg-color, #fff));
  border: 1px solid var(--border-subtle, #eef0f6);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--text-secondary, #5c6270);
  pointer-events: none;
  z-index: 3;
}
.re-chart-atlas__group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}
.re-chart-atlas__group-count {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  color: var(--text-tertiary, #6b7280);
  font-size: 9.5px;
}

/* ---- 连线 ---- */
.re-chart-atlas__wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
.re-chart-atlas__wire {
  fill: none;
  stroke: var(--border-default, #e3e6ef);
  stroke-width: 1.2;
  opacity: 0.85;
}
.re-chart-atlas__wire.is-dashed {
  stroke-dasharray: 5 5;
}
.re-chart-atlas__wire.is-active {
  stroke: var(--brand-400, #8f83fd);
  stroke-width: 1.8;
  opacity: 1;
}
.re-chart-atlas__wire-label {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0 5px;
  border-radius: 4px;
  background: var(--bg-elevated, #fbfbff);
  font-size: 9.5px;
  line-height: 1.5;
  color: var(--text-tertiary, #6b7280);
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
}

/* ---- 星 ---- */
.re-chart-atlas__node {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 6px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--accent) 34%, var(--bg-container, #fff));
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-container, #fff));
  color: var(--text-primary, #1f2430);
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 18, 33, 0.04));
  animation: re-chart-atlas-in 0.28s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)) both;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease;
}
.re-chart-atlas__node:hover,
.re-chart-atlas__node:focus-visible {
  transform: translate(-50%, -50%) scale(1.06);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--accent) 26%, transparent);
  outline: none;
}
.re-chart-atlas__node.is-lead {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse, #fff);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 34%, transparent);
}
.re-chart-atlas__node.is-picked {
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent),
    0 8px 20px color-mix(in srgb, var(--accent) 30%, transparent);
}
.re-chart-atlas__node.is-off {
  opacity: 0.55;
  border-style: dashed;
}
.re-chart-atlas__node.is-readonly {
  border-style: dashed;
}
.re-chart-atlas__node-label {
  max-width: 100%;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.15;
  overflow: hidden;
  overflow-wrap: anywhere;
  white-space: normal;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
/* 小星（直径 < 64）内宽更窄：降 0.5px 并让出 meta 的空间，
   否则「部门负责人」这类 5 字角色名会被截成「部门负…」 */
.re-chart-atlas__node.is-compact .re-chart-atlas__node-label {
  font-size: 10.5px;
}
.re-chart-atlas__node.is-lead .re-chart-atlas__node-label {
  font-weight: 650;
}
.re-chart-atlas__node-detail {
  max-width: 100%;
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 8.5px;
  letter-spacing: 0.02em;
  line-height: 1.2;
  opacity: 0.72;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-atlas__node.is-compact .re-chart-atlas__node-detail,
.re-chart-atlas__node.is-compact .re-chart-atlas__node-meta {
  display: none;
}
.re-chart-atlas__node-meta {
  margin-top: 2px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 8.5px;
  line-height: 1.5;
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  color: inherit;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-atlas__node.is-lead .re-chart-atlas__node-meta {
  background: rgba(255, 255, 255, 0.18);
}
@keyframes re-chart-atlas-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.82);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* ---- 图例 ---- */
.re-chart-atlas__legend {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  font-size: 11px;
  color: var(--text-secondary, #5c6270);
}
.re-chart-atlas__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.re-chart-atlas__legend-item b {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}
.re-chart-atlas__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.re-chart-atlas__note {
  margin-left: auto;
  color: var(--text-tertiary, #6b7280);
}

/* ---- 空态 ---- */
.re-chart-atlas__empty {
  flex: 1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed var(--border-default, #e3e6ef);
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-container, #fff);
}
.re-chart-atlas__empty-title {
  font-size: 13px;
  color: var(--text-secondary, #5c6270);
}
.re-chart-atlas__empty-desc {
  font-size: 11px;
  color: var(--text-tertiary, #6b7280);
}

@media (prefers-reduced-motion: reduce) {
  .re-chart-atlas__node {
    animation: none;
    transition: none;
  }
  .re-chart-atlas__layer {
    transition: none;
  }
}
</style>
