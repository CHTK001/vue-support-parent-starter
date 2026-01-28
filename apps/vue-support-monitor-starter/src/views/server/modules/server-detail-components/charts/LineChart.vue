<template>
  <div class="line-chart system-container modern-bg" :style="{ height: (height - 10) + 'px' }">
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
  },
  defaultTimeRange: {
    type: Number,
    default: 30
  }
});

const emit = defineEmits<{
  timeRangeChange: [timeRange: number];
}>();

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
 * 初始化图表
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
    toolbox: {
      show: config.toolbox?.show === true,
      feature: {
        saveAsImage: {
          iconStyle: {
            borderColor: '#e0e0e0'
          }
        }
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
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
      type: 'line',
      data: dataset.data || [],
      smooth: true,
      lineStyle: {
        width: config.lineWidth || 2,
        color: dataset.borderColor || config.color?.primary || '#409EFF'
      },
      areaStyle: dataset.fill ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: dataset.backgroundColor || 'rgba(64, 158, 255, 0.3)'
          },
          {
            offset: 1,
            color: dataset.backgroundColor || 'rgba(64, 158, 255, 0.1)'
          }
        ])
      } : undefined
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

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
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


.line-chart {
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


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
