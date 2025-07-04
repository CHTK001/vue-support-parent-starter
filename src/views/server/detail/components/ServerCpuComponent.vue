<template>
  <div class="server-cpu-component">
    <div class="component-header">
      <div class="component-title">
        <IconifyIconOnline icon="ri:cpu-line" class="component-icon" />
        <span>CPU使用率</span>
      </div>
      <div class="component-actions" v-if="editable">
        <el-button type="text" size="small" @click="$emit('edit')">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
      </div>
    </div>
    
    <div class="component-content">
      <div class="cpu-gauge">
        <el-progress
          type="dashboard"
          :percentage="cpuUsage"
          :color="getCpuColor(cpuUsage)"
          :width="120"
          :stroke-width="8"
        >
          <template #default="{ percentage }">
            <div class="gauge-content">
              <div class="gauge-value">{{ percentage }}%</div>
              <div class="gauge-label">CPU</div>
            </div>
          </template>
        </el-progress>
      </div>
      
      <div class="cpu-details">
        <div class="detail-item">
          <span class="detail-label">核心数:</span>
          <span class="detail-value">{{ cpuCores || 'N/A' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">负载:</span>
          <span class="detail-value">{{ loadAverage || 'N/A' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">进程数:</span>
          <span class="detail-value">{{ processCount || 'N/A' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { IconifyIconOnline } from '@repo/components/ReIcon';
import { useServerMetrics } from '@/composables/useServerWebSocket';

interface Props {
  serverId: number;
  componentConfig?: any;
  height?: number;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: 200,
  editable: false
});

const emit = defineEmits(['edit', 'share', 'remove']);

// 使用服务器指标数据
const { metrics, connect, disconnect } = useServerMetrics(props.serverId);

// 计算属性
const cpuUsage = computed(() => {
  return Math.round(metrics.value?.cpuUsage || 0);
});

const cpuCores = computed(() => {
  return metrics.value?.cpu?.cores || metrics.value?.cpuCores;
});

const loadAverage = computed(() => {
  return metrics.value?.loadAverage;
});

const processCount = computed(() => {
  return metrics.value?.processCount;
});

/**
 * 获取CPU使用率颜色
 */
const getCpuColor = (percentage: number) => {
  if (percentage >= 90) return '#f56c6c';
  if (percentage >= 75) return '#e6a23c';
  return '#67c23a';
};

// 生命周期
onMounted(() => {
  connect();
});

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped lang="scss">
.server-cpu-component {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-lighter);

  .component-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .component-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .component-actions {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .component-actions {
    opacity: 1;
  }
}

.component-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.cpu-gauge {
  .gauge-content {
    text-align: center;

    .gauge-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .gauge-label {
      font-size: 12px;
      color: var(--el-text-color-regular);
      margin-top: 4px;
    }
  }
}

.cpu-details {
  width: 100%;
  max-width: 200px;

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 14px;

    .detail-label {
      color: var(--el-text-color-regular);
    }

    .detail-value {
      color: var(--el-text-color-primary);
      font-weight: 500;
    }
  }
}
</style>
