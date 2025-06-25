<template>
  <div class="server-file-upload-progress">
    <!-- WebSocket连接状态 -->
    <div class="connection-status">
      <el-card>
        <div class="status-content">
          <div class="status-indicator">
            <el-icon :class="connectionStatusClass">
              <component :is="connectionStatusIcon" />
            </el-icon>
            <span class="status-text">{{ connectionStatusText }}</span>
          </div>
          
          <div class="connection-info">
            <span class="info-item">活跃任务: {{ activeTaskCount }}</span>
            <span class="info-item">总进度: {{ totalProgress }}%</span>
            <span class="info-item">总速度: {{ formatSpeed(totalSpeed) }}</span>
          </div>
          
          <div class="connection-actions">
            <el-button
              v-if="!isConnected"
              type="primary"
              size="small"
              @click="handleConnect"
            >
              连接
            </el-button>
            <el-button
              v-else
              type="danger"
              size="small"
              @click="handleDisconnect"
            >
              断开
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 队列状态 -->
    <div class="queue-status">
      <el-card>
        <template #header>
          <span>队列状态</span>
        </template>
        
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="queue-metric">
              <div class="metric-value">{{ queueStatus.queueLength }}</div>
              <div class="metric-label">队列长度</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="queue-metric">
              <div class="metric-value">{{ formatDuration(queueStatus.avgWaitTime / 1000) }}</div>
              <div class="metric-label">平均等待</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="queue-metric">
              <div class="metric-value">{{ formatDuration(queueStatus.avgProcessTime / 1000) }}</div>
              <div class="metric-label">平均处理</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="queue-metric">
              <div class="metric-value">{{ queueStatus.throughput.toFixed(1) }}</div>
              <div class="metric-label">吞吐量/分</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 活跃任务进度 -->
    <div class="active-tasks">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>活跃任务进度</span>
            <el-button text @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        
        <div v-if="activeTaskProgresses.length === 0" class="empty-state">
          <el-empty description="暂无活跃任务" />
        </div>
        
        <div v-else class="task-list">
          <div
            v-for="task in activeTaskProgresses"
            :key="task.taskId"
            class="task-item"
          >
            <div class="task-header">
              <div class="task-info">
                <span class="task-id">任务 #{{ task.taskId }}</span>
                <el-tag :type="getStatusType(task.status)" size="small">
                  {{ getStatusText(task.status) }}
                </el-tag>
              </div>
              
              <div class="task-metrics">
                <span class="metric">{{ formatSpeed(task.speed) }}</span>
                <span class="metric">{{ formatFileSize(task.transferredBytes) }}/{{ formatFileSize(task.totalBytes) }}</span>
                <span v-if="task.remainingTime" class="metric">剩余: {{ formatDuration(task.remainingTime) }}</span>
              </div>
            </div>
            
            <div class="task-progress">
              <el-progress
                :percentage="task.progress"
                :status="getProgressStatus(task.status)"
                :stroke-width="8"
                :show-text="true"
              />
            </div>
            
            <div class="task-actions">
              <el-button
                size="small"
                type="danger"
                @click="handleCancelTask(task.taskId)"
              >
                取消
              </el-button>
              <el-button
                size="small"
                @click="handleViewTaskDetail(task.taskId)"
              >
                详情
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计信息 -->
    <div class="statistics">
      <el-card>
        <template #header>
          <span>统计信息</span>
        </template>
        
        <el-row :gutter="16">
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.activeTasks }}</div>
              <div class="stat-label">活跃任务</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.completedTasks }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.failedTasks }}</div>
              <div class="stat-label">失败任务</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ formatFileSize(statistics.totalTransferred) }}</div>
              <div class="stat-label">总传输量</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ formatSpeed(statistics.avgSpeed) }}</div>
              <div class="stat-label">平均速度</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Connection, Disconnect, Warning } from '@element-plus/icons-vue';
import { useServerFileUpload } from '@/composables/useServerFileUpload';
import { cancelServerFileUploadTask, TASK_STATUS } from '@/api/server-file-upload';

// 使用组合式函数
const {
  isConnected,
  connectionStatus,
  taskProgresses,
  queueStatus,
  statistics,
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
    case 'CONNECTED':
      return 'status-connected';
    case 'CONNECTING':
      return 'status-connecting';
    case 'ERROR':
      return 'status-error';
    default:
      return 'status-disconnected';
  }
});

const connectionStatusIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'CONNECTED':
      return Connection;
    case 'CONNECTING':
      return Connection;
    case 'ERROR':
      return Warning;
    default:
      return Disconnect;
  }
});

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'CONNECTED':
      return '已连接';
    case 'CONNECTING':
      return '连接中';
    case 'ERROR':
      return '连接错误';
    default:
      return '未连接';
  }
});

const activeTaskProgresses = computed(() => {
  return Array.from(taskProgresses.values()).filter(
    task => task.status === TASK_STATUS.PROCESSING || task.status === TASK_STATUS.PENDING
  );
});

// 方法
const handleConnect = async () => {
  try {
    await connect();
  } catch (error) {
    console.error('连接失败:', error);
  }
};

const handleDisconnect = () => {
  disconnect();
};

const handleRefresh = () => {
  emit('refresh');
};

const handleCancelTask = async (taskId: number) => {
  try {
    await cancelServerFileUploadTask(taskId);
    ElMessage.success('任务取消成功');
  } catch (error: any) {
    ElMessage.error(error.message || '取消任务失败');
  }
};

const handleViewTaskDetail = (taskId: number) => {
  emit('viewTaskDetail', taskId);
};

const getStatusType = (status: string) => {
  const statusMap = {
    [TASK_STATUS.PENDING]: 'info',
    [TASK_STATUS.PROCESSING]: 'warning',
    [TASK_STATUS.COMPLETED]: 'success',
    [TASK_STATUS.FAILED]: 'danger',
    [TASK_STATUS.CANCELLED]: 'info'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const statusMap = {
    [TASK_STATUS.PENDING]: '待处理',
    [TASK_STATUS.PROCESSING]: '处理中',
    [TASK_STATUS.COMPLETED]: '已完成',
    [TASK_STATUS.FAILED]: '失败',
    [TASK_STATUS.CANCELLED]: '已取消'
  };
  return statusMap[status] || status;
};

const getProgressStatus = (status: string) => {
  if (status === TASK_STATUS.COMPLETED) return 'success';
  if (status === TASK_STATUS.FAILED) return 'exception';
  return undefined;
};
</script>

<style scoped>
.server-file-upload-progress {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.connection-status .status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator .el-icon {
  font-size: 18px;
}

.status-connected {
  color: #67c23a;
}

.status-connecting {
  color: #e6a23c;
}

.status-error {
  color: #f56c6c;
}

.status-disconnected {
  color: #909399;
}

.status-text {
  font-weight: 500;
}

.connection-info {
  display: flex;
  gap: 16px;
}

.info-item {
  font-size: 14px;
  color: #606266;
}

.queue-status .queue-metric {
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-id {
  font-weight: 500;
  color: #303133;
}

.task-metrics {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #606266;
}

.task-progress {
  margin-bottom: 12px;
}

.task-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.statistics .stat-item {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}
</style>
