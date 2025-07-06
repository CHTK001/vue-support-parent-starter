<template>
  <div class="pie-chart" :style="{ height: (height - 10) + 'px' }">
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
 * 初始化图表
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
  
  // 处理数据格式
  const seriesData = data.labels?.map((label, index) => ({
    name: label,
    value: data.datasets?.[0]?.data?.[index] || 0
  })) || [];
  
  return {
    title: {
      text: config.title || '',
      textStyle: {
        color: '#e0e0e0',
        fontSize: config.fontSize || 14
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#333',
      textStyle: {
        color: '#e0e0e0'
      }
    },
    legend: {
      show: config.legend?.show !== false,
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: '#e0e0e0'
      }
    },
    series: [
      {
        name: data.name || '数据分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#1e1e2e',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#e0e0e0'
          }
        },
        labelLine: {
          show: false
        },
        data: seriesData,
        color: data.datasets?.[0]?.backgroundColor || [
          '#409EFF',
          '#67C23A',
          '#E6A23C',
          '#F56C6C',
          '#909399'
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
.pie-chart {
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
