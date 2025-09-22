import { ref, reactive } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { io, Socket } from 'socket.io-client'

// Socket.IO连接状态
export const socketState = reactive({
  connected: false,
  connecting: false,
  error: null as string | null,
  reconnectAttempts: 0
})

// 进度追踪
export const progressState = reactive({
  activeOperations: new Map<string, OperationProgress>(),
  notifications: [] as ProgressNotification[]
})

// 类型定义
export interface OperationProgress {
  id: string
  type: 'pull_image' | 'start_container' | 'install_software' | 'sync_software'
  title: string
  status: 'pending' | 'running' | 'success' | 'error'
  progress: number
  message: string
  startTime: Date
  endTime?: Date
  data?: any
}

export interface ProgressNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  duration?: number
}

// Socket.IO实例
let socket: Socket | null = null

// 事件监听器
const eventListeners = new Map<string, Set<Function>>()

/**
 * 连接到Socket.IO服务器
 */
export const connectSocket = () => {
  if (socket?.connected) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    try {
      socketState.connecting = true
      socketState.error = null

      // 获取Socket.IO服务器地址（从环境变量或配置文件）
      const serverUrl = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.host}`
      
      socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false
      })

      // 连接成功
      socket.on('connect', () => {
        socketState.connected = true
        socketState.connecting = false
        socketState.reconnectAttempts = 0
        console.log('Socket.IO 连接成功')
        resolve()
      })

      // 连接失败
      socket.on('connect_error', (error) => {
        socketState.connecting = false
        socketState.error = error.message
        socketState.reconnectAttempts++
        console.error('Socket.IO 连接失败:', error)
        reject(error)
      })

      // 断开连接
      socket.on('disconnect', (reason) => {
        socketState.connected = false
        console.warn('Socket.IO 连接断开:', reason)
        
        if (reason === 'io server disconnect') {
          // 服务器主动断开，需要重新连接
          setTimeout(() => {
            socket?.connect()
          }, 2000)
        }
      })

      // 重连
      socket.on('reconnect', (attemptNumber) => {
        socketState.connected = true
        socketState.reconnectAttempts = 0
        console.log(`Socket.IO 重连成功，尝试次数: ${attemptNumber}`)
      })

      // 监听进度更新
      socket.on('operation_progress', handleOperationProgress)
      socket.on('operation_complete', handleOperationComplete)
      socket.on('operation_error', handleOperationError)

      // 监听Docker事件
      socket.on('docker_image_pull_progress', handleImagePullProgress)
      socket.on('docker_container_status', handleContainerStatus)
      socket.on('software_sync_progress', handleSoftwareSyncProgress)

      // 开始连接
      socket.connect()

    } catch (error) {
      socketState.connecting = false
      socketState.error = error.message
      reject(error)
    }
  })
}

/**
 * 断开Socket.IO连接
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    socketState.connected = false
    socketState.connecting = false
    progressState.activeOperations.clear()
  }
}

/**
 * 处理操作进度更新
 */
const handleOperationProgress = (data: {
  operationId: string
  type: string
  title: string
  progress: number
  message: string
  status?: string
}) => {
  const operation: OperationProgress = {
    id: data.operationId,
    type: data.type as any,
    title: data.title,
    status: (data.status as any) || 'running',
    progress: data.progress,
    message: data.message,
    startTime: progressState.activeOperations.get(data.operationId)?.startTime || new Date()
  }

  progressState.activeOperations.set(data.operationId, operation)
  
  // 触发事件监听器
  emitEvent('progress_update', operation)
}

/**
 * 处理操作完成
 */
const handleOperationComplete = (data: {
  operationId: string
  result?: any
  message?: string
}) => {
  const operation = progressState.activeOperations.get(data.operationId)
  if (operation) {
    operation.status = 'success'
    operation.progress = 100
    operation.endTime = new Date()
    operation.message = data.message || '操作完成'
    operation.data = data.result

    // 显示成功通知
    addNotification({
      type: 'success',
      title: operation.title,
      message: operation.message,
      duration: 3000
    })

    // 延迟移除操作记录
    setTimeout(() => {
      progressState.activeOperations.delete(data.operationId)
    }, 5000)

    // 触发事件监听器
    emitEvent('operation_complete', operation)
  }
}

/**
 * 处理操作错误
 */
const handleOperationError = (data: {
  operationId: string
  error: string
  details?: any
}) => {
  const operation = progressState.activeOperations.get(data.operationId)
  if (operation) {
    operation.status = 'error'
    operation.endTime = new Date()
    operation.message = data.error
    operation.data = data.details

    // 显示错误通知
    addNotification({
      type: 'error',
      title: operation.title,
      message: data.error,
      duration: 5000
    })

    // 延迟移除操作记录
    setTimeout(() => {
      progressState.activeOperations.delete(data.operationId)
    }, 10000)

    // 触发事件监听器
    emitEvent('operation_error', operation)
  }
}

/**
 * 处理镜像拉取进度
 */
const handleImagePullProgress = (data: {
  imageId: string
  imageName: string
  progress: number
  status: string
  message: string
}) => {
  const operationId = `pull_image_${data.imageId}`
  handleOperationProgress({
    operationId,
    type: 'pull_image',
    title: `拉取镜像: ${data.imageName}`,
    progress: data.progress,
    message: data.message,
    status: data.status === 'complete' ? 'success' : 'running'
  })
}

/**
 * 处理容器状态变化
 */
const handleContainerStatus = (data: {
  containerId: string
  containerName: string
  status: string
  message?: string
}) => {
  // 触发容器状态更新事件
  emitEvent('container_status_change', data)
  
  // 如果是重要状态变化，显示通知
  if (['started', 'stopped', 'error'].includes(data.status)) {
    const typeMap = {
      started: 'success' as const,
      stopped: 'warning' as const,
      error: 'error' as const
    }
    
    addNotification({
      type: typeMap[data.status] || 'info',
      title: `容器 ${data.containerName}`,
      message: data.message || `状态已变更为: ${data.status}`,
      duration: 3000
    })
  }
}

/**
 * 处理软件同步进度
 */
const handleSoftwareSyncProgress = (data: {
  syncId: string
  totalCount: number
  currentCount: number
  currentSoftware: string
  message: string
}) => {
  const operationId = `sync_software_${data.syncId}`
  const progress = data.totalCount > 0 ? (data.currentCount / data.totalCount) * 100 : 0
  
  handleOperationProgress({
    operationId,
    type: 'sync_software',
    title: '同步软件信息',
    progress,
    message: `${data.message} (${data.currentCount}/${data.totalCount})`
  })
}

/**
 * 添加通知
 */
const addNotification = (notification: Omit<ProgressNotification, 'id' | 'timestamp'>) => {
  const id = Date.now().toString()
  const fullNotification: ProgressNotification = {
    ...notification,
    id,
    timestamp: new Date()
  }
  
  progressState.notifications.unshift(fullNotification)
  
  // 限制通知数量
  if (progressState.notifications.length > 50) {
    progressState.notifications = progressState.notifications.slice(0, 50)
  }
  
  // 显示Element Plus通知
  const notifyOptions = {
    title: fullNotification.title,
    message: fullNotification.message,
    type: fullNotification.type,
    duration: fullNotification.duration || 4500,
    position: 'top-right' as const
  }
  
  ElNotification(notifyOptions)
}

/**
 * 订阅事件
 */
export const addEventListener = (event: string, callback: Function) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set())
  }
  eventListeners.get(event)!.add(callback)
  
  return () => {
    eventListeners.get(event)?.delete(callback)
  }
}

/**
 * 触发事件
 */
const emitEvent = (event: string, data: any) => {
  const listeners = eventListeners.get(event)
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`事件监听器错误 (${event}):`, error)
      }
    })
  }
}

/**
 * 发送消息到服务器
 */
export const sendMessage = (event: string, data: any) => {
  if (socket?.connected) {
    socket.emit(event, data)
  } else {
    ElMessage.warning('Socket连接未建立，无法发送消息')
  }
}

/**
 * 订阅特定操作的进度
 */
export const subscribeOperation = (operationId: string, callback: (operation: OperationProgress) => void) => {
  return addEventListener('progress_update', (operation: OperationProgress) => {
    if (operation.id === operationId) {
      callback(operation)
    }
  })
}

/**
 * 订阅容器状态变化
 */
export const subscribeContainerStatus = (callback: (data: any) => void) => {
  return addEventListener('container_status_change', callback)
}

/**
 * 开始监听操作
 */
export const startOperation = (operation: Omit<OperationProgress, 'startTime' | 'progress' | 'status'>) => {
  const fullOperation: OperationProgress = {
    ...operation,
    startTime: new Date(),
    progress: 0,
    status: 'pending'
  }
  
  progressState.activeOperations.set(operation.id, fullOperation)
  return fullOperation
}

/**
 * 清除通知
 */
export const clearNotifications = () => {
  progressState.notifications.length = 0
}

/**
 * 获取活跃操作列表
 */
export const getActiveOperations = () => {
  return Array.from(progressState.activeOperations.values())
}

/**
 * 获取通知列表
 */
export const getNotifications = () => {
  return progressState.notifications
}

// 自动连接（如果需要）
let autoConnectEnabled = false

export const enableAutoConnect = () => {
  if (!autoConnectEnabled) {
    autoConnectEnabled = true
    
    // 页面可见时自动连接
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !socketState.connected && !socketState.connecting) {
        connectSocket().catch(console.error)
      }
    })
    
    // 网络恢复时自动连接
    window.addEventListener('online', () => {
      if (!socketState.connected && !socketState.connecting) {
        connectSocket().catch(console.error)
      }
    })
  }
}

// 页面关闭时断开连接
window.addEventListener('beforeunload', () => {
  disconnectSocket()
})