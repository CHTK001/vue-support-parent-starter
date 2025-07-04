<template>
  <div class="server-component" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="component-header">
      <div class="component-title">{{ title }}</div>
      <div class="component-actions">
        <el-tooltip content="刷新" placement="top" :show-after="300">
          <el-button link @click="fetchData">
            <IconifyIconOnline icon="ep:refresh" />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="editable" content="配置图表" placement="top" :show-after="300">
          <el-button link @click="$emit('editChartConfig', item)">
            <IconifyIconOnline icon="ep:setting" />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="editable" content="编辑查询" placement="top" :show-after="300">
          <el-button link @click="$emit('editComponent', item)">
            <IconifyIconOnline icon="ep:edit" />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="editable" content="移除" placement="top" :show-after="300">
          <el-button link @click="$emit('removeComponent', item)">
            <IconifyIconOnline icon="ep:delete" />
          </el-button>
        </el-tooltip>
      </div>
    </div>
    <div class="component-content">
      <div v-if="error" class="component-error">
        <el-alert :title="error" type="error" show-icon :closable="false" />
      </div>
      <div v-else-if="chartType === 'line'" class="chart-wrapper">
        <line-chart :chart-data="chartData" :height="chartHeight" :loading="loading" :chart-config="chartConfig" :tip="tip" :defaultTimeRange="30" @timeRangeChange="handleTimeRangeChange" />
      </div>
      <div v-else-if="chartType === 'gauge'" class="chart-wrapper">
        <gauge-chart :chart-data="chartData" :height="chartHeight" :loading="loading" :chart-config="chartConfig" :tip="tip" />
      </div>
      <div v-else-if="chartType === 'card'" class="chart-wrapper">
        <card-chart :chart-data="chartData" :height="chartHeight" :loading="loading" :chart-config="chartConfig" :tip="tip" :query-time="queryTime" />
      </div>
      <div v-else-if="chartType === 'bar'" class="chart-wrapper">
        <bar-chart :chart-data="chartData" :height="chartHeight" :loading="loading" :chart-config="chartConfig" :tip="tip" />
      </div>
      <div v-else-if="chartType === 'pie'" class="chart-wrapper">
        <pie-chart :chart-data="chartData" :height="chartHeight" :loading="loading" :chart-config="chartConfig" :tip="tip" />
      </div>
      <div v-else-if="chartType === 'table'" class="table-wrapper">
        <div v-if="loading" class="loading-mask">
          <IconifyIconOnline icon="ep:loading" class="is-loading" />
        </div>
        <el-table v-else :data="tableData" stripe style="width: 100%" :max-height="tableHeight" size="small">
          <el-table-column v-for="(column, index) in tableColumns" :key="index" :prop="column.prop" :label="column.label" :width="column.width" />
        </el-table>
      </div>
    </div>
    <div v-if="showFooter" class="component-footer">
      <div class="query-info">
        <span class="query-time">{{ queryTime }}</span>
        <span v-if="valueUnit" class="value-unit">
          <el-tag size="small" type="info">{{ getValueUnitLabel(valueUnit) }}</el-tag>
        </span>
      </div>
      <div v-if="refreshInterval > 0" class="refresh-info">
        <IconifyIconOnline icon="ep:timer" />
        <span>{{ refreshCountdown }}s</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import LineChart from "../charts/LineChart.vue";
import GaugeChart from "../charts/GaugeChart.vue";
import CardChart from "../charts/CardChart.vue";
import BarChart from "../charts/BarChart.vue";
import PieChart from "../charts/PieChart.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  chartData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ""
  },
  editable: {
    type: Boolean,
    default: false
  },
  refreshInterval: {
    type: Number,
    default: 0
  },
  queryTime: {
    type: String,
    default: ""
  },
  height: {
    type: [Number, String],
    default: 250
  },
  chartConfig: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(["fetchData", "editComponent", "removeComponent", "editChartConfig", "timeRangeChange"]);

// 组件标题
const title = computed(() => {
  return props.item.title || props.item.monitorSysGenServerComponentName || "未命名组件";
});

// 图表类型
const chartType = computed(() => {
  return props.item.type || props.item.monitorSysGenServerComponentType || "line";
});

// 提示信息
const tip = computed(() => {
  return props.item.monitorSysGenServerDetailComponentTip || "";
});

// 数据单位
const valueUnit = computed(() => {
  return props.item.valueUnit || props.item.monitorSysGenServerDetailComponentValueUnit || "";
});

// 图表高度
const chartHeight = computed(() => {
  return typeof props.height === 'number' ? props.height : parseInt(props.height) || 250;
});

// 表格高度
const tableHeight = computed(() => {
  return chartHeight.value - 40; // 减去表格头部高度
});

// 表格数据
const tableData = computed(() => {
  return props.chartData.data || [];
});

// 表格列
const tableColumns = computed(() => {
  return props.chartData.columns || [];
});

// 是否显示底部信息
const showFooter = computed(() => {
  return props.queryTime || props.refreshInterval > 0;
});

// 全屏状态
const isFullscreen = ref(false);

// 刷新倒计时
const refreshCountdown = ref(0);
const refreshTimer = ref(null);

// 监听刷新间隔变化
watch(() => props.refreshInterval, (newInterval) => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
  
  if (newInterval > 0) {
    refreshCountdown.value = newInterval;
    refreshTimer.value = setInterval(() => {
      refreshCountdown.value--;
      if (refreshCountdown.value <= 0) {
        refreshCountdown.value = newInterval;
        fetchData();
      }
    }, 1000);
  }
}, { immediate: true });

// 生命周期
onMounted(() => {
  // 监听全屏变化
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onBeforeUnmount(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
  }
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

/**
 * 获取数值单位标签
 */
const getValueUnitLabel = (unit) => {
  const unitMap = {
    percent: '%',
    bytes: 'B',
    status: '状态',
    count: '个',
    time: 's'
  };
  return unitMap[unit] || unit;
};

/**
 * 刷新数据
 */
const fetchData = () => {
  emit('fetchData', props.item);
};

/**
 * 时间范围变化处理
 */
const handleTimeRangeChange = (timeRange) => {
  emit('timeRangeChange', props.item, timeRange);
};

/**
 * 全屏变化处理
 */
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};
</script>

<style lang="scss" scoped>
.server-component {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
  color: #e0e0e0;

  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: #1e1e2e;
  }

  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    min-height: 40px;

    .component-title {
      font-size: 14px;
      font-weight: 500;
      color: #e0e0e0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .component-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;

      .el-button {
        color: #e0e0e0;
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }

    &:hover .component-actions {
      opacity: 1;
    }
  }

  .component-content {
    flex: 1;
    position: relative;
    overflow: hidden;

    .component-error {
      padding: 16px;
    }

    .chart-wrapper {
      height: 100%;
      padding: 8px;
    }

    .table-wrapper {
      height: 100%;
      position: relative;

      .loading-mask {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10;

        .is-loading {
          font-size: 24px;
          color: var(--el-color-primary);
          animation: rotate 2s linear infinite;
        }
      }

      :deep(.el-table) {
        background: transparent;
        color: #e0e0e0;

        .el-table__header {
          background: rgba(255, 255, 255, 0.1);
        }

        .el-table__row {
          background: transparent;

          &:hover {
            background: rgba(255, 255, 255, 0.05);
          }
        }

        th, td {
          border-color: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
        }
      }
    }
  }

  .component-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 12px;
    color: #a0a0a0;

    .query-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .refresh-info {
      display: flex;
      align-items: center;
      gap: 4px;
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
