<template>
  <el-drawer
    v-model="drawerVisible"
    title="软件安装进度"
    size="60%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="install-header px-4 py-2 border-b flex items-center justify-between">
      <div class="software-info flex items-center gap-2">
        <el-avatar :size="40" v-if="software.softServiceLogo" :src="software.softServiceLogo">
          <IconifyIconOnline icon="ep:picture" />
        </el-avatar>
        <div>
          <div class="text-lg font-medium">{{ software.softServiceName }}</div>
          <div class="text-sm text-gray-500">版本: {{ software.softServiceVersion }}</div>
        </div>
      </div>
      <div class="action-buttons flex gap-2">
        <el-button type="primary" @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </el-button>
        <template v-if="installStatus === 'success'">
          <el-dropdown split-button type="success" @click="handleStart" @command="handleCommand">
            <IconifyIconOnline icon="ep:video-play" class="mr-1" />
            启动服务
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="stop">
                  <IconifyIconOnline icon="ep:video-pause" class="mr-1" />
                  停止服务
                </el-dropdown-item>
                <el-dropdown-item command="restart">
                  <IconifyIconOnline icon="ep:refresh-right" class="mr-1" />
                  重启服务
                </el-dropdown-item>
                <el-dropdown-item command="uninstall">
                  <IconifyIconOnline icon="ep:delete" class="mr-1" />
                  卸载服务
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>
    
    <el-container class="install-content h-full">
      <!-- 左侧设备列表 -->
      <el-aside width="250px" class="border-r">
        <div class="device-list p-4">
          <div class="text-lg font-medium mb-4 flex items-center">
            <IconifyIconOnline icon="ep:monitor" class="mr-2" />
            安装设备
          </div>
          
          <el-scrollbar height="calc(100vh - 230px)">
            <el-menu
              :default-active="activeDevice"
              @select="handleSelectDevice"
              class="device-menu"
            >
              <el-menu-item v-for="device in deviceList" :key="device.id" :index="device.id">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center">
                    <el-badge :type="getStatusType(device.status)" :value="getStatusText(device.status)" class="mr-2" />
                    {{ device.name }}
                  </div>
                </div>
              </el-menu-item>
            </el-menu>
          </el-scrollbar>
        </div>
      </el-aside>
      
      <!-- 右侧日志 -->
      <el-main class="install-logs">
        <div class="logs-header pb-2 mb-2 border-b">
          <div class="text-lg font-medium flex items-center justify-between">
            <div class="flex items-center">
              <IconifyIconOnline icon="ep:document" class="mr-2" />
              安装日志
            </div>
            <div class="log-tabs">
              <el-radio-group v-model="activeLogType" size="small" @change="handleLogTypeChange">
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
        
        <el-scrollbar height="calc(100vh - 230px)" ref="logScrollRef">
          <div class="log-container p-2 font-mono text-sm">
            <div v-if="logs.length === 0" class="text-gray-400 py-4 text-center">
              暂无日志记录，请等待安装过程...
            </div>
            <div v-for="log in logs" :key="log.id" :class="['log-item py-1', log.type]">
              <template v-if="log.msg">
                <span class="log-time text-gray-500 mr-2">{{ formatTime(log.timestamp || new Date()) }}</span>
                <span :class="getLogClass(log.type)">{{ log.msg }}</span>
              </template>
              <template v-else-if="log.content">
                <span class="log-time text-gray-500 mr-2">{{ formatTime(log.timestamp || new Date()) }}</span>
                <span :class="getLogClass(log.type)">{{ log.content }}</span>
              </template>
            </div>
          </div>
        </el-scrollbar>
        
        <div class="log-footer mt-4 flex justify-between items-center">
          <div class="status-info flex items-center">
            <el-tag :type="getStatusTagType(installStatus)" size="small">{{ getInstallStatusText() }}</el-tag>
          </div>
          <div class="action-buttons">
            <el-button size="small" @click="clearLogs">清空日志</el-button>
            <el-button size="small" type="primary" @click="exportLogs">导出日志</el-button>
          </div>
        </div>
      </el-main>
    </el-container>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { message, useUUID, splitToArray } from "@repo/utils"
import { socket } from "@repo/core"
import { getConfig } from "@repo/config"
import type { PartialSoftService } from '@/api/soft'
import { 
  fetchSoftServiceStartService, 
  fetchSoftServiceStopService,
  fetchSoftServiceRestartService,
  fetchSoftServiceUninstall
} from '@/api/soft/install'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  software: {
    type: Object as () => PartialSoftService,
    required: true
  },
  devices: {
    type: Array as () => string[],
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'finish'])

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 状态和日志相关
const logs = ref<any[]>([])
const stompClient = ref<any>(null)
const logScrollRef = ref<any>(null)
const activeDevice = ref<string>('')
const activeLogType = ref<string>('install')
const installStatus = ref<string>('pending') // pending, running, success, error
const deviceList = ref<any[]>([])
const installId = ref<string>('')

// 计算属性
const canViewServiceLogs = computed(() => {
  return installStatus.value === 'success'
})

// 当前设备对象
const currentDevice = computed(() => {
  return deviceList.value.find(d => d.id === activeDevice.value) || null
})

// 监听 devices 变化
watch(() => props.devices, (newDevices) => {
  setupDeviceList(newDevices)
}, { immediate: true })

// 设置设备列表
const setupDeviceList = (deviceIds: string[]) => {
  deviceList.value = deviceIds.map(id => ({
    id,
    name: `设备 ${id.substring(0, 8)}`,
    status: 'pending'
  }))
  
  if (deviceList.value.length > 0 && !activeDevice.value) {
    activeDevice.value = deviceList.value[0].id
  }
}

// 连接 WebSocket
const connectWebSocket = async () => {
  if (stompClient.value && stompClient.value.connected) {
    return
  }

  try {
    const config = getConfig()
    stompClient.value = socket(splitToArray(config.SocketUrl), undefined, {})

    // 连接成功添加一条日志
    addLog('info', '连接安装日志服务成功，等待安装操作...')
    
    // 订阅当前设备的安装日志
    subscribeToLogs()
  } catch (error) {
    console.error('WebSocket连接异常:', error)
    addLog('error', `WebSocket连接异常: ${error}`)
  }
}

// 订阅日志
const subscribeToLogs = () => {
  if (!activeDevice.value || !stompClient.value) return
  
  // 先取消之前的订阅
  unsubscribeFromLogs()
  
  // 清空日志
  logs.value = []
  
  // 根据当前日志类型订阅不同的主题
  const topicSuffix = getTopicSuffix()
  const topic = `/topic/command/soft/${activeDevice.value}_${topicSuffix}`
  
  stompClient.value.on(topic, (message: any) => {
    try {
      const output = JSON.parse(message.data)
      logs.value.push({
        ...output,
        id: logs.value.length + 1,
        timestamp: new Date()
      })

      // 自动滚动到底部
      nextTick(() => {
        scrollToBottom()
      })
      
      // 检查安装状态
      checkInstallStatus(output)
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  })
  
  addLog('info', `正在监听${getLogTypeText()}...`)
}

// 取消订阅
const unsubscribeFromLogs = () => {
  if (!stompClient.value) return
  
  // 这里可以实现取消订阅的逻辑
  // stompClient.value.unsubscribe(...)
}

// 根据日志类型获取主题后缀
const getTopicSuffix = () => {
  switch (activeLogType.value) {
    case 'install': return 'install'
    case 'start': return 'start'
    case 'stop': return 'stop'
    case 'restart': return 'restart'
    case 'uninstall': return 'uninstall'
    case 'monitor': return 'monitorlog'
    default: return 'viewlog'
  }
}

// 获取日志类型文本
const getLogTypeText = () => {
  switch (activeLogType.value) {
    case 'install': return '安装日志'
    case 'start': return '启动日志'
    case 'stop': return '停止日志'
    case 'restart': return '重启日志'
    case 'uninstall': return '卸载日志'
    case 'monitor': return '实时监控'
    default: return '日志'
  }
}

// 检查安装状态
const checkInstallStatus = (log: any) => {
  if (activeLogType.value !== 'install') return
  
  const msg = log.msg || log.content || ''
  
  // 根据日志内容更新安装状态
  if (msg.includes('安装开始')) {
    installStatus.value = 'running'
    updateDeviceStatus(activeDevice.value, 'running')
  } else if (msg.includes('安装成功') || msg.includes('安装完成')) {
    installStatus.value = 'success'
    updateDeviceStatus(activeDevice.value, 'success')
  } else if (msg.includes('安装失败') || msg.includes('错误') || msg.includes('Error')) {
    installStatus.value = 'error'
    updateDeviceStatus(activeDevice.value, 'error')
  }
}

// 更新设备状态
const updateDeviceStatus = (deviceId: string, status: string) => {
  const device = deviceList.value.find(d => d.id === deviceId)
  if (device) {
    device.status = status
  }
}

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'info'
    case 'running': return 'warning'
    case 'success': return 'success'
    case 'error': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '待安装'
    case 'running': return '安装中'
    case 'success': return '已安装'
    case 'error': return '安装失败'
    default: return '未知'
  }
}

// 获取安装状态文本
const getInstallStatusText = () => {
  switch (installStatus.value) {
    case 'pending': return '等待安装'
    case 'running': return '安装中'
    case 'success': return '安装成功'
    case 'error': return '安装失败'
    default: return '未知状态'
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

// 添加日志
const addLog = (type: string, content: string) => {
  logs.value.push({
    id: logs.value.length + 1,
    type,
    content,
    timestamp: new Date()
  })
  
  // 自动滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

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
      return 'text-red-500'
    case 'warning':
      return 'text-orange-500'
    case 'success':
      return 'text-green-500'
    default:
      return 'text-blue-500'
  }
}

// 滚动到日志底部
const scrollToBottom = () => {
  if (logScrollRef.value) {
    const scrollbar = logScrollRef.value
    scrollbar.setScrollTop(scrollbar.wrapRef.scrollHeight)
  }
}

// 处理选择设备
const handleSelectDevice = (deviceId: string) => {
  activeDevice.value = deviceId
  
  // 重新订阅日志
  subscribeToLogs()
}

// 处理日志类型变更
const handleLogTypeChange = () => {
  // 重新订阅日志
  subscribeToLogs()
}

// 刷新
const handleRefresh = () => {
  // 重新订阅日志
  subscribeToLogs()
}

// 清空日志
const clearLogs = () => {
  logs.value = []
  addLog('info', `日志已清空，继续监听${getLogTypeText()}...`)
}

// 导出日志
const exportLogs = () => {
  try {
    // 格式化日志内容
    const logContent = logs.value.map(log => {
      const time = formatTime(log.timestamp || new Date())
      const content = log.msg || log.content || ''
      return `[${time}] ${content}`
    }).join('\n')
    
    // 创建 Blob 对象
    const blob = new Blob([logContent], { type: 'text/plain' })
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${props.software.softServiceName}-${activeLogType.value}-logs-${new Date().toISOString().slice(0, 10)}.txt`
    
    // 触发点击事件
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    
    message.success('日志导出成功')
  } catch (error) {
    console.error('导出日志失败:', error)
    message.error('导出日志失败')
  }
}

// 处理服务操作
const handleCommand = async (command: string) => {
  if (!currentDevice.value) return
  
  try {
    let res: any
    const deviceId = currentDevice.value.id
    
    switch (command) {
      case 'stop':
        res = await fetchSoftServiceStopService({ installId: deviceId } )
        if (res.code === '00000') {
          message.success('停止服务命令已发送')
          activeLogType.value = 'stop'
          subscribeToLogs()
        } else {
          message.error(res.msg || '停止服务失败')
        }
        break
        
      case 'restart':
        res = await fetchSoftServiceRestartService({ installId: deviceId })
        if (res.code === '00000') {
          message.success('重启服务命令已发送')
          activeLogType.value = 'restart'
          subscribeToLogs()
        } else {
          message.error(res.msg || '重启服务失败')
        }
        break
        
      case 'uninstall':
        res = await fetchSoftServiceUninstall({ installId: deviceId })
        if (res.code === '00000') {
          message.success('卸载服务命令已发送')
          activeLogType.value = 'uninstall'
          subscribeToLogs()
        } else {
          message.error(res.msg || '卸载服务失败')
        }
        break
    }
  } catch (error) {
    console.error('服务操作失败:', error)
    message.error('服务操作失败')
  }
}

// 启动服务
const handleStart = async () => {
  if (!currentDevice.value) return
  
  try {
    const res = await fetchSoftServiceStartService({ installId: currentDevice.value.id })
    if (res.code === '00000') {
      message.success('启动服务命令已发送')
      activeLogType.value = 'start'
      subscribeToLogs()
    } else {
      message.error(res.msg || '启动服务失败')
    }
  } catch (error) {
    console.error('启动服务失败:', error)
    message.error('启动服务失败')
  }
}

// 关闭抽屉
const handleClose = () => {
  // 断开 WebSocket 连接
  if (stompClient.value && stompClient.value.connected) {
    try {
      stompClient.value.disconnect()
    } catch (error) {
      console.error('断开WebSocket连接失败:', error)
    }
  }
  
  // 清空日志
  logs.value = []
  
  // 通知父组件
  emit('finish')
}

// 组件挂载时连接 WebSocket
onMounted(() => {
  if (drawerVisible.value) {
    connectWebSocket()
  }
})

// 监听抽屉可见性变化
watch(() => drawerVisible.value, (newValue) => {
  if (newValue) {
    connectWebSocket()
  }
})

// 组件销毁前断开 WebSocket 连接
onBeforeUnmount(() => {
  if (stompClient.value && stompClient.value.connected) {
    try {
      stompClient.value.disconnect()
    } catch (error) {
      console.error('组件销毁时断开WebSocket连接失败:', error)
    }
  }
})
</script>

<style scoped lang="scss">
.install-content {
  height: calc(100% - 60px);
}

.device-menu {
  border-right: none;
}

.log-container {
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  min-height: 200px;
}

.log-item {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

.error {
  color: var(--el-color-danger);
}

.warning {
  color: var(--el-color-warning);
}

.success {
  color: var(--el-color-success);
}
</style> 