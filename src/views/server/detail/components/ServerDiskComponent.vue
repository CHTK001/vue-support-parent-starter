<template>
  <div class="server-disk-component">
    <div class="component-header">
      <div class="component-title">
        <IconifyIconOnline icon="ri:hard-drive-line" class="component-icon" />
        <span>磁盘使用情况</span>
      </div>
      <div class="component-actions" v-if="editable">
        <el-button type="text" size="small" @click="$emit('edit')">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
      </div>
    </div>
    
    <div class="component-content">
      <div class="disk-partitions">
        <div class="partitions-header">
          <span class="partitions-count">{{ diskPartitions.length }} 个分区</span>
        </div>
        
        <div class="partitions-list-container">
          <div class="partitions-list">
            <div
              v-for="(partition, index) in diskPartitions"
              :key="index"
              class="partition-item"
            >
              <div class="partition-header">
                <div class="partition-info">
                  <IconifyIconOnline icon="ri:folder-line" class="partition-icon" />
                  <span class="partition-name">{{ partition.name || partition.mount }}</span>
                  <el-tag size="small" type="info" class="partition-type">
                    {{ partition.type }}
                  </el-tag>
                </div>
                <div class="partition-usage" :class="getPartitionUsageClass(partition.usagePercent || 0)">
                  {{ Math.round(partition.usagePercent || 0) }}%
                </div>
              </div>
              <div class="partition-details">
                <span>已用: {{ formatBytes(partition.usedSpace) }}</span>
                <span>可用: {{ formatBytes(partition.freeSpace) }}</span>
                <span>总计: {{ formatBytes(partition.totalSpace) }}</span>
              </div>
            </div>
          </div>
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
const diskPartitions = computed(() => {
  return metrics.value?.disk?.partitions || metrics.value?.diskPartitions || [];
});

/**
 * 获取磁盘分区使用率颜色类名
 */
const getPartitionUsageClass = (percentage: number) => {
  if (percentage >= 90) return 'usage-critical';
  if (percentage >= 75) return 'usage-warning';
  return 'usage-normal';
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
.server-disk-component {
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
  overflow: hidden;
}

.disk-partitions {
  height: 100%;
  display: flex;
  flex-direction: column;

  .partitions-header {
    margin-bottom: 12px;

    .partitions-count {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .partitions-list-container {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
    
    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: var(--el-fill-color-lighter);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-darker);
      border-radius: 3px;
      
      &:hover {
        background: var(--el-color-primary-light-5);
      }
    }
  }

  .partitions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .partition-item {
    padding: 12px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color);
      border-color: var(--el-border-color);
    }

    .partition-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .partition-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        .partition-icon {
          font-size: 14px;
          color: var(--el-color-primary);
        }

        .partition-name {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .partition-type {
          font-size: 11px;
        }
      }

      .partition-usage {
        font-size: 13px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        
        &.usage-normal {
          color: var(--el-color-success);
          background-color: var(--el-color-success-light-9);
        }
        
        &.usage-warning {
          color: var(--el-color-warning);
          background-color: var(--el-color-warning-light-9);
        }
        
        &.usage-critical {
          color: var(--el-color-danger);
          background-color: var(--el-color-danger-light-9);
        }
      }
    }

    .partition-details {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--el-text-color-regular);
      gap: 8px;

      span {
        flex: 1;
        text-align: center;
      }
    }
  }
}
</style>
