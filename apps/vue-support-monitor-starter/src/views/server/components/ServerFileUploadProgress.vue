<template>
  <div class="server-file-upload-progress">
    <!-- Socket.IO连接状态 -->
    <div class="connection-status">
      <el-card class="status-card" shadow="hover">
        <div class="status-content">
          <div class="status-indicator">
            <div class="status-icon-wrapper" :class="connectionStatusClass">
              <IconifyIconOnline :icon="connectionStatusIcon" :class="['status-icon', connectionStatusClass, { rotating: connectionStatus === 'CONNECTING' }]" />
              <div class="status-pulse" v-if="connectionStatus === 'CONNECTED'"></div>
            </div>
            <div class="status-info">
              <span class="status-text">{{ connectionStatusText }}</span>
              <span class="status-subtitle">Socket.IO 实时连接</span>
            </div>
          </div>

          <div class="connection-metrics">
            <div class="metric-card">
              <div class="metric-icon">
                <IconifyIconOnline icon="ep:files" />
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ activeTaskCount }}</div>
                <div class="metric-label">活跃任务</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">
                <IconifyIconOnline icon="ep:pie-chart" />
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ totalProgress }}%</div>
                <div class="metric-label">总进度</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">
                <IconifyIconOnline icon="ep:odometer" />
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ formatSpeed(totalSpeed) }}</div>
                <div class="metric-label">总速度</div>
              </div>
            </div>
          </div>

          <div class="connection-actions">
            <el-button v-if="!isConnected" type="primary" size="default" :loading="connectionStatus === 'CONNECTING'" @click="handleConnect" class="action-button">
              <IconifyIconOnline icon="ep:connection" />
              连接
            </el-button>
            <el-button v-else type="danger" size="default" @click="handleDisconnect" class="action-button">
              <IconifyIconOnline icon="ep:close-connection" />
              断开
            </el-button>
            <el-button type="info" size="default" :disabled="connectionStatus !== 'CONNECTED'" class="action-button refresh-btn" @click="handleRefreshStatistics">
              <IconifyIconOnline icon="ep:refresh" />
              刷新统计
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 队列状态 -->
    <div class="queue-status">
      <el-card class="queue-card" shadow="hover">
        <template #header>
          <div class="section-header">
            <div class="header-icon">
              <IconifyIconOnline icon="ep:data-line" />
            </div>
            <span class="header-title">队列状态</span>
            <div class="header-badge">
              <el-badge :value="queueStatus.pendingTasks" :max="99" type="primary" />
            </div>
          </div>
        </template>

        <div class="queue-metrics-grid">
          <div class="queue-metric-card">
            <div class="metric-icon-wrapper pending">
              <IconifyIconOnline icon="ep:clock" />
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ queueStatus.pendingTasks }}</div>
              <div class="metric-label">等待任务</div>
            </div>
          </div>

          <div class="queue-metric-card">
            <div class="metric-icon-wrapper processing">
              <IconifyIconOnline icon="ep:loading" class="rotating" />
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ queueStatus.processingTasks }}</div>
              <div class="metric-label">处理中</div>
            </div>
          </div>

          <div class="queue-metric-card">
            <div class="metric-icon-wrapper completed">
              <IconifyIconOnline icon="ep:circle-check" />
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ queueStatus.completedTasks }}</div>
              <div class="metric-label">已完成</div>
            </div>
          </div>

          <div class="queue-metric-card">
            <div class="metric-icon-wrapper throughput">
              <IconifyIconOnline icon="ep:odometer" />
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ queueStatus.throughput.toFixed(1) }}</div>
              <div class="metric-label">吞吐量/分</div>
            </div>
          </div>
        </div>

        <div class="queue-progress-section">
          <div class="progress-info">
            <span class="progress-label">并发处理进度</span>
            <span class="progress-text">{{ queueStatus.currentConcurrent }}/{{ queueStatus.maxConcurrent }}</span>
          </div>
          <el-progress :percentage="Math.round((queueStatus.currentConcurrent / queueStatus.maxConcurrent) * 100)" :stroke-width="8" :show-text="false" class="concurrency-progress" />
        </div>
      </el-card>
    </div>

    <!-- 活跃任务进度 -->
    <div class="active-tasks">
      <el-card class="tasks-card" shadow="hover">
        <template #header>
          <div class="section-header">
            <div class="header-icon">
              <IconifyIconOnline icon="ep:upload-filled" />
            </div>
            <span class="header-title">活跃任务进度</span>
            <div class="header-actions">
              <el-badge :value="activeTaskProgresses.length" :max="99" type="success" class="task-count-badge" />
              <el-button type="primary" text @click="handleRefresh" class="refresh-button">
                <IconifyIconOnline icon="ep:refresh" />
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="activeTaskProgresses.length === 0" class="empty-state">
          <div class="empty-content">
            <IconifyIconOnline icon="ep:document" class="empty-icon" />
            <h3 class="empty-title">暂无活跃任务</h3>
            <p class="empty-description">当前没有正在进行的文件上传任务</p>
          </div>
        </div>

        <div v-else class="task-list">
          <div v-for="task in activeTaskProgresses" :key="task.taskId" class="task-item" :class="getTaskItemClass(task.status)">
            <div class="task-header">
              <div class="task-info">
                <div class="task-title">
                  <IconifyIconOnline :icon="getTaskIcon(task.status)" :class="getTaskIconClass(task.status)" />
                  <span class="task-id">任务 #{{ task.taskId }}</span>
                  <span class="task-filename">{{ task.fileName }}</span>
                </div>
                <el-tag :type="getStatusType(task.status)" size="small" class="task-status-tag">
                  {{ getStatusText(task.status) }}
                </el-tag>
              </div>
            </div>

            <div class="task-progress-section">
              <div class="progress-header">
                <span class="progress-percentage">{{ task.progress }}%</span>
                <span class="progress-size">{{ formatFileSize(task.transferredBytes) }}/{{ formatFileSize(task.totalBytes) }}</span>
              </div>
              <el-progress :percentage="task.progress" :status="getProgressStatus(task.status)" :stroke-width="12" :show-text="false" class="task-progress-bar" />
            </div>

            <div class="task-metrics">
              <div class="metric-item">
                <IconifyIconOnline icon="ep:odometer" />
                <span class="metric-value">{{ formatSpeed(task.speed) }}</span>
                <span class="metric-label">速度</span>
              </div>
              <div v-if="task.estimatedTime" class="metric-item">
                <IconifyIconOnline icon="ep:clock" />
                <span class="metric-value">{{ formatDuration(task.estimatedTime) }}</span>
                <span class="metric-label">剩余时间</span>
              </div>
              <div v-if="task.startTime" class="metric-item">
                <IconifyIconOnline icon="ep:timer" />
                <span class="metric-value">{{ formatDuration((Date.now() - new Date(task.startTime).getTime()) / 1000) }}</span>
                <span class="metric-label">已用时间</span>
              </div>
            </div>

            <div class="task-actions">
              <el-button size="small" type="danger" plain @click="handleCancelTask(task.taskId)" class="action-btn">
                <IconifyIconOnline icon="ep:close" />
                取消
              </el-button>
              <el-button size="small" type="primary" plain @click="handleViewTaskDetail(task.taskId)" class="action-btn">
                <IconifyIconOnline icon="ep:view" />
                详情
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计信息 -->
    <div class="statistics">
      <el-card class="stats-card" shadow="hover">
        <template #header>
          <div class="section-header">
            <div class="header-icon">
              <IconifyIconOnline icon="ep:data-analysis" />
            </div>
            <span class="header-title">统计信息</span>
            <div class="header-actions">
              <el-tag type="info" size="small">成功率: {{ statistics.successRate.toFixed(1) }}%</el-tag>
            </div>
          </div>
        </template>

        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon-wrapper">
              <IconifyIconOnline icon="ep:files" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.totalCount }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </div>

          <div class="stat-card processing">
            <div class="stat-icon-wrapper">
              <IconifyIconOnline icon="ep:loading" class="rotating" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.processingCount }}</div>
              <div class="stat-label">处理中</div>
            </div>
          </div>

          <div class="stat-card completed">
            <div class="stat-icon-wrapper">
              <IconifyIconOnline icon="ep:circle-check" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.completedCount }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>

          <div class="stat-card failed">
            <div class="stat-icon-wrapper">
              <IconifyIconOnline icon="ep:circle-close" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.failedCount }}</div>
              <div class="stat-label">失败任务</div>
            </div>
          </div>

          <div class="stat-card size">
            <div class="stat-icon-wrapper">
              <IconifyIconOnline icon="ep:folder" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatFileSize(statistics.totalFileSize) }}</div>
              <div class="stat-label">总文件大小</div>
            </div>
          </div>

          <div class="stat-card time">
            <div class="stat-icon-wrapper">
              <IconifyIconOnline icon="ep:timer" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatDuration(statistics.avgUploadTime) }}</div>
              <div class="stat-label">平均用时</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { useServerFileUpload } from "@/composables/useServerFileUpload";
import { cancelServerFileUploadTask, TASK_STATUS } from "@/api/server-file-upload";

// 使用组合式函数
const {
  isConnected,
  connectionStatus,
  taskProgresses,
  queueStatus,
  statistics,
  socketClient,
  activeTaskCount,
  totalProgress,
  totalSpeed,
  connect,
  disconnect,
  formatFileSize,
  formatSpeed,
  formatDuration
} = useServerFileUpload();

// Emits
const emit = defineEmits<{
  viewTaskDetail: [taskId: number];
  refresh: [];
}>();

// 计算属性
const connectionStatusClass = computed(() => {
  switch (connectionStatus.value) {
    case "CONNECTED":
      return "status-connected";
    case "CONNECTING":
      return "status-connecting";
    case "ERROR":
      return "status-error";
    default:
      return "status-disconnected";
  }
});

const connectionStatusIcon = computed(() => {
  switch (connectionStatus.value) {
    case "CONNECTED":
      return "ep:connection";
    case "CONNECTING":
      return "ep:loading";
    case "ERROR":
      return "ep:warning";
    default:
      return "ep:close-connection";
  }
});

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case "CONNECTED":
      return "已连接";
    case "CONNECTING":
      return "连接中";
    case "ERROR":
      return "连接错误";
    default:
      return "未连接";
  }
});

const activeTaskProgresses = computed(() => {
  return Array.from(taskProgresses.value.values()).filter(task => task.status === TASK_STATUS.PROCESSING || task.status === TASK_STATUS.PENDING);
});

// 新增的计算属性和方法
const getTaskIcon = (status: string) => {
  switch (status) {
    case TASK_STATUS.PROCESSING:
      return "ep:upload-filled";
    case TASK_STATUS.PENDING:
      return "ep:clock";
    case TASK_STATUS.COMPLETED:
      return "ep:circle-check";
    case TASK_STATUS.FAILED:
      return "ep:circle-close";
    default:
      return "ep:document";
  }
};

const getTaskIconClass = (status: string) => {
  switch (status) {
    case TASK_STATUS.PROCESSING:
      return "task-icon processing";
    case TASK_STATUS.PENDING:
      return "task-icon pending";
    case TASK_STATUS.COMPLETED:
      return "task-icon completed";
    case TASK_STATUS.FAILED:
      return "task-icon failed";
    default:
      return "task-icon";
  }
};

const getTaskItemClass = (status: string) => {
  switch (status) {
    case TASK_STATUS.PROCESSING:
      return "processing";
    case TASK_STATUS.PENDING:
      return "pending";
    case TASK_STATUS.COMPLETED:
      return "completed";
    case TASK_STATUS.FAILED:
      return "failed";
    default:
      return "";
  }
};

// 方法
const handleConnect = () => {
  try {
    connect();
  } catch (error) {
    console.error("连接失败:", error);
  }
};

const handleDisconnect = () => {
  disconnect();
};

const handleRefresh = () => {
  emit("refresh");
};

const handleRefreshStatistics = () => {
  // 通过Socket.IO请求刷新统计信息
  if (socketClient.value && isConnected.value) {
    socketClient.value.emit("server_file_upload_refresh_statistics", {
      timestamp: Date.now()
    });
    ElMessage.success("已请求刷新统计信息");
  } else {
    ElMessage.warning("Socket.IO未连接，无法刷新统计");
  }
};

const handleCancelTask = async (taskId: number) => {
  try {
    await cancelServerFileUploadTask(taskId);
    ElMessage.success("任务取消成功");
  } catch (error: any) {
    ElMessage.error(error.message || "取消任务失败");
  }
};

const handleViewTaskDetail = (taskId: number) => {
  emit("viewTaskDetail", taskId);
};

const getStatusType = (status: string) => {
  const statusMap = {
    [TASK_STATUS.PENDING]: "info",
    [TASK_STATUS.PROCESSING]: "warning",
    [TASK_STATUS.COMPLETED]: "success",
    [TASK_STATUS.FAILED]: "danger",
    [TASK_STATUS.CANCELLED]: "info"
  };
  return statusMap[status] || "info";
};

const getStatusText = (status: string) => {
  const statusMap = {
    [TASK_STATUS.PENDING]: "待处理",
    [TASK_STATUS.PROCESSING]: "处理中",
    [TASK_STATUS.COMPLETED]: "已完成",
    [TASK_STATUS.FAILED]: "失败",
    [TASK_STATUS.CANCELLED]: "已取消"
  };
  return statusMap[status] || status;
};

const getProgressStatus = (status: string) => {
  if (status === TASK_STATUS.COMPLETED) return "success";
  if (status === TASK_STATUS.FAILED) return "exception";
  return undefined;
};
</script>

<style scoped>
.server-file-upload-progress {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

/* 卡片通用样式 */
.status-card,
.queue-card,
.tasks-card,
.stats-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-card:hover,
.queue-card:hover,
.tasks-card:hover,
.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

/* 通用头部样式 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: var(--el-text-color-primary);
  font-size: 16px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-badge {
  display: flex;
  align-items: center;
}

/* 连接状态样式 */
.connection-status .status-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-icon-wrapper.status-connected {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.3);
}

.status-icon-wrapper.status-connecting {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
  box-shadow: 0 4px 16px rgba(230, 162, 60, 0.3);
}

.status-icon-wrapper.status-error {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.3);
}

.status-icon-wrapper.status-disconnected {
  background: linear-gradient(135deg, #909399, #b1b3b8);
  box-shadow: 0 4px 16px rgba(144, 147, 153, 0.3);
}

.status-icon {
  font-size: 24px;
  color: var(--el-text-color-primary);
  transition: all 0.3s ease;
}

.status-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(103, 194, 58, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-text {
  font-weight: 600;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.status-subtitle {
  font-size: 14px;
   color: var(--el-text-color-primary);
}

.connection-metrics {
  display: flex;
  gap: 24px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  transition: all 0.3s ease;
}

.metric-card:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: var(--el-text-color-primary);
  font-size: 16px;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1;
}

.metric-label {
  font-size: 12px;
   color: var(--el-text-color-primary);
}

.connection-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.action-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.action-button:hover::before {
  left: 100%;
}

.refresh-btn {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: var(--el-text-color-primary);
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #337ecc, #5dade6);
}

/* 队列状态样式 */
.queue-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.queue-metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  transition: all 0.3s ease;
}

.queue-metric-card:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.metric-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 20px;
  color: var(--el-text-color-primary);
  transition: all 0.3s ease;
}

.metric-icon-wrapper.pending {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
  box-shadow: 0 4px 16px rgba(230, 162, 60, 0.3);
}

.metric-icon-wrapper.processing {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.metric-icon-wrapper.completed {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.3);
}

.metric-icon-wrapper.throughput {
  background: linear-gradient(135deg, #909399, #b1b3b8);
  box-shadow: 0 4px 16px rgba(144, 147, 153, 0.3);
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-progress-section {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.progress-text {
  font-size: 14px;
  color: #606266;
}

.concurrency-progress {
  margin-top: 8px;
}

/* 任务列表样式 */
.empty-state {
  padding: 60px 0;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin: 0;
}

.empty-description {
  font-size: 14px;
   color: var(--el-text-color-primary);
  margin: 0;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-item {
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid var(--el-border-color);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.task-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #e4e7ed;
  transition: all 0.3s ease;
}

.task-item.processing::before {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.task-item.pending::before {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.task-item.completed::before {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.task-item.failed::before {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.task-item:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-icon {
  font-size: 20px;
  transition: all 0.3s ease;
}

.task-icon.processing {
  color: #409eff;
}

.task-icon.pending {
  color: #e6a23c;
}

.task-icon.completed {
  color: #67c23a;
}

.task-icon.failed {
  color: #f56c6c;
}

.task-id {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.task-filename {
  font-size: 14px;
  color: #606266;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 6px;
}

.task-status-tag {
  margin-left: auto;
}

.task-progress-section {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-percentage {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-size {
  font-size: 14px;
  color: #606266;
}

.task-progress-bar {
  border-radius: 8px;
}

.task-metrics {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric-item:hover {
  background: rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.metric-item .iconify {
  font-size: 16px;
  color: #409eff;
}

.metric-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.metric-label {
  font-size: 12px;
   color: var(--el-text-color-primary);
}

.task-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.refresh-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.refresh-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.task-count-badge {
  margin-right: 8px;
}

/* 统计信息样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: #e4e7ed;
  transition: all 0.3s ease;
}

.stat-card.total::before {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-card.processing::before {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-card.completed::before {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-card.failed::before {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-card.size::before {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.stat-card.time::before {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-card:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 20px;
  color: var(--el-text-color-primary);
  transition: all 0.3s ease;
}

.stat-card.total .stat-icon-wrapper {
  background: linear-gradient(135deg, #909399, #b1b3b8);
  box-shadow: 0 4px 16px rgba(144, 147, 153, 0.3);
}

.stat-card.processing .stat-icon-wrapper {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.stat-card.completed .stat-icon-wrapper {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.3);
}

.stat-card.failed .stat-icon-wrapper {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.3);
}

.stat-card.size .stat-icon-wrapper {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
  box-shadow: 0 4px 16px rgba(230, 162, 60, 0.3);
}

.stat-card.time .stat-icon-wrapper {
  background: linear-gradient(135deg, #909399, #b1b3b8);
  box-shadow: 0 4px 16px rgba(144, 147, 153, 0.3);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
   color: var(--el-text-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .server-file-upload-progress {
    padding: 16px;
    gap: 16px;
  }

  .connection-metrics {
    flex-direction: column;
    gap: 12px;
  }

  .queue-metrics-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .task-metrics {
    flex-direction: column;
    gap: 12px;
  }

  .task-actions {
    flex-direction: column;
    gap: 8px;
  }
}

/* 动画效果 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

.status-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

/* 新增动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

/* 页面加载动画 */
.server-file-upload-progress > * {
  animation: slideInUp 0.6s ease-out;
}

.server-file-upload-progress > *:nth-child(1) {
  animation-delay: 0.1s;
}

.server-file-upload-progress > *:nth-child(2) {
  animation-delay: 0.2s;
}

.server-file-upload-progress > *:nth-child(3) {
  animation-delay: 0.3s;
}

.server-file-upload-progress > *:nth-child(4) {
  animation-delay: 0.4s;
}

/* 进度条增强动画 */
.el-progress__bar .el-progress__bar-inner {
  background: linear-gradient(90deg, #409eff, #66b1ff, #409eff);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

/* 卡片悬停增强效果 */
.status-card:hover .status-icon-wrapper,
.queue-metric-card:hover .metric-icon-wrapper,
.task-card:hover .task-icon,
.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
}

/* 数字计数动画 */
.metric-value,
.stat-value {
  transition: all 0.3s ease;
}

.metric-value:hover,
.stat-value:hover {
  transform: scale(1.05);
  color: #409eff;
}

/* 连接状态指示器增强 */
.status-icon-wrapper.status-connected::after {
  content: "";
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #67c23a;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}
</style>
