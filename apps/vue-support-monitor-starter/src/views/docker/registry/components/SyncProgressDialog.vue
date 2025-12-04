<template>
  <el-dialog
    title="同步进度"
    v-model="dialogVisible"
    width="700px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <div class="sync-progress-container">
      <!-- 整体进度 -->
      <div class="overall-progress">
        <div class="progress-header">
          <h4>{{ progress.title || '正在同步仓库数据' }}</h4>
          <el-tag 
            :type="getStatusType(progress.status)"
            size="small"
          >
            {{ getStatusText(progress.status) }}
          </el-tag>
        </div>
        
        <el-progress
          :percentage="progress.percentage || 0"
          :status="getProgressStatus(progress.status)"
          :stroke-width="20"
          text-inside
        />
        
        <div class="progress-info">
          <span class="current-step">{{ progress.currentStep || '准备中...' }}</span>
          <span class="time-info">
            已用时: {{ formatDuration(progress.elapsed || 0) }}
            <span v-if="progress.estimated">
              / 预计: {{ formatDuration(progress.estimated) }}
            </span>
          </span>
        </div>
      </div>

      <!-- 详细步骤 -->
      <div class="step-details" v-if="progress.steps && progress.steps.length > 0">
        <h5>同步步骤</h5>
        <el-timeline>
          <el-timeline-item
            v-for="(step, index) in progress.steps"
            :key="index"
            :type="getStepType(step.status)"
            :icon="getStepIcon(step.status)"
            :timestamp="step.timestamp ? formatTime(step.timestamp) : ''"
            placement="top"
          >
            <div class="step-content">
              <div class="step-title">{{ step.title }}</div>
              <div v-if="step.description" class="step-description">
                {{ step.description }}
              </div>
              <div v-if="step.progress !== undefined" class="step-progress">
                <el-progress
                  :percentage="step.progress"
                  :show-text="false"
                  :stroke-width="6"
                />
                <span class="progress-text">{{ step.progress }}%</span>
              </div>
              <div v-if="step.error" class="step-error">
                <IconifyIconOnline icon="ri:error-warning-line" />
                {{ step.error }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 同步统计 -->
      <div class="sync-stats" v-if="progress.stats">
        <h5>同步统计</h5>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ progress.stats.totalSoftware || 0 }}</div>
            <div class="stat-label">软件总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ progress.stats.syncedSoftware || 0 }}</div>
            <div class="stat-label">已同步</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ progress.stats.newSoftware || 0 }}</div>
            <div class="stat-label">新增</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ progress.stats.updatedSoftware || 0 }}</div>
            <div class="stat-label">更新</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ progress.stats.failedSoftware || 0 }}</div>
            <div class="stat-label">失败</div>
          </div>
        </div>
      </div>

      <!-- 同步日志 -->
      <div class="sync-logs" v-if="progress.logs && progress.logs.length > 0">
        <div class="logs-header">
          <h5>同步日志</h5>
          <div class="logs-actions">
            <el-button size="small" @click="toggleLogDetails">
              {{ showLogDetails ? '隐藏' : '显示' }}详细日志
            </el-button>
            <el-button size="small" @click="clearLogs">
              清空日志
            </el-button>
          </div>
        </div>
        
        <div v-if="showLogDetails" class="logs-content">
          <div
            v-for="(log, index) in displayLogs"
            :key="index"
            :class="['log-line', log.level]"
          >
            <span class="log-time">[{{ formatTime(log.timestamp) }}]</span>
            <span class="log-level">[{{ log.level.toUpperCase() }}]</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button
          v-if="canCancel"
          @click="handleCancel"
        >
          取消同步
        </el-button>
        <el-button
          v-if="isCompleted"
          type="primary"
          @click="handleClose"
        >
          确定
        </el-button>
        <el-button
          v-if="isFailed"
          type="warning"
          @click="handleRetry"
        >
          重试
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

// Props 定义
interface Props {
  visible: boolean
  progress: any
}

const props = defineProps<Props>()

// Emits 定义
const emit = defineEmits<{
  'update:visible': [value: boolean]
  cancel: []
  retry: []
}>()

// 响应式数据
const showLogDetails = ref(false)
const maxDisplayLogs = ref(100)

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isCompleted = computed(() => {
  return ['completed', 'cancelled'].includes(props.progress?.status)
})

const isFailed = computed(() => {
  return props.progress?.status === 'failed'
})

const canCancel = computed(() => {
  return ['running', 'pending'].includes(props.progress?.status)
})

const displayLogs = computed(() => {
  if (!props.progress?.logs) return []
  
  const logs = [...props.progress.logs]
  if (logs.length > maxDisplayLogs.value) {
    return logs.slice(-maxDisplayLogs.value)
  }
  return logs
})

// 方法定义
const getStatusType = (status: string) => {
  const types = {
    'pending': 'info',
    'running': 'warning',
    'completed': 'success',
    'failed': 'danger',
    'cancelled': 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    'pending': '等待中',
    'running': '进行中',
    'completed': '已完成',
    'failed': '失败',
    'cancelled': '已取消'
  }
  return texts[status] || '未知'
}

const getProgressStatus = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'exception'
  return null
}

const getStepType = (status: string) => {
  const types = {
    'pending': 'info',
    'running': 'primary',
    'completed': 'success',
    'failed': 'danger',
    'skipped': 'warning'
  }
  return types[status] || 'info'
}

const getStepIcon = (status: string) => {
  const icons = {
    'pending': 'ri:time-line',
    'running': 'ri:loader-line',
    'completed': 'ri:check-line',
    'failed': 'ri:close-line',
    'skipped': 'ri:skip-forward-line'
  }
  return icons[status] || 'ri:more-line'
}

const formatTime = (timestamp: number | string) => {
  return new Date(timestamp).toLocaleTimeString()
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
};

const toggleLogDetails = () => {
  showLogDetails.value = !showLogDetails.value
}

const clearLogs = () => {
  // 清空日志的逻辑
  console.log('清空日志')
}

const handleCancel = () => {
  emit('cancel')
}

const handleRetry = () => {
  emit('retry')
}

const handleClose = () => {
  emit('update:visible', false)
}

// 监听器
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      showLogDetails.value = false
    }
  }
)
</script>

<style scoped>
.sync-progress-container {
  max-height: 600px;
  overflow-y: auto;
}

.overall-progress {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-header h4 {
  margin: 0;
  color: #2c3e50;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 14px;
  color: #6c757d;
}

.step-details {
  margin-bottom: 24px;
}

.step-details h5 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.step-content {
  padding: 8px 0;
}

.step-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.step-description {
  color: #6c757d;
  font-size: 13px;
  margin-bottom: 8px;
}

.step-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.step-progress .el-progress {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  color: #6c757d;
  min-width: 35px;
}

.step-error {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f56c6c;
  font-size: 13px;
}

.sync-stats {
  margin-bottom: 24px;
}

.sync-stats h5 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
}

.sync-logs {
  margin-bottom: 16px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.logs-header h5 {
  margin: 0;
  color: #2c3e50;
}

.logs-actions {
  display: flex;
  gap: 8px;
}

.logs-content {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.log-line {
  margin-bottom: 2px;
}

.log-line.error {
  color: #f56c6c;
}

.log-line.warn {
  color: #e6a23c;
}

.log-line.info {
  color: #409eff;
}

.log-line.debug {
  color: #909399;
}

.log-time {
  color: #909399;
}

.log-level {
  font-weight: 600;
  margin: 0 8px;
}

.log-message {
  word-break: break-all;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
