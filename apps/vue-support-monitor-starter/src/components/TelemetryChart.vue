<template>
  <div class="tel-chart-wrap">
    <div class="tel-chart-header">
      <span class="tel-chart-title">{{ title }}</span>
      <div class="tel-chart-controls">
        <ReSelect
          v-if="!hideTimeRange"
          v-model="timeRange"

          style="width: 100px"
          :options="timeRangeOptions"
          @change="onTimeRangeChange"
        />
        <ReButton icon="ZoomIn" layout="square" title="查看历史详情" @click="openHistory" />
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
/**
 * 遥测折线图组件（ECharts）
 *
 * 实时渲染指标折线（FIFO 限点），支持时间范围选择与历史数据弹窗。
 * @author CH
 * @since 4.0.0
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";

const props = withDefaults(defineProps<{
  title: string;
  data: (number | null)[];
  timestamps?: number[];
  unit?: string;
  color?: string;
  height?: number;
  maxPoints?: number;
  /** 受控时间范围（外部 v-model:time-range），传入后内部选择器同步显示 */
  timeRange?: string;
  /** 是否隐藏内置时间范围选择器（页面级统一控制时使用） */
  hideTimeRange?: boolean;
}>(), {
  unit: "",
  color: "#38bdf8",
  height: 160,
  maxPoints: 200,
  hideTimeRange: false,
});

const emit = defineEmits<{
  (e: "time-range-change", range: string): void;
  (e: "update:timeRange", range: string): void;
}>();

const chartRef = ref<HTMLDivElement>();
const historyChartRef = ref<HTMLDivElement>();
const historyVisible = ref(false);
const timeRange = ref(props.timeRange ?? "1h");

// 外部受控 timeRange 变化时同步内部状态
watch(() => props.timeRange, (v) => {
  if (v && v !== timeRange.value) timeRange.value = v;
});

const timeRangeOptions = [
  { label: "1小时", value: "1h" },
  { label: "6小时", value: "6h" },
  { label: "24小时", value: "24h" },
  { label: "7天", value: "7d" },
  { label: "全部", value: "all" },
];

let chart: echarts.ECharts | null = null;
let historyChart: echarts.ECharts | null = null;
let themeObserver: MutationObserver | null = null;

const stats = computed(() => {
  const d = props.data.filter((v): v is number => v != null);
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

/** 是否深色主题（html.dark class） */
function isDark(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/**
 * 构建 ECharts 配置项（主题感知）
 * @param data 数值序列（可含 null）
 * @param times 时间戳序列（可选）
 * @returns ECharts 配置
 */
function buildOption(data: (number | null)[], times?: number[]): echarts.EChartsOption {
  const dark = isDark();
  const axisLabelColor = dark ? "#94a3b8" : "#64748b";
  const splitLineColor = dark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.12)";
  const axisLineColor = dark ? "rgba(148,163,184,0.2)" : "rgba(100,116,139,0.2)";
  const tooltipBg = dark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)";
  const tooltipTextColor = dark ? "#e2e8f0" : "#1e293b";
  const xData = times && times.length === data.length
    ? times.map(t => new Date(t).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }))
    : data.map((_, i) => String(i));
  return {
    grid: { left: 50, right: 15, top: 10, bottom: 30 },
    tooltip: {
      trigger: "axis",
      backgroundColor: tooltipBg,
      borderColor: dark ? "rgba(56,189,248,0.3)" : "rgba(100,116,139,0.2)",
      textStyle: { color: tooltipTextColor, fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0];
        return `${p.axisValue}<br/>${props.title}: <b>${Number(p.value).toLocaleString()}${props.unit}</b>`;
      },
    },
    xAxis: {
      type: "category",
      data: xData,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: axisLabelColor, fontSize: 10, hideOverlap: true },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: axisLabelColor, fontSize: 10 },
      splitLine: { lineStyle: { color: splitLineColor } },
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

/** 渲染实时图表（FIFO 限制数据点数量） */
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

/** 渲染历史数据图表 */
function renderHistoryChart() {
  if (!historyChart || !historyChartRef.value) return;
  historyChart.setOption(buildOption(props.data, props.timestamps));
}

/** 时间范围变更事件透传 */
function onTimeRangeChange() {
  emit("time-range-change", timeRange.value);
  emit("update:timeRange", timeRange.value);
}

/** 打开历史数据弹窗并渲染 */
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
  // 监听 html.dark 类变化，切换主题时重绘图表
  themeObserver = new MutationObserver(() => {
    renderChart();
    if (historyVisible.value) renderHistoryChart();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
});

/** 窗口尺寸变化时重算图表尺寸 */
function onResize() {
  chart?.resize();
  historyChart?.resize();
}

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  themeObserver?.disconnect();
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
