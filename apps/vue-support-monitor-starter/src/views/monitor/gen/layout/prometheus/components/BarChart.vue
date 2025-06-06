<template>
  <div class="bar-chart-container" :style="{ height: `${height}px` }">
    <div ref="chartContainer" class="chart-container"></div>
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
    <div v-if="!loading && noData" class="chart-no-data">
      <el-empty description="暂无数据" :image-size="50" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount, nextTick } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import * as echarts from 'echarts/core';
import { BarChart as EChartsBarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  EChartsBarChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
]);

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
const convertToEChartsOption = (chartData) => {
  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return {
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: []
    };
  }

  const series = chartData.datasets.map(dataset => {
    // 提取颜色
    let color = dataset.borderColor;

    return {
      name: dataset.label,
      type: 'bar',
      data: dataset.data,
      itemStyle: {
        color: color
      },
      barWidth: '50%'
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.labels || [],
      axisLine: {
        lineStyle: {
          color: '#E0E0E0'
        }
      },
      axisLabel: {
        color: '#909399',
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#E0E0E0'
        }
      },
      axisLabel: {
        color: '#909399',
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
watch(() => props.chartData, () => {
  updateChart();
}, { deep: true });

// 监听高度变化
watch(() => props.height, () => {
  nextTick(() => {
    handleResize();
  });
});

// 组件挂载时初始化图表
onMounted(() => {
  initChart();
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
});

// 组件卸载前销毁图表和事件监听
onBeforeUnmount(() => {
  if (chart) {
    chart.dispose();
  }
  
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss" scoped>
.bar-chart-container {
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
    background-color: rgba(255, 255, 255, 0.7);
    z-index: 1;
    
    .el-icon {
      font-size: 24px;
      color: var(--el-color-primary);
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
    z-index: 1;
  }
}
</style> 