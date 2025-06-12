<template>
  <el-drawer
    v-model="drawerVisible"
    :title="'软件安装进度 - ' + props.software.softServiceName"
    size="90%"
    direction="rtl"
    :destroy-on-close="false"
    :before-close="handleClose"
    class="install-progress-drawer"
  >
    <template #header>
      <div class="flex justify-between items-center w-full">
        <div class="flex items-center justify-between">
          <IconifyIconOnline icon="ep:connection" class="mr-2 text-primary text-xl" />
          <span class="text-lg font-medium">软件安装进度 - {{ props.software.softServiceName }}</span>
          <el-tag> {{ isViewMode ? '查看模式' : '安装模式' }}</el-tag>
        </div>
        <el-tag type="info" effect="plain" size="large" class="status-tag">
          <IconifyIconOnline :icon="getStatusIcon(installStatus)" class="mr-1" />
        </el-tag>
      </div>
    </template>
    <el-container class="install-container h-full">
      <!-- 左侧信息和设备列表 -->
      <el-aside width="320px" class="install-left-sidebar">
        <div class="left-sidebar-content">
          <!-- 软件信息部分 -->
          <SoftwareInfo :software="props.software" />
          
          <!-- 设备列表部分 -->
          <DeviceList 
            :device-list="deviceList" 
            :active-device="activeDevice"
            @select-device="handleSelectDevice"
          />
        </div>
      </el-aside>
      
      <!-- 右侧日志和设备卡片 -->
      <el-container class="install-right-content">
        <!-- 右侧上部日志区域 -->
        <el-main class="install-logs" :class="{ 'has-active-device': !!activeDevice && activeDevice !== 'loading' && activeDevice !== 'error' && activeDevice !== 'no-records' }">
          <div class="install-progress-header" v-if="activeDevice && activeDevice !== 'loading' && activeDevice !== 'error' && activeDevice !== 'no-records'">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <el-avatar :size="36" class="mr-3">
                  <IconifyIconOnline icon="ep:monitor" />
                </el-avatar>
                <div>
                  <h3 class="text-lg font-medium mb-0">{{ getCurrentDeviceName() }}</h3>
                  <div class="text-sm text-gray-500">
                    {{ getCurrentDeviceInfo() }}
                  </div>
                </div>
              </div>
              <el-tag :type="getStatusTagType(installStatus)" effect="dark" size="large">
                {{ getInstallStatusText() }}
              </el-tag>
            </div>
          </div>
          <LogSection
            :logs="logs"
            :logs-height="logsHeight"
            :install-status="installStatus"
            :can-view-service-logs="canViewServiceLogs"
            ref="logSectionRef"
            @log-type-change="handleLogTypeChange"
            @clear="clearLogs"
            @export="exportLogs"
          />
        </el-main>
      </el-container>
    </el-container>
  </el-drawer>
   
  <!-- 服务表单对话框 -->
  <ServiceForm
    v-model="serviceFormVisible"
    :service-data="serviceForm"
    :is-edit="isEditService"
    :soft-service-list="softServiceList"
    @submit="submitServiceForm"
    @cancel="serviceFormVisible = false"
  />
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
  fetchSoftServiceLog,
  fetchSoftServiceInstallByServiceId,
  fetchSoftServiceInstallAdd,
  fetchSoftServiceInstallUpdate,
  fetchSoftServiceInstallDelete,
  type SoftServiceInstall
} from '@/api/soft/install'
import { fetchSoftServicePage } from '@/api/soft'
import { fetchSoftServiceInstallLog } from '@/api/soft/log'
import { ElMessageBox } from 'element-plus'
import { 
  ResizeHandle, 
  LogSection, 
  ServiceSection, 
  DeviceList, 
  ServiceForm, 
  SoftwareInfo 
} from './install-progress'

// 扩展SoftServiceInstall接口，添加UI需要的额外字段
//@ts-ignore
interface ExtendedSoftServiceInstall extends Partial<SoftServiceInstall> {
  sshName?: string;
  sshHost?: string;
  sshPort?: string | number;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  software: {
    type: Object as () => PartialSoftService,
    required: true
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
const logSectionRef = ref<any>(null)
const activeInstallId = ref<any>(null)
const activeDevice = ref<string>('')
const installStatus = ref<string>('pending') // pending, running, success, error
const deviceList = ref<any[]>([])
const installId = ref<string>('')
const isViewMode = ref(false) // 是否为查看模式

// 设备服务相关
const deviceServices = ref<ExtendedSoftServiceInstall[]>([])
const serviceFormVisible = ref(false)
const serviceForm = reactive<ExtendedSoftServiceInstall>({
  installId: undefined,
  sshId: '',
  softServiceId: 0,
  installStatus: 0,
  installPath: '',
  installVersion: '',
  installRunStatus: 0,
  sshName: '',
  sshHost: '',
  sshPort: ''
})
const isEditService = ref(false)
const currentServiceId = ref('')
const softServiceList = ref<any[]>([]) // 软件服务列表

// 计算属性: 是否可以查看服务日志
const canViewServiceLogs = computed(() => {
  return activeDevice.value && deviceServices.value.length > 0
})

// 当前选中的设备
const currentDevice = computed(() => {
  return deviceList.value.find(d => d.id === activeDevice.value)
})

// 拖动分隔符相关
const resizing = ref(false)
const startY = ref(0)
const logsHeight = ref('calc(100vh - 450px)')
const minLogHeight = 150
const maxLogHeight = window.innerHeight - 350
const currentLogHeight = ref(window.innerHeight - 450)

// 服务区域切换器
const servicesVisible = ref(false)
const toggleServices = () => {
  servicesVisible.value = !servicesVisible.value
}

// 处理拖动调整大小
const handleResize = (height: number) => {
  logsHeight.value = `${height}px`
  currentLogHeight.value = height
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

// 滚动到日志底部
const scrollToBottom = () => {
  if (logSectionRef.value?.logScrollRef) {
    const scrollbar = logSectionRef.value.logScrollRef
    scrollbar.setScrollTop(scrollbar.wrapRef.scrollHeight)
  }
}

// 加载软件服务列表
const loadSoftServiceList = async () => {
  try {
    const res: any = await fetchSoftServicePage({
      pageNum: 1,
      pageSize: 999
    })
    
    if (res.code === "00000" && res.data && res.data.data) {
      softServiceList.value = res.data.data
    } else {
      softServiceList.value = []
    }
  } catch (error) {
    console.error('加载软件服务列表失败:', error)
    softServiceList.value = []
  }
}

// 加载设备安装日志
const loadDeviceInstallLog = async (deviceId: string) => {
  try {
    // 清空日志
    logs.value = []
    addLog('info', '正在加载安装日志...')
    
    // 检查deviceId是否有效
    if (!deviceId || typeof deviceId !== 'string' || 
        deviceId === 'loading' || deviceId === 'error' || 
        deviceId === 'load-error' || deviceId === 'no-records') {
      addLog('error', '无效的设备ID，无法加载日志')
      return
    }
    
    // 查询设备安装日志
    const res = await fetchSoftServiceLog({ installId: deviceId })
    
    if (res.code === "00000" && res.data) {
      // 处理返回的日志数据
      const logData = res.data
      
      if (Array.isArray(logData) && logData.length > 0) {
        // 转换日志格式
        logs.value = logData.map((log, index) => ({
          id: index + 1,
          type: log.level?.toLowerCase() || 'info',
          msg: log.message || '',
          timestamp: log.createTime ? new Date(log.createTime) : new Date(),
          module: log.module
        }))
      } else {
        addLog('info', '暂无安装日志记录')
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

// 加载设备服务
const loadDeviceServices = async () => {
  if (!activeDevice.value || activeDevice.value === 'loading' || activeDevice.value === 'error' || 
      activeDevice.value === 'load-error' || activeDevice.value === 'no-records') {
    deviceServices.value = []
    return
  }
  
  try {
    deviceServices.value = []
    
    // 查询设备服务，获取所有与当前软件关联的安装记录
    const res = await fetchSoftServiceInstallByServiceId({ 
      softServiceId: props.software.softServiceId!,
      installId: activeDevice.value
    })
    
    if (res.code === "00000" && res.data) {
      // 过滤当前设备的服务
      deviceServices.value = Array.isArray(res.data) 
        ? res.data.filter((service: any) => service.sshId === activeDevice.value || service.installId === activeDevice.value)
        : (res.data ? [res.data] : [])
    } else {
      deviceServices.value = []
    }
  } catch (error) {
    console.error('加载设备服务失败:', error)
    deviceServices.value = []
    message.error('加载设备服务失败')
  }
}

// 格式化时间
const formatTime = (date: Date) => {
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 获取安装记录状态
const getInstallRecordStatus = (status: number | string | undefined) => {
  if (status === undefined) return 'pending'
  
  // 转换为数字
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status
  
  switch (statusNum) {
    case 0: return 'pending' // 未安装
    case 1: return 'running' // 安装中
    case 2: return 'success' // 已安装
    case 3: return 'error'   // 安装失败
    default: return 'pending'
  }
}

// 监听软件信息变化，获取已安装的设备
watch(() => props.software.installedServers, (newInstalledServers) => {
  // 默认为查看模式
  isViewMode.value = true
  
  if (newInstalledServers && newInstalledServers.length > 0) {
    // 如果有已安装的服务器信息，转换为设备列表
    deviceList.value = newInstalledServers.map(server => ({
      id: server.sshId || server.installId,
      name: server.serverName || `设备 ${server.sshId?.substring(0, 8) || '未知'}`,
      status: getInstallRecordStatus(server.installStatus),
      installTime: server.installTime,
      installPath: server.installPath,
      port: server.port,
      softServiceVersion: server.installVersion,
      installId: server.installId
    }))
    
    // 如果有指定的设备ID，则选中该设备
    if ((props.software as any).selectedDeviceId) {
      activeDevice.value = (props.software as any).selectedDeviceId
    } 
    // 否则选择第一个设备
    else if (deviceList.value.length > 0 && !activeDevice.value) {
      activeDevice.value = deviceList.value[0].id
    }
  } else {
    // 如果没有已安装服务器，查询历史安装记录
    loadInstallHistory()
  }
}, { immediate: true })

// 监听 activeDevice 变化
watch(() => activeDevice.value, (newDeviceId) => {
  if (newDeviceId && newDeviceId !== 'loading' && newDeviceId !== 'error' && newDeviceId !== 'no-records') {
    // 加载设备服务
    loadDeviceServices()
  }
})

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
    
    // 订阅软件安装日志
    subscribeToSoftLogs()
  } catch (error) {
    console.error('WebSocket连接异常:', error)
    addLog('error', `WebSocket连接异常: ${error}`)
  }
}

// 订阅软件日志
const subscribeToSoftLogs = () => {
  if (!stompClient.value || !props.software.softServiceId) return
  
  // 先取消之前的订阅
  unsubscribeFromLogs()
  
  // 清空日志
  logs.value = []
  
  // 订阅软件主题
  const topic = `/topic/install/soft`
  
  stompClient.value.on(topic, (message: any) => {
    try {
      const output = JSON.parse(message.data)
      
      // 如果有eventId（installId），检查是否是当前选中的设备
      if (output.eventId && activeInstallId.value && output.eventId !== activeInstallId.value) {
        // 不是当前设备的日志，忽略
        return
      }
      
      // 如果有softServiceId，检查是否是当前软件
      if (output.softServiceId && props.software.softServiceId && 
          output.softServiceId !== props.software.softServiceId) {
        // 不是当前软件的日志，忽略
        return
      }
      
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
      
      // 当收到安装完成的消息时，重新加载设备服务
      if (output.type === 'success' && output.msg && output.msg.includes('安装完成')) {
        nextTick(async () => {
          await loadDeviceServices()
        })
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  })
  
  addLog('info', `正在监听${getLogTypeText()}...`)
}

// 订阅设备日志
const subscribeToDeviceLogs = () => {
  if (!activeDevice.value || !stompClient.value) return
  
  // 先取消之前的订阅
  unsubscribeFromLogs()
  
  // 清空日志
  logs.value = []
  
  // 根据当前日志类型订阅不同的主题
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
      
      // 当收到安装完成的消息时，重新加载设备服务
      if (output.type === 'success' && output.msg && output.msg.includes('安装完成')) {
        nextTick(async () => {
          await loadDeviceServices()
          if (deviceServices.value.length > 0) {
            servicesVisible.value = true
          }
        })
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  })
  
  addLog('info', `正在监听设备 ${activeDevice.value} 的${getLogTypeText()}...`)
  
  // 订阅后也立即加载一次设备服务数据
  loadDeviceServices().then(() => {
    if (deviceServices.value.length > 0) {
      servicesVisible.value = true
    }
  })
}

// 取消订阅
const unsubscribeFromLogs = () => {
  if (!stompClient.value) return
  
  // 取消软件主题订阅
  const softTopic = `/topic/install/soft`
  stompClient.value.off(softTopic)
  
  // 取消设备主题订阅
  if (activeDevice.value) {
    const deviceTopic = `/topic/install/ssh/${activeDevice.value}`
    stompClient.value.off(deviceTopic)
  }
}

// 获取日志类型文本
const getLogTypeText = () => {
  if (!logSectionRef.value) return '日志'
  
  const activeLogType = logSectionRef.value.activeLogType
  switch (activeLogType) {
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
  if (!logSectionRef.value || logSectionRef.value.activeLogType !== 'install') return
  
  const msg = log.msg || ''
  const type = log.type || ''
  
  // 根据日志内容或类型更新安装状态
  if (msg.includes('安装开始') || type === 'start') {
    installStatus.value = 'running'
    updateDeviceStatus(activeDevice.value, 'running')
  } else if (msg.includes('安装成功') || msg.includes('安装完成') || type === 'success') {
    installStatus.value = 'success'
    updateDeviceStatus(activeDevice.value, 'success')
  } else if (msg.includes('安装失败') || msg.includes('错误') || msg.includes('Error') || type === 'error' || type === 'FAILURE') {
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

// 处理日志类型变更
const handleLogTypeChange = () => {
  // 重新订阅日志
  if (activeDevice.value) {
    subscribeToDeviceLogs()
  } else {
    subscribeToSoftLogs()
  }
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
    link.download = `${props.software.softServiceName}-${logSectionRef.value?.activeLogType || 'install'}-logs-${new Date().toISOString().slice(0, 10)}.txt`
    
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

// 加载安装历史记录
const loadInstallHistory = async () => {
  try {
    deviceList.value = [{
      id: 'loading',
      name: '正在加载...',
      status: 'pending',
      progress: 0
    }]
    
    // 加载设备服务
    await loadDeviceServices()
    
    if (deviceServices.value.length > 0) {
      // 如果有设备服务，转换为设备列表
      deviceList.value = deviceServices.value.map(service => ({
        id: service.installId || service.sshId,
        name: service.sshName || `设备 ${service.sshId?.substring(0, 8) || '未知'}`,
        status: getInstallRecordStatus(service.installStatus),
        installTime: service.createTime,
        installPath: service.installPath,
        port: service.sshPort,
        softServiceVersion: service.installVersion,
        installId: service.installId
      }))
      
      // 选择第一个设备
      if (deviceList.value.length > 0) {
        activeDevice.value = deviceList.value[0].id
        
        // 加载该设备的安装日志
        if (typeof activeDevice.value === 'string') {
          const device = deviceList.value[0]
          loadDeviceInstallLog(device.installId || device.id)
        }
      }
    } else {
      deviceList.value = [{
        id: 'no-records',
        name: '暂无安装记录',
        status: 'pending',
        progress: 0
      }]
    }
  } catch (error) {
    console.error('加载安装历史记录失败:', error)
    deviceList.value = [{
      id: 'error',
      name: '加载失败',
      status: 'error',
      progress: 0
    }]
    addLog('error', '加载安装记录失败')
  }
}

// 处理选择设备
const handleSelectDevice = async (deviceId: string, installId?: string) => {
  // 检查deviceId是否有效
  if (!deviceId || deviceId === 'loading' || deviceId === 'error' || 
      deviceId === 'load-error' || deviceId === 'no-records') {
    message.warning('无效的设备ID，无法加载信息')
    return
  }
  
  activeDevice.value = deviceId
  activeInstallId.value = installId
  
  // 无论是查看模式还是安装模式，都订阅日志
  subscribeToDeviceLogs()
  
  // 加载该设备的安装日志
  loadDeviceInstallLog(installId || deviceId)
  
  // 加载设备服务
  await loadDeviceServices()
  // 当选择设备并且有服务数据时自动显示服务区域
  if (deviceServices.value.length > 0) {
    servicesVisible.value = true
  }
}

// 删除服务
const handleDeleteService = async (service: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除服务 "${service.sshName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await fetchSoftServiceInstallDelete({ installId: service.installId })
    
    if (res.code === "00000") {
      message.success('删除服务成功')
      loadDeviceServices()
    } else {
      message.error(res.msg || '删除服务失败')
    }
  } catch (error) {
    console.error('删除服务失败:', error)
    if (error !== 'cancel') {
      message.error('删除服务失败')
    }
  }
}

// 添加服务
const handleAddService = () => {
  isEditService.value = false
  serviceForm.installId = Number(activeDevice.value)
  serviceForm.softServiceId = props.software.softServiceId || 0
  serviceForm.sshName = ''
  serviceForm.sshHost = ''
  serviceForm.sshPort = ''
  serviceForm.installPath = ''
  serviceForm.installVersion = ''
  serviceForm.installRunStatus = 0
  serviceForm.installStatus = 0
  serviceFormVisible.value = true
}

// 编辑服务
const handleEditService = (service: any) => {
  isEditService.value = true
  currentServiceId.value = service.installId
  serviceForm.installId = service.installId
  serviceForm.softServiceId = service.softServiceId
  serviceForm.sshName = service.sshName
  serviceForm.sshHost = service.sshHost
  serviceForm.sshPort = service.sshPort
  serviceForm.installPath = service.installPath
  serviceForm.installVersion = service.installVersion
  serviceForm.installRunStatus = service.installRunStatus
  serviceForm.installStatus = service.installStatus
  serviceFormVisible.value = true
}

// 提交服务表单
const submitServiceForm = async (data: any) => {
  try {
    let res
    if (isEditService.value) {
      res = await fetchSoftServiceInstallUpdate(data)
    } else {
      res = await fetchSoftServiceInstallAdd(data)
    }
    
    if (res.code === "00000") {
      message.success(isEditService.value ? '更新服务成功' : '添加服务成功')
      serviceFormVisible.value = false
      loadDeviceServices()
    } else {
      message.error(res.msg || (isEditService.value ? '更新服务失败' : '添加服务失败'))
    }
  } catch (error) {
    console.error('提交服务表单失败:', error)
    message.error(isEditService.value ? '更新服务失败' : '添加服务失败')
  }
}

// 断开WebSocket连接
const disconnectWebSocket = () => {
  if (stompClient.value) {
    unsubscribeFromLogs()
    stompClient.value.close()
    stompClient.value = null
  }
}

// 组件挂载时加载软件服务列表
onMounted(() => {
  // 无论是安装模式还是查看模式，都连接WebSocket获取日志
  connectWebSocket()
  
  // 加载软件服务列表
  loadSoftServiceList()
  
  // 加载设备服务
  loadDeviceServices()
})

// 组件销毁前断开WebSocket连接和移除事件监听器
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

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return 'ep:loading';
    case 'running': return 'ep:loading';
    case 'success': return 'ep:check';
    case 'error': return 'ep:close';
    default: return 'ep:info';
  }
}

// 获取当前设备名称
const getCurrentDeviceName = () => {
  if (!activeDevice.value) return '未选择设备';
  
  const device = deviceList.value.find(d => d.id === activeDevice.value);
  return device ? device.name : '未知设备';
}

// 获取当前设备信息
const getCurrentDeviceInfo = () => {
  if (!activeDevice.value) return '';
  
  const device = deviceList.value.find(d => d.id === activeDevice.value);
  if (!device) return '';
  
  const parts = [];
  if (device.port) parts.push(`端口: ${device.port}`);
  if (device.softServiceVersion) parts.push(`版本: ${device.softServiceVersion}`);
  if (device.installPath) parts.push(`路径: ${device.installPath}`);
  
  return parts.join(' | ');
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending': return 'info';
    case 'running': return 'warning';
    case 'success': return 'success';
    case 'error': return 'danger';
    default: return 'info';
  }
}

// 获取安装状态文本
const getInstallStatusText = () => {
  switch (installStatus.value) {
    case 'pending': return '等待安装';
    case 'running': return '安装中';
    case 'success': return '安装成功';
    case 'error': return '安装失败';
    default: return '未知状态';
  }
}
</script>

<style lang="scss" scoped>
:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

:deep(.el-drawer__body) {
  padding: 0;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.status-tag {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.install-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

.install-left-sidebar {
  border-right: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 1;
  overflow: hidden;
  
  .left-sidebar-content {
    padding: 8px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.install-right-content {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  flex: 1;
  overflow: hidden;
}

.install-logs {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &.has-active-device {
    padding-top: 0;
  }
}

.install-progress-header {
  background-color: var(--el-bg-color);
  padding: 16px;
  margin: 0 -16px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.device-card-section {
  flex: 1;
  overflow: auto;
  min-height: 300px;
  max-height: 500px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  .icon {
    margin-right: 8px;
    color: var(--el-color-primary);
    font-size: 18px;
  }
}

// 动画效果
.log-item {
  transition: all 0.3s ease;
  
  &.success {
    animation: fadeInSuccess 0.5s forwards;
  }
  
  &.error {
    animation: fadeInError 0.5s forwards;
  }
}

@keyframes fadeInSuccess {
  from {
    background-color: rgba(var(--el-color-success-rgb), 0.1);
  }
  to {
    background-color: transparent;
  }
}

@keyframes fadeInError {
  from {
    background-color: rgba(var(--el-color-danger-rgb), 0.1);
  }
  to {
    background-color: transparent;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .install-container {
    flex-direction: column;
  }
  
  .install-left-sidebar {
    width: 100% !important;
    max-height: 300px;
  }
}
</style>
