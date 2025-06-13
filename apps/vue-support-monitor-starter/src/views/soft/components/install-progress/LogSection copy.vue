<template>
  <div class="log-section">
    <div class="logs-header pb-2 mb-3">
      <div class="section-title flex items-center justify-between">
        <div class="flex items-center flex-wrap">
          <div class="flex items-center">
            <IconifyIconOnline icon="ep:document" class="mr-2 text-primary text-xl" />
            安装日志
            <span v-if="activeLogType === 'install' && getInstallProgress() > 0" class="ml-2 text-sm text-primary font-medium">
              ({{ getInstallProgress() }}%)
            </span>
          </div>
          <div v-if="activeLogType === 'install' && getInstallProgress() > 0" class="install-progress-bar ml-3 flex-1 min-w-[100px] max-w-[200px]">
            <el-progress 
              :percentage="getInstallProgress()" 
              :status="getProgressStatus()" 
              :stroke-width="8" 
              :show-text="true"
              :format="() => getProgressFormatText()"
              :color="progressBarColor"
            />
          </div>
        </div>
        <div class="log-tabs">
          <el-radio-group v-model="activeLogType" size="small" class="log-type-tabs" @change="$emit('log-type-change', activeLogType)">
            <el-radio-button label="install">安装日志</el-radio-button>
            <el-radio-button label="start" :disabled="!canViewServiceLogs">启动日志</el-radio-button>
            <el-radio-button label="stop" :disabled="!canViewServiceLogs">停止日志</el-radio-button>
            <el-radio-button label="restart" :disabled="!canViewServiceLogs">重启日志</el-radio-button>
            <el-radio-button label="uninstall" :disabled="!canViewServiceLogs">卸载日志</el-radio-button>
            <el-radio-button label="monitor" :disabled="!canViewServiceLogs">实时监控</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>
    
    <el-scrollbar :height="logsHeight" ref="logScrollRef" class="log-scrollbar">
      <div class="log-container p-4 font-mono text-sm">
        <div v-if="logs.length === 0" class="empty-logs">
          <el-empty description="暂无日志记录" :image-size="100">
            <template #description>
              <p>暂无日志记录，请等待安装过程...</p>
            </template>
          </el-empty>
        </div>
        <div v-for="log in logs" :key="log.id" :class="['log-item py-2 px-3 mb-1 rounded', log.type]">
          <span class="log-time text-gray-500 mr-2 font-semibold">{{ formatTime(log.timestamp || new Date()) }}</span>
          <span :class="getLogClass(log.type)">
            {{ log.msg }}
            <span v-if="log.step !== undefined && log.total !== undefined && log.total > 0" class="ml-2 text-gray-500 font-medium">
              ({{ Math.round((log.step / log.total) * 100) }}% - {{ log.step }}/{{ log.total }})
            </span>
          </span>
        </div>
      </div>
    </el-scrollbar>
    
    <div class="log-footer mt-4 flex justify-between items-center">
      <div class="status-info flex items-center">
        <el-tag :type="getStatusTagType(installStatus)" size="large" effect="dark" class="status-tag">
          <IconifyIconOnline :icon="getStatusIcon(installStatus)" class="mr-1" />
          {{ getInstallStatusText() }}
        </el-tag>
      </div>
      <div class="action-buttons">
        <el-button size="small" @click="$emit('clear')" plain type="info">
          <IconifyIconOnline icon="ep:delete" class="mr-1" />
          清空日志
        </el-button>
        <el-button size="small" type="primary" @click="$emit('export')" plain>
          <IconifyIconOnline icon="ep:download" class="mr-1" />
          导出日志
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  logs: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  logsHeight: {
    type: String,
    default: 'calc(100vh - 450px)'
  },
  installStatus: {
    type: String,
    default: 'pending'
  },
  canViewServiceLogs: {
    type: Boolean,
    default: false
  },
  installProgress: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['log-type-change', 'clear', 'export', 'scroll-to-bottom'])

const activeLogType = ref('install')
const logScrollRef = ref(null)

// 记录最高进度值
const highestProgress = ref(0);

// 添加渐变颜色的计算属性
const progressBarColor = computed(() => {
  if (props.installStatus === 'error') {
    return '#f56c6c' // 错误状态为红色
  }
  return getInstallProgress() === 100 ? '#67c23a' : '#409eff'
})

// 格式化时间
const formatTime = (date: Date) => {
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 根据日志类型获取样式类
const getLogClass = (type: string) => {
  switch (type) {
    case 'error':
      return 'text-red-500 font-medium'
    case 'warning':
      return 'text-orange-500 font-medium'
    case 'success':
      return 'text-green-500 font-medium'
    default:
      return 'text-blue-500'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending': return 'info'
    case 'running': return 'warning'
    case 'success': return 'success'
    case 'error': return 'danger'
    default: return 'info'
  }
}

// 获取安装状态文本
const getInstallStatusText = () => {
  switch (props.installStatus) {
    case 'pending': return '等待安装'
    case 'running': return '安装中'
    case 'success': return '安装成功'
    case 'error': return '安装失败'
    default: return '未知状态'
  }
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return 'ep:time'
    case 'running': return 'ep:loading'
    case 'success': return 'ep:check'
    case 'error': return 'ep:close'
    default: return 'ep:info'
  }
}

// 获取安装进度
const getInstallProgress = () => {
  // 更新最高进度值
  if (props.installProgress > highestProgress.value) {
    highestProgress.value = props.installProgress;
  }
  
  // 始终返回最高进度值，防止进度回退
  return highestProgress.value;
}

// 获取进度条状态
const getProgressStatus = () => {
  if (props.installStatus === 'error') {
    return 'exception' // 错误状态
  } else if (getInstallProgress() === 100) {
    return 'success'   // 成功状态
  } else {
    return ''          // 默认状态
  }
}

// 获取进度条格式化文本
const getProgressFormatText = () => {
  if (props.installStatus === 'error') {
    return '失败'      // 错误状态显示"失败"
  } else {
    return `${getInstallProgress()}%` // 正常状态显示百分比
  }
}

defineExpose({
  logScrollRef,
  activeLogType
})
</script>

<style lang="scss" scoped>
.logs-header {
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.install-progress-bar {
  margin-left: 12px;
  transition: all 0.3s ease;
  position: relative;
  
  :deep(.el-progress-bar__outer) {
    border-radius: 4px;
    background-color: var(--el-fill-color-lighter);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-progress-bar__inner) {
    transition: all 0.5s ease-out;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  :deep(.el-progress__text) {
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
}

.log-type-tabs {
  :deep(.el-radio-button__inner) {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
  }
}

.log-scrollbar {
  :deep(.el-scrollbar__bar) {
    width: 6px;
    
    &.is-horizontal {
      height: 6px;
    }
  }
}

.log-container {
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  min-height: 200px;
  border: 1px solid var(--el-border-color-lighter);
}

.empty-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--el-text-color-secondary);
}

.log-item {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.error {
    background-color: rgba(var(--el-color-danger-rgb), 0.05);
    border-left-color: var(--el-color-danger);
  }
  
  &.warning {
    background-color: rgba(var(--el-color-warning-rgb), 0.05);
    border-left-color: var(--el-color-warning);
  }
  
  &.success {
    background-color: rgba(var(--el-color-success-rgb), 0.05);
    border-left-color: var(--el-color-success);
  }
  
  &.info {
    background-color: rgba(var(--el-color-info-rgb), 0.03);
    border-left-color: var(--el-color-info);
  }
}

.log-footer {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.status-tag {
  display: flex;
  align-items: center;
  font-weight: 500;
  padding: 6px 12px;
}
</style>