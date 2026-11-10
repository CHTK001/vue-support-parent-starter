<template>
  <div class="re-chart-context" :style="{ height }">
    <div v-if="!vm" class="re-chart-context__empty">
      <span class="re-chart-context__empty-title">暂无可展示的上下文数据</span>
      <span class="re-chart-context__empty-desc">
        数据结构须为 { used, total, slices }；来源形状不同请传入 transform 归一
      </span>
    </div>

    <template v-else>
      <!-- 头部：来源 + 实时徽标 + 两种画法切换 -->
      <header class="re-chart-context__head">
        <div class="re-chart-context__source">
          <span class="re-chart-context__source-name">{{ sourceName }}</span>
          <span v-if="sourceGroup" class="re-chart-context__source-group">{{ sourceGroup }}</span>
          <span v-if="isLive" class="re-chart-context__live">实时</span>
        </div>
        <div class="re-chart-context__switch" role="tablist" aria-label="上下文窗口画法">
          <button
            v-for="mode in MODES"
            :key="mode.key"
            type="button"
            role="tab"
            class="re-chart-context__switch-btn"
            :class="{ 'is-active': viewMode === mode.key }"
            :aria-selected="viewMode === mode.key"
            :title="mode.label"
            @click="viewMode = mode.key"
          >
            {{ mode.label }}
          </button>
        </div>
      </header>

      <!-- 统计区 -->
      <div class="re-chart-context__stats">
        <div class="re-chart-context__stat">
          <span class="re-chart-context__stat-label">已用</span>
          <span class="re-chart-context__stat-value">{{ formatTokens(vm.used) }}</span>
        </div>
        <div class="re-chart-context__stat">
          <span class="re-chart-context__stat-label">窗口</span>
          <span class="re-chart-context__stat-value">{{ formatTokens(vm.total) }}</span>
        </div>
        <div class="re-chart-context__stat">
          <span class="re-chart-context__stat-label">占用</span>
          <span class="re-chart-context__stat-value">{{ percentText }}%</span>
        </div>
        <div class="re-chart-context__bar">
          <span class="re-chart-context__bar-fill" :style="{ width: `${percentText}%` }" />
        </div>
      </div>

      <!-- 画法 A：面积图（treemap） -->
      <div
        v-if="viewMode === 'area'"
        ref="areaRef"
        class="re-chart-context__area"
      >
        <div
          v-for="cell in cells"
          :key="cell.key"
          class="re-chart-context__cell"
          :class="{ 'is-free': cell.slice.kind === 'free' }"
          :data-key="cell.key"
          :data-kind="cell.slice.kind ?? 'other'"
          :style="cellStyle(cell)"
          :title="`${cell.slice.label} · ${formatTokens(cell.slice.tokens)} tokens`"
        >
          <span
            v-if="cell.w > 64 && cell.h > 30"
            class="re-chart-context__cell-label"
          >{{ cell.slice.label }}</span>
          <span
            v-if="cell.w > 64 && cell.h > 46"
            class="re-chart-context__cell-tokens"
          >{{ formatTokens(cell.slice.tokens) }}</span>
        </div>
        <div v-if="!cells.length" class="re-chart-context__placeholder">
          切片为空，无法绘制面积图
        </div>
      </div>

      <!-- 画法 B：点阵图（200 格，同一份数据） -->
      <div v-else class="re-chart-context__dots" :aria-label="`${DOT_COUNT} 格点阵，每格约 ${perDotText} tokens`">
        <span
          v-for="(dot, i) in dots"
          :key="i"
          class="re-chart-context__dot"
          :class="{ 'is-free': dot.kind === 'free' }"
          :style="{ background: dot.color }"
          :title="dot.title"
        />
      </div>

      <footer class="re-chart-context__legend">
        <span
          v-for="item in legend"
          :key="item.kind"
          class="re-chart-context__legend-item"
        >
          <span class="re-chart-context__legend-dot" :style="{ background: item.color }" />
          {{ item.label }}
          <em class="re-chart-context__legend-pct">{{ item.pct }}%</em>
        </span>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 上下文窗口（ReChart type="context"）。
 *
 * 同一份 `{ used, total, slices }` 数据的**两种画法**，切换按钮在头部：
 *  - `area`：面积图，每块面积 ∝ token 占比（自实现 slice & dice treemap，
 *    不引第三方布局库；宽度用 ResizeObserver 实测，块大小随容器变）；
 *  - `dots`：点阵图，200 格固定总量，每格代表 0.5%，颜色与面积图完全一致，
 *    所以两种画法看的是同一件事，只是细粒度不同。
 *
 * 剩余空间：`total - used` 在面板内部补齐（见 normalizeContextWindow），
 * 保证两种画法的格子/面积总和都等于窗口总量。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import type { ContextSlice, ReChartContextData } from "./types";
import {
  assignDots,
  formatTokens,
  layoutTreemap,
  normalizeContextWindow,
  sliceColor,
  sliceKindLabel,
} from "./contract";

const props = withDefaults(
  defineProps<{
    /** 上下文窗口数据；null 时渲染空态 */
    data: ReChartContextData | null;
    /** 容器高度 */
    height?: string;
  }>(),
  { height: "100%" },
);

/** 两种画法 */
const MODES = [
  { key: "area" as const, label: "面积图" },
  { key: "dots" as const, label: "点阵图" },
];
const viewMode = ref<"area" | "dots">("area");

/** 点阵固定格数：200 格 = 每格 0.5%，肉眼可数又不至于糊成一片 */
const DOT_COUNT = 200;

/** 归一后的数据（含自动补齐的剩余空间） */
const vm = computed<ReChartContextData | null>(() => {
  if (!props.data) return null;
  return normalizeContextWindow(props.data);
});

const percent = computed(() => {
  const d = vm.value;
  if (!d) return 0;
  return Math.min(100, Math.max(0, (d.used / d.total) * 100));
});
const percentText = computed(() => (percent.value < 10 ? percent.value.toFixed(1) : Math.round(percent.value).toString()));

/** 来源信息（source 可缺省，模板里统一走这三个 computed 避免 TS18048） */
const sourceName = computed(() => vm.value?.source?.name || "上下文窗口");
const sourceGroup = computed(() => vm.value?.source?.group ?? "");
const isLive = computed(() => vm.value?.source?.status === "实时");

/** 面积图按 token 降序：大块落左上，符合阅读顺序 */
const sortedSlices = computed<ContextSlice[]>(() => {
  const list = vm.value?.slices ?? [];
  return [...list].sort((a, b) => b.tokens - a.tokens);
});

/* ==================== 面积图 ==================== */

const areaRef = ref<HTMLElement | null>(null);
const areaSize = reactive({ w: 0, h: 0 });

const cells = computed(() =>
  areaSize.w > 0 && areaSize.h > 0
    ? layoutTreemap(sortedSlices.value, areaSize.w, areaSize.h)
    : [],
);

/** 块只靠圆角与描边分隔（不缩 w/h），保证面积严格等于 token 占比 */
function cellStyle(cell: { x: number; y: number; w: number; h: number; slice: ContextSlice }) {
  const free = cell.slice.kind === "free";
  const color = sliceColor(cell.slice);
  return {
    left: `${cell.x}px`,
    top: `${cell.y}px`,
    width: `${cell.w}px`,
    height: `${cell.h}px`,
    background: free ? "var(--el-fill-color, #eef2f7)" : withAlpha(color, 0.16),
    borderColor: free ? "var(--el-border-color-light, #dbe2ea)" : withAlpha(color, 0.5),
    color: free ? "var(--el-text-color-secondary, #94a3b8)" : color,
  };
}

/** #rrggbb + alpha → rgba()（不引 color 库，本图颜色全是固定 hex） */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* ==================== 点阵图 ==================== */

const dots = computed(() => {
  const d = vm.value;
  if (!d) return [];
  const ordered = sortedSlices.value;
  const owners = assignDots(ordered, d.total, DOT_COUNT);
  return owners.map((idx) => {
    const slice = ordered[idx];
    return {
      kind: slice?.kind,
      color: slice ? sliceColor(slice) : "var(--el-fill-color, #eef2f7)",
      title: slice ? `${slice.label} · ${formatTokens(slice.tokens)} tokens` : "",
    };
  });
});

const perDotText = computed(() => {
  const d = vm.value;
  if (!d) return "0";
  return formatTokens(d.total / DOT_COUNT);
});

/* ==================== 图例 ==================== */

/** 图例按类别聚合（同类多片只出现一次，占比累加） */
const legend = computed(() => {
  const d = vm.value;
  if (!d) return [];
  const map = new Map<string, { kind: string; color: string; tokens: number; label: string }>();
  for (const s of d.slices) {
    const kind = s.kind ?? "other";
    const hit = map.get(kind);
    if (hit) hit.tokens += s.tokens;
    else
      map.set(kind, {
        kind,
        color: sliceColor(s),
        tokens: s.tokens,
        label: sliceKindLabel(s.kind),
      });
  }
  return [...map.values()]
    .sort((a, b) => b.tokens - a.tokens)
    .map((it) => ({
      ...it,
      pct: d.total > 0 ? Math.round((it.tokens / d.total) * 100) : 0,
    }));
});

/* ==================== 尺寸实测 ==================== */

let observer: ResizeObserver | null = null;

function syncSize() {
  const el = areaRef.value;
  if (!el) return;
  const box = el.getBoundingClientRect();
  areaSize.w = Math.round(box.width);
  areaSize.h = Math.round(box.height);
}

onMounted(() => {
  syncSize();
  if (typeof ResizeObserver !== "undefined" && areaRef.value) {
    observer = new ResizeObserver(() => syncSize());
    observer.observe(areaRef.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<style scoped>
.re-chart-context {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 260px;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-primary, #1f2937);
}

/* ---- 头部 ---- */
.re-chart-context__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.re-chart-context__source {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.re-chart-context__source-name {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-context__source-group {
  font-size: 12px;
  color: var(--el-text-color-secondary, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-context__live {
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.7;
  color: var(--el-color-success, #22c55e);
  background: var(--el-color-success-light-9, rgba(34, 197, 94, 0.12));
}
.re-chart-context__switch {
  flex-shrink: 0;
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light, #f1f5f9);
}
.re-chart-context__switch-btn {
  border: none;
  background: transparent;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular, #64748b);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.re-chart-context__switch-btn.is-active {
  background: var(--el-bg-color, #fff);
  color: var(--el-color-primary, #6366f1);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

/* ---- 统计 ---- */
.re-chart-context__stats {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
.re-chart-context__stat {
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.re-chart-context__stat-label {
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
}
.re-chart-context__stat-value {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.re-chart-context__bar {
  flex: 1 1 120px;
  min-width: 80px;
  height: 6px;
  border-radius: 999px;
  background: var(--el-fill-color, #eef2f7);
  overflow: hidden;
}
.re-chart-context__bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--el-color-primary, #6366f1);
  transition: width 0.3s ease;
}

/* ---- 面积图 ---- */
.re-chart-context__area {
  position: relative;
  flex: 1 1 auto;
  min-height: 160px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-lighter, #f8fafc);
}
.re-chart-context__cell {
  position: absolute;
  border-radius: 4px;
  border: 1px solid transparent;
  box-sizing: border-box;
  padding: 4px 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1px;
  transition: left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease;
}
.re-chart-context__cell-label {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-context__cell-tokens {
  font-size: 10px;
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
}
.re-chart-context__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--el-text-color-secondary, #94a3b8);
}

/* ---- 点阵图 ---- */
.re-chart-context__dots {
  flex: 1 1 auto;
  min-height: 160px;
  display: grid;
  grid-template-columns: repeat(20, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: 3px;
  padding: 8px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter, #f8fafc);
}
.re-chart-context__dot {
  border-radius: 2px;
  min-height: 4px;
  transition: transform 0.15s ease;
}
.re-chart-context__dot.is-free {
  opacity: 0.5;
}
.re-chart-context__dot:hover {
  transform: scale(1.25);
}

/* ---- 图例 ---- */
.re-chart-context__legend {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
}
.re-chart-context__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.re-chart-context__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.re-chart-context__legend-pct {
  font-style: normal;
  color: var(--el-text-color-regular, #64748b);
  font-variant-numeric: tabular-nums;
}

/* ---- 空态 ---- */
.re-chart-context__empty {
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
.re-chart-context__empty-title {
  font-size: 13px;
  color: var(--el-text-color-regular, #64748b);
}
.re-chart-context__empty-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
}
</style>