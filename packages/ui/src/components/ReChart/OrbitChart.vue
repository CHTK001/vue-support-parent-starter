<template>
  <div class="re-chart-orbit" :style="{ height }">
    <div v-if="!data" class="re-chart-orbit__empty">
      <span class="re-chart-orbit__empty-title">暂无可展示的轨道数据</span>
      <span class="re-chart-orbit__empty-desc">
        数据结构须为 { center, rings }；来源形状不同请传入 transform 归一
      </span>
    </div>

    <template v-else>
      <div class="re-chart-orbit__body">
        <div class="re-chart-orbit__stage">
          <svg
            class="re-chart-orbit__svg"
            viewBox="0 0 400 400"
            role="img"
            :aria-label="`${data.center.label} 的权限轨道`"
          >
            <!-- 外圈刻度：12 等分，纯粹给量感，不参与读数 -->
            <g class="re-chart-orbit__ticks" aria-hidden="true">
              <line
                v-for="tick in ticks"
                :key="tick.angle"
                :x1="tick.x1"
                :y1="tick.y1"
                :x2="tick.x2"
                :y2="tick.y2"
              />
            </g>

            <!-- 环：底轨 + 弧长（弧长 = percent） -->
            <g v-for="ring in rings" :key="ring.key" class="re-chart-orbit__ring">
              <circle
                class="re-chart-orbit__track"
                cx="200"
                cy="200"
                :r="ring.r"
                fill="none"
              />
              <circle
                v-if="ring.percent > 0"
                class="re-chart-orbit__arc"
                cx="200"
                cy="200"
                :r="ring.r"
                fill="none"
                :stroke="ring.color"
                :stroke-dasharray="ring.dash"
                transform="rotate(-90 200 200)"
                role="button"
                tabindex="0"
                :aria-label="`${ring.label} ${Math.round(ring.percent)}%`"
                @click="pick(ring.key)"
                @keydown.enter.prevent="pick(ring.key)"
                @keydown.space.prevent="pick(ring.key)"
              />
            </g>

            <!-- 卫星标注：外缘的小读数 -->
            <g v-for="sat in satellites" :key="sat.id" class="re-chart-orbit__sat">
              <circle :cx="sat.x" :cy="sat.y" r="2.6" :fill="sat.color" />
              <text
                :x="sat.x"
                :y="sat.y + sat.dy"
                :text-anchor="sat.anchor"
                class="re-chart-orbit__sat-label"
              >{{ sat.label }}</text>
              <text
                v-if="sat.value"
                :x="sat.x"
                :y="sat.y + sat.dy + 12"
                :text-anchor="sat.anchor"
                class="re-chart-orbit__sat-value"
              >{{ sat.value }}</text>
            </g>
          </svg>

          <div class="re-chart-orbit__center">
            <span class="re-chart-orbit__center-label">{{ data.center.label }}</span>
            <span v-if="data.center.detail" class="re-chart-orbit__center-detail">
              {{ data.center.detail }}
            </span>
            <span v-if="data.center.caption" class="re-chart-orbit__center-caption">
              {{ data.center.caption }}
            </span>
          </div>
        </div>

        <ul class="re-chart-orbit__legend">
          <li
            v-for="ring in rings"
            :key="ring.key"
            class="re-chart-orbit__item"
            :class="{ 'is-picked': ring.key === picked }"
            role="button"
            tabindex="0"
            @click="pick(ring.key)"
            @keydown.enter.prevent="pick(ring.key)"
            @keydown.space.prevent="pick(ring.key)"
          >
            <i class="re-chart-orbit__dot" :style="{ background: ring.color }" />
            <span class="re-chart-orbit__meta">
              <span class="re-chart-orbit__name">{{ ring.label }}</span>
              <span v-if="ring.detail" class="re-chart-orbit__desc">{{ ring.detail }}</span>
            </span>
            <span class="re-chart-orbit__num">
              <b>{{ Math.round(ring.percent) }}<small>%</small></b>
              <span v-if="ring.value">{{ ring.value }}</span>
            </span>
          </li>
        </ul>
      </div>

      <div v-if="data.note" class="re-chart-orbit__note">{{ data.note }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 权限轨道（ReChart type="orbit"）。
 *
 * 解决的问题：一堆百分比排成进度条时，「整体有多大、还剩多少」要靠脑补。
 * 这里把每个维度画成一圈同心弧：弧长就是覆盖率，圈越外代表越偏外层的范围。
 *
 * 渲染要点：
 *  - 用 `stroke-dasharray` 画弧，`stroke-linecap: round` 让弧端有明确终点；
 *  - 底轨单独画一层，0% 时也能看见「这一圈存在但空着」；
 *  - 圆心是 DOM 文本而非 SVG text，长名字可以换行；
 *  - 外缘卫星标注按角度摆放，靠近右/左边界时自动改锚点，避免被裁掉。
 *
 * 配色只取 koi 令牌，暗色主题下随令牌提亮，不写死色值。
 */
import { computed, ref } from "vue";
import type { ReChartOrbitData } from "./types";

const props = withDefaults(
  defineProps<{
    /** 轨道数据；null 时渲染空态 */
    data: ReChartOrbitData | null;
    /** 容器高度 */
    height?: string;
  }>(),
  { height: "100%" },
);

const emit = defineEmits<{
  /** 点了某一环 */
  (e: "select", payload: { id: string }): void;
}>();

/** 环色梯次：全部是语义令牌 */
const RING_COLORS = [
  "var(--brand-500)",
  "var(--metric-net)",
  "var(--status-success)",
  "var(--status-warning)",
  "var(--proto-vnc)",
  "var(--metric-disk)",
];

const picked = ref<string | null>(null);

const SVG_SIZE = 400;
const CENTER = SVG_SIZE / 2;
/** 内环半径 / 外环半径（别贴边，给卫星标注留空间） */
const R_MIN = 72;
const R_MAX = 150;

interface RingView {
  key: string;
  label: string;
  detail?: string;
  value?: string;
  percent: number;
  color: string;
  r: number;
  dash: string;
}

const rings = computed<RingView[]>(() => {
  const list = props.data?.rings ?? [];
  const count = list.length;
  return list.map((ring, index) => {
    const percent = Math.min(100, Math.max(0, finite(ring.percent)));
    const r = count > 1 ? R_MIN + ((R_MAX - R_MIN) * index) / (count - 1) : 132;
    const circumference = 2 * Math.PI * r;
    const arc = (circumference * percent) / 100;
    return {
      key: ring.key,
      label: ring.label,
      detail: ring.detail,
      value: ring.value,
      percent,
      color: ring.color || RING_COLORS[index % RING_COLORS.length],
      r,
      // 第二段给足剩余长度并多留 1px，避免 100% 时圆头盖不严
      dash: `${arc} ${circumference - arc + 1}`,
    };
  });
});

/** 12 等分刻度，画在最外环之外 */
const ticks = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const inner = R_MAX + 8;
    const outer = R_MAX + 14;
    return {
      angle: i,
      x1: round(CENTER + Math.cos(angle) * inner),
      y1: round(CENTER + Math.sin(angle) * inner),
      x2: round(CENTER + Math.cos(angle) * outer),
      y2: round(CENTER + Math.sin(angle) * outer),
    };
  }),
);

interface SatelliteView {
  id: string;
  label: string;
  value?: string;
  x: number;
  y: number;
  dy: number;
  anchor: "start" | "middle" | "end";
  color: string;
}

const satellites = computed<SatelliteView[]>(() => {
  const list = props.data?.satellites ?? [];
  return list.map((sat, index) => {
    const ring = rings.value.find((r) => r.key === sat.ring) ?? rings.value[rings.value.length - 1];
    const radius = (ring?.r ?? R_MAX) + 26;
    const angle = (((sat.angle ?? 0) - 90) * Math.PI) / 180;
    const x = CENTER + Math.cos(angle) * radius;
    const y = CENTER + Math.sin(angle) * radius;
    // 左右各留 40px 判断锚点，靠边时不至于被画布裁掉
    const anchor = x > CENTER + 60 ? "start" : x < CENTER - 60 ? "end" : "middle";
    return {
      id: sat.id,
      label: sat.label,
      value: sat.value,
      x: round(x),
      y: round(y),
      // 上半个圆把文字放在点上方，下半个圆放下方
      dy: y < CENTER ? -10 : 20,
      anchor,
      color: ring?.color ?? "var(--brand-500)",
    };
  });
});

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function pick(key: string) {
  picked.value = key;
  emit("select", { id: key });
}
</script>

<style scoped>
.re-chart-orbit {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 320px;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #1f2430));
}

.re-chart-orbit__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

/* ---- 画布 ---- */
.re-chart-orbit__stage {
  position: relative;
  flex: 0 0 auto;
  width: min(58%, 380px);
  aspect-ratio: 1;
  min-width: 240px;
  margin: 0 auto;
}
.re-chart-orbit__svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.re-chart-orbit__ticks line {
  stroke: var(--border-default, #e3e6ef);
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.8;
}
.re-chart-orbit__track {
  stroke: var(--border-subtle, #eef0f6);
  stroke-width: 12;
}
.re-chart-orbit__arc {
  stroke-width: 12;
  stroke-linecap: round;
  cursor: pointer;
  transition: stroke-width 0.2s ease, opacity 0.2s ease;
}
.re-chart-orbit__arc:hover,
.re-chart-orbit__arc:focus-visible {
  stroke-width: 16;
  outline: none;
}

/* ---- 圆心 ---- */
.re-chart-orbit__center {
  position: absolute;
  inset: 33%;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  text-align: center;
  pointer-events: none;
}
.re-chart-orbit__center-label {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.2;
  color: var(--text-primary, #1f2430);
  overflow-wrap: anywhere;
}
.re-chart-orbit__center-detail {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--text-tertiary, #6b7280);
  overflow-wrap: anywhere;
}
.re-chart-orbit__center-caption {
  font-size: 10px;
  color: var(--text-secondary, #5c6270);
  line-height: 1.35;
}

/* ---- 卫星 ---- */
.re-chart-orbit__sat-label {
  font-size: 9.5px;
  fill: var(--text-secondary, #5c6270);
  paint-order: stroke;
  stroke: var(--bg-container, #fff);
  stroke-width: 3px;
  stroke-linejoin: round;
}
.re-chart-orbit__sat-value {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 9px;
  fill: var(--text-tertiary, #6b7280);
  paint-order: stroke;
  stroke: var(--bg-container, #fff);
  stroke-width: 3px;
  stroke-linejoin: round;
}

/* ---- 图例（同时是环的读数表） ---- */
.re-chart-orbit__legend {
  flex: 1 1 200px;
  min-width: 180px;
  max-width: 340px;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.re-chart-orbit__item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 9px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.re-chart-orbit__item:hover,
.re-chart-orbit__item:focus-visible {
  background: var(--bg-fill, var(--el-fill-color-light, #f5f7fa));
  outline: none;
}
.re-chart-orbit__item.is-picked {
  background: var(--brand-50, #f6f4ff);
  border-color: color-mix(in srgb, var(--brand-500) 24%, transparent);
}
.re-chart-orbit__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
.re-chart-orbit__meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.re-chart-orbit__name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.re-chart-orbit__desc {
  font-size: 10px;
  color: var(--text-tertiary, #6b7280);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.re-chart-orbit__num {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  text-align: right;
}
.re-chart-orbit__num b {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, #1f2430);
}
.re-chart-orbit__num b small {
  font-size: 9px;
  margin-left: 1px;
  color: var(--text-tertiary, #6b7280);
}
.re-chart-orbit__num span {
  font-size: 9.5px;
  color: var(--text-tertiary, #6b7280);
}
.re-chart-orbit__note {
  flex-shrink: 0;
  font-size: 10.5px;
  color: var(--text-tertiary, #6b7280);
}

/* ---- 空态 ---- */
.re-chart-orbit__empty {
  flex: 1;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed var(--border-default, #e3e6ef);
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-container, #fff);
}
.re-chart-orbit__empty-title {
  font-size: 13px;
  color: var(--text-secondary, #5c6270);
}
.re-chart-orbit__empty-desc {
  font-size: 11px;
  color: var(--text-tertiary, #6b7280);
}

@media (prefers-reduced-motion: reduce) {
  .re-chart-orbit__arc,
  .re-chart-orbit__item {
    transition: none;
  }
}
</style>
