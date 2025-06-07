<template>
  <div class="gauge-chart-container" :style="{ height: `${height}px` }">
    <div ref="chartContainer" class="chart-container" />
    <div v-if="loading" class="chart-loading">
      <IconifyIconOnline icon="ep:loading" class="is-loading" />
    </div>
    <div v-if="!loading && noData" class="chart-no-data">
      <el-empty description="暂无数据" :image-size="50" />
    </div>
    <el-tooltip v-if="tip" :content="tip" placement="top" :show-after="300" class="chart-tip">
      <IconifyIconOnline icon="ep:info-filled" />
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts/core";
import { GaugeChart as EChartsGaugeChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, GridComponent, DatasetComponent, TransformComponent, LegendComponent } from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 注册必要的组件
echarts.use([TitleComponent, TooltipComponent, GridComponent, DatasetComponent, TransformComponent, LegendComponent, EChartsGaugeChart, LabelLayout, UniversalTransition, CanvasRenderer]);

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
  },
  chartConfig: {
    type: Object,
    default: () => ({})
  },
  tip: {
    type: String,
    default: ""
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
      series: []
    };
  }

  // 获取配置
  const config = props.chartConfig || {};
  
  // 设置单位
  const unit = config.unit || '';
  
  // 设置颜色
  const mainColor = config.mainColor || "#409EFF";
  
  // 设置阈值
  const thresholds = config.thresholds || [
    { value: 0, color: '#67C23A' },
    { value: 60, color: '#E6A23C' },
    { value: 80, color: '#F56C6C' }
  ];
  
  // 确保阈值按值排序
  thresholds.sort((a, b) => a.value - b.value);
  
  // 获取最后一个数据点的值
  let value = 0;
  if (chartData.datasets[0] && chartData.datasets[0].data && chartData.datasets[0].data.length > 0) {
    value = chartData.datasets[0].data[chartData.datasets[0].data.length - 1];
  }

  // 确定最大值
  const max = config.max || 100;
  
  // 创建轴线配置
  const axisLine = {
    lineStyle: {
      width: 30,
      color: []
    }
  };
  
  // 根据阈值设置颜色区间
  for (let i = 0; i < thresholds.length; i++) {
    const threshold = thresholds[i];
    const nextThreshold = thresholds[i + 1] || { value: max };
    
    axisLine.lineStyle.color.push([
      threshold.value / max,
      threshold.color
    ]);
    
    if (i === thresholds.length - 1 && nextThreshold.value < max) {
      axisLine.lineStyle.color.push([
        1,
        threshold.color
      ]);
    }
  }

  return {
    backgroundColor: "transparent",
    textStyle: {
      color: "#e0e0e0"
    },
    title: chartData.title ? {
      text: chartData.title,
      left: 'center',
      top: '10%',
      textStyle: {
        color: '#e0e0e0',
        fontSize: 14
      }
    } : undefined,
    tooltip: {
      formatter: `{a} <br/>{b} : {c}${unit}`,
      backgroundColor: "rgba(30, 30, 46, 0.9)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: {
        color: "#e0e0e0"
      }
    },
    series: [{
      name: chartData.datasets[0]?.label || '',
      type: 'gauge',
      radius: '85%',
      center: ['50%', '60%'],
      startAngle: 225,
      endAngle: -45,
      min: 0,
      max: max,
      progress: {
        show: true,
        width: 30
      },
      axisLine: axisLine,
      pointer: {
        show: true,
        length: '60%',
        width: 6,
        itemStyle: {
          color: mainColor
        }
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: true,
        length: 10,
        lineStyle: {
          width: 2,
          color: '#999'
        }
      },
      axisLabel: {
        distance: -30,
        color: '#a0a0a0',
        fontSize: 12,
        formatter: function(value) {
          return value + unit;
        }
      },
      anchor: {
        show: true,
        showAbove: true,
        size: 18,
        itemStyle: {
          borderWidth: 3
        }
      },
      detail: {
        valueAnimation: true,
        fontSize: 24,
        offsetCenter: [0, '30%'],
        formatter: function(value) {
          return value.toFixed(2) + unit;
        },
        color: '#e0e0e0'
      },
      data: [{
        value: value,
        name: chartData.datasets[0]?.label || ''
      }]
    }]
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
    nextTick(() => {
      updateChart();
    });
  },
  { deep: true }
);

// 监听配置变化
watch(
  () => props.chartConfig,
  () => {
    nextTick(() => {
      updateChart();
    });
  },
  { deep: true }
);

// 监听容器大小变化
watch(
  () => props.height,
  () => {
    nextTick(() => {
      handleResize();
    });
  }
);

// 组件挂载
onMounted(() => {
  initChart();
  window.addEventListener("resize", handleResize);
});

// 组件卸载
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<style scoped>
.gauge-chart-container {
  width: 100%;
  position: relative;
}

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
  background-color: rgba(0, 0, 0, 0.5);
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
}

.chart-tip {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 16px;
  color: #409EFF;
  cursor: pointer;
  z-index: 10;
}
</style>
