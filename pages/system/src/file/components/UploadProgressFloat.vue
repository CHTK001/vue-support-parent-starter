<template>
  <transition name="slide-up">
    <div v-if="visible && tasks.length > 0" class="upload-progress-float">
      <div class="float-header">
        <div class="header-title">
          <IconifyIconOnline icon="ri:upload-cloud-2-line" class="title-icon" />
          <span>上传进度</span>
          <ScBadge :value="tasks.length" class="task-badge" />
        </div>
        <div class="header-actions">
          <ScButton link @click="toggleCollapse">
            <IconifyIconOnline
              :icon="collapsed ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'"
            />
          </ScButton>
          <ScButton link @click="handleClose">
            <IconifyIconOnline icon="ri:close-line" />
          </ScButton>
        </div>
      </div>

      <transition name="collapse">
        <div v-show="!collapsed" class="float-content">
          <div class="task-list">
            <div v-for="task in tasks" :key="task.id" class="task-item">
              <div class="task-info">
                <IconifyIconOnline
                  :icon="getTaskIcon(task.status)"
                  class="task-icon"
                  :class="task.status"
                />
                <div class="task-detail">
                  <div class="task-name">{{ task.name }}</div>
                  <div class="task-status">
                    {{ getStatusText(task.status) }}
                  </div>
                </div>
              </div>
              <div class="task-progress">
                <ScProgress 
                  :percentage="task.progress"
                  :status="getProgressStatus(task.status)"
                  :stroke-width="6"
                  :show-text="false"
                />
                <span class="progress-text">{{ task.progress }}%</span>
              </div>
            </div>
          </div>

          <!-- 总体进度 -->
          <div v-if="tasks.length > 1" class="total-progress">
            <span class="total-label">总进度</span>
            <ScProgress :percentage="totalProgress" :stroke-width="8" />
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: "pending" | "uploading" | "merging" | "success" | "error";
}

interface Props {
  visible: boolean;
  tasks: UploadTask[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const collapsed = ref(false);

// 计算总进度
const totalProgress = computed(() => {
  if (props.tasks.length === 0) return 0;
  const sum = props.tasks.reduce((acc, task) => acc + task.progress, 0);
  return Math.round(sum / props.tasks.length);
});

// 获取任务图标
const getTaskIcon = (status: string): string => {
  const icons: Record<string, string> = {
    pending: "ri:time-line",
    uploading: "ri:upload-2-line",
    merging: "ri:merge-cells-horizontal",
    success: "ri:checkbox-circle-line",
    error: "ri:error-warning-line",
  };
  return icons[status] || "ri:file-line";
};

// 获取状态文本
const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: "等待中",
    uploading: "上传中",
    merging: "合并中",
    success: "已完成",
    error: "失败",
  };
  return texts[status] || "";
};

// 获取进度条状态
const getProgressStatus = (status: string): "success" | "exception" | "" => {
  if (status === "success") return "success";
  if (status === "error") return "exception";
  return "";
};

// 切换折叠
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

// 关闭
const handleClose = () => {
  emit("close");
};
</script>

<style lang="scss" scoped>
.upload-progress-float {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 360px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-lighter);
  z-index: 2000;
  overflow: hidden;
}

.float-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    .title-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }

    .task-badge {
      margin-left: 4px;
    }
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }
}

.float-content {
  padding: 12px 16px;
  max-height: 300px;
  overflow-y: auto;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;

  .task-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;

    .task-icon {
      font-size: 20px;

      &.pending {
        color: var(--el-text-color-secondary);
      }
      &.uploading,
      &.merging {
        color: var(--el-color-primary);
        animation: pulse 1.5s ease-in-out infinite;
      }
      &.success {
        color: var(--el-color-success);
      }
      &.error {
        color: var(--el-color-danger);
      }
    }

    .task-detail {
      flex: 1;
      min-width: 0;

      .task-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .task-status {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .task-progress {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-progress {
      flex: 1;
    }

    .progress-text {
      width: 36px;
      text-align: right;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.total-progress {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);

  .total-label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
