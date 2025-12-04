<template>
  <div class="install-progress">
    <!-- 进度头部 -->
    <div class="progress-header">
      <div class="progress-title">
        <el-icon :size="20" class="title-icon">
          <Download v-if="status === 'downloading'" />
          <Loading v-else-if="status === 'installing'" />
          <SuccessFilled v-else-if="status === 'completed'" />
          <CircleCloseFilled v-else-if="status === 'failed'" />
          <Clock v-else />
        </el-icon>
        <span class="title-text">{{ getStatusText() }}</span>
      </div>
      
      <div class="progress-actions">
        <el-button 
          v-if="canCancel" 
          size="small" 
          type="danger" 
          text
          @click="handleCancel"
        >
          取消
        </el-button>
        
        <el-button 
          v-if="canRetry" 
          size="small" 
          type="primary" 
          text
          @click="handleRetry"
        >
          重试
        </el-button>
        
        <el-button 
          v-if="canClose" 
          size="small" 
          text
          @click="handleClose"
        >
          关闭
        </el-button>
      </div>
    </div>
    
    <!-- 软件信息 -->
    <div v-if="softwareInfo" class="software-info">
      <div class="software-basic">
        <div class="software-name">{{ softwareInfo.name }}</div>
        <div class="software-version">v{{ softwareInfo.version }}</div>
      </div>
      
      <div class="software-details">
        <span class="detail-item">
          <el-icon><Files /></el-icon>
          {{ formatBytes(softwareInfo.size || 0) }}
        </span>
        
        <span v-if="softwareInfo.category" class="detail-item">
          <el-icon><Collection /></el-icon>
          {{ softwareInfo.category }}
        </span>
        
        <span v-if="estimatedTime" class="detail-item">
          <el-icon><Timer /></el-icon>
          预计 {{ estimatedTime }}
        </span>
      </div>
    </div>
    
    <!-- 主进度条 -->
    <div class="main-progress">
      <div class="progress-info">
        <span class="progress-text">{{ currentStep }}</span>
        <span class="progress-percentage">{{ Math.round(progress) }}%</span>
      </div>
      
      <el-progress 
        :percentage="progress" 
        :status="getProgressStatus()"
        :stroke-width="12"
        :show-text="false"
        class="progress-bar"
      />
    </div>
    
    <!-- 详细步骤 -->
    <div v-if="showSteps" class="progress-steps">
      <div 
        v-for="(step, index) in steps" 
        :key="index"
        class="step-item"
        :class="{
          'step-active': index === currentStepIndex,
          'step-completed': index < currentStepIndex,
          'step-failed': step.status === 'failed'
        }"
      >
        <div class="step-icon">
          <el-icon v-if="step.status === 'completed'">
            <SuccessFilled />
          </el-icon>
          <el-icon v-else-if="step.status === 'failed'">
            <CircleCloseFilled />
          </el-icon>
          <el-icon v-else-if="step.status === 'running'">
            <Loading />
          </el-icon>
          <span v-else class="step-number">{{ index + 1 }}</span>
        </div>
        
        <div class="step-content">
          <div class="step-title">{{ step.title }}</div>
          <div v-if="step.description" class="step-description">
            {{ step.description }}
          </div>
          
          <div v-if="step.progress !== undefined" class="step-progress">
            <el-progress 
              :percentage="step.progress" 
              :stroke-width="4"
              :show-text="false"
              :status="step.status === 'failed' ? 'exception' : undefined"
            />
          </div>
        </div>
        
        <div v-if="step.duration" class="step-duration">
          {{ formatDuration(step.duration) }}
        </div>
      </div>
    </div>
    
    <!-- 速度和统计信�?-->
    <div v-if="showStats" class="progress-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">下载速度</span>
          <span class="stat-value">{{ formatSpeed(downloadSpeed) }}</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">已用时间</span>
          <span class="stat-value">{{ formatDuration(elapsedTime) }}</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">剩余时间</span>
          <span class="stat-value">{{ formatDuration(remainingTime) }}</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">完成进度</span>
          <span class="stat-value">{{ completedSteps }}/{{ totalSteps }}</span>
        </div>
      </div>
    </div>
    
    <!-- 日志输出 -->
    <div v-if="showLogs && logs.length > 0" class="progress-logs">
      <div class="logs-header">
        <span class="logs-title">安装日志</span>
        <el-button size="small" text @click="clearLogs">
          清空
        </el-button>
      </div>
      
      <div class="logs-content" ref="logsContainer">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-item"
          :class="`log-${log.level}`"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
    
    <!-- 错误信息 -->
    <div v-if="error" class="progress-error">
      <el-alert 
        :title="error.title || '安装失败'" 
        :description="error.message"
        type="error"
        :closable="false"
        show-icon
      >
        <template v-if="error.details" #default>
          <div class="error-details">
            <el-collapse>
              <el-collapse-item title="错误详情">
                <pre class="error-stack">{{ error.details }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import {
  Download,
  Loading,
  SuccessFilled,
  CircleCloseFilled,
  Clock,
  Files,
  Collection,
  Timer
} from '@element-plus/icons-vue';

interface SoftwareInfo {
  name: string;
  version: string;
  size?: number;
  category?: string;
}

interface ProgressStep {
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  duration?: number;
}

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

interface ErrorInfo {
  title?: string;
  message: string;
  details?: string;
}

interface Props {
  status: 'pending' | 'downloading' | 'installing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string;
  currentStepIndex: number;
  steps: ProgressStep[];
  softwareInfo?: SoftwareInfo;
  downloadSpeed?: number;
  elapsedTime?: number;
  remainingTime?: number;
  logs?: LogEntry[];
  error?: ErrorInfo;
  showSteps?: boolean;
  showStats?: boolean;
  showLogs?: boolean;
  canCancel?: boolean;
  canRetry?: boolean;
  canClose?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  currentStep: '',
  currentStepIndex: 0,
  steps: () => [],
  downloadSpeed: 0,
  elapsedTime: 0,
  remainingTime: 0,
  logs: () => [],
  showSteps: true,
  showStats: true,
  showLogs: false,
  canCancel: false,
  canRetry: false,
  canClose: false
});

const emit = defineEmits<{
  cancel: [];
  retry: [];
  close: [];
  clearLogs: [];
}>();

const logsContainer = ref<HTMLElement>();

const completedSteps = computed(() => {
  return props.steps.filter(step => step.status === 'completed').length;
});

const totalSteps = computed(() => {
  return props.steps.length;
});

const estimatedTime = computed(() => {
  if (props.remainingTime > 0) {
    return formatDuration(props.remainingTime);
  }
  return null;
});

const getStatusText = () => {
  switch (props.status) {
    case 'pending':
      return '准备安装';
    case 'downloading':
      return '正在下载';
    case 'installing':
      return '正在安装';
    case 'completed':
      return '安装完成';
    case 'failed':
      return '安装失败';
    case 'cancelled':
      return '已取�?;
    default:
      return '未知状�?;
  }
};

const getProgressStatus = () => {
  switch (props.status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'exception';
    default:
      return undefined;
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number) => {
  return formatBytes(bytesPerSecond) + '/s';
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}�?{remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

const handleCancel = () => {
  emit('cancel');
};

const handleRetry = () => {
  emit('retry');
};

const handleClose = () => {
  emit('close');
};

const clearLogs = () => {
  emit('clearLogs');
};

// 自动滚动到最新日�?
watch(() => props.logs.length, async () => {
  if (props.showLogs && logsContainer.value) {
    await nextTick();
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
  }
});
</script>

<style scoped>
.install-progress {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.progress-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: #409eff;
}

.title-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-actions {
  display: flex;
  gap: 8px;
}

.software-info {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.software-basic {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.software-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.software-version {
  font-size: 14px;
   color: var(--el-text-color-primary);
  background: #e4e7ed;
  padding: 2px 8px;
  border-radius: 4px;
}

.software-details {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.main-progress {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 14px;
  color: #606266;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-bar {
  margin-bottom: 8px;
}

.progress-steps {
  margin-bottom: 20px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color);
}

.step-item:last-child {
  border-bottom: none;
}

.step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e4e7ed;
   color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-active .step-icon {
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
}

.step-completed .step-icon {
  background: #67c23a;
  color: var(--el-text-color-primary);
}

.step-failed .step-icon {
  background: #f56c6c;
  color: var(--el-text-color-primary);
}

.step-number {
  font-size: 12px;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.step-description {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.step-progress {
  width: 100%;
}

.step-duration {
  font-size: 12px;
   color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.progress-stats {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-logs {
  margin-bottom: 20px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.logs-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.logs-content {
  max-height: 200px;
  overflow-y: auto;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  line-height: 1.4;
}

.log-time {
   color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.log-level {
  font-weight: 600;
  flex-shrink: 0;
  width: 50px;
}

.log-info .log-level {
  color: #409eff;
}

.log-warn .log-level {
  color: #e6a23c;
}

.log-error .log-level {
  color: #f56c6c;
}

.log-debug .log-level {
   color: var(--el-text-color-primary);
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.progress-error {
  margin-top: 16px;
}

.error-details {
  margin-top: 12px;
}

.error-stack {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .software-basic {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .software-details {
    flex-direction: column;
    gap: 8px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .step-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .step-duration {
    align-self: flex-start;
  }
}
</style>