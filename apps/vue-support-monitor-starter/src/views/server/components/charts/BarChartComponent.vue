<template>
  <div class="bar-chart-component system-container modern-bg">
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
@import "@/styles/variables.scss";

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
    @include gradient-bg;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.bar-chart-component {
  height: 100%;
  @include glass-effect(0.9, 16px);
  border-radius: $radius-lg;
  border: 1px solid $border-light;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all $duration-normal $ease-standard;
  position: relative;
  box-shadow: $shadow-md;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $gradient-line-top;
    opacity: 0;
    transition: opacity $duration-normal ease;
  }

  &:hover {
    border-color: $border-primary;
    box-shadow: $shadow-hover-md;
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-xl $spacing-md;
  border-bottom: 1px solid $border-light;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: $spacing-xl;
    right: $spacing-xl;
    height: 1px;
    background: $gradient-line;
    opacity: 0.5;
  }

  .chart-title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-md;
    font-weight: $font-weight-semibold;
    color: var(--el-text-color-primary);
    transition: all $duration-fast ease;

    .chart-icon {
      font-size: $icon-lg;
      color: var(--el-color-primary);
      transition: transform $duration-normal $ease-standard;
    }

    &:hover .chart-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  .chart-actions {
    display: flex;
    gap: $spacing-xs;
    opacity: 0;
    transition: opacity $duration-normal $ease-standard;

    .el-button {
      border-radius: $radius-sm;
      transition: all $duration-fast ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  &:hover .chart-actions {
    opacity: 1;
  }
}

.chart-content {
  flex: 1;
  padding: $spacing-lg;
  position: relative;

  .bar-chart {
    height: 100%;
    min-height: 240px;
    position: relative;
    transition: all $duration-normal $ease-standard;
    border-radius: $radius-md;
    overflow: hidden;

    &:hover {
      transform: scale(1.01);
    }
  }
}

.chart-footer {
  padding: $spacing-md $spacing-xl;
  border-top: 1px solid $border-light;
  display: flex;
  justify-content: center;
  position: relative;
  background: rgba(0, 0, 0, 0.02);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: $spacing-xl;
    right: $spacing-xl;
    height: 1px;
    background: $gradient-line;
    opacity: 0.5;
  }

  .el-button {
    border-radius: $radius-md;
    transition: all $duration-fast ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-hover-sm;
    }
  }
}

// 响应式设计
@include respond-to(lg) {
  .chart-content {
    padding: $spacing-md;

    .bar-chart {
      min-height: 200px;
    }
  }
}

@include respond-to(sm) {
  .chart-content {
    padding: $spacing-md;

    .bar-chart {
      min-height: 180px;
    }
  }

  .chart-header,
  .chart-footer {
    padding: $spacing-md $spacing-lg;
  }
}

@include respond-to(xs) {
  .chart-content {
    padding: $spacing-sm;

    .bar-chart {
      min-height: 150px;
    }
  }
}
</style>
