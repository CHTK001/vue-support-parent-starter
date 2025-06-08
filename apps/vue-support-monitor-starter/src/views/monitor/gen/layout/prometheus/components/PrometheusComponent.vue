<template>
  <div class="prometheus-component" :class="{ 'is-fullscreen': isFullscreen }">
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
import LineChart from "./LineChart.vue";
import GaugeChart from "./GaugeChart.vue";
import CardChart from "./CardChart.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  prometheusData: {
    type: Object,
    default: () => ({})
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
  return props.item.title || props.item.monitorSysGenPrometheusConfigTitle || props.item.monitorSysGenPrometheusConfigName || "未命名组件";
});

// 图表类型
const chartType = computed(() => {
  return props.item.type || props.item.monitorSysGenPrometheusConfigChartType || "line";
});

// 提示信息
const tip = computed(() => {
  return props.item.monitorSysGenPrometheusConfigTip || "";
});

// 数据单位
const valueUnit = computed(() => {
  return props.item.valueUnit || props.item.monitorSysGenPrometheusConfigValueUnit || "";
});

// 获取数据单位标签
const getValueUnitLabel = unit => {
  const unitMap = {
    percent: "百分比 (%)",
    bytes: "字节 (B/KB/MB)",
    number: "数值 (K/M/B)",
    time: "时间 (秒/分/时)"
  };
  return unitMap[unit] || unit;
};

// 表格数据
const tableData = computed(() => {
  if (!props.prometheusData || !props.prometheusData.result) {
    return [];
  }

  const result = props.prometheusData.result || [];
  const tableRows = [];

  result.forEach(series => {
    const metric = series.metric || {};
    const values = series.values || series.value || [];

    // 对于即时向量，values是单个值
    if (!Array.isArray(values[0])) {
      const row = { ...metric, value: values[1] };
      tableRows.push(row);
    }
    // 对于范围向量，取最后一个值
    else if (values.length > 0) {
      const lastValue = values[values.length - 1];
      const row = { ...metric, value: lastValue[1], timestamp: new Date(lastValue[0] * 1000).toLocaleString() };
      tableRows.push(row);
    }
  });

  return tableRows;
});

// 表格列
const tableColumns = computed(() => {
  if (tableData.value.length === 0) {
    return [];
  }

  const firstRow = tableData.value[0];
  const columns = [];

  // 添加所有指标作为列
  Object.keys(firstRow).forEach(key => {
    if (key !== "__name__") {
      columns.push({
        prop: key,
        label: key,
        width: key === "value" ? "120" : ""
      });
    }
  });

  return columns;
});

// 图表高度
const chartHeight = computed(() => {
  // 全屏模式下，高度为视口高度减去头部和底部
  if (isFullscreen.value) {
    return window.innerHeight - 100;
  }

  // 使用传入的高度或默认高度
  return props.height || 250;
});

// 表格高度
const tableHeight = computed(() => {
  // 全屏模式下，高度为视口高度减去头部和底部
  if (isFullscreen.value) {
    return window.innerHeight - 100;
  }

  if (props.height) {
    if (props.height instanceof String) {
      return props.height;
    }

    return props.height + "px";
  }
  // 使用传入的高度或默认高度
  return "250px";
});

// 是否显示底部
const showFooter = computed(() => {
  return true;
});

// 全屏状态
const isFullscreen = ref(false);

// 刷新倒计时
const refreshCountdown = ref(0);
let countdownTimer = null;

// 获取随机颜色
const getRandomColor = (alpha = 1) => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 获取数据
const fetchData = () => {
  emit("fetchData", props.item);

  // 重置倒计时
  if (props.refreshInterval > 0) {
    refreshCountdown.value = props.refreshInterval;
  }
};

// 更新倒计时
const updateCountdown = () => {
  if (refreshCountdown.value > 0) {
    refreshCountdown.value--;

    if (refreshCountdown.value === 0 && props.refreshInterval > 0) {
      fetchData();
    }
  }
};

// 监听刷新间隔变化
watch(
  () => props.refreshInterval,
  newVal => {
    if (newVal > 0) {
      refreshCountdown.value = newVal;
    }
  }
);

// 组件挂载
onMounted(() => {
  if (props.refreshInterval > 0) {
    refreshCountdown.value = props.refreshInterval;
    countdownTimer = setInterval(updateCountdown, 1000);
  }
});

// 组件卸载
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});

// 添加handleTimeRangeChange方法
const handleTimeRangeChange = (range) => {
  emit('timeRangeChange', { ...range, componentId: props.item.i });
};
</script>

<style scoped>
.prometheus-component {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  background-color: #1e1e2e;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.prometheus-component.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  border-radius: 0;
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #292a3e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.component-title {
  font-size: 14px;
  font-weight: bold;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.component-actions {
  display: flex;
  align-items: center;
}

.component-content {
  flex: 1;
  padding: 8px;
  background-color: #292a3e;
  overflow: hidden;
  position: relative;
}

.component-footer {
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 4px 16px;
  background-color: #292a3e;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: #a0a0a0;
}

.query-info {
  display: flex;
  align-items: center;
}

.query-time {
  margin-left: 8px;
}

.value-unit {
  margin-left: 8px;
}

.refresh-info {
  display: flex;
  align-items: center;
}

.refresh-info span {
  margin-left: 4px;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
}

.table-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.component-error {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}
</style>
