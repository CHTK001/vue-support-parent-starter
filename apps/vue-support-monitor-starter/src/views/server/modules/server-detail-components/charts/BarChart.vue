<template>
  <div class="bar-chart" :style="{ height: (height - 10) + 'px' }">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import * as echarts from "echarts";

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: [Number, String],
    default: 300
  },
  loading: {
    type: Boolean,
    default: false
  },
  chartConfig: {
    type: Object,
    default: () => ({})
  }
});

const chartRef = ref<HTMLElement>();
const chart = ref<echarts.ECharts>();

// 监听数据变化
watch(() => props.chartData, () => {
  updateChart();
}, { deep: true });

watch(() => props.loading, (loading) => {
  if (!loading) {
    nextTick(() => {
      initChart();
    });
  }
});

// 监听高度变化
watch(() => props.height, () => {
  nextTick(() => {
    handleResize();
  });
});

// 生命周期
onMounted(() => {
  if (!props.loading) {
    initChart();
  }
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (chart.value) {
    chart.value.dispose();
  }
  window.removeEventListener('resize', handleResize);
});

/**
 * 初始化图�?
 */
const initChart = () => {
  if (!chartRef.value) return;

  chart.value = echarts.init(chartRef.value, 'dark');
  updateChart();

  // 延迟调整图表尺寸，确保容器已完全渲染
  nextTick(() => {
    setTimeout(() => {
      if (chart.value) {
        chart.value.resize();
      }
    }, 100);
  });
};

/**
 * 更新图表
 */
const updateChart = () => {
  if (!chart.value) return;
  
  const option = generateOption();
  chart.value.setOption(option, true);
};

/**
 * 生成图表配置
 */
const generateOption = () => {
  const data = props.chartData;
  const config = props.chartConfig;
  
  return {
    title: {
      text: config.title || '',
      textStyle: {
        color: '#e0e0e0',
        fontSize: config.fontSize || 14
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#333',
      textStyle: {
        color: '#e0e0e0'
      }
    },
    legend: {
      show: config.legend?.show !== false,
      textStyle: {
        color: '#e0e0e0'
      },
      [config.legend?.position || 'top']: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.labels || [],
      axisLine: {
        lineStyle: {
          color: '#666'
        }
      },
      axisLabel: {
        color: '#a0a0a0'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#666'
        }
      },
      axisLabel: {
        color: '#a0a0a0'
      },
      splitLine: {
        lineStyle: {
          color: config.color?.grid || '#333'
        }
      }
    },
    series: (data.datasets || []).map((dataset, index) => ({
      name: dataset.label || `Series ${index + 1}`,
      type: 'bar',
      data: dataset.data || [],
      barWidth: config.barWidth || '60%',
      itemStyle: {
        color: dataset.backgroundColor || config.color?.primary || '#409EFF',
        borderRadius: [2, 2, 0, 0]
      }
    }))
  };
};

/**
 * 窗口大小变化处理
 */
const handleResize = () => {
  if (chart.value) {
    chart.value.resize();
  }
};
</script>

<style lang="scss" scoped>
.bar-chart {
  width: 100%;
}

.loading-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>
