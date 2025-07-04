<template>
  <div class="server-memory-component">
    <div class="component-header">
      <div class="component-title">
        <IconifyIconOnline icon="ri:database-line" class="component-icon" />
        <span>内存使用率</span>
      </div>
      <div class="component-actions" v-if="editable">
        <el-button type="text" size="small" @click="$emit('edit')">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
      </div>
    </div>
    
    <div class="component-content">
      <div class="memory-gauge">
        <el-progress
          type="dashboard"
          :percentage="memoryUsage"
          :color="getMemoryColor(memoryUsage)"
          :width="120"
          :stroke-width="8"
        >
          <template #default="{ percentage }">
            <div class="gauge-content">
              <div class="gauge-value">{{ percentage }}%</div>
              <div class="gauge-label">内存</div>
            </div>
          </template>
        </el-progress>
      </div>
      
      <div class="memory-details">
        <div class="detail-item">
          <span class="detail-label">已用:</span>
          <span class="detail-value">{{ formatBytes(memoryUsed) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">可用:</span>
          <span class="detail-value">{{ formatBytes(memoryFree) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">总计:</span>
          <span class="detail-value">{{ formatBytes(memoryTotal) }}</span>
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
const memoryUsage = computed(() => {
  return Math.round(metrics.value?.memoryUsage || 0);
});

const memoryUsed = computed(() => {
  return metrics.value?.memory?.used || 0;
});

const memoryFree = computed(() => {
  return metrics.value?.memory?.free || 0;
});

const memoryTotal = computed(() => {
  return metrics.value?.memory?.total || 0;
});

/**
 * 获取内存使用率颜色
 */
const getMemoryColor = (percentage: number) => {
  if (percentage >= 90) return '#f56c6c';
  if (percentage >= 75) return '#e6a23c';
  return '#67c23a';
};

/**
 * 格式化字节数
 */
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
.server-memory-component {
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

.memory-gauge {
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

.memory-details {
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
