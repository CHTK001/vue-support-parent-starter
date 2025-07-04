<template>
  <div class="server-network-component">
    <div class="component-header">
      <div class="component-title">
        <IconifyIconOnline icon="ri:wifi-line" class="component-icon" />
        <span>网络流量</span>
      </div>
      <div class="component-actions" v-if="editable">
        <el-button type="text" size="small" @click="$emit('edit')">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
      </div>
    </div>
    
    <div class="component-content">
      <div class="network-stats">
        <div class="stat-item">
          <div class="stat-icon upload">
            <IconifyIconOnline icon="ri:upload-line" />
          </div>
          <div class="stat-info">
            <div class="stat-label">上传</div>
            <div class="stat-value">{{ formatNetworkSpeed(networkOut) }}</div>
            <div class="stat-total">总计: {{ formatBytes(networkOutTotal) }}</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon download">
            <IconifyIconOnline icon="ri:download-line" />
          </div>
          <div class="stat-info">
            <div class="stat-label">下载</div>
            <div class="stat-value">{{ formatNetworkSpeed(networkIn) }}</div>
            <div class="stat-total">总计: {{ formatBytes(networkInTotal) }}</div>
          </div>
        </div>
      </div>
      
      <div class="network-chart">
        <!-- 这里可以添加网络流量图表 -->
        <div class="chart-placeholder">
          <IconifyIconOnline icon="ri:line-chart-line" class="chart-icon" />
          <span>网络流量图表</span>
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
const networkIn = computed(() => {
  return metrics.value?.networkInSpeed || metrics.value?.network?.inSpeed || 0;
});

const networkOut = computed(() => {
  return metrics.value?.networkOutSpeed || metrics.value?.network?.outSpeed || 0;
});

const networkInTotal = computed(() => {
  return metrics.value?.networkIn || metrics.value?.network?.in || 0;
});

const networkOutTotal = computed(() => {
  return metrics.value?.networkOut || metrics.value?.network?.out || 0;
});

/**
 * 格式化网络速度
 */
const formatNetworkSpeed = (speed: number) => {
  if (!speed || speed === 0) return '0 B/s';
  
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(speed) / Math.log(k));
  
  return parseFloat((speed / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
.server-network-component {
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
  gap: 16px;
}

.network-stats {
  display: flex;
  gap: 16px;

  .stat-item {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: white;

      &.upload {
        background-color: var(--el-color-success);
      }

      &.download {
        background-color: var(--el-color-primary);
      }
    }

    .stat-info {
      flex: 1;

      .stat-label {
        font-size: 12px;
        color: var(--el-text-color-regular);
        margin-bottom: 2px;
      }

      .stat-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 2px;
      }

      .stat-total {
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.network-chart {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);

  .chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-secondary);

    .chart-icon {
      font-size: 32px;
    }

    span {
      font-size: 14px;
    }
  }
}
</style>
