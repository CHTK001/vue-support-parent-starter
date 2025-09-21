<template>
  <div class="bar-chart-component">
    <div class="chart-header">
      <div class="chart-title">
        <IconifyIconOnline icon="ri:bar-chart-line" class="chart-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div class="chart-actions" v-if="editMode">
        <el-button type="primary" text size="small" @click="handleEdit">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
        <el-button type="danger" text size="small" @click="handleDelete">
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>
    
    <div class="chart-content" v-loading="loading">
      <div ref="chartRef" class="bar-chart"></div>
    </div>

    <div class="chart-footer" v-if="!editMode">
      <el-button type="primary" text size="small" @click="handleRefresh" :loading="refreshing">
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import * as echarts from "echarts";
import { type ServerDetailComponent } from "@/api/server";

const props = defineProps<{
  componentData: ServerDetailComponent;
  serverId: number;
  editMode: boolean;
}>();

const emit = defineEmits<{
  delete: [componentId: number];
  edit: [component: ServerDetailComponent];
  refresh: [componentId: number];
}>();

const loading = ref(false);
const refreshing = ref(false);
const chartRef = ref<HTMLElement>();
const chartInstance = ref<echarts.ECharts>();

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance.value = echarts.init(chartRef.value);
  
  // 示例数据
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    yAxis: { type: 'value' },
    series: [{
      data: [120, 200, 150, 80, 70, 110, 130],
      type: 'bar',
      itemStyle: { color: '#409EFF' }
    }]
  };
  
  chartInstance.value.setOption(option);
};

const handleRefresh = () => {
  refreshing.value = true;
  setTimeout(() => {
    refreshing.value = false;
    emit("refresh", props.componentData.monitorSysGenServerDetailComponentId!);
  }, 1000);
};

const handleEdit = () => emit("edit", props.componentData);
const handleDelete = () => emit("delete", props.componentData.monitorSysGenServerDetailComponentId!);

onMounted(() => {
  nextTick(() => initChart());
  window.addEventListener('resize', () => chartInstance.value?.resize());
});

onUnmounted(() => {
  window.removeEventListener('resize', () => chartInstance.value?.resize());
  chartInstance.value?.dispose();
});
</script>

<style lang="scss" scoped>
.bar-chart-component {
  height: 100%;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  .chart-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .chart-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .chart-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .chart-actions {
    opacity: 1;
  }
}

.chart-content {
  flex: 1;
  padding: 16px;

  .bar-chart {
    height: 100%;
    min-height: 200px;
  }
}

.chart-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-extra-light);
  display: flex;
  justify-content: center;
}
</style>
