<script setup lang="ts">
/**
 * 迷你趋势线：KPI 卡片底部的那条小折线。
 *
 * 为什么用 SVG 而不是再起一个 ECharts 实例：概览页 4 张卡各带一条，echarts 的
 * 初始化 / ResizeObserver / canvas 在 5 秒自动刷新下要起停 4 次，收益不抵开销；
 * 24 个点的折线用 polyline 足够，且天然随卡片宽度拉伸。
 *
 * 颜色走 currentColor：调用方在根元素上给 color（koi 令牌值），描边与面积一起变，
 * 暗色主题不用再传第二份颜色，也不会因为 canvas 不认 CSS 变量而失真。
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 按时间顺序排列的分桶计数（空数组渲染一条贴底的平线） */
    values?: number[];
  }>(),
  { values: () => [] },
);

/** 画布尺寸：viewBox 用 100x30，配合 preserveAspectRatio="none" 自适应卡片宽度 */
const W = 100;
const H = 30;
/** 上下留白，避免折线贴边被裁掉 */
const PAD = 2;

/**
 * 归一化点列：x 按序号等分，y 按窗口内最大值线性缩放。
 *
 * 全 0 时压成一条贴底的平线而不是散开——「近 24 小时没有失败」本身就是有意义的信息，
 * 画成底部一条直线比画成空白更诚实。
 */
const points = computed<{ x: number; y: number }[]>(() => {
  const values = props.values.length ? props.values : [0];
  const max = Math.max(...values, 0);
  const usable = H - PAD * 2;
  return values.map((value, index) => ({
    x: values.length === 1 ? W : (index / (values.length - 1)) * W,
    y: PAD + (max <= 0 ? usable : usable - (value / max) * usable),
  }));
});

/** 折线顶点串（polyline 的 points） */
const line = computed(() => points.value.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" "));

/** 面积多边形：折线再回到底边闭合 */
const area = computed(() => `${line.value} ${W},${H} 0,${H}`);
</script>

<template>
  <svg
    class="ov-spark"
    viewBox="0 0 100 30"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <polygon class="ov-spark__area" :points="area"/>
    <polyline class="ov-spark__line" :points="line"/>
  </svg>
</template>

<style scoped>
.ov-spark {
  display: block;
  width: 100%;
  height: 30px;
}

/* 面积与描边都吃 currentColor，颜色由调用方在根元素上给 */
.ov-spark__area {
  fill: currentColor;
  fill-opacity: 0.14;
}

/* non-scaling-stroke：viewBox 被非等比拉伸后描边仍保持 1.5px，不会被拉粗 */
.ov-spark__line {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
</style>
