<!--
  MetricChart —— 指标时序折线图（多指标可叠一张）。

  为什么单独抽一个组件：总览页和服务详情页都要画「响应时间 / 调用量 / 成功率」，
  而 SkyWalking 的各指标时间轴长度并不一致（后端按 step 对齐，但空桶会被裁掉），
  对齐逻辑写两遍必然出现「两条线错位一格」。这里统一按时间戳并集对齐。

  渲染交给 @repo/ui 的 ReChart（echarts 引擎），主题（深浅色、resize）由它统一处理，
  本组件只管把 ApmMetricSeries 翻译成 option。
-->
<template>
  <ReChart type="line" engine="echarts" :option="option" :height="height" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import ReChart from "@repo/ui/re-chart";
import type { ApmMetricSeries } from "../api/apmApi";
import { fmtClock, normalizeMetricValue } from "../utils/format";

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

/** 数值单位：多条线单位不一致时不共用 Y 轴，改为全部归一后由 tooltip 标注单位 */
const unitLabel = computed(() => {
  const units = new Set(props.series.map((s) => s.unit).filter(Boolean));
  return units.size === 1 ? ` (${[...units][0]})` : "";
});

const option = computed<EChartsOption>(() => {
  const list = props.series.filter((s) => (s.points?.length ?? 0) > 0);
  if (!list.length) {
    return {};
  }
  // 时间轴：所有序列的时间戳并集，保证不同长度的序列在同一格上对齐
  const times = [...new Set(list.flatMap((s) => s.points.map((p) => p.time)))].sort((a, b) => a - b);
  const index = list.map((s) => {
    const map = new Map<number, number>();
    for (const point of s.points) {
      map.set(point.time, normalizeMetricValue(point.value, s.unit));
    }
    return map;
  });

  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => (value === null || value === undefined ? "—" : String(value)),
    },
    legend: { show: !props.compact && list.length > 1, top: 0, type: "scroll" },
    grid: props.compact
      ? { left: 0, right: 0, top: 4, bottom: 2, containLabel: false }
      : { left: 52, right: 18, top: list.length > 1 ? 34 : 18, bottom: 30 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: times.map((t) => fmtClock(t)),
      axisLabel: { show: !props.compact, fontSize: 10, hideOverlap: true },
      axisLine: { show: !props.compact },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      name: props.compact ? undefined : unitLabel.value.trim() || undefined,
      nameTextStyle: { fontSize: 10 },
      axisLabel: { show: !props.compact, fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: !props.compact, lineStyle: { type: "dashed" } },
    },
    series: list.map((s, i) => ({
      name: s.label || s.name,
      type: "line" as const,
      smooth: true,
      showSymbol: false,
      connectNulls: true,
      lineStyle: props.compact ? { width: 1.6 } : undefined,
      areaStyle: props.compact ? { opacity: 0.12 } : undefined,
      data: times.map((t) => index[i].get(t) ?? null),
    })),
  };
});
</script>
