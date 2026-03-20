<template>
  <el-card class="task-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="task-name">{{ task.syncTaskName }}</span>
        <el-tag :type="getStatusType(task.syncTaskStatus)" size="small">
          {{ getStatusText(task.syncTaskStatus) }}
        </el-tag>
      </div>
    </template>

    <div class="card-content">
      <p class="task-desc">{{ task.syncTaskDesc || "暂无描述" }}</p>

      <div class="task-info">
        <div class="info-item">
          <span class="label">同步模式:</span>
          <span class="value">{{ getSyncModeText(task.syncTaskSyncMode) }}</span>
        </div>
        <div class="info-item">
          <span class="label">批次大小:</span>
          <span class="value">{{ task.syncTaskBatchSize || 0 }}</span>
        </div>
        <div class="info-item">
          <span class="label">最后运行:</span>
          <span class="value">{{ task.syncTaskLastRunTime || "-" }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="card-actions">
        <el-button size="small" @click="$emit('design', task)">设计</el-button>
        <el-button
          size="small"
          @click="$emit('edit', task)"
          :disabled="task.syncTaskStatus === 'RUNNING'"
        >
          编辑
        </el-button>
        <el-button
          size="small"
          type="success"
          @click="$emit('start', task)"
          :disabled="task.syncTaskStatus === 'RUNNING'"
        >
          启动
        </el-button>
        <el-button
          size="small"
          type="warning"
          @click="$emit('stop', task)"
          :disabled="task.syncTaskStatus !== 'RUNNING'"
        >
          停止
        </el-button>
        <el-button size="small" type="info" @click="$emit('logs', task)">
          日志
        </el-button>
        <el-button size="small" type="primary" @click="$emit('monitor', task)">
          监控
        </el-button>
        <el-button size="small" type="danger" @click="$emit('delete', task)">
          删除
        </el-button>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import type { SyncTask } from "../api/task";

defineProps<{
  task: SyncTask;
}>();

defineEmits<{
  design: [task: SyncTask];
  edit: [task: SyncTask];
  start: [task: SyncTask];
  stop: [task: SyncTask];
  logs: [task: SyncTask];
  monitor: [task: SyncTask];
  delete: [task: SyncTask];
}>();

const getStatusType = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "success",
    STOPPED: "info",
    ERROR: "danger",
  };
  return status ? map[status] || "info" : "info";
};

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "运行中",
    STOPPED: "已停止",
    ERROR: "异常",
  };
  return status ? map[status] || status : "未知";
};

const getSyncModeText = (mode?: string) => {
  const map: Record<string, string> = {
    FULL: "全量同步",
    INCREMENTAL: "增量同步",
    BIDIRECTIONAL: "双向同步",
  };
  return mode ? map[mode] || mode : "-";
};
</script>

<style scoped lang="scss">
.task-card {
  height: 100%;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .task-name {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .card-content {
    .task-desc {
      min-height: 40px;
      margin-bottom: 15px;
      color: #606266;
    }

    .task-info {
      .info-item {
        display: flex;
        margin-bottom: 8px;

        .label {
          width: 80px;
          color: #909399;
        }

        .value {
          flex: 1;
          color: #606266;
          word-break: break-all;
        }
      }
    }
  }

  .card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
