<template>
  <div class="card-chart-container" :style="{ height: `${height}px` }">
    <div class="card-content" :class="{ 'has-trend': showTrend }">
      <div v-if="loading" class="chart-loading">
        <IconifyIconOnline icon="ep:loading" class="is-loading" />
      </div>
      <template v-else-if="!noData">
        <div class="card-title">{{ chartData.title || "" }}</div>
        <div class="card-value" :style="valueStyle">
          {{ formattedValue }}
          <span class="card-unit">{{ unit }}</span>
        </div>
        <div v-if="showTrend" class="card-trend" :class="trendClass">
          <IconifyIconOnline v-if="trend > 0" icon="ep:arrow-up" />
          <IconifyIconOnline v-else-if="trend < 0" icon="ep:arrow-down" />
          <span>{{ Math.abs(trend).toFixed(2) }}%</span>
        </div>
      </template>
      <div v-else class="chart-no-data">
        <el-empty description="暂无数据" :image-size="50" />
      </div>
    </div>
    <div class="card-update-time">{{ queryTime }}</div>
    <el-tooltip v-if="tip" :content="tip" placement="top" :show-after="300" class="chart-tip">
      <IconifyIconOnline icon="ep:info-filled" />
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  height: {
    type: Number,
    default: 120
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
  queryTime: {
    type: String,
    default: ""
  }
});

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

// 获取最新值
const currentValue = computed(() => {
  if (noData.value) return 0;

  const dataset = props.chartData.datasets[0];
  if (!dataset || !dataset.data || dataset.data.length === 0) return 0;

  return dataset.data[dataset.data.length - 1];
});

// 格式化显示值
const formattedValue = computed(() => {
  const value = currentValue.value;

  // 如果值大于1000，使用K作为单位
  if (value >= 1000) {
    return (value / 1000).toFixed(2);
  }

  // 如果是整数，不显示小数点
  if (Number.isInteger(value)) {
    return value.toString();
  }

  if (value instanceof Number) {
    return value.toFixed(2);
  }

  return value;
});

// 获取单位
const unit = computed(() => {
  const config = props.chartConfig || {};

  // 如果有配置的单位，优先使用
  if (config.unit) {
    return config.unit;
  }

  // 如果值大于1000，使用K作为单位
  if (currentValue.value >= 1000) {
    return "K";
  }

  return "";
});

// 计算趋势变化
const trend = computed(() => {
  if (noData.value) return 0;

  const dataset = props.chartData.datasets[0];
  if (!dataset || !dataset.data || dataset.data.length < 2) return 0;

  const current = dataset.data[dataset.data.length - 1];
  const previous = dataset.data[dataset.data.length - 2];

  if (previous === 0) return 0;

  return ((current - previous) / previous) * 100;
});

// 是否显示趋势
const showTrend = computed(() => {
  const config = props.chartConfig || {};
  return config.showTrend !== false && trend.value !== 0;
});

// 趋势样式类
const trendClass = computed(() => {
  if (trend.value > 0) return "trend-up";
  if (trend.value < 0) return "trend-down";
  return "";
});

// 计算值的样式
const valueStyle = computed(() => {
  const config = props.chartConfig || {};
  const value = currentValue.value;

  // 默认颜色
  let color = config.mainColor || "#409EFF";

  // 如果设置了阈值，根据阈值设置颜色
  if (config.thresholds && Array.isArray(config.thresholds)) {
    // 确保阈值按值排序
    const sortedThresholds = [...config.thresholds].sort((a, b) => a.value - b.value);

    // 查找适用的阈值
    for (let i = sortedThresholds.length - 1; i >= 0; i--) {
      if (value >= sortedThresholds[i].value) {
        color = sortedThresholds[i].color;
        break;
      }
    }
  }

  return { color };
});
</script>

<style scoped>
.card-chart-container {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
}

.card-content {
  width: 100%;
  height: calc(100% - 20px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.card-content.has-trend {
  justify-content: space-between;
}

.card-title {
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 5px;
  text-align: center;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
}

.card-unit {
  font-size: 14px;
  margin-left: 2px;
}

.card-trend {
  display: flex;
  align-items: center;
  font-size: 12px;
  margin-top: 5px;
}

.card-update-time {
  position: absolute;
  bottom: 5px;
  right: 10px;
  font-size: 10px;
  color: #a0a0a0;
}

.trend-up {
  color: #f56c6c;
}

.trend-down {
  color: #67c23a;
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
