<template>
  <div ref="rootRef" class="re-chart-context" :class="{ 'is-compact': !chrome }" :style="{ height }">
    <div v-if="!vm" class="re-chart-context__empty">
      <span class="re-chart-context__empty-title">暂无可展示的上下文数据</span>
      <span class="re-chart-context__empty-desc">
        数据结构须为 { used, total, slices }；来源形状不同请传入 transform 归一
      </span>
    </div>

    <template v-else>
      <!-- 头部：来源 + 实时徽标 + 三种画法切换（宿主自带抬头时整块不渲染） -->
      <header v-if="chrome" class="re-chart-context__head">
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
            :aria-label="mode.label"
            @click="viewMode = mode.key"
          >
            <ContextModeIcon :mode="mode.key" :size="14" />
          </button>
        </div>
      </header>

      <!-- 统计区 -->
      <div v-if="chrome" class="re-chart-context__stats">
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
        :class="{ 'is-dimmed': !!hoveredKey }"
        @mouseleave="onPointerLeave"
      >
        <div
          v-for="cell in cells"
          :key="cell.key"
          class="re-chart-context__cell"
          :class="{
            'is-free': cell.slice.kind === 'free',
            'is-dim': isDimSlice(cell.slice),
            'is-active': hoveredKey === cell.key,
            'is-clickable': clickToExpand,
          }"
          :data-key="cell.key"
          :data-kind="cell.slice.kind ?? 'other'"
          :style="cellStyle(cell)"
          :role="clickToExpand ? 'button' : undefined"
          :tabindex="clickToExpand ? 0 : undefined"
          @mouseenter="onSliceEnter($event, cell.slice)"
          @mousemove="onPointerMove"
          @focus="onSliceEnter($event, cell.slice)"
          @blur="onPointerLeave"
          @click="onSliceClick(cell.slice)"
          @keydown.enter="onSliceClick(cell.slice)"
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
      <div
        v-else-if="viewMode === 'dots'"
        class="re-chart-context__dots"
        :class="{ 'is-dimmed': !!hoveredKey }"
        :aria-label="`${DOT_COUNT} 格点阵，每格约 ${perDotText} tokens`"
        @mouseleave="onPointerLeave"
      >
        <span
          v-for="(dot, i) in dots"
          :key="i"
          class="re-chart-context__dot"
          :class="{
            'is-free': dot.slice?.kind === 'free',
            'is-dim': isDimSlice(dot.slice),
            'is-active': hoveredKey === dot.slice?.key,
            'is-clickable': clickToExpand,
          }"
          :style="{ background: dot.color }"
          @mouseenter="dot.slice && onSliceEnter($event, dot.slice)"
          @mousemove="onPointerMove"
          @click="onSliceClick(dot.slice)"
        />
      </div>

      <!--
        画法 C：水位仪表。
        左罐从底往上按占用堆叠、剩余留空；右侧给一个主读数 + 前几类占比。
        和面积图/点阵图看的是同一份 slices，只是把「还剩多少」摆到最前面。
      -->
      <div v-else class="re-chart-context__gauge" @mouseleave="onPointerLeave">
        <div
          class="re-chart-context__gauge-tank"
          role="img"
          :aria-label="`已用 ${percentText}%，窗口 ${formatTokens(vm.total)}`"
        >
          <span
            v-for="s in sortedSlices"
            :key="s.key"
            class="re-chart-context__gauge-seg"
            :class="{
              'is-free': s.kind === 'free',
              'is-dim': isDimSlice(s),
              'is-active': hoveredKey === s.key,
              'is-clickable': clickToExpand,
            }"
            :data-key="s.key"
            :style="{ flexGrow: s.tokens, background: sliceColor(s) }"
            @mouseenter="onSliceEnter($event, s)"
            @mousemove="onPointerMove"
            @click="onSliceClick(s)"
          />
        </div>
        <div class="re-chart-context__gauge-side">
          <div class="re-chart-context__gauge-read">
            <b>{{ percentText }}%</b>
            <span>已用 {{ formatTokens(vm.used) }} / {{ formatTokens(vm.total) }}</span>
          </div>
          <ul class="re-chart-context__gauge-rows">
            <li v-for="row in gaugeRows" :key="row.key">
              <i :style="{ background: row.color }" />
              <span>{{ row.label }}</span>
              <b>{{ row.pct }}%</b>
            </li>
          </ul>
        </div>
      </div>

      <!-- 图例 -->
      <footer v-if="chrome" class="re-chart-context__legend">
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

      <!-- 1.4 点击展开：直接把全部切片摊开，不走弹层 -->
      <section v-if="clickToExpand && expanded" class="re-chart-context__detail">
        <header class="re-chart-context__detail-head">
          <span class="re-chart-context__detail-title">
            全部切片 · {{ allSlices.length }} 项
          </span>
          <button type="button" class="re-chart-context__detail-close" @click="expanded = false">
            收起
          </button>
        </header>
        <ul class="re-chart-context__detail-list">
          <li v-for="s in allSlices" :key="s.key" class="re-chart-context__detail-item">
            <span class="re-chart-context__detail-dot" :style="{ background: sliceColor(s) }" />
            <span class="re-chart-context__detail-label">{{ s.label }}</span>
            <span class="re-chart-context__detail-kind">{{ sliceKindLabel(s.kind) }}</span>
            <span class="re-chart-context__detail-tokens">{{ formatTokens(s.tokens) }}</span>
            <span class="re-chart-context__detail-pct">{{ pctOfTotal(s) }}%</span>
          </li>
        </ul>
      </section>

      <!-- 1.3 悬停详情：不依赖 title 气泡，小到看不到标签的块也能看全 -->
      <div
        v-if="tip.visible && tip.slice"
        class="re-chart-context__tip"
        :style="{ left: `${tip.x}px`, top: `${tip.y}px` }"
        role="tooltip"
      >
        <span class="re-chart-context__tip-title">{{ tip.slice.label }}</span>
        <span class="re-chart-context__tip-grid">
          <span class="re-chart-context__tip-label">类别</span>
          <span class="re-chart-context__tip-value">{{ sliceKindLabel(tip.slice.kind) }}</span>
          <span class="re-chart-context__tip-label">占用</span>
          <span class="re-chart-context__tip-value">{{ formatTokens(tip.slice.tokens) }} tokens</span>
          <span class="re-chart-context__tip-label">占窗口</span>
          <span class="re-chart-context__tip-value">{{ pctOfTotal(tip.slice) }}%</span>
          <span class="re-chart-context__tip-label">占已用</span>
          <span class="re-chart-context__tip-value">{{ pctOfUsed(tip.slice) }}%</span>
        </span>
        <span v-if="clickToExpand" class="re-chart-context__tip-hint">点击展开全部切片</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 上下文窗口（ReChart type="context"）。
 *
 * 同一份 `{ used, total, slices }` 数据的**三种画法**，切换按钮在头部：
 *  - `area`：面积图，每块面积 ∝ token 占比（自实现 slice & dice treemap，
 *    不引第三方布局库；宽度用 ResizeObserver 实测，块大小随容器变）；
 *  - `dots`：点阵图，200 格固定总量，每格代表 0.5%，颜色与面积图完全一致，
 *    所以两种画法看的是同一件事，只是细粒度不同；
 *  - `gauge`：水位仪表，左侧竖向罐体按占用堆叠、右侧给主读数与前几类占比，
 *    把「还剩多少」摆到最前面。
 *
 * 剩余空间：`total - used` 在面板内部补齐（见 normalizeContextWindow），
 * 保证三种画法的格子/面积/水位总和都等于窗口总量。
 *
 * 交互口径：
 *  - 悬停某块时，**同类别**的块保持清晰、其余类别虚化（便于看清「这一组占了多少」）；
 *  - 悬停详情走自绘浮层（不是原生 title）：类别 / 占用 / 占窗口 / 占已用 全给，
 *    小块（尺寸不足不显示标签）同样能看全；
 *  - `clickToExpand`（默认开）点击任意块即在图下方摊开全部切片清单，不弹对话框。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import ContextModeIcon from "./ContextModeIcon.vue";
import type { ContextSlice, ContextViewMode, ReChartContextData } from "./types";
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
    /**
     * 点击切片是否在图下方展开「全部切片」清单（默认 true）。
     * 关掉后图只读：不响应点击，也没有展开区。
     */
    clickToExpand?: boolean;
    /** 初始画法；宿主传新值时跟随切换（受控），切换时另发 mode-change */
    mode?: ContextViewMode;
    /** 是否渲染自带的头部 / 统计 / 图例（默认 true）；宿主自带抬头时置 false */
    chrome?: boolean;
  }>(),
  { height: "100%", clickToExpand: true, mode: "area", chrome: true },
);

const emit = defineEmits<{
  /** 切换画法（受控用法下由宿主写回 mode） */
  (e: "mode-change", mode: ContextViewMode): void;
  /** 点了某个切片（宿主可据此过滤明细；是否展开仍由 clickToExpand 决定） */
  (e: "context-click", slice: ContextSlice): void;
}>();

/** 三种画法：拼贴面积 / 点阵密度 / 水位仪表 */
const MODES: Array<{ key: ContextViewMode; label: string }> = [
  { key: "area", label: "拼贴面积" },
  { key: "dots", label: "点阵密度" },
  { key: "gauge", label: "水位仪表" },
];

/** 受控 + 非受控两用：宿主传 mode 就跟随，点击时一律发事件 */
const innerMode = ref<ContextViewMode>(props.mode);
watch(
  () => props.mode,
  (mode) => {
    if (mode) innerMode.value = mode;
  },
);
const viewMode = computed<ContextViewMode>({
  get: () => innerMode.value,
  set: (mode) => {
    if (innerMode.value === mode) return;
    innerMode.value = mode;
    emit("mode-change", mode);
  },
});

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

/* ==================== 悬停 / 展开 ==================== */

const hoveredKey = ref<string | null>(null);
const expanded = ref(false);
const rootRef = ref<HTMLElement | null>(null);

/** 悬停块所属类别：同类别的块保持清晰，其余虚化 */
/** 悬停中的那一块本身（拿不到 key 时视为没有命中） */
const hoveredSlice = computed<ContextSlice | null>(() => {
  const key = hoveredKey.value;
  if (!key) return null;
  return (vm.value?.slices ?? []).find((s) => s.key === key) ?? null;
});

/**
 * 该切片是否应虚化。
 *
 * 给了 kind 的按**类别**分组：同一组（同 kind）的块一起保持清晰，
 * 才能回答「这一组总共占了多少」，而不是只剩鼠标下那一块孤零零地亮着。
 * 没给 kind 的宿主（每个切片本身就是一类，比如控制台的五个构成项）
 * 按**单块**处理：悬停一块，其余全部虚化。
 */
function isDimSlice(slice?: ContextSlice | null): boolean {
  const hovered = hoveredSlice.value;
  if (!hovered || !slice) return false;
  if (slice.key === hovered.key) return false;
  if (hovered.kind && slice.kind) return slice.kind !== hovered.kind;
  return true;
}

/** 悬停浮层：位置相对组件根节点，避免被父级 overflow 裁掉 */
const tip = reactive({
  visible: false,
  x: 0,
  y: 0,
  slice: null as ContextSlice | null,
});

const TIP_WIDTH = 190;
const TIP_HEIGHT = 116;

function onSliceEnter(ev: MouseEvent | FocusEvent, slice: ContextSlice): void {
  hoveredKey.value = slice.key;
  tip.slice = slice;
  tip.visible = true;
  // 键盘聚焦没有指针坐标，浮层留在默认位置，只保证详情可见
  if (ev instanceof MouseEvent) onPointerMove(ev);
}

function onPointerMove(ev: MouseEvent): void {
  const root = rootRef.value;
  if (!root || !tip.visible) return;
  const box = root.getBoundingClientRect();
  const maxX = Math.max(8, box.width - TIP_WIDTH - 8);
  const maxY = Math.max(8, box.height - TIP_HEIGHT - 8);
  tip.x = Math.min(maxX, Math.max(8, ev.clientX - box.left + 14));
  tip.y = Math.min(maxY, Math.max(8, ev.clientY - box.top + 14));
}

function onPointerLeave(): void {
  hoveredKey.value = null;
  tip.visible = false;
}

function onSliceClick(slice?: ContextSlice | null): void {
  // 先发事件：宿主可能要用它过滤明细（面板点一下只看这一类），与是否展开无关
  if (slice) emit("context-click", slice);
  if (!props.clickToExpand) return;
  expanded.value = !expanded.value;
}

/** 全部切片（含剩余空间），按占用降序 */
const allSlices = computed<ContextSlice[]>(() => sortedSlices.value);

/** 占窗口百分比（保留一位小数，避免小块全被显示成 0%） */
function pctOfTotal(slice: ContextSlice): string {
  const total = vm.value?.total ?? 0;
  if (total <= 0) return "0";
  const v = (slice.tokens / total) * 100;
  return v > 0 && v < 1 ? v.toFixed(1) : v.toFixed(0);
}

/** 占已用量百分比 */
function pctOfUsed(slice: ContextSlice): string {
  const used = vm.value?.used ?? 0;
  if (used <= 0) return "0";
  const v = (slice.tokens / used) * 100;
  return v > 0 && v < 1 ? v.toFixed(1) : v.toFixed(0);
}

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
    // 底色提到 22%：浅色类（橙/青）在 16% 时几乎与白底同色，
    // 叠加下面按亮度压深的文字色，11px 标签才看得清。
    background: free ? "var(--el-fill-color, #eef2f7)" : tint(color, 22),
    borderColor: free
      ? "var(--el-border-color-light, #dbe2ea)"
      : tint(color, 55),
    color: free ? "var(--el-text-color-secondary, #94a3b8)" : readableTextColor(color),
  };
}

/**
 * 透明淡染：hex 直接算 rgba（jsdom 与其它的计算属性都认），
 * 宿主传 `var(--el-color-*)` 时取不到通道值，退回 `color-mix` 让浏览器算。
 */
function tint(color: string, pct: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(pct / 100).toFixed(2)})`;
}

/** #rrggbb → 通道值；不是 hex（如 CSS 变量）时返回 null */
function hexToRgb(color: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * 文字色：直接用品类色会「浅色底 + 浅色字」糊成一片（橙 #f59e0b 最明显）。
 *
 * hex 按感知亮度压深到 0.42 以内再往墨蓝混一点；宿主给的 CSS 变量取不到 RGB，
 * 统一往墨蓝方向混 72%——中亮度的橙/青被压深、深色不变，浅底上仍有足够对比度。
 */
function readableTextColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return `color-mix(in srgb, ${color} 72%, #0f172a)`;
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  const factor = lum > 0.42 ? 0.42 / Math.max(lum, 0.01) : 1;
  // 15 ≈ #0f172a 的通道值，用来抵消压深后偏灰的问题
  const mix = (v: number) => Math.round(Math.min(255, v * factor * 0.94 + 15 * (1 - factor * 0.94)));
  return `rgb(${mix(rgb[0])}, ${mix(rgb[1])}, ${mix(rgb[2])})`;
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
      slice: slice ?? null,
      color: slice ? sliceColor(slice) : "var(--el-fill-color, #eef2f7)",
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

/**
 * 水位仪表右侧读数：类别聚合后取前三，其余并成一行。
 * 窄栏（约 300px）里五行会挤成一条，三行 + 合计才看得清。
 */
const gaugeRows = computed(() => {
  const rows = legend.value;
  if (rows.length <= 4) {
    return rows.map((r) => ({ key: r.kind, label: r.label, color: r.color, pct: r.pct }));
  }
  const rest = rows.slice(3);
  return [
    ...rows.slice(0, 3).map((r) => ({ key: r.kind, label: r.label, color: r.color, pct: r.pct })),
    {
      key: "__rest__",
      label: `其余 ${rest.length} 类`,
      color: "var(--el-text-color-placeholder, #cbd5e1)",
      pct: rest.reduce((sum, r) => sum + r.pct, 0),
    },
  ];
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 260px;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-primary, #1f2937);
}

/* 宿主自带抬头/图例时只留画布：去掉 260px 的最小高度与块间距，
   高度完全由宿主给（控制台右栏是 132px，不能凭空撑高） */
.re-chart-context.is-compact {
  min-height: 0;
  gap: 0;
}

/* 紧凑模式（宿主只留画布）下三个视图都不得自带最小高度：
   控制台右栏给的是 132px，160px 的下限会直接顶出容器 */
.re-chart-context.is-compact .re-chart-context__area,
.re-chart-context.is-compact .re-chart-context__dots,
.re-chart-context.is-compact .re-chart-context__gauge {
  min-height: 0;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 4px 7px;
  border-radius: 6px;
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
  height: 8px;
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
  padding: 2px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-lighter, #f8fafc);
  box-shadow: inset 0 0 0 1px var(--el-border-color-extra-light, #eef2f7);
}
.re-chart-context__cell {
  position: absolute;
  border-radius: 5px;
  border: 1px solid transparent;
  box-sizing: border-box;
  padding: 4px 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1px;
  transition: left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease,
    opacity 0.18s ease, box-shadow 0.18s ease;
}
/* 同类别保持清晰、其余类别退到 0.2：一组占多少一眼可读 */
.re-chart-context__cell.is-dim {
  opacity: 0.2;
}
.re-chart-context__cell.is-active {
  z-index: 2;
  box-shadow: 0 0 0 2px var(--el-bg-color, #fff), 0 0 0 3px currentColor,
    0 4px 10px rgba(15, 23, 42, 0.12);
}
.re-chart-context__cell.is-clickable {
  cursor: pointer;
}
.re-chart-context__cell.is-clickable:focus-visible {
  outline: 2px solid var(--el-color-primary, #6366f1);
  outline-offset: 1px;
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
  opacity: 0.8;
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
  gap: 4px;
  padding: 10px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter, #f8fafc);
  box-shadow: inset 0 0 0 1px var(--el-border-color-extra-light, #eef2f7);
}
.re-chart-context__dot {
  border-radius: 3px;
  min-height: 4px;
  transition: transform 0.15s ease, opacity 0.18s ease;
}
.re-chart-context__dot.is-free {
  opacity: 0.5;
}
.re-chart-context__dot.is-dim {
  opacity: 0.18;
}
.re-chart-context__dot.is-active {
  transform: scale(1.35);
  box-shadow: 0 0 0 1.5px var(--el-bg-color, #fff);
}
.re-chart-context__dot.is-clickable {
  cursor: pointer;
}
.re-chart-context__dot:hover {
  transform: scale(1.25);
}

/* ---- 水位仪表 ---- */
.re-chart-context__gauge {
  flex: 1 1 auto;
  display: flex;
  gap: 10px;
  min-height: 116px;
  min-width: 0;
}
.re-chart-context__gauge-tank {
  flex: 0 0 44px;
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  padding: 2px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-lighter, #f8fafc);
  box-shadow: inset 0 0 0 1px var(--el-border-color-extra-light, #eef2f7);
}
.re-chart-context__gauge-seg {
  flex-basis: 0;
  min-height: 2px;
  border-radius: 4px;
  transition: opacity 0.18s ease, flex-grow 0.3s ease, box-shadow 0.18s ease;
}
/* 剩余空间只是底噪：看得见罐子有多空，但不该抢已用的色 */
.re-chart-context__gauge-seg.is-free {
  opacity: 0.3;
}
.re-chart-context__gauge-seg.is-dim {
  opacity: 0.16;
}
.re-chart-context__gauge-seg.is-active {
  box-shadow: inset 0 0 0 1.5px var(--el-bg-color, #fff);
}
.re-chart-context__gauge-seg.is-clickable {
  cursor: pointer;
}
.re-chart-context__gauge-side {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
}
.re-chart-context__gauge-read {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.re-chart-context__gauge-read b {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.re-chart-context__gauge-read span {
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-context__gauge-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.re-chart-context__gauge-rows li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-regular, #64748b);
  min-width: 0;
}
.re-chart-context__gauge-rows i {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex: 0 0 auto;
}
.re-chart-context__gauge-rows span {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chart-context__gauge-rows b {
  color: var(--el-text-color-primary, #1f2937);
  font-variant-numeric: tabular-nums;
}

/* ---- 图例 ---- */
.re-chart-context__legend {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  font-size: 11px;
  color: var(--el-text-color-regular, #64748b);
}
.re-chart-context__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--el-fill-color-lighter, #f8fafc);
  border: 1px solid var(--el-border-color-extra-light, #eef2f7);
}
.re-chart-context__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.re-chart-context__legend-pct {
  font-style: normal;
  color: var(--el-text-color-primary, #1f2937);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ---- 悬停详情 ---- */
.re-chart-context__tip {
  position: absolute;
  z-index: 20;
  width: 190px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light, #e2e8f0);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.re-chart-context__tip-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary, #1f2937);
  word-break: break-all;
}
.re-chart-context__tip-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 8px;
  font-size: 11px;
}
.re-chart-context__tip-label {
  color: var(--el-text-color-secondary, #94a3b8);
}
.re-chart-context__tip-value {
  color: var(--el-text-color-primary, #1f2937);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.re-chart-context__tip-hint {
  font-size: 10px;
  color: var(--el-color-primary, #6366f1);
}

/* ---- 展开清单（替代弹窗） ---- */
.re-chart-context__detail {
  flex: 0 0 auto;
  max-height: 190px;
  overflow: auto;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-extra-light, #eef2f7);
  background: var(--el-fill-color-blank, #fff);
}
.re-chart-context__detail-head {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--el-fill-color-lighter, #f8fafc);
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef2f7);
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
}
.re-chart-context__detail-title {
  font-weight: 600;
  color: var(--el-text-color-regular, #64748b);
}
.re-chart-context__detail-close {
  border: none;
  background: transparent;
  padding: 0 2px;
  font-size: 11px;
  color: var(--el-color-primary, #6366f1);
  cursor: pointer;
}
.re-chart-context__detail-list {
  list-style: none;
  margin: 0;
  padding: 2px 0;
}
.re-chart-context__detail-item {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto auto 46px;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  font-size: 11px;
  color: var(--el-text-color-regular, #64748b);
}
.re-chart-context__detail-item:hover {
  background: var(--el-fill-color-lighter, #f8fafc);
}
.re-chart-context__detail-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.re-chart-context__detail-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary, #1f2937);
}
.re-chart-context__detail-kind {
  color: var(--el-text-color-secondary, #94a3b8);
}
.re-chart-context__detail-tokens {
  font-variant-numeric: tabular-nums;
}
.re-chart-context__detail-pct {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary, #1f2937);
  font-weight: 600;
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
