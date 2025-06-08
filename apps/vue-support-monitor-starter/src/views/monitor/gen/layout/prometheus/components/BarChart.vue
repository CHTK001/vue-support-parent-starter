<template>
  <div class="bar-chart-container" :style="{ height: `${height}px` }">
    <div v-if="loading" class="chart-loading">
      <IconifyIconOnline icon="ep:loading" class="is-loading" />
    </div>
    <div v-else-if="noData" class="chart-no-data">
      <el-empty description="暂无数据" :image-size="50" />
    </div>
    <div v-else ref="chartContainer" class="chart-container" :style="{ height: '100%' }" />
    <el-tooltip v-if="tip" :content="tip" placement="top" :show-after="300" class="chart-tip">
      <IconifyIconOnline icon="ep:info-filled" />
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { formatValue, getValueUnit } from "../utils/format";

// 注册必要的组件
echarts.use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, BarChart, CanvasRenderer]);

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  height: {
    type: Number,
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

// 将数据转换为ECharts选项
const convertToEChartsOption = chartData => {
  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return {};
  }

  // 获取配置
  const config = props.chartConfig || {};

  // 获取单位
  const valueUnit = chartData.valueUnit || "";
  const unit = config.unit || getValueUnit(0, valueUnit, config);

  // 设置颜色
  const mainColor = config.mainColor || "#409EFF";
  const bgColor = config.bgColor || "rgba(64, 158, 255, 0.1)";

  // 设置是否显示图例
  const showLegend = config.showLegend !== false;

  // 是否堆叠
  const stacked = config.stacked || false;

  // 创建系列数据
  const series = chartData.datasets.map((dataset, index) => {
    const color = dataset.borderColor || (index === 0 ? mainColor : getRandomColor());

    return {
      name: dataset.label || `数据 ${index + 1}`,
      type: "bar",
      stack: stacked ? "总量" : undefined,
      itemStyle: {
        color: color
      },
      emphasis: {
        focus: "series"
      },
      data: dataset.data || [],
      barWidth: "50%"
    };
  });

  // 格式化函数
  const formatValueWithUnit = value => {
    const formattedValue = formatValue(value, valueUnit, config.unit);
    return formattedValue + unit;
  };

  return {
    backgroundColor: "transparent",
    textStyle: {
      color: "#e0e0e0"
    },
    title: chartData.title
      ? {
          text: chartData.title,
          left: "center",
          textStyle: {
            color: "#e0e0e0"
          }
        }
      : undefined,
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      backgroundColor: "rgba(30, 30, 46, 0.9)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: {
        color: "#e0e0e0"
      },
      formatter: function (params) {
        let result = params[0].axisValue + "<br/>";
        params.forEach(param => {
          // 使用自定义颜色
          const color = param.color;
          result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
          result += `${param.seriesName}: ${formatValueWithUnit(param.value)}<br/>`;
        });
        return result;
      }
    },
    legend: showLegend
      ? {
          show: true,
          top: "left",
          textStyle: {
            color: "#e0e0e0"
          }
        }
      : { show: false },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: showLegend ? "15%" : "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
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
          return formatValueWithUnit(value);
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

<style scoped>
.bar-chart-container {
  width: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
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
  color: #409eff;
  cursor: pointer;
  z-index: 10;
}
</style>
