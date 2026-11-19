<!--
  迷你趋势线（sparkline）：纯 SVG 折线 + 面积 + 末点，不引图表库。

  用在指标页签的「主读数趋势」：一屏宽度有限，要的是「在涨还是在跌」的形状，
  不是精确读数 —— 坐标轴、刻度、图例一律省掉。
-->
<template>
  <svg
    class="act-sparkline"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="`趋势：${titleText}`"
  >
    <title>{{ titleText }}</title>
    <polygon v-if="areaPoints" :points="areaPoints" class="act-sparkline__area" />
    <polyline :points="linePoints" vector-effect="non-scaling-stroke" class="act-sparkline__line" />
    <circle v-if="points.length" :cx="lastPoint[0]" :cy="lastPoint[1]" r="3" class="act-sparkline__dot" />
  </svg>
</template>

<script setup lang="ts" name="ActuatorSparkline">
/**
 * 迷你趋势线。
 *
 * <p>viewBox 固定、{@code preserveAspectRatio="none"}：线条随容器拉伸，
 * 配合 polyline 上的 {@code vector-effect="non-scaling-stroke"} 保证描边不被拉花。
 * 全部值相等时按「居中平线」处理（极差兜底为 1），不会除零。</p>
 */
import { computed } from "vue";

/** 逻辑坐标宽度（任意值，形状随容器缩放） */
const W = 120;
/** 逻辑坐标高度 */
const H = 36;

const props = defineProps<{
  /** 采样序列（旧 → 新）；调用方保证至少 2 个点 */
  values: number[];
}>();

/** 过滤掉非有限值：一个 NaN 就会毁掉整条路径 */
const finite = computed<number[]>(() => props.values.filter((value) => Number.isFinite(value)));

const min = computed<number>(() => Math.min(...finite.value));
const max = computed<number>(() => Math.max(...finite.value));

/** 极差；全部相等时兜底为 1（画成居中平线） */
const span = computed<number>(() => {
  const diff = max.value - min.value;
  return diff > 0 ? diff : 1;
});

/** 折线顶点（逻辑坐标，上下各留 5px 呼吸位） */
const points = computed<[number, number][]>(() => {
  const list = finite.value;
  if (list.length < 2) return [];
  return list.map((value, index) => {
    const x = (index / (list.length - 1)) * W;
    const y = H - 5 - ((value - min.value) / span.value) * (H - 10);
    return [x, y];
  });
});

const linePoints = computed<string>(() => points.value.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" "));

/** 面积 = 折线 + 底边闭合；点不足时不画 */
const areaPoints = computed<string>(() => (points.value.length ? `0,${H} ${linePoints.value} ${W},${H}` : ""));

const lastPoint = computed<[number, number]>(() => points.value[points.value.length - 1] ?? [W / 2, H / 2]);

/** 悬浮 / 无障碍文案：首 → 末值 */
const titleText = computed<string>(() => {
  const list = finite.value;
  if (!list.length) return "暂无数据";
  return `${list[0]} → ${list[list.length - 1]}`;
});
</script>
