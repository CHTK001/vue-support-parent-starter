<template>
  <div class="card-chart" :style="{ height: height + 'px' }">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="2" animated />
    </div>
    <div v-else class="card-content">
      <div class="card-main">
        <div class="card-value">
          <span class="value-number" :class="getValueClass()">{{ formattedValue }}</span>
          <span v-if="unit" class="value-unit">{{ unit }}</span>
        </div>
        <div v-if="trend" class="card-trend">
          <IconifyIconOnline 
            :icon="trend > 0 ? 'ri:arrow-up-line' : 'ri:arrow-down-line'" 
            :class="trend > 0 ? 'trend-up' : 'trend-down'"
          />
          <span class="trend-value">{{ Math.abs(trend) }}%</span>
        </div>
      </div>
      
      <div v-if="description" class="card-description">
        {{ description }}
      </div>
      
      <div v-if="queryTime" class="card-footer">
        <span class="update-time">{{ queryTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: [Number, String],
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
  queryTime: {
    type: String,
    default: ""
  }
});

// 计算属性
const value = computed(() => {
  return props.chartData.value ?? 0;
});

const unit = computed(() => {
  return props.chartData.unit || props.chartConfig.unit || "";
});

const trend = computed(() => {
  return props.chartData.trend ?? null;
});

const description = computed(() => {
  return props.chartData.description || "";
});

const formattedValue = computed(() => {
  const val = value.value;
  const decimal = props.chartConfig.decimal ?? 2;
  
  if (typeof val === 'number') {
    return val.toFixed(decimal);
  }
  return val;
});

/**
 * 获取数值样式类
 */
const getValueClass = () => {
  const thresholds = props.chartConfig.thresholds || [];
  const val = parseFloat(value.value);
  
  if (thresholds.length === 0) return '';
  
  // 根据阈值确定颜色
  for (const threshold of thresholds.sort((a, b) => b.value - a.value)) {
    if (val >= threshold.value) {
      if (threshold.color === '#F56C6C') return 'value-danger';
      if (threshold.color === '#E6A23C') return 'value-warning';
      if (threshold.color === '#67C23A') return 'value-success';
    }
  }
  
  return '';
};
</script>

<style lang="scss" scoped>
.card-chart {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: #e0e0e0;
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-value {
  display: flex;
  align-items: baseline;
  gap: 8px;

  .value-number {
    font-size: 32px;
    font-weight: 600;
    color: #e0e0e0;
    
    &.value-success {
      color: #67C23A;
    }
    
    &.value-warning {
      color: #E6A23C;
    }
    
    &.value-danger {
      color: #F56C6C;
    }
  }

  .value-unit {
    font-size: 16px;
    color: #a0a0a0;
  }
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;

  .trend-up {
    color: #67C23A;
  }

  .trend-down {
    color: #F56C6C;
  }

  .trend-value {
    color: #a0a0a0;
  }
}

.card-description {
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 8px;
}

.card-footer {
  font-size: 12px;
  color: var(--el-text-color-primary);
  text-align: right;
}
</style>
