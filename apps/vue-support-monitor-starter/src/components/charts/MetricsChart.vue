<template>
  <div class="metrics-chart" :style="{ height: height + 'px' }">
    <div v-if="loading" class="chart-loading">
      <el-loading-spinner />
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!hasData" class="chart-empty">
      <el-empty :description="emptyText" />
    </div>
    
    <div v-else ref="chartRef" class="chart-container" :style="{ height: height + 'px' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from "vue";
import * as echarts from "echarts";

// 定义属性
interface Props {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'gauge';
  title?: string;
  height?: number;
  loading?: boolean;
  emptyText?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  seriesName?: string;
  color?: string | string[];
  showLegend?: boolean;
  showGrid?: boolean;
  smooth?: boolean;
  area?: boolean;
  realTime?: boolean;
  maxDataPoints?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  height: 300,
  loading: false,
  emptyText: '暂无数据',
  xAxisKey: 'time',
  yAxisKey: 'value',
  seriesName: '数据',
  color: '#409eff',
  showLegend: true,
  showGrid: true,
  smooth: true,
  area: false,
  realTime: false,
  maxDataPoints: 100,
});

// 响应式状态
const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

// 计算属性
const hasData = computed(() => {
  return Array.isArray(props.data) && props.data.length > 0;
});

/**
 * 初始化图表
 */
const initChart = () => {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  updateChart();
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
};

/**
 * 更新图表
 */
const updateChart = () => {
  if (!chartInstance || !hasData.value) return;
  
  const option = getChartOption();
  chartInstance.setOption(option, true);
};

/**
 * 获取图表配置
 */
const getChartOption = () => {
  const baseOption = {
    title: {
      text: props.title,
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
    },
    legend: {
      show: props.showLegend,
      bottom: 0,
    },
    grid: {
      show: props.showGrid,
      left: '3%',
      right: '4%',
      bottom: props.showLegend ? '10%' : '3%',
      containLabel: true,
    },
    color: Array.isArray(props.color) ? props.color : [props.color],
  };

  switch (props.type) {
    case 'line':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: props.data.map(item => item[props.xAxisKey]),
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
              }
              return value.toString();
            },
          },
        },
        series: [
          {
            name: props.seriesName,
            type: 'line',
            smooth: props.smooth,
            areaStyle: props.area ? {} : undefined,
            data: props.data.map(item => item[props.yAxisKey]),
            animationDuration: props.realTime ? 0 : 1000,
          },
        ],
      };

    case 'bar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: props.data.map(item => item[props.xAxisKey]),
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: props.seriesName,
            type: 'bar',
            data: props.data.map(item => item[props.yAxisKey]),
          },
        ],
      };

    case 'pie':
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        series: [
          {
            name: props.seriesName,
            type: 'pie',
            radius: '50%',
            data: props.data.map(item => ({
              name: item[props.xAxisKey],
              value: item[props.yAxisKey],
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      };

    case 'gauge':
      const value = props.data.length > 0 ? props.data[props.data.length - 1][props.yAxisKey] : 0;
      return {
        ...baseOption,
        series: [
          {
            name: props.seriesName,
            type: 'gauge',
            detail: {
              formatter: '{value}%',
            },
            data: [
              {
                value,
                name: props.seriesName,
              },
            ],
          },
        ],
      };

    default:
      return baseOption;
  }
};

/**
 * 处理窗口大小变化
 */
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

/**
 * 添加数据点（实时模式）
 */
const addDataPoint = (dataPoint: any) => {
  if (!props.realTime) return;
  
  const newData = [...props.data, dataPoint];
  
  // 限制数据点数量
  if (newData.length > props.maxDataPoints) {
    newData.shift();
  }
  
  // 更新图表
  nextTick(() => {
    updateChart();
  });
};

/**
 * 清空数据
 */
const clearData = () => {
  if (chartInstance) {
    chartInstance.clear();
  }
};

/**
 * 导出图片
 */
const exportImage = (type: 'png' | 'jpeg' = 'png') => {
  if (!chartInstance) return null;
  
  return chartInstance.getDataURL({
    type,
    pixelRatio: 2,
    backgroundColor: '#fff',
  });
};

/**
 * 下载图片
 */
const downloadImage = (filename?: string) => {
  const dataURL = exportImage();
  if (!dataURL) return;
  
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename || `chart-${Date.now()}.png`;
  link.click();
};

// 监听数据变化
watch(
  () => props.data,
  () => {
    nextTick(() => {
      updateChart();
    });
  },
  { deep: true }
);

// 监听加载状态
watch(
  () => props.loading,
  (loading) => {
    if (!loading) {
      nextTick(() => {
        updateChart();
      });
    }
  }
);

// 暴露方法
defineExpose({
  addDataPoint,
  clearData,
  exportImage,
  downloadImage,
  chartInstance: () => chartInstance,
});

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.metrics-chart {
  position: relative;
  width: 100%;

  .chart-loading,
  .chart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;

    p {
      margin-top: 12px;
      font-size: 14px;
    }
  }

  .chart-container {
    width: 100%;
  }
}
</style>
