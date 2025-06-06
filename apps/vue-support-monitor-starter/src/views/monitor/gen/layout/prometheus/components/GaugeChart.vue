<template>
  <div class="gauge-chart-container">
    <div class="gauge-chart" :class="{ 'is-loading': loading }">
      <div v-if="loading" class="loading-overlay">
        <el-icon class="loading-icon"><IconifyIconOnline icon="ep:loading" /></el-icon>
      </div>
      <div v-else class="gauge-content">
        <div class="gauge-header">
          <span class="gauge-title">{{ chartData?.title || "监控指标" }}</span>
          <el-tag v-if="statusText" :type="statusType" size="small" effect="light">{{ statusText }}</el-tag>
        </div>

        <div class="gauge-body">
          <div ref="gaugeCanvasRef" class="gauge-canvas-container">
            <canvas ref="gaugeCanvas" />
          </div>

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
import Chart from "chart.js/auto";

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
const gaugeCanvasRef = ref(null);
const gaugeCanvas = ref(null);
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

// 初始化仪表盘
const initGaugeChart = () => {
  if (!gaugeCanvas.value) return;

  // 销毁已有图表
  if (gaugeChart) {
    gaugeChart.destroy();
  }

  const ctx = gaugeCanvas.value.getContext("2d");

  gaugeChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [value.value, 100 - value.value],
          backgroundColor: [getGaugeColor(value.value), "#E4E7ED"],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "75%",
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      animation: {
        duration: 1000,
        easing: "easeOutCubic"
      }
    }
  });
};

// 更新仪表盘
const updateGaugeChart = () => {
  if (!gaugeChart) return;

  gaugeChart.data.datasets[0].data = [value.value, 100 - value.value];
  gaugeChart.data.datasets[0].backgroundColor[0] = getGaugeColor(value.value);
  gaugeChart.update();
};

// 调整画布大小
const resizeCanvas = () => {
  if (!gaugeCanvasRef.value || !gaugeCanvas.value) return;

  const container = gaugeCanvasRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  gaugeCanvas.value.width = width;
  gaugeCanvas.value.height = height;

  if (gaugeChart) {
    gaugeChart.resize();
  }
};

// 监听窗口大小变化
const handleResize = () => {
  resizeCanvas();
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
    resizeCanvas();
    initGaugeChart();
  });
});

// 组件卸载
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);

  if (gaugeChart) {
    gaugeChart.destroy();
    gaugeChart = null;
  }
});
</script>

<style lang="scss" scoped>
.gauge-chart-container {
  width: 100%;
  height: 100%;
  padding: 8px;
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
        animation: rotate 1s linear infinite;
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

  .gauge-canvas-container {
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
