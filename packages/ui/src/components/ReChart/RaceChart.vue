<template>
  <div class="re-chart-race" :style="{ height }">
    <div v-if="!data || !frames.length" class="re-chart-race__empty">
      <span class="re-chart-race__empty-title">暂无可竞速的数据</span>
      <span class="re-chart-race__empty-desc">
        数据结构须为 { items, frames }；来源形状不同请传入 transform 归一
      </span>
    </div>

    <div v-else-if="!bars.length" class="re-chart-race__empty">
      <span class="re-chart-race__empty-title">条目还没有数值</span>
      <span class="re-chart-race__empty-desc">items 至少给一项，且帧里要有对应 id 的数值</span>
    </div>

    <div v-else class="re-chart-race__stage">
      <header v-if="chrome" class="re-chart-race__head">
        <div class="re-chart-race__heading">
          <span v-if="data.title" class="re-chart-race__title">{{ data.title }}</span>
          <span v-if="frameLabel" class="re-chart-race__frame">{{ frameLabel }}</span>
        </div>
        <div class="re-chart-race__actions">
          <span class="re-chart-race__count">{{ index + 1 }} / {{ frames.length }}</span>
          <button
            type="button"
            class="re-chart-race__btn"
            :aria-label="playing ? '暂停' : '播放'"
            :title="playing ? '暂停' : '播放'"
            :disabled="frames.length < 2"
            @click="toggle"
          >
            <svg v-if="playing" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <rect x="3" y="2.5" width="3.5" height="11" rx="1" fill="currentColor" />
              <rect x="9.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor" />
            </svg>
            <svg v-else viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M4 2.6v10.8a1 1 0 0 0 1.53.85l8.2-5.4a1 1 0 0 0 0-1.7l-8.2-5.4A1 1 0 0 0 4 2.6Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      <ReEcharts
        class="re-chart-race__canvas"
        height="100%"
        :option="option"
        :theme="theme"
        @click="onBarClick"
      />

      <div
        v-if="chrome && frames.length > 1"
        class="re-chart-race__track"
        role="progressbar"
        :aria-valuemin="1"
        :aria-valuemax="frames.length"
        :aria-valuenow="index + 1"
        :aria-valuetext="frameLabel"
      >
        <span class="re-chart-race__track-fill" :style="{ width: `${progress}%` }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 动态竞速条形（ReChart type="race"）—— Bar Chart Race。
 *
 * 第三方实现口径：条长插值与名次换位交给 **ECharts 官方的 bar-race 能力**
 * （`series.realtimeSort` + `animationDurationUpdate`），本组件只做三件事：
 *  1. 逐帧推进多帧快照（`frames`），每帧一次 `setOption`（merge 模式）；
 *  2. 把 `items` + 当前帧 `values` 拼成 ECharts 的「类目轴 + 数值」数据；
 *  3. 按 koi 令牌解析每条的颜色（canvas 不认 `var(--x)`，必须先解析成 sRGB）。
 *
 * 为什么要 `realtimeSort`：名次变化时的「换位」是 ECharts 内部按 `changeAxisOrder`
 * 做的动画；如果自己先把数组排好序再喂进去，内部排序变成空操作，条会瞬移而不是换位。
 * 因此这里**保持 items 原始顺序**，只由 `yAxis.max` 控制露出前 N 名。
 *
 * 配色只取 koi 令牌（`--brand-*` / `--metric-*` / `--status-*` / `--text-*`），
 * 暗色主题下随令牌提亮，不写死色值。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { EChartsOption } from "echarts";
import ReEcharts from "../ReEcharts";
import { normalizeColor } from "../ReEcharts/colorSpace";
import type { RaceItem, ReChartRaceData } from "./types";

const props = withDefaults(
  defineProps<{
    /** 竞速数据；null 时渲染空态 */
    data: ReChartRaceData | null;
    /** 容器高度 */
    height?: string;
    /** 主题（透传 ReEcharts，并作为令牌重解析的依赖） */
    theme?: "light" | "dark";
    /** 是否渲染自带头部 / 进度条（默认 true）；宿主自带抬头时置 false */
    chrome?: boolean;
    /** 挂载后是否自动播放（默认 true） */
    autoplay?: boolean;
  }>(),
  { height: "100%", theme: "light", chrome: true, autoplay: true },
);

const emit = defineEmits<{
  /** 点了某一条 */
  (e: "select", payload: { id: string; label: string; value: number }): void;
}>();

/** 条色梯次：全部是 koi 语义令牌 */
const BAR_TOKENS = [
  "--brand-500",
  "--metric-net",
  "--metric-mem",
  "--status-success",
  "--metric-disk",
  "--metric-redis",
  "--metric-db",
  "--proto-vnc",
];

/** 令牌读不到时的浅色兜底（与上面的令牌同序） */
const FALLBACK_HEX = ["#6d5dfc", "#06b6d4", "#8b5cf6", "#2fbf71", "#f59e0b", "#ef4444", "#0ea5e9", "#7c5cfc"];

/** 令牌读不到时的暗色兜底（与上面的令牌同序，整体提亮） */
const DARK_FALLBACK = ["#9d92ff", "#4fd3e8", "#b39bff", "#4fd694", "#fbbf24", "#f87777", "#54b8f0", "#a596ff"];

const DEFAULT_TOP = 10;
const DEFAULT_DURATION = 900;
const DEFAULT_HOLD = 300;

/** 系统启用「减少动态效果」时不做插值，直接跳帧 */
const prefersReducedMotion =
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * 换主题色后重取条色与文字色。
 *
 * <p>调色板是 computed 里读 CSS 变量解析出来的，主题色写在 `<html>` 行内样式上，
 * props 不变 Vue 不会重算 —— 不补这个，换主题色后条会停在旧配色上（ReEcharts 同理）。</p>
 */
const themeTick = ref(0);
let themeStyleObserver: MutationObserver | null = null;

/** 读 CSS 变量并归一成 ECharts 能稳定解析的 sRGB */
function cssVar(token: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return normalizeColor(value) || fallback;
}

/** 条目自带颜色：支持 hex / rgb / CSS 变量；解析不出来时退回梯次色 */
function itemColor(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  const raw = input.trim();
  const name = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/)?.[1] ?? (raw.startsWith("--") ? raw : null);
  if (!name) return normalizeColor(raw) || fallback;
  return cssVar(name, fallback);
}

const palette = computed<string[]>(() => {
  void themeTick.value; // 建立响应依赖：换主题色后随重渲染重新取色
  const theme = props.theme; // 建立依赖：换主题后令牌已变，颜色要跟着重新解析
  const fallback = theme === "dark" ? DARK_FALLBACK : FALLBACK_HEX;
  return BAR_TOKENS.map((token, i) => cssVar(token, fallback[i] ?? fallback[0] ?? "#6d5dfc"));
});

const frames = computed(() => props.data?.frames ?? []);

const index = ref(0);

const current = computed(() => frames.value[index.value]);

const frameLabel = computed(() => current.value?.label ?? "");

const progress = computed(() =>
  frames.value.length ? Math.min(100, Math.max(0, ((index.value + 1) / frames.value.length) * 100)) : 0,
);

/** 当前帧的条目 + 数值 + 颜色（保持 items 原始顺序，排序交给 realtimeSort） */
const bars = computed(() => {
  const data = props.data;
  if (!data) return [];
  const values = current.value?.values ?? {};
  return (data.items ?? [])
    .map((item: RaceItem, i: number) => ({
      item,
      color: itemColor(item.color, palette.value[i % palette.value.length] ?? "#6d5dfc"),
      value: Number(values[item.id] ?? 0),
    }))
    .filter((bar) => Number.isFinite(bar.value));
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function thousand(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-US");
}

const option = computed<EChartsOption>(() => {
  void themeTick.value; // 建立响应依赖：换主题色后文字色随之重算
  const data = props.data;
  if (!data) return {} as EChartsOption;

  const top = clamp(Math.round(data.top ?? DEFAULT_TOP), 1, 50);
  const duration = prefersReducedMotion ? 0 : clamp(data.duration ?? DEFAULT_DURATION, 120, 6000);
  const unit = data.unit ?? "";
  const format = (value: unknown) => {
    const num = Number(value);
    return (data.valueFormat ? data.valueFormat(num) : thousand(num)) + unit;
  };
  const textTertiary = cssVar("--text-tertiary", "#6b7280");
  const textSecondary = cssVar("--text-secondary", "#5c6270");
  // 暗色下 --text-tertiary(#6b7080) 落在 --bg-container(#1a1d27) 上只有 ~3.4:1，
  // 11px 的名次号读不清；名次是有意义的信息，暗色提到 secondary
  const rankColor = props.theme === "dark" ? textSecondary : textTertiary;

  return {
    // ECharts 内置 dark 主题自带 backgroundColor(#100C2A)，会和卡片底色割出直角缝
    backgroundColor: "transparent",
    animation: !prefersReducedMotion,
    animationDuration: 0,
    animationDurationUpdate: duration,
    animationEasing: "linear",
    animationEasingUpdate: "linear",
    grid: { left: 4, right: 88, top: 6, bottom: 6, containLabel: true },
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const item = (data.items ?? []).find((it) => it.label === params?.name);
        const head = item?.detail
          ? `${params.name}<br/><span style="opacity:.62">${item.detail}</span>`
          : `${params.name}`;
        return `${head}<br/><b>${format(params?.value)}</b>`;
      },
    },
    xAxis: {
      type: "value",
      max: "dataMax",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "category",
      inverse: true,
      // 只露出前 N 名：类目轴 0..top-1，名次变化由 realtimeSort 换位
      max: Math.min(top, Math.max(bars.value.length, 1)) - 1,
      data: bars.value.map((bar) => bar.item.label),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      animationDuration: 0,
      animationDurationUpdate: duration,
      axisLabel: {
        margin: 14,
        hideOverlap: false,
        formatter: (name: string, i: number) => `{rank|${String(i + 1).padStart(2, "0")}}  ${name}`,
        rich: {
          rank: {
            color: rankColor,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            width: 18,
          },
        },
      },
    },
    series: [
      {
        type: "bar",
        name: data.title || "排名",
        // 官方 bar-race 的核心开关：数值变化时条长插值，同时按新数值换位
        realtimeSort: true,
        // 条厚随面板高度走（百分比），再夹一个上限，避免大屏下单条过肥
        barCategoryGap: "45%",
        barMaxWidth: 44,
        itemStyle: { borderRadius: [0, 6, 6, 0] },
        emphasis: { focus: "self" },
        label: {
          show: true,
          position: "right",
          distance: 8,
          valueAnimation: true,
          color: textSecondary,
          fontWeight: 600,
          formatter: (params: any) => format(params?.value),
        },
        data: bars.value.map((bar) => ({
          name: bar.item.label,
          value: bar.value,
          itemStyle: { color: bar.color, borderRadius: [0, 6, 6, 0] },
        })),
      },
    ],
  } as EChartsOption;
});

/* ==================== 播放控制 ==================== */

const playing = ref(props.autoplay);

let timer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function schedule() {
  clearTimer();
  if (!playing.value || frames.value.length < 2) return;

  const duration = prefersReducedMotion ? 0 : clamp(props.data?.duration ?? DEFAULT_DURATION, 120, 6000);
  const hold = clamp(props.data?.hold ?? DEFAULT_HOLD, 0, 5000);

  timer = setTimeout(() => {
    const last = frames.value.length - 1;
    if (index.value >= last) {
      if (props.data?.loop === false) {
        playing.value = false;
        return;
      }
      index.value = 0;
    } else {
      index.value += 1;
    }
    schedule();
  }, duration + hold);
}

function toggle() {
  playing.value = !playing.value;
}

watch(playing, (on) => (on ? schedule() : clearTimer()));

// 数据换了（含刷新同一份引用内容）：回到第一帧重播，避免停在越界帧
watch(
  () => props.data,
  () => {
    clearTimer();
    index.value = 0;
    if (props.autoplay) playing.value = true;
    schedule();
  },
);

watch(
  () => props.autoplay,
  (on) => (playing.value = on),
);

watch(
  () => frames.value.length,
  (len) => {
    if (index.value > len - 1) index.value = 0;
    schedule();
  },
);

schedule();

onMounted(() => {
  if (typeof MutationObserver !== "undefined" && typeof document !== "undefined") {
    themeStyleObserver = new MutationObserver(() => {
      themeTick.value += 1;
    });
    themeStyleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }
});

onBeforeUnmount(() => {
  clearTimer();
  themeStyleObserver?.disconnect();
  themeStyleObserver = null;
});

function onBarClick(params: any) {
  const item = (props.data?.items ?? []).find((it) => it.label === params?.name);
  if (!item) return;
  emit("select", { id: item.id, label: item.label, value: Number(params?.value) });
}

defineExpose({
  /** 当前帧下标 */
  getFrame: () => index.value,
  /** 跳到指定帧（夹在 0..frames.length-1） */
  seek: (frame: number) => {
    index.value = clamp(Math.round(frame), 0, Math.max(0, frames.value.length - 1));
  },
  play: () => (playing.value = true),
  pause: () => (playing.value = false),
  isPlaying: () => playing.value,
});
</script>

<style scoped>
.re-chart-race {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.re-chart-race__stage {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}
.re-chart-race__head {
  display: flex;
  flex-shrink: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
}
.re-chart-race__heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.re-chart-race__title {
  color: var(--text-primary, var(--el-text-color-primary, #1f2430));
  font-size: 13px;
  font-weight: 600;
}
.re-chart-race__frame {
  color: var(--text-tertiary, #6b7280);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
.re-chart-race__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.re-chart-race__count {
  color: var(--text-tertiary, #6b7280);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.re-chart-race__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef0f6));
  border-radius: 50%;
  background: var(--bg-container, var(--el-bg-color, #fff));
  color: var(--text-secondary, #5c6270);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.re-chart-race__btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--brand-500, #6d5dfc) 34%, transparent);
  background: var(--brand-50, #f6f4ff);
  color: var(--brand-500, #6d5dfc);
}
.re-chart-race__btn:focus-visible {
  outline: 2px solid var(--el-color-primary, #6366f1);
  outline-offset: 1px;
}
.re-chart-race__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.re-chart-race__canvas {
  flex: 1 1 auto;
  min-height: 0;
}
.re-chart-race__track {
  flex-shrink: 0;
  height: 2px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--bg-fill, var(--el-fill-color-light, #f5f7fa));
}
.re-chart-race__track-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand-gradient, linear-gradient(135deg, #6d5dfc 0%, #8f83fd 100%));
  transition: width 0.4s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.re-chart-race__empty {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  border: 1px dashed var(--border-default, #e3e6ef);
  border-radius: 10px;
  background: var(--bg-elevated, var(--el-fill-color-lighter, #fbfbff));
  text-align: center;
}
.re-chart-race__empty-title {
  color: var(--text-secondary, #5c6270);
  font-size: 13px;
}
.re-chart-race__empty-desc {
  color: var(--text-tertiary, #6b7280);
  font-size: 12px;
}
@media (prefers-reduced-motion: reduce) {
  .re-chart-race__track-fill {
    transition: none;
  }
}
</style>
