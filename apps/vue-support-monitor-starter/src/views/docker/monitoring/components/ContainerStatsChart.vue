<template>
  <div class="container-stats-chart system-container modern-bg">
    <div class="chart-header">
      <div class="chart-title">{{ title }}</div>
      <div class="time-range-selector">
        <ScSelect
          v-model="timeRange"
          size="small"
          style="width: 120px"
          @change="onTimeRangeChange"
        >
          <ScOption label="最近1小时" value="1h" />
          <ScOption label="最近6小时" value="6h" />
          <ScOption label="最近12小时" value="12h" />
          <ScOption label="最近24小时" value="24h" />
          <ScOption label="最近7天" value="7d" />
        </ScSelect>
      </div>
    </div>

    <div ref="chartContainerRef" class="chart-container" />

    <div v-if="latestStats" class="chart-stats">
      <div class="stat-item">
        <span class="stat-label">当前值:</span>
        <span class="stat-value">{{ formatValue(latestStats.current) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均值:</span>
        <span class="stat-value">{{ formatValue(latestStats.average) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大值:</span>
        <span class="stat-value">{{ formatValue(latestStats.max) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { containerApi } from "@/api/docker";
import * as echarts from "echarts";
import { onMounted, onUnmounted, ref, watch } from "vue";

interface Props {
  containerId: number;
  title: string;
  dataType:
    | "cpu"
    | "memory"
    | "diskRead"
    | "diskWrite"
    | "networkRx"
    | "networkTx";
  timeRange?: string;
}

interface Emits {
  (e: "update:timeRange", value: string): void;
}

interface ChartData {
  timestamps: string[];
  values: number[];
}

interface StatsSummary {
  current: number;
  average: number;
  max: number;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const chartContainerRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;
const timeRange = ref(props.timeRange || "1h");
const chartData = ref<ChartData>({ timestamps: [], values: [] });
const latestStats = ref<StatsSummary | null>(null);
const loading = ref(false);
let sampleTimer: ReturnType<typeof setInterval> | null = null;

// 初始化图表
const initChart = () => {
  if (chartContainerRef.value) {
    chartInstance = echarts.init(chartContainerRef.value);
    updateChart();
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) return;

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.seriesName}: ${formatValue(param.value)}`;
      },
    },
    xAxis: {
      type: "category",
      data: chartData.value.timestamps,
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => formatValue(value),
      },
    },
    series: [
      {
        name: props.title,
        type: "line",
        data: chartData.value.values,
        smooth: true,
        areaStyle: {
          opacity: 0.1,
        },
        lineStyle: {
          width: 2,
        },
      },
    ],
    grid: {
      left: "10%",
      right: "10%",
      bottom: "15%",
      top: "15%",
    },
  };

  chartInstance.setOption(option);
};

// 格式化值显示
const formatValue = (value: number) => {
  switch (props.dataType) {
    case "cpu":
      return `${value.toFixed(2)}%`;
    case "memory":
      return formatBytes(value);
    case "diskRead":
    case "diskWrite":
    case "networkRx":
    case "networkTx":
      return formatBytes(value);
    default:
      return value.toFixed(2);
  }
};

// 格式化字节显示
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取统计数据
const fetchStatsData = async () => {
  if (loading.value) return;
  loading.value = true;

  try {
    const response = await containerApi.getContainerStats(props.containerId);
    if (response.code !== "00000" || !response.data) {
      return;
    }

    const value = pickValue(response.data);
    appendDataPoint(value);
    updateChart();
  } catch (error) {
    console.error("获取统计数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const pickValue = (stats: any) => {
  switch (props.dataType) {
    case "cpu":
      return Number(stats.systemSoftContainerStatsCpuPercent || 0);
    case "memory":
      return Number(stats.systemSoftContainerStatsMemoryUsage || 0);
    case "diskRead":
      return Number(stats.systemSoftContainerStatsDiskRead || 0);
    case "diskWrite":
      return Number(stats.systemSoftContainerStatsDiskWrite || 0);
    case "networkRx":
      return Number(stats.systemSoftContainerStatsNetworkRxBytes || 0);
    case "networkTx":
      return Number(stats.systemSoftContainerStatsNetworkTxBytes || 0);
    default:
      return 0;
  }
};

const samplingConfig = () => {
  switch (timeRange.value) {
    case "6h":
      return { intervalMs: 5 * 60_000, maxPoints: 72 };
    case "12h":
      return { intervalMs: 10 * 60_000, maxPoints: 72 };
    case "24h":
      return { intervalMs: 20 * 60_000, maxPoints: 72 };
    case "7d":
      return { intervalMs: 2 * 60 * 60_000, maxPoints: 84 };
    default:
      return { intervalMs: 60_000, maxPoints: 60 };
  }
};

const appendDataPoint = (value: number) => {
  const now = new Date();
  chartData.value.timestamps.push(
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  chartData.value.values.push(value);

  const { maxPoints } = samplingConfig();
  if (chartData.value.values.length > maxPoints) {
    chartData.value.values.shift();
    chartData.value.timestamps.shift();
  }

  calculateStatsSummary(chartData.value);
};

// 计算统计数据摘要
const calculateStatsSummary = (data: ChartData) => {
  if (data.values.length === 0) {
    latestStats.value = null;
    return;
  }

  const current = data.values[data.values.length - 1];
  const sum = data.values.reduce((a, b) => a + b, 0);
  const average = sum / data.values.length;
  const max = Math.max(...data.values);

  latestStats.value = { current, average, max };
};

// 时间范围变化处理
const onTimeRangeChange = (value: string) => {
  timeRange.value = value;
  emit("update:timeRange", value);
  resetSeries();
  restartSampling();
};

// 监听容器ID变化
watch(
  () => [props.containerId, props.dataType],
  () => {
    resetSeries();
    restartSampling();
  },
);

watch(
  () => props.timeRange,
  (value) => {
    if (!value || value === timeRange.value) return;
    timeRange.value = value;
    resetSeries();
    restartSampling();
  },
);

// 监听数据变化并更新图表
watch(chartData, () => {
  updateChart();
});

// 组件挂载
const resetSeries = () => {
  chartData.value = { timestamps: [], values: [] };
  latestStats.value = null;
  updateChart();
};

const startSampling = () => {
  stopSampling();
  const { intervalMs } = samplingConfig();
  fetchStatsData();
  sampleTimer = setInterval(fetchStatsData, intervalMs);
};

const stopSampling = () => {
  if (sampleTimer) {
    clearInterval(sampleTimer);
    sampleTimer = null;
  }
};

const restartSampling = () => {
  startSampling();
};

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

onMounted(() => {
  initChart();
  startSampling();
  window.addEventListener("resize", resizeChart);
});

// 组件卸载
onUnmounted(() => {
  stopSampling();
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener("resize", resizeChart);
});
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.container-stats-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  flex: 1;
  min-height: 200px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.chart-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
