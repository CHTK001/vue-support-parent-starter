<template>
  <div class="disk-partitions-component">
    <div class="card-header">
      <div class="card-title">
        <IconifyIconOnline icon="ri:hard-drive-line" class="card-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle || '磁盘分区' }}</span>
      </div>
      <div class="card-actions" v-if="editMode">
        <el-button
          type="primary"
          text
          size="small"
          @click="handleEdit"
        >
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
        <el-button
          type="danger"
          text
          size="small"
          @click="handleDelete"
        >
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>
    
    <div class="card-content" v-loading="loading">
      <div v-if="partitions.length === 0" class="no-data">
        <el-empty description="暂无磁盘分区数据" :image-size="60" />
      </div>
      
      <div v-else class="partitions-list">
        <div 
          v-for="(partition, index) in partitions" 
          :key="index"
          class="partition-item"
        >
          <div class="partition-header">
            <div class="partition-name">
              <IconifyIconOnline icon="ri:folder-line" class="partition-icon" />
              <span class="name">{{ partition.name || partition.mount }}</span>
              <el-tag size="small" type="info" class="partition-type">
                {{ partition.type }}
              </el-tag>
            </div>
          </div>
          
          <div class="partition-details">
            <div class="detail-item">
              <span class="label">已用:</span>
              <span class="value">{{ formatBytes(partition.usedSpace || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">可用:</span>
              <span class="value">{{ formatBytes(partition.freeSpace || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">总计:</span>
              <span class="value">{{ formatBytes(partition.totalSpace || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="last-update">
        最后更新: {{ lastUpdateTime }}
      </div>
    </div>

    <div class="card-footer" v-if="!editMode">
      <el-button
        type="primary"
        text
        size="small"
        @click="handleRefresh"
        :loading="refreshing"
      >
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useServerMetrics } from "@/composables/useServerWebSocket";
import type { ServerDetailComponent } from "@/api/server";

// 定义属性
interface Props {
  componentData: ServerDetailComponent;
  serverId: number;
  editMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
});

// 定义事件
const emit = defineEmits<{
  edit: [component: ServerDetailComponent];
  delete: [component: ServerDetailComponent];
  refresh: [component: ServerDetailComponent];
}>();

// 响应式状态
const loading = ref(false);
const refreshing = ref(false);
const partitions = ref<any[]>([]);
const lastUpdateTime = ref<string>('-');

// WebSocket监听
const { onServerMetrics } = useServerMetrics(props.serverId);

// 监听服务器指标数据
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = onServerMetrics((metrics, message) => {
    updatePartitionsData(metrics);
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

/**
 * 更新分区数据
 */
const updatePartitionsData = (metrics: any) => {
  if (metrics.disk && metrics.disk.partitions) {
    partitions.value = metrics.disk.partitions;
    lastUpdateTime.value = new Date().toLocaleTimeString();
  }
};



/**
 * 格式化字节
 */
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * 处理编辑
 */
const handleEdit = () => {
  emit('edit', props.componentData);
};

/**
 * 处理删除
 */
const handleDelete = () => {
  emit('delete', props.componentData);
};

/**
 * 处理刷新
 */
const handleRefresh = async () => {
  refreshing.value = true;
  try {
    emit('refresh', props.componentData);
    // 这里可以添加刷新逻辑
  } finally {
    refreshing.value = false;
  }
};
</script>

<style lang="scss" scoped>
.disk-partitions-component {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px 12px;
    border-bottom: 1px solid #f0f0f0;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #303133;

      .card-icon {
        color: #409eff;
        font-size: 18px;
      }
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }
  }

  .card-content {
    flex: 1;
    padding: 16px 20px;
    overflow-y: auto;

    .no-data {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }

    .partitions-list {
      .partition-item {
        margin-bottom: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;

        &:last-child {
          margin-bottom: 0;
        }

        .partition-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .partition-name {
            display: flex;
            align-items: center;
            gap: 8px;

            .partition-icon {
              color: #909399;
              font-size: 16px;
            }

            .name {
              font-weight: 500;
              color: #303133;
            }

            .partition-type {
              margin-left: 8px;
            }
          }

        }

        .partition-details {
          display: flex;
          justify-content: space-between;
          gap: 16px;

          .detail-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;

            .label {
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
            }

            .value {
              font-size: 13px;
              font-weight: 500;
              color: #606266;
            }
          }
        }
      }
    }

    .last-update {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
      font-size: 12px;
      color: #909399;
      text-align: center;
    }
  }

  .card-footer {
    padding: 12px 20px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: center;
  }
}
</style>
