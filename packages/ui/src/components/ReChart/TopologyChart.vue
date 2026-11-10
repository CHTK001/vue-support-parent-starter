<template>
  <div
    ref="rootRef"
    class="re-chart-topology"
    :class="{ 'is-dark': theme === 'dark' }"
    :style="{ height }"
  >
    <div v-if="!data" class="re-chart-topology__empty">
      <span class="re-chart-topology__empty-title">暂无可展示的链路数据</span>
      <span class="re-chart-topology__empty-desc">
        数据结构须为 { nodes, edges }；来源形状不同请传入 transform 归一
      </span>
    </div>

    <template v-else>
      <div class="re-chart-topology__stage">
        <!-- 节点层：DOM 卡片，连线坐标全部从这里实测，故改字号/换行也不会错位 -->
        <div class="re-chart-topology__columns">
          <section v-for="col in columns" :key="col.key" class="re-chart-topology__col">
            <div class="re-chart-topology__col-title">{{ col.label }}</div>
            <div class="re-chart-topology__col-body">
              <div
                v-for="node in col.nodes"
                :key="node.id"
                :ref="setNodeRef(node.id)"
                class="re-chart-topology__node"
                :class="`is-${node.status || 'idle'}`"
              >
                <div class="re-chart-topology__node-head">
                  <span class="re-chart-topology__node-dot" />
                  <span class="re-chart-topology__node-label">{{ node.label }}</span>
                </div>
                <div v-if="node.detail" class="re-chart-topology__node-detail">
                  {{ node.detail }}
                </div>
                <div v-if="node.meta?.length" class="re-chart-topology__node-meta">
                  <span v-for="m in node.meta.slice(0, 2)" :key="m" class="re-chart-topology__chip">
                    {{ m }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 连线层：viewBox 与容器 1:1，不做拉伸，所以线宽与小鸟不变形 -->
        <svg
          class="re-chart-topology__wires"
          :width="size.w"
          :height="size.h"
          :viewBox="`0 0 ${size.w} ${size.h}`"
          aria-hidden="true"
        >
          <g v-for="wire in wires" :key="wire.id">
            <path
              class="re-chart-topology__wire"
              :class="[`is-${wire.status}`, { 'is-active': wire.active }]"
              :d="wire.d"
            />
            <path
              v-if="wire.active"
              class="re-chart-topology__wire-glow"
              :d="wire.d"
            />
            <text
              v-if="wire.label"
              class="re-chart-topology__wire-label"
              :x="wire.mx"
              :y="wire.my - 7"
              text-anchor="middle"
            >
              {{ wire.label }}
            </text>

            <!-- 在用线路：小鸟叼着数据包沿线搬运 -->
            <g v-if="wire.active" class="re-chart-topology__bird-wrap">
              <animateMotion
                :path="wire.d"
                :dur="wire.dur"
                :begin="wire.begin"
                rotate="auto"
                repeatCount="indefinite"
              />
              <g class="re-chart-topology__bird">
                <path class="re-chart-topology__bird-tail" d="M -8 0 L -13 -4 L -12 0 L -13 4 Z" />
                <ellipse class="re-chart-topology__bird-body" cx="-1" cy="0" rx="7" ry="4.2" />
                <path
                  class="re-chart-topology__bird-wing"
                  d="M -3.5 -1.6 Q 1.5 -9.5 7 -3.4 Q 2 -1.2 -3.5 -1.6 Z"
                />
                <path class="re-chart-topology__bird-head" d="M 5.6 -2.2 L 11.4 -0.4 L 5.6 2.2 Z" />
                <circle class="re-chart-topology__bird-eye" cx="4.4" cy="-1.2" r="0.95" />
                <rect class="re-chart-topology__bird-packet" x="-3" y="3.6" width="6.4" height="4.6" rx="1.2" />
              </g>
            </g>

            <!-- 数据包拖尾：证明这条线此刻真的在搬运 -->
            <circle
              v-if="wire.active"
              class="re-chart-topology__packet"
              r="2"
            >
              <animateMotion
                :path="wire.d"
                :dur="wire.dur"
                :begin="wire.begin"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </svg>
      </div>

      <div class="re-chart-topology__legend">
        <span class="re-chart-topology__legend-item">
          <span class="re-chart-topology__legend-line is-active" />在用线路
        </span>
        <span class="re-chart-topology__legend-item">
          <span class="re-chart-topology__legend-line is-idle" />备用线路
        </span>
        <span class="re-chart-topology__legend-item">
          <span class="re-chart-topology__legend-line is-limited" />受限
        </span>
        <span class="re-chart-topology__legend-item">
          <span class="re-chart-topology__legend-bird" />小鸟 = 数据搬运中
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 链路拓扑（ReChart type="topology"）。
 *
 * 三件事是本图的存在意义：
 *  1. **连线有动画**：在用线路是流动虚线，另有一条发光描边；
 *  2. **标出当前在用的线路**：`edges[].active` 为真即高亮，其余压暗；
 *  3. **线段上有小鸟搬运**：SMIL `animateMotion` 直接沿 `path` 飞行，翅膀另做
 *     高频摆动，鸟爪下挂一个数据包，另有一颗包点同轨追赶。
 *
 * 坐标全部取「节点 DOM 实测矩形 − 容器矩形」，所以 SVG 与容器 1:1，
 * 不需要 `preserveAspectRatio="none"` 拉伸（拉伸会把小鸟压扁）。
 * 容器尺寸变化、数据变化都会重测：ResizeObserver + 深 watch + nextTick。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type { ReChartTopologyData, TopologyNode } from "./types";

const props = withDefaults(
  defineProps<{
    /** 拓扑数据；null 时渲染空态 */
    data: ReChartTopologyData | null;
    /** 容器高度 */
    height?: string;
    /** 主题 */
    theme?: "light" | "dark";
  }>(),
  { height: "100%", theme: "light" },
);

/** kind → 列标题（未命中时直接用 kind 原文） */
const COLUMN_TITLE: Record<string, string> = {
  client: "调用方",
  app: "调用方",
  gateway: "网关",
  proxy: "网关",
  upstream: "上游",
  provider: "供应商",
  model: "模型",
  storage: "存储",
};

interface Column {
  key: string;
  label: string;
  nodes: TopologyNode[];
}

/** 节点分列：按 kind 首次出现顺序，保证同一份数据每次渲染列序稳定 */
const columns = computed<Column[]>(() => {
  const list = props.data?.nodes ?? [];
  const buckets = new Map<string, TopologyNode[]>();
  for (const node of list) {
    const key = node.kind || "default";
    const bucket = buckets.get(key);
    if (bucket) bucket.push(node);
    else buckets.set(key, [node]);
  }
  return [...buckets.entries()].map(([key, nodes]) => ({
    key,
    label: COLUMN_TITLE[key] ?? (key === "default" ? "节点" : key),
    nodes,
  }));
});

/* ==================== 连线坐标实测 ==================== */

interface NodeBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
}

interface Wire {
  id: string;
  d: string;
  mx: number;
  my: number;
  label?: string;
  active: boolean;
  status: string;
  dur: string;
  begin: string;
}

const rootRef = ref<HTMLElement | null>(null);
/** 非响应式：函数 ref 写入它不会触发重渲染，避免自激 */
const nodeEls = new Map<string, HTMLElement>();

function setNodeRef(id: string) {
  return (el: unknown) => {
    if (el instanceof HTMLElement) nodeEls.set(id, el);
    else nodeEls.delete(id);
  };
}

const size = reactive({ w: 0, h: 0 });
const wires = ref<Wire[]>([]);

async function measure() {
  await nextTick();
  const root = rootRef.value;
  if (!root) return;
  const box = root.getBoundingClientRect();
  size.w = Math.round(box.width);
  size.h = Math.round(box.height);

  const data = props.data;
  if (!data) {
    wires.value = [];
    return;
  }

  const posOf = (id: string): NodeBox | null => {
    const el = nodeEls.get(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const left = r.left - box.left;
    const top = r.top - box.top;
    return {
      left,
      right: left + r.width,
      top,
      bottom: top + r.height,
      cx: left + r.width / 2,
      cy: top + r.height / 2,
    };
  };

  wires.value = data.edges
    .map((edge, index): Wire | null => {
      const a = posOf(edge.from);
      const b = posOf(edge.to);
      if (!a || !b) return null;

      // 三段式走线：正向 → 左右直连；反向 → 左侧绕回；同列/重叠 → 右侧外抛
      let x0: number, y0: number, x1: number, y1: number, c1x: number, c1y: number, c2x: number, c2y: number;
      if (b.left > a.right + 4) {
        const dx = Math.max(48, (b.left - a.right) * 0.45);
        x0 = a.right; y0 = a.cy; x1 = b.left; y1 = b.cy;
        c1x = x0 + dx; c1y = y0; c2x = x1 - dx; c2y = y1;
      } else if (a.left > b.right + 4) {
        const dx = Math.max(48, (a.left - b.right) * 0.45);
        x0 = a.left; y0 = a.cy; x1 = b.right; y1 = b.cy;
        c1x = x0 - dx; c1y = y0; c2x = x1 + dx; c2y = y1;
      } else {
        const dx = 64;
        x0 = a.right; y0 = a.cy; x1 = b.right; y1 = b.cy;
        c1x = x0 + dx; c1y = y0; c2x = x1 + dx; c2y = y1;
      }

      const active = edge.active === true;
      // 每 1.6s 一条线一个相位差，避免多条线的小鸟同步起跳
      const dur = active ? 3.2 : 0;
      return {
        id: `${edge.from}->${edge.to}`,
        d: `M ${round(x0)} ${round(y0)} C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(x1)} ${round(y1)}`,
        // 三次贝塞尔 t=0.5 的解析解，用于放线标签
        mx: round((x0 + 3 * c1x + 3 * c2x + x1) / 8),
        my: round((y0 + 3 * c1y + 3 * c2y + y1) / 8),
        label: edge.label,
        active,
        status: edge.status ?? (active ? "active" : "idle"),
        dur: `${dur}s`,
        // 相位差：多条线的小鸟不同步起跳
        begin: `${-Number(((index * 1.1) % 3.2).toFixed(2))}s`,
      } satisfies Wire;
    })
    .filter((w): w is Wire => w !== null);
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}

/* ==================== 重测时机 ==================== */

let observer: ResizeObserver | null = null;

onMounted(() => {
  void measure();
  if (typeof ResizeObserver !== "undefined" && rootRef.value) {
    observer = new ResizeObserver(() => {
      void measure();
    });
    observer.observe(rootRef.value);
  }
  window.addEventListener("resize", onWindowResize);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
  window.removeEventListener("resize", onWindowResize);
  nodeEls.clear();
});

function onWindowResize() {
  void measure();
}

watch(
  () => props.data,
  () => {
    void measure();
  },
  { deep: true },
);
</script>

<style scoped>
.re-chart-topology {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 260px;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-primary, #1f2937);
}

/* ---- 舞台 ---- */
.re-chart-topology__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 220px;
  padding: 6px 4px 12px;
  border-radius: 12px;
  background: var(--el-fill-color-lighter, #f8fafc);
  overflow: hidden;
}
.re-chart-topology__columns {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  height: 100%;
}
.re-chart-topology__col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}
.re-chart-topology__col-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--el-text-color-secondary, #94a3b8);
  padding-left: 2px;
}
.re-chart-topology__col-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
}

/* ---- 节点卡片 ---- */
.re-chart-topology__node {
  position: relative;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #e5e7eb);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.re-chart-topology__node.is-active {
  border-color: var(--el-color-primary, #6366f1);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9, rgba(99, 102, 241, 0.12));
}
.re-chart-topology__node.is-limited {
  border-color: var(--el-color-warning, #f59e0b);
}
.re-chart-topology__node.is-offline {
  opacity: 0.6;
}
.re-chart-topology__node-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.re-chart-topology__node-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-info, #94a3b8);
}
.re-chart-topology__node.is-active .re-chart-topology__node-dot {
  background: var(--el-color-success, #22c55e);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.16);
}
.re-chart-topology__node.is-limited .re-chart-topology__node-dot {
  background: var(--el-color-warning, #f59e0b);
}
.re-chart-topology__node.is-offline .re-chart-topology__node-dot {
  background: var(--el-color-danger, #ef4444);
}
.re-chart-topology__node-label {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-topology__node-detail {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-topology__node-meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.re-chart-topology__chip {
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.6;
  color: var(--el-text-color-regular, #64748b);
  background: var(--el-fill-color-light, #f1f5f9);
}

/* ---- 连线 ---- */
.re-chart-topology__wires {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: visible;
}
.re-chart-topology__wire {
  fill: none;
  stroke: var(--el-border-color, #cbd5e1);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0.75;
}
.re-chart-topology__wire.is-limited {
  stroke: var(--el-color-warning, #f59e0b);
}
.re-chart-topology__wire.is-offline {
  stroke: var(--el-color-danger, #ef4444);
  stroke-dasharray: 2 4;
}
.re-chart-topology__wire.is-active {
  stroke: var(--el-color-primary, #6366f1);
  stroke-width: 2.2;
  opacity: 1;
  stroke-dasharray: 7 7;
  animation: re-chart-topology-flow 0.9s linear infinite;
}
.re-chart-topology__wire-glow {
  fill: none;
  stroke: var(--el-color-primary, #6366f1);
  stroke-width: 7;
  stroke-linecap: round;
  opacity: 0.12;
  filter: blur(2px);
}
@keyframes re-chart-topology-flow {
  to {
    stroke-dashoffset: -28;
  }
}
.re-chart-topology__wire-label {
  font-size: 10px;
  fill: var(--el-text-color-secondary, #94a3b8);
  paint-order: stroke;
  stroke: var(--el-fill-color-lighter, #f8fafc);
  stroke-width: 3px;
  stroke-linejoin: round;
}

/* ---- 小鸟 ---- */
.re-chart-topology__bird {
  fill: var(--el-color-primary, #6366f1);
  stroke: none;
}
.re-chart-topology__bird-body {
  opacity: 0.95;
}
.re-chart-topology__bird-wing {
  fill: var(--el-color-primary-light-3, #a5b4fc);
  transform-origin: -2px -1px;
  animation: re-chart-topology-flap 0.42s ease-in-out infinite alternate;
}
.re-chart-topology__bird-tail,
.re-chart-topology__bird-head {
  fill: var(--el-color-primary, #6366f1);
}
.re-chart-topology__bird-eye {
  fill: #fff;
}
.re-chart-topology__bird-packet {
  fill: var(--el-color-warning, #f59e0b);
  stroke: var(--el-bg-color, #fff);
  stroke-width: 1;
}
@keyframes re-chart-topology-flap {
  from {
    transform: rotate(-16deg);
  }
  to {
    transform: rotate(20deg);
  }
}
.re-chart-topology__packet {
  fill: var(--el-color-primary-light-5, #818cf8);
  opacity: 0.8;
}

/* ---- 图例 ---- */
.re-chart-topology__legend {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
}
.re-chart-topology__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.re-chart-topology__legend-line {
  width: 22px;
  height: 0;
  border-top: 2px solid var(--el-border-color, #cbd5e1);
}
.re-chart-topology__legend-line.is-active {
  border-top-style: dashed;
  border-color: var(--el-color-primary, #6366f1);
}
.re-chart-topology__legend-line.is-limited {
  border-color: var(--el-color-warning, #f59e0b);
}
.re-chart-topology__legend-bird {
  width: 10px;
  height: 10px;
  border-radius: 50% 50% 50% 0;
  background: var(--el-color-primary, #6366f1);
  transform: rotate(-45deg);
}

/* ---- 空态 ---- */
.re-chart-topology__empty {
  flex: 1;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed var(--el-border-color, #cbd5e1);
  border-radius: 12px;
  background: var(--el-fill-color-blank, #fff);
}
.re-chart-topology__empty-title {
  font-size: 13px;
  color: var(--el-text-color-regular, #64748b);
}
.re-chart-topology__empty-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
}

/* 无障碍：系统开启「减少动态效果」时只保留静态高亮 */
@media (prefers-reduced-motion: reduce) {
  .re-chart-topology__wire.is-active,
  .re-chart-topology__bird-wing {
    animation: none;
  }
  .re-chart-topology__bird-wrap,
  .re-chart-topology__packet {
    display: none;
  }
}
</style>