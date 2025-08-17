<template>
  <div class="upload-queue-status" :class="{ 'is-collapsed': isCollapsed }">
    <!-- 队列状态面板 -->
    <div class="queue-panel">
      <!-- 面板头部 -->
      <div class="panel-header" @click="toggleCollapse">
        <div class="header-left">
          <IconifyIconOnline
            :icon="isCollapsed ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'"
            class="collapse-icon"
          />
          <span class="panel-title">上传队列</span>
          <el-badge
            v-if="queueList.length"
            :value="queueList.length"
            class="queue-badge"
          />
        </div>
        <div class="header-right">
          <div v-if="isCollapsed && currentTask" class="current-progress">
            <span class="progress-text">{{ currentTask.fileName }}</span>
            <el-progress
              :percentage="currentTask.progress"
              :status="getProgressStatus(currentTask.status)"
              :stroke-width="4"
              :show-text="false"
            />
          </div>
        </div>
      </div>

      <!-- 队列内容 -->
      <div v-if="!isCollapsed" class="panel-content">
        <div v-if="!queueList.length" class="empty-queue">
          <IconifyIconOnline icon="ri:inbox-line" class="empty-icon" />
          <p>暂无上传任务</p>
        </div>
        <div v-else class="queue-list">
          <div
            v-for="item in queueList"
            :key="item.fileId"
            class="queue-item"
            :class="{ 'is-active': item.fileId === currentTask?.fileId }"
          >
            <div class="item-info">
              <div class="item-header">
                <IconifyIconOnline
                  :icon="getStatusIcon(item.status)"
                  :class="['status-icon', `status-${item.status}`]"
                />
                <span class="file-name" :title="item.fileName">
                  {{ item.fileName }}
                </span>
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click="$emit('cancel-task', item.fileId)"
                >
                  <IconifyIconOnline icon="ri:close-line" />
                </el-button>
              </div>
              <div class="item-progress">
                <el-progress
                  :percentage="item.progress"
                  :status="getProgressStatus(item.status)"
                  :stroke-width="6"
                />
              </div>
              <div class="item-status">
                <span class="status-text">{{
                  getStatusText(item.status)
                }}</span>
                <span v-if="item.message" class="status-message">{{
                  item.message
                }}</span>
                <el-button
                  v-if="item.status === 'completed'"
                  size="small"
                  text
                  type="primary"
                  @click="$emit('sync-task', item.fileId)"
                >
                  <IconifyIconOnline
                    icon="ri:share-forward-line"
                    class="mr-1"
                  />
                  同步
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 队列操作 -->
        <div v-if="queueList.length" class="queue-actions">
          <el-button size="small" @click="$emit('pause-all')">
            <IconifyIconOnline icon="ri:pause-line" class="mr-1" />
            暂停全部
          </el-button>
          <el-button size="small" @click="$emit('resume-all')">
            <IconifyIconOnline icon="ri:play-line" class="mr-1" />
            继续全部
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="$emit('clear-completed')"
          >
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            清除已完成
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { ElMessage } from "element-plus";
import type { UploadQueueStatus } from "@/api/monitor/filesystem";

// Props
interface Props {
  queueStatus: Map<number, UploadQueueStatus>;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "queue-update": [queue: UploadQueueStatus[]];
  "pause-all": [];
  "resume-all": [];
  "clear-completed": [];
  "cancel-task": [fileId: number];
  "sync-task": [fileId: number];
}>();

// 响应式数据
const isCollapsed = ref(true);
const queueList = ref<UploadQueueStatus[]>([]);

// 计算属性
const currentTask = computed(() => {
  return queueList.value.find(
    (item) => item.status === "uploading" || item.status === "merging"
  );
});

// 监听队列状态变化
watch(
  () => props.queueStatus,
  (newQueueStatus) => {
    // 将Map转换为数组
    queueList.value = Array.from(newQueueStatus.values());
    emit("queue-update", queueList.value);
  },
  { deep: true, immediate: true }
);

// 生命周期
onMounted(() => {
  // 初始化队列数据
  queueList.value = Array.from(props.queueStatus.values());
});

onUnmounted(() => {
  // 清理工作
});

/**
 * 切换折叠状态
 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

/**
 * 添加到队列
 */
const addToQueue = (task: UploadQueueStatus) => {
  const existingIndex = queueList.value.findIndex(
    (item) => item.fileId === task.fileId
  );
  if (existingIndex >= 0) {
    queueList.value[existingIndex] = task;
  } else {
    queueList.value.push(task);
  }
  emit("queue-update", queueList.value);
};

/**
 * 从队列移除
 */
const removeFromQueue = (fileId: number) => {
  const index = queueList.value.findIndex((item) => item.fileId === fileId);
  if (index >= 0) {
    queueList.value.splice(index, 1);
    emit("queue-update", queueList.value);
  }
};

/**
 * 更新队列状态
 */
const updateQueueStatus = (
  fileId: number,
  updates: Partial<UploadQueueStatus>
) => {
  const item = queueList.value.find((item) => item.fileId === fileId);
  if (item) {
    Object.assign(item, updates);
    emit("queue-update", queueList.value);
  }
};

/**
 * 手动刷新队列状态
 */
const refreshQueue = () => {
  // 从props重新获取最新数据
  queueList.value = Array.from(props.queueStatus.values());
  emit("queue-update", queueList.value);
};

/**
 * 暂停全部
 */
const pauseAll = () => {
  // TODO: 实现暂停逻辑
  ElMessage.info("暂停功能开发中");
};

/**
 * 继续全部
 */
const resumeAll = () => {
  // TODO: 实现继续逻辑
  ElMessage.info("继续功能开发中");
};

/**
 * 清除已完成
 */
const clearCompleted = () => {
  queueList.value = queueList.value.filter(
    (item) => item.status !== "completed" && item.status !== "failed"
  );
  emit("queue-update", queueList.value);
};

/**
 * 获取状态图标
 */
const getStatusIcon = (status: string) => {
  const iconMap: Record<string, string> = {
    uploading: "ri:upload-line",
    merging: "ri:settings-3-line",
    completed: "ri:checkbox-circle-line",
    failed: "ri:error-warning-line",
  };
  return iconMap[status] || "ri:file-line";
};

/**
 * 获取状态文本
 */
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    uploading: "上传中",
    merging: "合并中",
    completed: "已完成",
    failed: "失败",
  };
  return textMap[status] || "未知";
};

/**
 * 获取进度状态
 */
const getProgressStatus = (status: string) => {
  if (status === "completed") return "success";
  if (status === "failed") return "exception";
  return undefined;
};

// 暴露方法给父组件
defineExpose({
  addToQueue,
  removeFromQueue,
  updateQueueStatus,
});
</script>

<style scoped lang="scss">
.upload-queue-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 500px;
  z-index: 1000;
  transition: all 0.3s ease;

  &.is-collapsed {
    width: 300px;
  }

  .queue-panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid #ebeef5;
    overflow: hidden;

    .panel-header {
      padding: 12px 16px;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;

      &:hover {
        background: #ecf5ff;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .collapse-icon {
          font-size: 16px;
          color: #909399;
          transition: transform 0.3s ease;
        }

        .panel-title {
          font-weight: 500;
          color: #303133;
        }

        .queue-badge {
          :deep(.el-badge__content) {
            background: #409eff;
          }
        }
      }

      .header-right {
        flex: 1;
        margin-left: 16px;

        .current-progress {
          display: flex;
          align-items: center;
          gap: 8px;

          .progress-text {
            font-size: 12px;
            color: #606266;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .el-progress {
            flex: 1;
          }
        }
      }
    }

    .panel-content {
      max-height: 400px;
      overflow-y: auto;

      .empty-queue {
        padding: 40px 20px;
        text-align: center;
        color: #909399;

        .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }

      .queue-list {
        .queue-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s ease;

          &:last-child {
            border-bottom: none;
          }

          &.is-active {
            background: #f0f9ff;
          }

          &:hover {
            background: #fafafa;
          }

          .item-info {
            .item-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;

              .status-icon {
                font-size: 16px;

                &.status-uploading {
                  color: #409eff;
                  animation: spin 1s linear infinite;
                }

                &.status-merging {
                  color: #e6a23c;
                  animation: spin 1s linear infinite;
                }

                &.status-completed {
                  color: #67c23a;
                }

                &.status-failed {
                  color: #f56c6c;
                }
              }

              .file-name {
                flex: 1;
                font-size: 14px;
                color: #303133;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .item-progress {
              margin-bottom: 8px;
            }

            .item-status {
              display: flex;
              justify-content: space-between;
              align-items: center;

              .status-text {
                font-size: 12px;
                color: #606266;
              }

              .status-message {
                font-size: 12px;
                color: #909399;
                max-width: 150px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
        }
      }

      .queue-actions {
        padding: 12px 16px;
        background: #fafafa;
        border-top: 1px solid #ebeef5;
        display: flex;
        gap: 8px;
        justify-content: center;
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .upload-queue-status {
    width: 300px;
    right: 10px;
    bottom: 10px;

    &.is-collapsed {
      width: 250px;
    }
  }
}
</style>
