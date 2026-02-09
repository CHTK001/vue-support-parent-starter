<template>
  <div class="disk-partitions-component system-container modern-bg">
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
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

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

.disk-partitions-component {
  height: 100%;
  display: flex;
  flex-direction: column;
  @include glass-effect(0.9, 16px);
  border-radius: $radius-lg;
  border: 1px solid $border-light;
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

  .card-header {
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

    .card-title {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      font-size: $font-md;
      font-weight: $font-weight-semibold;
      color: var(--el-text-color-primary);
      transition: all $duration-fast ease;

      .card-icon {
        font-size: $icon-lg;
        color: var(--el-color-primary);
        transition: transform $duration-normal $ease-standard;
      }

      &:hover .card-icon {
        transform: scale(1.1) rotate(5deg);
      }
    }

    .card-actions {
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

    &:hover .card-actions {
      opacity: 1;
    }
  }

  .card-content {
    flex: 1;
    padding: $spacing-lg $spacing-xl;
    overflow-y: auto;
    @include custom-scrollbar;

    .no-data {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }

    .partitions-list {
      .partition-item {
        margin-bottom: $spacing-lg;
        padding: $spacing-lg;
        @include glass-effect(0.95, 12px);
        border-radius: $radius-md;
        border: 1px solid $border-light;
        transition: all $duration-normal $ease-standard;
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: $gradient-line-top;
          opacity: 0;
          transition: opacity $duration-normal ease;
        }

        &:hover {
          border-color: $border-primary;
          box-shadow: $shadow-hover-sm;
          transform: translateY(-2px);

          &::before {
            opacity: 1;
          }
        }

        &:last-child {
          margin-bottom: 0;
        }

        .partition-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $spacing-md;

          .partition-name {
            display: flex;
            align-items: center;
            gap: $spacing-sm;

            .partition-icon {
              font-size: $icon-md;
              color: var(--el-color-primary);
              transition: transform $duration-fast ease;
            }

            .name {
              font-weight: $font-weight-semibold;
              color: var(--el-text-color-primary);
              font-size: $font-md;
            }

            .partition-type {
              margin-left: $spacing-sm;
              border-radius: $radius-sm;
            }

            &:hover .partition-icon {
              transform: scale(1.1) rotate(5deg);
            }
          }
        }

        .partition-details {
          display: flex;
          justify-content: space-between;
          gap: $spacing-md;

          .detail-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            padding: $spacing-sm;
            border-radius: $radius-sm;
            background: rgba(0, 0, 0, 0.02);
            transition: all $duration-fast ease;

            &:hover {
              background: rgba(0, 0, 0, 0.04);
              transform: translateY(-2px);
            }

            .label {
              font-size: $font-xs;
              color: var(--el-text-color-regular);
              margin-bottom: $spacing-xs;
              font-weight: $font-weight-medium;
            }

            .value {
              font-size: $font-sm;
              font-weight: $font-weight-bold;
              background: $gradient-primary;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
          }
        }
      }
    }

    .last-update {
      margin-top: $spacing-lg;
      padding-top: $spacing-md;
      border-top: 1px solid $border-light;
      font-size: $font-xs;
      color: var(--el-text-color-placeholder);
      text-align: center;
      opacity: 0.7;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-xs;

      &::before {
        content: "🕐";
        font-size: $font-xs;
      }
    }
  }

  .card-footer {
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
}

// 响应式设计
@include respond-to(lg) {
  .disk-partitions-component .card-content {
    padding: $spacing-md $spacing-lg;
  }
}

@include respond-to(sm) {
  .disk-partitions-component {
    .card-header,
    .card-footer {
      padding: $spacing-md $spacing-lg;
    }

    .card-content {
      padding: $spacing-md $spacing-lg;

      .partitions-list .partition-item {
        padding: $spacing-md;

        .partition-details {
          flex-direction: column;
          gap: $spacing-sm;
        }
      }
    }
  }
}

@include respond-to(xs) {
  .disk-partitions-component .card-content {
    padding: $spacing-sm $spacing-md;
  }
}
</style>
