<template>
  <div class="battery-chart-container">
    <div class="battery-chart-header">
      <div class="battery-chart-title">{{ props.title }}</div>
      <div v-if="props.queryTime" class="battery-chart-time">{{ props.queryTime }}</div>
    </div>
    <div class="battery-chart-content">
      <div class="battery-wrapper">
        <div class="battery">
          <div class="battery-level" :style="batteryLevelStyle"></div>
          <div class="battery-cap"></div>
        </div>
        <div class="battery-value">
          <span class="value">{{ formattedValue }}</span>
          <span v-if="unitDisplay" class="unit">{{ unitDisplay }}</span>
        </div>
      </div>
    </div>
    <div v-if="props.tip" class="battery-chart-tip">
      <el-tooltip :content="props.tip" placement="top">
        <IconifyIconOnline icon="ri:information-line" />
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  chartConfig: {
    type: Object,
    default: () => ({})
  },
  title: String,
  tip: String,
  queryTime: String
});

// 获取电池图的值
const value = computed(() => {
  if (!props.chartData || !props.chartData.datasets || props.chartData.datasets.length === 0) {
    return 0;
  }
  
  // 获取第一个数据集的第一个值
  const firstDataset = props.chartData.datasets[0];
  return firstDataset.data && firstDataset.data.length > 0 ? firstDataset.data[0] : 0;
});

// 格式化后的值
const formattedValue = computed(() => {
  if (props.chartConfig && props.chartConfig.formatValue) {
    return props.chartConfig.formatValue(value.value);
  }
  return value.value;
});

// 单位显示
const unitDisplay = computed(() => {
  if (props.chartConfig && props.chartConfig.getValueUnit) {
    return props.chartConfig.getValueUnit(value.value);
  }
  return "";
});

// 电池样式
const batteryLevelStyle = computed(() => {
  // 确保值在0-100之间
  let percentage = value.value;
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;
  
  // 根据百分比确定颜色
  let color = "#67C23A"; // 默认绿色
  
  // 使用阈值配置确定颜色
  if (props.chartConfig && props.chartConfig.thresholds) {
    // 按值从高到低排序阈值
    const sortedThresholds = [...props.chartConfig.thresholds].sort((a, b) => b.value - a.value);
    
    // 找到第一个小于等于当前值的阈值
    for (const threshold of sortedThresholds) {
      if (percentage >= threshold.value) {
        color = threshold.color;
        break;
      }
    }
  } else {
    // 默认颜色逻辑
    if (percentage <= 20) {
      color = "#F56C6C"; // 红色
    } else if (percentage <= 50) {
      color = "#E6A23C"; // 黄色
    }
  }
  
  return {
    width: `${percentage}%`,
    backgroundColor: color
  };
});
</script>

<style lang="scss" scoped>
.battery-chart-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  color: #e0e0e0;
}

.battery-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.battery-chart-title {
  font-size: 16px;
  font-weight: bold;
}

.battery-chart-time {
  font-size: 12px;
  color: #909399;
}

.battery-chart-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.battery-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.battery {
  position: relative;
  width: 150px;
  height: 70px;
  border: 3px solid #e0e0e0;
  border-radius: 5px;
  background-color: #292a3e;
  margin-right: 8px;
  
  &-cap {
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 35px;
    background-color: #e0e0e0;
    border-radius: 0 3px 3px 0;
  }
  
  &-level {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: #67C23A;
    transition: width 0.5s ease, background-color 0.5s ease;
  }
}

.battery-value {
  font-size: 24px;
  font-weight: bold;
  
  .unit {
    font-size: 16px;
    margin-left: 5px;
  }
}

.battery-chart-tip {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  color: #909399;
  font-size: 16px;
}
</style> 