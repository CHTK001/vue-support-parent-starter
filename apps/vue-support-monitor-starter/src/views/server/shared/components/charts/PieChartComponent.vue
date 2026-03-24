<template>
  <div class="pie-chart-component system-container modern-bg">
    <div class="chart-header">
      <div class="chart-title">
        <IconifyIconOnline icon="ri:pie-chart-line" class="chart-icon" />
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
      <div ref="chartRef" class="pie-chart"></div>
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
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [{
      name: 'Access From',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: '40', fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 1048, name: 'Search Engine' },
        { value: 735, name: 'Direct' },
        { value: 580, name: 'Email' },
        { value: 484, name: 'Union Ads' },
        { value: 300, name: 'Video Ads' }
      ]
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

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.pie-chart-component {
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

  .pie-chart {
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


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
