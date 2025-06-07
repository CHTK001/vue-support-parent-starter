<template>
  <div class="gauge-chart-container">
    <div class="gauge-chart" :class="{ 'is-loading': loading }">
      <div v-if="loading" class="loading-overlay">
        <IconifyIconOnline icon="ep:loading" class="loading-icon is-spinning" />
      </div>
      <div v-else class="gauge-content">
        <div class="gauge-header">
          <span class="gauge-title">{{ chartData?.title || "监控指标" }}</span>
          <el-tag v-if="statusText" :type="statusType" size="small" effect="light">{{ statusText }}</el-tag>
        </div>

        <div class="gauge-body">
          <div ref="gaugeChartRef" class="gauge-chart-container" />

          <div class="gauge-info">
            <div class="gauge-value">
              <span class="value">{{ formattedValue }}</span>
              <span class="unit">{{ chartData?.unit || "%" }}</span>
            </div>
            <div class="gauge-description">{{ description }}</div>
          </div>
        </div>

        <div class="gauge-footer">
          <div class="gauge-thresholds">
            <div v-for="(threshold, index) in thresholds" :key="index" class="threshold-item">
              <div class="threshold-color" :style="{ backgroundColor: threshold.color }" />
              <div class="threshold-label">{{ threshold.label }}</div>
            </div>
          </div>

          <div class="last-update">
            <IconifyIconOnline icon="ep:time" class="time-icon" />
            <span>{{ lastUpdateTime }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import * as echarts from "echarts/core";
import { GaugeChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { TitleComponent, TooltipComponent, LegendComponent } from "echarts/components";

// 注册必要的组件
echarts.use([GaugeChart, CanvasRenderer, TitleComponent, TooltipComponent, LegendComponent]);

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({})
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

// 引用
const gaugeChartRef = ref(null);
let gaugeChart = null;

// 格式化数值
const formattedValue = computed(() => {
  if (!props.chartData || !props.chartData.datasets || !props.chartData.datasets[0]) {
    return "0";
  }

  const data = props.chartData.datasets[0].data;
  if (!data || data.length === 0) {
    return "0";
  }

  // 获取最新值
  const latestValue = parseFloat(data[data.length - 1]);

  // 根据数值大小格式化
  return latestValue.toFixed(2);
});

// 获取数值
const value = computed(() => {
  if (!props.chartData || !props.chartData.datasets || !props.chartData.datasets[0]) {
    return 0;
  }

  const data = props.chartData.datasets[0].data;
  if (!data || data.length === 0) {
    return 0;
  }

  // 获取最新值
  return parseFloat(data[data.length - 1]);
});

// 阈值设置
const thresholds = [
  { value: 0, color: "#67C23A", label: "正常" },
  { value: 60, color: "#E6A23C", label: "警告" },
  { value: 80, color: "#F56C6C", label: "危险" }
];

// 根据当前值获取状态
const status = computed(() => {
  const currentValue = value.value;

  if (currentValue >= thresholds[2].value) {
    return "danger";
  } else if (currentValue >= thresholds[1].value) {
    return "warning";
  } else {
    return "success";
  }
});

// 状态文本
const statusText = computed(() => {
  switch (status.value) {
    case "danger":
      return "危险";
    case "warning":
      return "警告";
    case "success":
      return "正常";
    default:
      return "";
  }
});

// 状态类型
const statusType = computed(() => {
  return status.value;
});

// 描述文本
const description = computed(() => {
  const currentValue = value.value;

  if (currentValue >= thresholds[2].value) {
    return "当前指标处于危险水平，请立即处理";
  } else if (currentValue >= thresholds[1].value) {
    return "当前指标接近警戒线，请注意关注";
  } else {
    return "当前指标处于正常范围";
  }
});

// 最后更新时间
const lastUpdateTime = computed(() => {
  // 优先使用 updateTime 字段
  if (props.chartData && props.chartData.updateTime) {
    return props.chartData.updateTime;
  }

  // 如果没有 updateTime，则尝试从标签中获取
  if (!props.chartData || !props.chartData.labels || !props.chartData.labels.length) {
    return "暂无数据";
  }

  return props.chartData.labels[props.chartData.labels.length - 1] || "暂无数据";
});

// 获取仪表盘颜色
const getGaugeColor = value => {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i].value) {
      return thresholds[i].color;
    }
  }
  return thresholds[0].color;
};

// 获取渐变色配置
const getGaugeColorStops = () => {
  return [
    {
      offset: 0,
      color: thresholds[0].color
    },
    {
      offset: thresholds[1].value / 100,
      color: thresholds[1].color
    },
    {
      offset: thresholds[2].value / 100,
      color: thresholds[2].color
    }
  ];
};

// 初始化 ECharts 仪表盘
const initGaugeChart = () => {
  if (!gaugeChartRef.value) return;

  // 初始化 ECharts 实例
  gaugeChart = echarts.init(gaugeChartRef.value);

  // 设置仪表盘配置项
  const option = {
    series: [
      {
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        radius: "100%",
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [...getGaugeColorStops()]
          }
        },
        pointer: {
          icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
          length: "60%",
          width: 6,
          offsetCenter: [0, "0%"],
          itemStyle: {
            color: "auto"
          }
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: "auto",
            width: 1
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: "auto",
            width: 2
          }
        },
        axisLabel: {
          color: "#909399",
          fontSize: 12,
          distance: -40,
          formatter: function (value) {
            if (value === 0 || value === 100) {
              return value;
            }
            return "";
          }
        },
        detail: {
          show: false
        },
        data: [
          {
            value: value.value,
            name: "当前值"
          }
        ],
        title: {
          show: false
        },
        animation: true,
        animationDuration: 1000,
        animationEasing: "cubicOut"
      }
    ]
  };

  // 设置配置项并渲染图表
  gaugeChart.setOption(option);
};

// 更新仪表盘数据
const updateGaugeChart = () => {
  if (!gaugeChart) return;

  gaugeChart.setOption({
    series: [
      {
        data: [
          {
            value: value.value,
            name: "当前值"
          }
        ]
      }
    ]
  });
};

// 调整图表大小
const resizeChart = () => {
  if (gaugeChart) {
    gaugeChart.resize();
  }
};

// 监听窗口大小变化
const handleResize = () => {
  resizeChart();
};

// 监听数据变化
watch(
  () => props.chartData,
  () => {
    nextTick(() => {
      if (gaugeChart) {
        updateGaugeChart();
      } else {
        initGaugeChart();
      }
    });
  },
  { deep: true }
);

// 组件挂载
onMounted(() => {
  window.addEventListener("resize", handleResize);

  nextTick(() => {
    initGaugeChart();
  });
});

// 组件卸载
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);

  if (gaugeChart) {
    gaugeChart.dispose();
    gaugeChart = null;
  }
});
</script>

<style lang="scss" scoped>
.gauge-chart-container {
  width: 100%;
  height: 100%;
}

.gauge-chart {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.is-loading {
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;

      .loading-icon {
        font-size: 24px;
        color: var(--el-color-primary);

        &.is-spinning {
          animation: rotate 1s linear infinite;
        }
      }
    }
  }
}

.gauge-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.gauge-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .gauge-title {
    font-size: 16px;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
}

.gauge-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;

  .gauge-chart-container {
    width: 100%;
    height: 70%;
    position: relative;
  }

  .gauge-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: -20px;

    .gauge-value {
      display: flex;
      align-items: baseline;

      .value {
        font-size: 32px;
        font-weight: bold;
        color: var(--el-text-color-primary);
      }

      .unit {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-left: 4px;
      }
    }

    .gauge-description {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
      text-align: center;
    }
  }
}

.gauge-footer {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .gauge-thresholds {
    display: flex;
    justify-content: center;
    gap: 16px;

    .threshold-item {
      display: flex;
      align-items: center;

      .threshold-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        margin-right: 4px;
      }

      .threshold-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .last-update {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .time-icon {
      margin-right: 4px;
      font-size: 14px;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
