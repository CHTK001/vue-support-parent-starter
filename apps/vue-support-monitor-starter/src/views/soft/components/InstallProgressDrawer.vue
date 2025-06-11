<template>
  <el-drawer
    v-model="drawerVisible"
    title="软件详情"
    size="90%"
    :close-on-click-modal="false"
    @close="handleClose"
    class="install-progress-drawer"
    :show-close="false"
  >
    <template #header>
      <div class="drawer-header">
        <div class="software-info flex items-center gap-3">
          <el-avatar :size="46" v-if="software.softServiceLogo" :src="software.softServiceLogo" class="software-logo">
            <IconifyIconOnline icon="ep:picture" />
          </el-avatar>
          <div>
            <div class="text-lg font-medium">{{ software.softServiceName }}</div>
            <div class="text-sm text-gray-500">版本: {{ software.softServiceVersion }}</div>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ software.installCount || 0 }}</div>
              <div class="stat-label">
                <IconifyIconOnline icon="ep:download" class="mr-1" />
                安装次数
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ software.favoriteCount || 0 }}</div>
              <div class="stat-label">
                <IconifyIconOnline icon="ep:star" class="mr-1" />
                收藏数
              </div>
            </div>
          </div>
          <div>
             <h4 class="detail-subtitle">软件描述</h4>
              <p class="detail-text">{{ software.softServiceRemark || '暂无描述' }}</p>
          </div>
        </div>
        <div class="action-buttons flex gap-2">
          <el-button type="primary" @click="handleRefresh" plain size="small">
            <IconifyIconOnline icon="ep:refresh" class="mr-1" />
            刷新
          </el-button>
          <template v-if="installStatus === 'success'">
            <el-dropdown split-button type="success" size="small" @click="handleStart" @command="handleCommand">
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
                  <el-dropdown-item command="uninstall" divided>
                    <IconifyIconOnline icon="ep:delete" class="mr-1" />
                    卸载服务
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <el-button type="default" plain size="small" @click="handleClose">
            <IconifyIconOnline icon="ep:close" class="mr-1" />
            关闭
          </el-button>
        </div>
      </div>
    </template>
    
    <el-container class="install-content h-full">
      <!-- 左侧设备列表和软件详情 -->
      <el-aside width="300px" class="border-r">
        <!-- 软件详情部分 -->
        <div class="software-detail-section p-4">
          <div class="section-title mb-4">
            <IconifyIconOnline icon="ep:info-filled" class="mr-2" />
            软件信息
          </div>
          
          <el-scrollbar height="200px">
            <div class="detail-content px-2">
              <h4 class="detail-subtitle">安装信息</h4>
              <div class="detail-info-item">
                <IconifyIconOnline icon="ep:folder" class="mr-2" />
                <span class="detail-info-label">安装路径:</span>
                <span class="detail-info-value">{{ software.installPath || "默认路径" }}</span>
              </div>
              <div class="detail-info-item">
                <IconifyIconOnline icon="ep:connection" class="mr-2" />
                <span class="detail-info-label">端口:</span>
                <span class="detail-info-value">{{ software.port || "自动分配" }}</span>
              </div>

              <h4 class="detail-subtitle">系统要求</h4>
              <div class="requirements-card">
                <p>{{ software.requirements || "无特殊要求" }}</p>
              </div>
              
            </div>
          </el-scrollbar>
        </div>
        
        <!-- 设备列表部分 -->
        <div class="device-list p-4 border-t">
          <div class="section-title mb-4">
            <IconifyIconOnline icon="ep:monitor" class="mr-2" />
            安装设备
            <span class="device-count">{{ deviceList.length }}</span>
          </div>
          
          <el-scrollbar height="calc(100vh - 550px)">
            <el-menu
              :default-active="activeDevice"
              @select="handleSelectDevice"
              class="device-menu"
            >
              <el-menu-item v-for="device in deviceList" :key="device.id" :index="device.id">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center">
                    <el-badge :type="getStatusType(device.status)"  :value="getStatusText(device.status)" class="mr-2" />
                    {{ device.name }}
                  </div>
                  <div v-if="device.progress !== undefined && device.status === 'running'" class="device-progress">
                    <span class="text-xs text-gray-500 mr-1">{{ device.progress }}%</span>
                    <el-progress 
                      :percentage="device.progress || 0" 
                      :show-text="false"
                      :stroke-width="4"
                      :width="40"
                      type="circle"
                    />
                  </div>
                </div>
              </el-menu-item>
            </el-menu>
          </el-scrollbar>
        </div>
      </el-aside>
      
      <!-- 右侧日志 -->
      <el-main class="install-logs">
        <div class="logs-header pb-2 mb-3">
          <div class="section-title flex items-center justify-between">
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
        
        <el-scrollbar height="calc(100vh - 250px)" ref="logScrollRef" class="log-scrollbar">
          <div class="log-container p-3 font-mono text-sm">
            <div v-if="logs.length === 0" class="empty-logs">
              <el-empty description="暂无日志记录" :image-size="100">
                <template #description>
                  <p>暂无日志记录，请等待安装过程...</p>
                </template>
              </el-empty>
            </div>
            <div v-for="log in logs" :key="log.id" :class="['log-item py-1', log.type]">
              <span class="log-time text-gray-500 mr-2">{{ formatTime(log.timestamp || new Date()) }}</span>
              <span :class="getLogClass(log.type)">{{ log.msg }}</span>
              <div v-if="log.step !== undefined && log.total !== undefined && log.total > 0" class="log-progress mt-1">
                <el-progress 
                  :percentage="Math.round((log.step / log.total) * 100)" 
                  :status="getProgressStatus(log.type)"
                  :stroke-width="8"
                  size="small"
                >
                  <span class="text-xs">{{ log.step }}/{{ log.total }}</span>
                </el-progress>
              </div>
            </div>
          </div>
        </el-scrollbar>
        
        <div class="log-footer mt-4 flex justify-between items-center">
          <div class="status-info flex items-center">
            <el-tag :type="getStatusTagType(installStatus)" size="small" effect="dark">
              <IconifyIconOnline :icon="getStatusIcon(installStatus)" class="mr-1" />
              {{ getInstallStatusText() }}
            </el-tag>
          </div>
          <div class="action-buttons">
            <el-button size="small" @click="clearLogs" plain>
              <IconifyIconOnline icon="ep:delete" class="mr-1" />
              清空日志
            </el-button>
            <el-button size="small" type="primary" @click="exportLogs" plain>
              <IconifyIconOnline icon="ep:download" class="mr-1" />
              导出日志
            </el-button>
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
import { http, type ReturnResult } from "@repo/utils"
import type { PartialSoftService } from '@/api/soft'
import { 
  fetchSoftServiceStartService, 
  fetchSoftServiceStopService,
  fetchSoftServiceRestartService,
  fetchSoftServiceUninstall,
  fetchSoftServiceLog
} from '@/api/soft/install'
import { fetchSoftServiceInstallLog } from '@/api/soft/log'

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
const isViewMode = ref(false) // 是否为查看模式

// 计算属性
const canViewServiceLogs = computed(() => {
  return installStatus.value === 'success'
})

// 判断是否有已安装的服务器
const hasInstalledServers = computed(() => {
  return props.software.installedServers && props.software.installedServers.length > 0
})

// 当前设备对象
const currentDevice = computed(() => {
  return deviceList.value.find(d => d.id === activeDevice.value) || null
})

// 设置设备列表
const setupDeviceList = (deviceIds: string[]) => {
  deviceList.value = deviceIds.map(id => ({
    id,
    name: `设备 ${id.substring(0, 8)}`,
    status: 'pending',
    progress: 0
  }))
  
  if (deviceList.value.length > 0 && !activeDevice.value) {
    activeDevice.value = deviceList.value[0].id
  }
}

// 获取安装记录状态
const getInstallRecordStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'success':
      return 'success'
    case 'failed':
    case 'failure':
      return 'error'
    case 'running':
      return 'running'
    default:
      return 'pending'
  }
}

// 加载安装历史记录
const loadInstallHistory = async () => {
  try {
    // 显示加载中状态
    deviceList.value = [{
      id: 'loading',
      name: '加载中...',
      status: 'pending',
      progress: 0
    }]
    
    // 查询该软件的所有安装记录
    const res = await fetchSoftwareInstallHistory(props.software.softServiceId!)
    
    if (res.code === "00000" && res.data) {
      // 处理返回的安装记录数据
      let records: any[] = []
      
      if (Array.isArray(res.data)) {
        records = res.data
      } else if (res.data) {
        records = [res.data]
      }
      
      if (records.length > 0) {
        // 转换为设备列表格式
        deviceList.value = []
        for (const record of records) {
          deviceList.value.push({
            id: record.sshId || record.installId,
            name: record.sshName || `设备 ${record.sshId?.substring(0, 8) || '未知'}`,
            status: getInstallRecordStatus(record.status),
            installTime: record.createTime,
            installPath: record.installPath,
            port: record.port,
            softServiceVersion: record.softServiceVersion
          })
        }
        
        // 选择第一个设备
        if (deviceList.value.length > 0 && !activeDevice.value) {
          activeDevice.value = deviceList.value[0].id
          // 加载该设备的安装日志
          loadDeviceInstallLog(activeDevice.value)
        }
      } else {
        // 没有安装记录
        deviceList.value = [{
          id: 'no-records',
          name: '暂无安装记录',
          status: 'pending',
          progress: 0
        }]
        addLog('info', '该软件暂无安装记录')
      }
    } else {
      // 加载失败
      deviceList.value = [{
        id: 'error',
        name: '加载失败',
        status: 'error',
        progress: 0
      }]
      addLog('error', res.msg || '加载安装记录失败')
    }
  } catch (error) {
    console.error('加载安装记录失败:', error)
    deviceList.value = [{
      id: 'error',
      name: '加载失败',
      status: 'error',
      progress: 0
    }]
    addLog('error', '加载安装记录失败')
  }
}

// 加载设备安装日志
const loadDeviceInstallLog = async (deviceId: string) => {
  try {
    // 清空日志
    logs.value = []
    addLog('info', '正在加载安装日志...')
    
    // 查询设备安装日志
    const res = await fetchSoftServiceLog({ installId: deviceId })
    
    if (res.code === "00000" && res.data) {
      // 处理返回的日志数据
      const logData = res.data
      
      if (typeof logData === 'string') {
        // 如果是字符串，按行分割
        const logLines = logData.split('\n')
        logLines.forEach((line, index) => {
          if (line.trim()) {
            logs.value.push({
              id: index,
              msg: line,
              type: line.toLowerCase().includes('error') ? 'error' : 
                   line.toLowerCase().includes('warn') ? 'warning' : 
                   line.toLowerCase().includes('success') ? 'success' : 'info',
              timestamp: new Date()
            })
          }
        })
      } else if (Array.isArray(logData)) {
        // 如果是数组，直接使用
        //@ts-ignore
        logs.value = logData.map((log: any, index: number) => ({
          id: index,
          msg: log.msg || log.content || JSON.stringify(log),
          type: log.type || 'info',
          timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
          step: log.step,
          total: log.total
        }))
      }
      
      // 如果没有日志
      if (logs.value.length === 0) {
        addLog('info', '暂无安装日志')
      }
      
      // 自动滚动到底部
      nextTick(() => {
        scrollToBottom()
      })
    } else {
      addLog('error', res.msg || '加载安装日志失败')
    }
  } catch (error) {
    console.error('加载安装日志失败:', error)
    addLog('error', '加载安装日志失败')
  }
}

// 监听 devices 变化
watch(() => props.devices, (newDevices) => {
  // 如果devices数组为空，则为查看历史安装记录模式
  isViewMode.value = newDevices.length === 0
  
  if (isViewMode.value) {
    // 查询该软件的所有安装记录
    loadInstallHistory()
  } else {
    // 正常安装模式
    setupDeviceList(newDevices)
  }
}, { immediate: true })

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
  const topic = `/topic/install/ssh/${activeDevice.value}`
  
  stompClient.value.on(topic, (message: any) => {
    try {
      const output = JSON.parse(message.data)
      // 处理后端推送的消息格式
      logs.value.push({
        id: logs.value.length + 1,
        msg: output.msg,
        type: output.type || 'info',
        timestamp: output.timestamp ? new Date(output.timestamp) : new Date(),
        step: output.step,
        total: output.total,
        module: output.module,
        eventId: output.eventId
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
  
  // 实现取消订阅的逻辑
  if (activeDevice.value) {
    const topic = `/topic/install/ssh/${activeDevice.value}`
    stompClient.value.off(topic)
  }
}

// 根据日志类型获取主题后缀
const getTopicSuffix = () => {
  switch (activeLogType.value) {
    case 'install': return 'install'
    case 'start': return 'start'
    case 'stop': return 'stop'
    case 'restart': return 'restart'
    case 'uninstall': return 'uninstall'
    case 'monitor': return 'monitor'
    default: return 'install'
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
  
  const msg = log.msg || ''
  const type = log.type || ''
  
  // 根据日志内容或类型更新安装状态
  if (msg.includes('安装开始') || type === 'start') {
    installStatus.value = 'running'
    updateDeviceStatus(activeDevice.value, 'running')
  } else if (msg.includes('安装成功') || msg.includes('安装完成') || type === 'success') {
    installStatus.value = 'success'
    updateDeviceStatus(activeDevice.value, 'success')
  } else if (msg.includes('安装失败') || msg.includes('错误') || msg.includes('Error') || type === 'error') {
    installStatus.value = 'error'
    updateDeviceStatus(activeDevice.value, 'error')
  }
  
  // 如果有进度信息，更新进度
  if (log.step !== undefined && log.total !== undefined && log.total > 0) {
    const progress = Math.round((log.step / log.total) * 100)
    updateInstallProgress(activeDevice.value, progress)
  }
}

// 更新设备状态
const updateDeviceStatus = (deviceId: string, status: string) => {
  const device = deviceList.value.find(d => d.id === deviceId)
  if (device) {
    device.status = status
  }
}

// 更新安装进度
const updateInstallProgress = (deviceId: string, progress: number) => {
  const device = deviceList.value.find(d => d.id === deviceId)
  if (device) {
    device.progress = progress
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

// 获取运行状态类型
const getRunStatusType = (status: number) => {
  switch (status) {
    case 0: return 'info'    // 未运行
    case 1: return 'success' // 运行中
    case 2: return 'danger'  // 已停止
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

// 获取进度条状态
const getProgressStatus = (type: string) => {
  switch (type) {
    case 'success': return 'success'
    case 'error': return 'exception'
    case 'warning': return 'warning'
    default: return ''
  }
}

// 添加日志
const addLog = (type: string, content: string) => {
  logs.value.push({
    id: logs.value.length + 1,
    type,
    msg: content,
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
  
  if (isViewMode.value) {
    // 查看模式下，加载设备安装日志
    loadDeviceInstallLog(deviceId)
  } else {
    // 安装模式下，订阅日志
    subscribeToLogs()
  }
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
      const content = log.msg || ''
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

// 初始化
onMounted(() => {
  // 只有在安装模式下才连接WebSocket
  if (!isViewMode.value) {
    connectWebSocket()
  }
})

// 组件销毁前断开WebSocket连接
onBeforeUnmount(() => {
  disconnectWebSocket()
})

// 处理关闭
const handleClose = () => {
  // 断开WebSocket连接
  disconnectWebSocket()
  
  // 关闭抽屉
  drawerVisible.value = false
  
  // 发送完成事件
  emit('finish')
}

// 断开WebSocket连接
const disconnectWebSocket = () => {
  if (stompClient.value) {
    try {
      // 取消所有订阅
      unsubscribeFromLogs()
      
      // 断开连接
      if (stompClient.value.connected) {
        stompClient.value.disconnect()
      }
      stompClient.value = null
    } catch (error) {
      console.error('断开WebSocket连接失败:', error)
    }
  }
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return 'ep:loading'
    case 'running': return 'ep:loading'
    case 'success': return 'ep:check'
    case 'error': return 'ep:close'
    default: return 'ep:info-filled'
  }
}

// 查询软件安装历史记录
const fetchSoftwareInstallHistory = (softServiceId: number) => {
  return http.request<ReturnResult<any[]>>("get", `/v1/soft/service/install/history/${softServiceId}`)
}

// 获取分类名称
const getCategoryName = (category: string) => {
  if (!category) return "未分类"
  
  const categories = [
    { label: "全部", value: "all" },
    { label: "数据库", value: "database" },
    { label: "Web服务器", value: "web_server" },
    { label: "开发工具", value: "development" },
    { label: "监控工具", value: "monitoring" },
    { label: "容器", value: "container" },
    { label: "其他", value: "other" }
  ]
  
  const found = categories.find((item) => item.value === category)
  return found ? found.label : "未知"
}

// 查看服务器详情
const viewServerDetail = (server: any) => {
  // 设置当前设备
  if (server && server.sshId) {
    activeDevice.value = server.sshId
    // 加载该设备的安装日志
    loadDeviceInstallLog(server.sshId)
  }
}
</script>

<style scoped lang="scss">
.install-progress-drawer {
  :deep(.el-drawer__header) {
    margin: 0;
    padding: 0;
  }
  
  :deep(.el-drawer__body) {
    padding: 0;
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(to right, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
  border-bottom: 1px solid var(--el-border-color-light);
  
  .software-logo {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 2px solid #fff;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  
  .device-count {
    margin-left: 8px;
    background-color: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
    border-radius: 10px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: normal;
  }
}

.install-content {
  height: 100%;
}

// 软件详情样式
.software-detail-section {
  border-bottom: 1px solid var(--el-border-color-light);
}

.detail-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 16px 0 8px 0;
  position: relative;
  padding-left: 10px;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    height: 14px;
    width: 3px;
    background-color: var(--el-color-primary);
    border-radius: 2px;
  }
  
  &:first-child {
    margin-top: 0;
  }
}

.detail-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  margin-bottom: 12px;
}

.detail-info-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  
  .detail-info-label {
    margin-right: 8px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
  
  .detail-info-value {
    color: var(--el-text-color-primary);
  }
}

.requirements-card {
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  
  p {
    margin: 0;
    color: var(--el-text-color-regular);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  
  .stat-card {
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 12px;
    text-align: center;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-color-primary);
      margin-bottom: 6px;
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.installed-servers {
  margin-bottom: 12px;
  
  :deep(.el-table) {
    --el-table-header-bg-color: var(--el-fill-color-light);
    --el-table-border-color: var(--el-border-color-lighter);
    --el-table-header-text-color: var(--el-text-color-primary);
    
    .el-table__header th {
      font-weight: 600;
      font-size: 12px;
      padding: 8px 0;
    }
    
    .el-table__row td {
      padding: 6px 0;
      font-size: 12px;
    }
  }
}

.device-menu {
  border-right: none;
  
  .el-menu-item {
    height: auto;
    padding: 12px 16px;
    line-height: 1.5;
    border-radius: 6px;
    margin-bottom: 4px;
    
    &.is-active {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 500;
    }
    
    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
}

.device-progress {
  display: flex;
  align-items: center;
}

.logs-header {
  border-bottom: 1px solid var(--el-border-color-light);
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
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--el-fill-color-light);
  }
  
  .log-time {
    display: inline-block;
    min-width: 80px;
    font-family: monospace;
  }
  
  .log-progress {
    margin-left: 80px;
    max-width: 300px;
  }
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

.log-footer {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}

.install-logs {
  display: flex;
  flex-direction: column;
}
</style> 