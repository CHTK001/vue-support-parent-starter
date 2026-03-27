<template>
  <div
    class="upload-queue-status system-container modern-bg"
    :class="{ 'is-collapsed': isCollapsed }"
  >
    <div class="queue-panel">
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
                <span class="status-text">{{ getStatusText(item.status) }}</span>
                <span v-if="item.message" class="status-message">
                  {{ item.message }}
                </span>
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
import { computed, ref, watch } from "vue";
import type { UploadQueueStatus } from "../../api/monitor/filesystem";

interface Props {
  queueStatus: Map<number, UploadQueueStatus>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "queue-update": [queue: UploadQueueStatus[]];
  "pause-all": [];
  "resume-all": [];
  "clear-completed": [];
  "cancel-task": [fileId: number];
  "sync-task": [fileId: number];
}>();

const isCollapsed = ref(true);
const queueList = ref<UploadQueueStatus[]>([]);

const currentTask = computed(() =>
  queueList.value.find(
    (item) => item.status === "uploading" || item.status === "merging",
  ),
);

watch(
  () => props.queueStatus,
  (newQueueStatus) => {
    queueList.value = Array.from(newQueueStatus.values());
    emit("queue-update", queueList.value);
  },
  { deep: true, immediate: true },
);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const addToQueue = (task: UploadQueueStatus) => {
  const existingIndex = queueList.value.findIndex(
    (item) => item.fileId === task.fileId,
  );
  if (existingIndex >= 0) {
    queueList.value[existingIndex] = task;
  } else {
    queueList.value.push(task);
  }
  emit("queue-update", queueList.value);
};

const removeFromQueue = (fileId: number) => {
  const index = queueList.value.findIndex((item) => item.fileId === fileId);
  if (index >= 0) {
    queueList.value.splice(index, 1);
    emit("queue-update", queueList.value);
  }
};

const updateQueueStatus = (
  fileId: number,
  updates: Partial<UploadQueueStatus>,
) => {
  const item = queueList.value.find((task) => task.fileId === fileId);
  if (item) {
    Object.assign(item, updates);
    emit("queue-update", queueList.value);
  }
};

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, string> = {
    uploading: "ri:upload-line",
    merging: "ri:settings-3-line",
    completed: "ri:checkbox-circle-line",
    failed: "ri:error-warning-line",
  };
  return iconMap[status] || "ri:file-line";
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    uploading: "上传中",
    merging: "合并中",
    completed: "已完成",
    failed: "失败",
  };
  return textMap[status] || "未知";
};

const getProgressStatus = (status: string) => {
  if (status === "completed") return "success";
  if (status === "failed") return "exception";
  return undefined;
};

defineExpose({
  addToQueue,
  removeFromQueue,
  updateQueueStatus,
});
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
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
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid #ebeef5;
    overflow: hidden;

    .panel-header {
      padding: 12px 16px;
      background: var(--el-bg-color-overlay);
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
          color: var(--el-text-color-primary);
          transition: transform 0.3s ease;
        }

        .panel-title {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .queue-badge {
          :deep(.el-badge__content) {
            background: var(--el-bg-color-overlay);
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
        color: var(--el-text-color-primary);

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
          border-bottom: 1px solid var(--el-border-color);
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
                color: var(--el-text-color-primary);
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
                color: var(--el-text-color-primary);
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
