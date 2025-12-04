<template>
  <div class="gauge-chart" :style="{ height: height + 'px' }">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="2" animated />
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
  
  const value = data.value || 0;
  const max = config.max || data.max || 100;
  const min = config.min || data.min || 0;
  const unit = config.unit || data.unit || '';
  
  // 生成阈值颜�?
  const thresholds = config.thresholds || [
    { value: 80, color: '#F56C6C' },
    { value: 60, color: '#E6A23C' },
    { value: 0, color: '#67C23A' }
  ];
  
  const axisLineColors = thresholds
    .sort((a, b) => a.value - b.value)
    .map(threshold => [threshold.value / max, threshold.color]);
  
  return {
    title: {
      text: config.title || '',
      textStyle: {
        color: '#e0e0e0',
        fontSize: config.fontSize || 14
      }
    },
    series: [
      {
        name: '仪表�?,
        type: 'gauge',
        min: min,
        max: max,
        splitNumber: 5,
        radius: '80%',
        axisLine: {
          lineStyle: {
            width: 10,
            color: axisLineColors
          }
        },
        pointer: {
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: '#fff',
            width: 4
          }
        },
        axisLabel: {
          color: 'auto',
          distance: 40,
          fontSize: 12
        },
        detail: {
          valueAnimation: true,
          formatter: `{value}${unit}`,
          color: 'auto',
          fontSize: 20,
          offsetCenter: [0, '70%']
        },
        data: [
          {
            value: value,
            name: data.name || '当前�?
          }
        ]
      }
    ]
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
.gauge-chart {
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
