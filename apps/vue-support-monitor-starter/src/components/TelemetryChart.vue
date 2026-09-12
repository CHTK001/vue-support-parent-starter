<template>
  <div class="tel-chart-wrap">
    <div class="tel-chart-header">
      <span class="tel-chart-title">{{ title }}</span>
      <div class="tel-chart-controls">
        <ReSelect
          v-model="timeRange"
          size="small"
          style="width: 100px"
          :options="timeRangeOptions"
          @change="onTimeRangeChange"
        />
        <ReButton icon="ZoomIn" layout="square" size="small" title="查看历史详情" @click="openHistory" />
      </div>
    </div>
    <div ref="chartRef" class="tel-chart-canvas" :style="{ height: height + 'px' }" />
    <ReDialog v-model="historyVisible" :title="`${title} - 历史数据`" width="800px">
      <div ref="historyChartRef" class="tel-chart-canvas" style="height: 400px" />
      <div class="tel-chart-stats">
        <span>最小值: {{ stats.min }}</span>
        <span>最大值: {{ stats.max }}</span>
        <span>平均值: {{ stats.avg }}</span>
        <span>最新值: {{ stats.last }}</span>
        <span>数据点: {{ stats.count }}</span>
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";

const props = withDefaults(defineProps<{
  title: string;
  data: number[];
  timestamps?: number[];
  unit?: string;
  color?: string;
  height?: number;
  maxPoints?: number;
}>(), {
  unit: "",
  color: "#38bdf8",
  height: 160,
  maxPoints: 200,
});

const emit = defineEmits<{
  (e: "time-range-change", range: string): void;
}>();

const chartRef = ref<HTMLDivElement>();
const historyChartRef = ref<HTMLDivElement>();
const historyVisible = ref(false);
const timeRange = ref("1h");

const timeRangeOptions = [
  { label: "1小时", value: "1h" },
  { label: "6小时", value: "6h" },
  { label: "24小时", value: "24h" },
  { label: "7天", value: "7d" },
  { label: "全部", value: "all" },
];

let chart: echarts.ECharts | null = null;
let historyChart: echarts.ECharts | null = null;

const stats = computed(() => {
  const d = props.data;
  if (!d.length) return { min: "—", max: "—", avg: "—", last: "—", count: 0 };
  const min = Math.min(...d);
  const max = Math.max(...d);
  const avg = d.reduce((a, b) => a + b, 0) / d.length;
  return {
    min: min.toFixed(1),
    max: max.toFixed(1),
    avg: avg.toFixed(1),
    last: d[d.length - 1].toFixed(1),
    count: d.length,
  };
});

function buildOption(data: number[], times?: number[]): echarts.EChartsOption {
  const xData = times && times.length === data.length
    ? times.map(t => new Date(t).toLocaleTimeString("zh-CN", { hour12: false }))
    : data.map((_, i) => String(i));
  return {
    grid: { left: 45, right: 15, top: 10, bottom: 25 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15,23,42,0.95)",
      borderColor: "rgba(56,189,248,0.3)",
      textStyle: { color: "#e2e8f0", fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0];
        return `${p.axisValue}<br/>${props.title}: <b>${Number(p.value).toFixed(1)}${props.unit}</b>`;
      },
    },
    xAxis: {
      type: "category",
      data: xData,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.2)" } },
      axisLabel: { color: "#94a3b8", fontSize: 10, hideOverlap: true },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.08)" } },
    },
    series: [{
      type: "line",
      data,
      smooth: true,
      symbol: "none",
      lineStyle: { color: props.color, width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: props.color + "40" },
          { offset: 1, color: props.color + "05" },
        ]),
      },
    }],
  };
}

function renderChart() {
  if (!chart || !chartRef.value) return;
  // FIFO: 限制数据点数量
  let data = props.data;
  let times = props.timestamps;
  if (data.length > props.maxPoints) {
    const start = data.length - props.maxPoints;
    data = data.slice(start);
    if (times && times.length > props.maxPoints) {
      times = times.slice(start);
    }
  }
  chart.setOption(buildOption(data, times));
}

function renderHistoryChart() {
  if (!historyChart || !historyChartRef.value) return;
  historyChart.setOption(buildOption(props.data, props.timestamps));
}

function onTimeRangeChange() {
  emit("time-range-change", timeRange.value);
}

function openHistory() {
  historyVisible.value = true;
  nextTick(() => {
    if (historyChartRef.value && !historyChart) {
      historyChart = echarts.init(historyChartRef.value);
    }
    renderHistoryChart();
  });
}

watch(() => props.data, () => {
  renderChart();
  if (historyVisible.value) renderHistoryChart();
}, { deep: true });

onMounted(() => {
  nextTick(() => {
    if (chartRef.value) {
      chart = echarts.init(chartRef.value);
      renderChart();
    }
  });
  window.addEventListener("resize", onResize);
});

function onResize() {
  chart?.resize();
  historyChart?.resize();
}

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  chart?.dispose();
  historyChart?.dispose();
});
</script>

<style scoped>
.tel-chart-wrap {
  background: var(--bg-elevated, rgba(15, 23, 42, 0.6));
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.12));
  border-radius: 10px;
  padding: 12px;
}
.tel-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.tel-chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
}
.tel-chart-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tel-chart-canvas {
  width: 100%;
}
.tel-chart-stats {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.12));
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
}
</style>
