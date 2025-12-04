<template>
  <el-dialog
    v-model="dialogVisible"
    title="容器日志"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="logs-container">
      <!-- 日志控制栏 -->
      <div class="logs-header">
        <div class="logs-info">
          <span class="container-name">{{ containerData?.systemSoftContainerName }}</span>
          <el-tag size="small" :type="getStatusType(containerData?.systemSoftContainerStatus)">
            {{ getStatusText(containerData?.systemSoftContainerStatus) }}
          </el-tag>
        </div>
        <div class="logs-controls">
          <el-switch 
            v-model="autoRefresh" 
            active-text="自动刷新" 
            @change="handleAutoRefreshChange"
          />
          <el-input-number
            v-model="logLines"
            :min="50"
            :max="2000"
            :step="50"
            size="small"
            style="width: 120px"
            @change="loadLogs"
          />
          <span class="control-label">行</span>
          <el-select
            v-model="logLevel"
            size="small"
            style="width: 100px"
            @change="loadLogs"
          >
            <el-option label="全部" value="" />
            <el-option label="ERROR" value="error" />
            <el-option label="WARN" value="warn" />
            <el-option label="INFO" value="info" />
            <el-option label="DEBUG" value="debug" />
          </el-select>
        </div>
        <div class="logs-actions">
          <el-button size="small" @click="loadLogs" :loading="loading">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            刷新
          </el-button>
          <el-button size="small" @click="downloadLogs">
            <IconifyIconOnline icon="ri:download-line" class="mr-1" />
            下载
          </el-button>
          <el-button size="small" @click="clearLogs">
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            清空显示
          </el-button>
        </div>
      </div>
      
      <!-- 日志内容 -->
      <div class="logs-content" ref="logsContentRef">
        <div v-if="loading && !logs" class="logs-loading">
          <el-skeleton :rows="10" animated />
        </div>
        <div v-else-if="logs" class="logs-wrapper">
          <pre class="logs-text">{{ logs }}</pre>
        </div>
        <div v-else class="logs-empty">
          <IconifyIconOnline icon="ri:file-text-line" class="empty-icon" />
          <span>暂无日志信息</span>
          <el-button size="small" type="primary" @click="loadLogs">
            重新加载
          </el-button>
        </div>
      </div>
      
      <!-- 日志统计 -->
      <div class="logs-footer">
        <div class="logs-stats">
          <span class="stat-item">
            <span class="stat-label">总行数：</span>
            <span class="stat-value">{{ logStats.totalLines }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">错误：</span>
            <span class="stat-value error">{{ logStats.errorCount }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">警告：</span>
            <span class="stat-value warning">{{ logStats.warnCount }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">最后更新：</span>
            <span class="stat-value">{{ lastUpdateTime }}</span>
          </span>
        </div>
        <div class="logs-scroll">
          <el-button size="small" @click="scrollToTop">
            <IconifyIconOnline icon="ri:arrow-up-line" />
            顶部
          </el-button>
          <el-button size="small" @click="scrollToBottom">
            <IconifyIconOnline icon="ri:arrow-down-line" />
            底部
          </el-button>
        </div>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="openInNewWindow">
          <IconifyIconOnline icon="ri:external-link-line" class="mr-1" />
          新窗口打开
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { containerApi, type SystemSoftContainer } from '@/api/docker'

interface Props {
  visible: boolean
  containerData?: SystemSoftContainer | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const logs = ref('')
const logLines = ref(200)
const logLevel = ref('')
const autoRefresh = ref(false)
const lastUpdateTime = ref('')
const logsContentRef = ref<HTMLElement>()

// 日志统计
const logStats = reactive({
  totalLines: 0,
  errorCount: 0,
  warnCount: 0
})

// 定时器
let refreshTimer: NodeJS.Timeout | null = null

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听对话框状态
watch(dialogVisible, (visible) => {
  if (visible && props.containerData) {
    loadLogs()
  } else {
    stopAutoRefresh()
  }
})

// 监听容器数据变化
watch(() => props.containerData, (newData) => {
  if (newData && dialogVisible.value) {
    loadLogs()
  }
})

// 工具函数
const getStatusType = (status?: string) => {
  const map = { running: 'success', stopped: 'warning', paused: 'info', restarting: 'warning', error: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status?: string) => {
  const map = { running: '运行中', stopped: '已停止', paused: '暂停', restarting: '重启中', error: '错误' }
  return map[status] || '未知'
}

// 加载日志
const loadLogs = async () => {
  if (!props.containerData?.systemSoftContainerId) return
  
  try {
    loading.value = true
    
    const response = await containerApi.getContainerLogs(
      props.containerData.systemSoftContainerId,
      logLines.value
    )
    if (response.code === '00000') {
      logs.value = response.data || ''
      updateLogStats()
      lastUpdateTime.value = new Date().toLocaleTimeString()
      
      // 自动滚动到底部
      await nextTick()
      scrollToBottom()
    } else {
      ElMessage.error(response.msg || '获取日志失败')
    }
  } catch (error) {
    ElMessage.error('获取容器日志失败')
  } finally {
    loading.value = false
  }
}

// 更新日志统计
const updateLogStats = () => {
  if (!logs.value) {
    logStats.totalLines = 0
    logStats.errorCount = 0
    logStats.warnCount = 0
    return
  }
  
  const lines = logs.value.split('\n')
  logStats.totalLines = lines.length
  
  // 统计错误和警告数量
  logStats.errorCount = lines.filter(line => 
    /\b(error|ERROR|Error|exception|Exception|fatal|FATAL|Fatal)\b/.test(line)
  ).length
  
  logStats.warnCount = lines.filter(line => 
    /\b(warn|WARN|Warn|warning|WARNING|Warning)\b/.test(line)
  ).length
}

// 自动刷新控制
const handleAutoRefreshChange = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  refreshTimer = setInterval(async () => {
    if (autoRefresh.value && dialogVisible.value && props.containerData) {
      await loadLogs()
    }
  }, 3000) // 每3秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 滚动控制
const scrollToTop = () => {
  if (logsContentRef.value) {
    logsContentRef.value.scrollTop = 0
  }
}

const scrollToBottom = () => {
  if (logsContentRef.value) {
    logsContentRef.value.scrollTop = logsContentRef.value.scrollHeight
  }
}

// 清空显示
const clearLogs = () => {
  logs.value = ''
  logStats.totalLines = 0
  logStats.errorCount = 0
  logStats.warnCount = 0
}

// 下载日志
const downloadLogs = () => {
  if (!logs.value) {
    ElMessage.warning('暂无日志可下载')
    return
  }
  
  const containerName = props.containerData?.systemSoftContainerName || 'unknown'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `container-logs-${containerName}-${timestamp}.txt`
  
  const blob = new Blob([logs.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('日志文件下载成功')
}

// 新窗口打开
const openInNewWindow = () => {
  if (!logs.value) {
    ElMessage.warning('暂无日志内容')
    return
  }
  
  const containerName = props.containerData?.systemSoftContainerName || 'Unknown Container'
  const newWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes')
  
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>容器日志 - ${containerName}</title>
        <style>
          body {
            font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 20px;
            background: #1e1e1e;
            color: #d4d4d4;
          }
          .header {
            background: #333;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            color: #fff;
          }
          .logs {
            background: #2d2d30;
            padding: 15px;
            border-radius: 4px;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h3>容器日志 - ${containerName}</h3>
          <p>容器ID: ${props.containerData?.systemSoftContainerId || 'Unknown'}</p>
          <p>生成时间: ${new Date().toLocaleString()}</p>
        </div>
        <div class="logs">${logs.value}</div>
      </body>
      </html>
    `)
    newWindow.document.close()
  }
}

const handleClose = () => {
  stopAutoRefresh()
  autoRefresh.value = false
  dialogVisible.value = false
}

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.logs-container {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;
  gap: 16px;
}

.logs-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container-name {
  font-weight: 600;
  color: #303133;
}

.logs-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 12px;
  color: #606266;
}

.logs-actions {
  display: flex;
  gap: 8px;
}

.logs-content {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  background: #1e1e1e;
}

.logs-loading {
  padding: 20px;
  background: white;
}

.logs-wrapper {
  height: 100%;
  overflow-y: auto;
}

.logs-text {
  font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #d4d4d4;
  margin: 0;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-all;
  background: #1e1e1e;
  min-height: 100%;
}

.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  background: white;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
  color: #c0c4cc;
}

.logs-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-top: 16px;
}

.logs-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.stat-label {
  color: #606266;
}

.stat-value {
  font-weight: 500;
  color: #303133;
}

.stat-value.error {
  color: #f56c6c;
}

.stat-value.warning {
  color: #e6a23c;
}

.logs-scroll {
  display: flex;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>