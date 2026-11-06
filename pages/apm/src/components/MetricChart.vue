<!--
  MetricChart —— 指标时序折线图（多指标可叠一张）。

  为什么单独抽一个组件：总览页和服务详情页都要画「响应时间 / 调用量 / 成功率」，
  而 SkyWalking 的各指标时间轴长度并不一致（后端按 step 对齐，但空桶会被裁掉），
  对齐逻辑写两遍必然出现「两条线错位一格」。这里统一按时间戳并集对齐。

  渲染交给 @repo/ui 的 ReChart（echarts 引擎），主题（深浅色、resize）由它统一处理，
  本组件只管把 ApmMetricSeries 翻译成 option。

  视觉上只做三件事，都是为了让曲线读起来更快：
    · 线的颜色从 {@link useApmPalette} 取 —— canvas 里 `var(--el-*)` 是无效值，
      不取色就会在深色主题下退成一堆暗灰；
    · 单序列铺同色渐变，形状一眼能扫到，又不压过上面的读数；
    · 去掉图例方框、坐标轴线、网格竖线，只留一条虚线基准。
-->
<template>
  <ReChart type="line" engine="echarts" :option="option" :height="height" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import ReChart from "@repo/ui/re-chart";
import type { ApmMetricSeries } from "../api/apmApi";
import { useApmPalette } from "../composables/useApmPalette";
import { fillTimeGaps, fmtAxisClock, normalizeMetricValue, pickStepMs } from "../utils/format";

const props = withDefaults(
  defineProps<{
    /** 要画的时序（可多条，按 label 作为图例） */
    series: ApmMetricSeries[];
    /** 图高，透传给 ReChart */
    height?: string;
    /**
     * 紧凑档：去掉图例、坐标轴留白与除首末外的刻度。
     *
     * <p>侧栏里只有 60~80px 高，标准档的图例 + 30px 轴留白会把曲线压成一条线。
     * 紧凑档只保留「形状」，精确值由旁边的数字给。</p>
     */
    compact?: boolean;
  }>(),
  { height: "280px", compact: false },
);

const palette = useApmPalette();

/** 单位后缀：直接贴在刻度上（0.8ms），比轴名更省空间，也不会被卡片抬头压住 */
const unitSuffix = computed(() => {
  const units = new Set(props.series.map((s) => s.unit).filter(Boolean));
  return units.size === 1 ? String([...units][0]) : "";
});

const option = computed<EChartsOption>(() => {
  const p = palette.value;
  const list = props.series.filter((s) => (s.points?.length ?? 0) > 0);
  if (!list.length) {
    return {};
  }
  const colors = [p.primary, p.ok, p.warn, p.bad];

  // 时间轴：所有序列的时间戳并集，保证不同长度的序列在同一格上对齐。
  // 并集只包含「有数据的桶」，中间没流量那段会直接消失：横轴从 22:02 跳到 22:42，
  // 曲线跨过缺口还连成一条，看着像「一直在跑」。所以按步长把缺口补成空桶（null）。
  const times = fillTimeGaps(
    [...new Set(list.flatMap((s) => s.points.map((pt) => pt.time)))].sort((a, b) => a - b),
  );
  // 轴标签粒度跟着数据步长走：分钟级不重复「:00」的秒，跨日只留月日
  const stepMs = pickStepMs(times);
  const index = list.map((s) => {
    const map = new Map<number, number>();
    for (const point of s.points) {
      map.set(point.time, normalizeMetricValue(point.value, s.unit));
    }
    return map;
  });

  return {
    color: colors,
    tooltip: {
      trigger: "axis",
      backgroundColor: p.surface,
      borderColor: p.line,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: p.text, fontSize: 12 },
      extraCssText: "border-radius:10px;box-shadow:0 12px 28px -14px rgba(0,0,0,.35);",
      axisPointer: { type: "line", lineStyle: { color: p.line, width: 1, type: "dashed" } },
      valueFormatter: (value) => (value === null || value === undefined ? "—" : String(value)),
    },
    legend: {
      show: !props.compact && list.length > 1,
      top: 0,
      icon: "circle",
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 16,
      textStyle: { color: p.faint, fontSize: 11 },
    },
    grid: props.compact
      ? { left: 0, right: 0, top: 4, bottom: 2, containLabel: false }
      : { left: 52, right: 18, top: list.length > 1 ? 36 : 18, bottom: 28 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: times.map((t) => fmtAxisClock(t, stepMs)),
      axisLabel: { show: !props.compact, fontSize: 10, color: p.faint, hideOverlap: true },
      axisLine: { show: !props.compact, lineStyle: { color: p.line } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        show: !props.compact,
        fontSize: 10,
        color: p.faint,
        formatter: (value: number) => `${value}${unitSuffix.value}`,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: !props.compact,
        lineStyle: { color: p.line, type: "dashed" },
      },
    },
    series: list.map((s, i) => {
      const color = colors[i % colors.length];
      return {
        name: s.label || s.name,
        type: "line" as const,
        smooth: 0.35,
        showSymbol: false,
        // 缺口补出来的 null 必须让线断掉：连过去等于凭空断言「这段时间也在跑」
        connectNulls: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: props.compact ? 1.8 : 2.2, color },
        itemStyle: { color },
        // 面积用「同色 → 透明」的竖向渐变，再整体压低不透明度：
        // 只给 opacity 会是整块死色，只给渐变顶部又太实
        areaStyle: {
          opacity: props.compact ? 0.5 : 0.35,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color },
              { offset: 1, color: "transparent" },
            ],
          },
        },
        emphasis: { focus: "series" as const },
        data: times.map((t) => index[i].get(t) ?? null),
      };
    }),
  };
});
</script>
