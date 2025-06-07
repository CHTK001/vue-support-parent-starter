<template>
  <div class="line-chart-container" :style="{ height: `${height}px` }">
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
import { LineChart as EChartsLineChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, GridComponent, DatasetComponent, TransformComponent, LegendComponent } from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { IconifyIconOnline } from "@repo/components/ReIcon";

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
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: []
    };
  }

  // 获取配置
  const config = props.chartConfig || {};
  
  // 设置单位
  const unit = config.unit || '';
  
  // 设置颜色
  const mainColor = config.mainColor || "#409EFF";
  const bgColor = config.bgColor || "rgba(64, 158, 255, 0.1)";
  
  // 是否显示图例
  const showLegend = config.showLegend !== false;
  
  // 是否堆叠显示
  const stacked = config.stacked || false;
  
  // 是否填充区域
  const fill = config.fill !== false;
  
  // 是否平滑曲线
  const smooth = config.smooth || false;

  const series = chartData.datasets.map((dataset, index) => {
    // 提取颜色，优先使用数据集自身的颜色，其次使用配置的主色调，最后使用默认颜色
    let color = dataset.borderColor || (index === 0 ? mainColor : getRandomColor());
    let areaColor = dataset.backgroundColor || (index === 0 ? bgColor : getRandomColor(0.1));

    return {
      name: dataset.label,
      type: "line",
      data: dataset.data,
      smooth: smooth,
      stack: stacked ? 'total' : undefined,
      areaStyle: fill ? {
        color: areaColor,
        opacity: 0.3
      } : undefined,
      lineStyle: {
        color: color,
        width: 2
      },
      itemStyle: {
        color: color
      },
      emphasis: {
        focus: 'series'
      }
    };
  });

  return {
    backgroundColor: "transparent",
    textStyle: {
      color: "#e0e0e0"
    },
    title: chartData.title ? {
      text: chartData.title,
      left: 'center',
      textStyle: {
        color: '#e0e0e0'
      }
    } : undefined,
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: mainColor
        }
      },
      backgroundColor: "rgba(30, 30, 46, 0.9)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: {
        color: "#e0e0e0"
      },
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>';
        params.forEach(param => {
          // 使用自定义颜色
          const color = param.color;
          result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
          result += `${param.seriesName}: ${param.value}${unit}<br/>`;
        });
        return result;
      }
    },
    legend: showLegend ? {
      show: true,
      top: 'top',
      textStyle: {
        color: '#e0e0e0'
      }
    } : { show: false },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: showLegend ? "15%" : "3%",
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
      min: config.yAxisMin !== null && config.yAxisMin !== undefined ? config.yAxisMin : undefined,
      max: config.yAxisMax !== null && config.yAxisMax !== undefined ? config.yAxisMax : undefined,
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
        fontSize: 10,
        formatter: value => {
          return value + unit;
        }
      }
    },
    series: series
  };
};

// 生成随机颜色
const getRandomColor = (alpha = 1) => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  .chart-tip {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 16px;
    color: #409EFF;
    cursor: pointer;
    z-index: 10;
  }
}
</style>
