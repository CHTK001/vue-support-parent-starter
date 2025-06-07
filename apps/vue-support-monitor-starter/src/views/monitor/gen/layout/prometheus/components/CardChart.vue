<template>
  <div class="card-chart-container">
    <div class="card-chart" :class="{ 'is-loading': loading }">
      <div v-if="loading" class="loading-overlay">
        <el-icon class="loading-icon"><IconifyIconOnline icon="ep:loading" /></el-icon>
      </div>
      <div v-else class="card-content">
        <div class="card-header">
          <span class="card-title">{{ chartData?.title || "监控指标" }}</span>
        </div>
        <div class="card-value-container">
          <span class="card-value">{{ formattedValue }}</span>
          <span class="card-unit">{{ chartData?.unit || "" }}</span>
        </div>
        <div class="card-footer">
          <div class="trend-indicator" :class="trendClass">
            <IconifyIconOnline :icon="trendIcon" class="trend-icon" />
            <span class="trend-value">{{ formattedTrend }}</span>
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
import { computed, ref, onMounted } from "vue";

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
  if (latestValue >= 1000000) {
    return (latestValue / 1000000).toFixed(2) + "M";
  } else if (latestValue >= 1000) {
    return (latestValue / 1000).toFixed(2) + "K";
  } else {
    return latestValue.toFixed(2);
  }
});

// 计算趋势
const trend = computed(() => {
  if (!props.chartData || !props.chartData.datasets || !props.chartData.datasets[0]) {
    return 0;
  }

  const data = props.chartData.datasets[0].data;
  if (!data || data.length < 2) {
    return 0;
  }

  // 计算最新值与前一个值的差异
  const latest = parseFloat(data[data.length - 1]);
  const previous = parseFloat(data[data.length - 2]);

  if (previous === 0) {
    return 0;
  }

  return ((latest - previous) / previous) * 100;
});

// 格式化趋势
const formattedTrend = computed(() => {
  if (trend.value === 0) {
    return "0%";
  }

  return (trend.value > 0 ? "+" : "") + trend.value.toFixed(2) + "%";
});

// 趋势图标
const trendIcon = computed(() => {
  if (trend.value > 0) {
    return "ep:arrow-up-bold";
  } else if (trend.value < 0) {
    return "ep:arrow-down-bold";
  } else {
    return "ep:minus";
  }
});

// 趋势样式类
const trendClass = computed(() => {
  if (trend.value > 0) {
    return "trend-up";
  } else if (trend.value < 0) {
    return "trend-down";
  } else {
    return "trend-stable";
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
</script>

<style lang="scss" scoped>
.card-chart-container {
  width: 100%;
  height: 100%;
}

.card-chart {
  width: 100%;
  height: 100%;
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

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.card-header {
  margin-bottom: 16px;

  .card-title {
    font-size: 16px;
    font-weight: bold;
    color: var(--el-color-primary-light-9);
  }
}

.card-value-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .card-value {
    font-size: 36px;
    font-weight: bold;
    color: var(--el-color-primary-light-9);
  }

  .card-unit {
    font-size: 14px;
    color: var(--el-color-primary-light-9);
    margin-top: 4px;
  }
}

.card-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .trend-indicator {
    display: flex;
    align-items: center;
    font-size: 14px;

    .trend-icon {
      margin-right: 4px;
    }

    &.trend-up {
      color: var(--el-color-danger);

      .trend-icon {
        color: var(--el-color-danger);
      }
    }

    &.trend-down {
      color: var(--el-color-success);

      .trend-icon {
        color: var(--el-color-success);
      }
    }

    &.trend-stable {
      color: var(--el-text-color-secondary);

      .trend-icon {
        color: var(--el-text-color-secondary);
      }
    }
  }

  .last-update {
    display: flex;
    align-items: center;
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
