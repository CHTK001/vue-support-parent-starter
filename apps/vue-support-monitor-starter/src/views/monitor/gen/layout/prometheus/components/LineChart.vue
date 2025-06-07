<template>
  <div class="line-chart-container" :style="{ height: `${height}px` }">
    <div ref="chartContainer" class="chart-container" />
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
    <div v-if="!loading && noData" class="chart-no-data">
      <el-empty description="暂无数据" :image-size="50" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts/core";
import { LineChart as EChartsLineChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, GridComponent, DatasetComponent, TransformComponent, LegendComponent } from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

// 注册必要的组件
echarts.use([TitleComponent, TooltipComponent, GridComponent, DatasetComponent, TransformComponent, LegendComponent, EChartsLineChart, LabelLayout, UniversalTransition, CanvasRenderer]);

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  height: {
    type: Number,
    default: 200
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const chartContainer = ref(null);
let chart = null;

// 计算是否有数据
const noData = computed(() => {
  if (!props.chartData || !props.chartData.datasets || props.chartData.datasets.length === 0) {
    return true;
  }

  for (const dataset of props.chartData.datasets) {
    if (dataset.data && dataset.data.length > 0) {
      return false;
    }
  }

  return true;
});

// 将Chart.js数据格式转换为ECharts数据格式
const convertToEChartsOption = chartData => {
  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return {
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: []
    };
  }

  const series = chartData.datasets.map(dataset => {
    // 提取颜色
    let color = dataset.borderColor;
    let areaColor = dataset.backgroundColor;

    return {
      name: dataset.label,
      type: "line",
      data: dataset.data,
      smooth: true,
      showSymbol: false,
      lineStyle: {
        color: color
      },
      itemStyle: {
        color: color
      },
      areaStyle: dataset.fill
        ? {
            color: areaColor,
            opacity: 0.3
          }
        : undefined
    };
  });

  return {
    backgroundColor: "transparent",
    textStyle: {
      color: "#e0e0e0"
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#4db6ac"
        }
      },
      backgroundColor: "rgba(30, 30, 46, 0.9)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: {
        color: "#e0e0e0"
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: chartData.labels || [],
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.2)"
        }
      },
      axisLabel: {
        color: "#a0a0a0",
        fontSize: 10
      }
    },
    yAxis: {
      type: "value",
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "rgba(255, 255, 255, 0.1)"
        }
      },
      axisLabel: {
        color: "#a0a0a0",
        fontSize: 10
      }
    },
    series: series
  };
};

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return;

  // 如果已经存在图表实例，先销毁
  if (chart) {
    chart.dispose();
  }

  // 创建新的图表实例
  chart = echarts.init(chartContainer.value);

  // 设置图表选项
  const option = convertToEChartsOption(props.chartData);
  chart.setOption(option);
};

// 更新图表数据
const updateChart = () => {
  if (!chart) {
    initChart();
    return;
  }

  const option = convertToEChartsOption(props.chartData);
  chart.setOption(option);
};

// 处理窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

// 监听数据变化
watch(
  () => props.chartData,
  () => {
    updateChart();
  },
  { deep: true }
);

// 监听高度变化
watch(
  () => props.height,
  () => {
    nextTick(() => {
      handleResize();
    });
  }
);

// 组件挂载时初始化图表
onMounted(() => {
  initChart();

  // 添加窗口大小变化监听
  window.addEventListener("resize", handleResize);
});

// 组件卸载前销毁图表和事件监听
onBeforeUnmount(() => {
  if (chart) {
    chart.dispose();
  }

  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.line-chart-container {
  position: relative;
  width: 100%;

  .chart-container {
    width: 100%;
    height: 100%;
  }

  .chart-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(30, 30, 46, 0.7);
    z-index: 1;

    .el-icon {
      font-size: 24px;
      color: #4db6ac;
    }
  }

  .chart-no-data {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #a0a0a0;
  }
}
</style>
