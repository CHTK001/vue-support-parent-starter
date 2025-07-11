<template>
  <div class="bar-chart-container" :style="{ height: `${height}` }">
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
    <el-tooltip content="按住鼠标左键拖拽可以进行区域缩放" placement="top" :show-after="300" class="zoom-tip">
      <IconifyIconOnline icon="mdi:gesture-swipe" />
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, ToolboxComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { formatValue, getValueUnit } from "../utils/format";

// 注册必要的组件
echarts.use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, ToolboxComponent, BarChart, CanvasRenderer]);

const emit = defineEmits(["timeRangeChange"]);

const props = defineProps({
  chartData: {
    type: Object,
    required: true
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
  tip: {
    type: String,
    default: ""
  },
  defaultTimeRange: {
    type: Number,
    default: 30 // 默认查询最近30分钟数据
  }
});

const chartContainer = ref(null);
let chart = null;
const initialDataFetched = ref(false);

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

  // 设置是否显示图例
  const showLegend = config.showLegend !== false;

  // 是否堆叠
  const stacked = config.stacked || false;

  // 是否显示网格
  const showGrid = config.showGrid !== false;

  // 是否显示标签
  const showLabel = config.showLabel !== false;

  // 动画配置
  const animation = config.animation !== false;
  const animationDuration = config.animationDuration || 1000;
  const animationDelay = config.animationDelay || 0;

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
      label: showLabel ? {
        show: true,
        position: 'top',
        formatter: function(params) {
          return formatValueWithUnit(params.value);
        },
        color: '#e0e0e0',
        fontSize: 10
      } : {
        show: false
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
    animation: animation,
    animationDuration: animationDuration,
    animationDelay: animationDelay,
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
          right: "10px",
          top: "10px",
          orient: "vertical",
          textStyle: {
            color: "#e0e0e0"
          }
        }
      : { show: false },
    grid: {
      left: "3%",
      right: showLegend ? "15%" : "4%",
      bottom: "3%",
      top: "3%",
      containLabel: true,
      show: showGrid,
      borderColor: showGrid ? "rgba(255, 255, 255, 0.1)" : "transparent"
    },
    toolbox: {
      feature: {
        restore: {
          title: "重置缩放",
          icon: "path://M3.8,33.4 M47,18.9h9.8V8.7 M56.3,20.1 C52.1,9,40.5,0.6,26.8,2.1C12.6,3.7,1.6,16.2,2.1,30.6 M13,41.1H3.1v10.2 M3.7,39.9c4.2,11.1,15.8,19.5,29.5,18 c14.2-1.6,25.2-14.1,24.7-28.5",
          emphasis: {
            iconStyle: {
              color: "#4db6ac"
            }
          }
        }
      },
      right: "10px",
      top: "10px",
      iconStyle: {
        borderColor: "#e0e0e0",
        color: "#e0e0e0"
      }
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
        xAxisIndex: [0],
        zoomLock: false,
        filterMode: "filter",
        throttle: 100,
        rangeMode: ["value", "value"],
        moveOnMouseMove: false,
        preventDefaultMouseMove: false,
        disabled: false,
        zoomOnMouseWheel: true,
        moveOnMouseWheel: false
      },
      {
        type: "inside",
        start: 0,
        end: 100,
        yAxisIndex: [0],
        zoomLock: false,
        filterMode: "filter",
        throttle: 100,
        rangeMode: ["value", "value"],
        moveOnMouseMove: false,
        preventDefaultMouseMove: false,
        disabled: false,
        zoomOnMouseWheel: true,
        moveOnMouseWheel: false
      }
    ],
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

  // 设置鼠标操作
  chart.getZr().on("mousedown", function () {
    chartContainer.value.style.cursor = "crosshair";
  });

  chart.getZr().on("mouseup", function () {
    chartContainer.value.style.cursor = "default";
  });

  chart.getZr().on("mousemove", function () {
    if (chartContainer.value.style.cursor !== "crosshair") {
      chartContainer.value.style.cursor = "pointer";
    }
  });

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

  // 发送默认时间范围查询事件
  if (props.defaultTimeRange > 0 && !initialDataFetched.value) {
    const now = new Date();
    const startTime = new Date(now.getTime() - props.defaultTimeRange * 60 * 1000);
    emit("timeRangeChange", {
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      isDefault: true
    });
    initialDataFetched.value = true;
  }
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

.zoom-tip {
  position: absolute;
  top: 10px;
  right: 40px;
  font-size: 16px;
  color: #4db6ac;
  cursor: pointer;
  z-index: 10;
}
</style>
