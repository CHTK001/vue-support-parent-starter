import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import {
  serverFileUploadWS,
  MessageType,
  type UploadProgressData,
  type WebSocketMessage
} from '@/utils/websocket/server-file-upload';
import {
  getServerFileUploadTaskPage,
  getTaskQueueStatus,
  type ServerFileUploadTask,
  TASK_STATUS
} from '@/api/server-file-upload';

// 上传任务进度状态
interface TaskProgress {
  taskId: number;
  progress: number;
  speed: number;
  transferredBytes: number;
  totalBytes: number;
  remainingTime?: number;
  status: string;
  lastUpdate: number;
}

// 队列状态
interface QueueStatus {
  queueLength: number;
  avgWaitTime: number;
  avgProcessTime: number;
  throughput: number;
}

/**
 * 服务器文件上传组合式函数
 */
export function useServerFileUpload() {
  // 响应式状态
  const isConnected = ref(false);
  const connectionStatus = ref('DISCONNECTED');
  const taskProgresses = reactive<Map<number, TaskProgress>>(new Map());
  const queueStatus = reactive<QueueStatus>({
    queueLength: 0,
    avgWaitTime: 0,
    avgProcessTime: 0,
    throughput: 0
  });

  // 统计信息
  const statistics = reactive({
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalTransferred: 0,
    avgSpeed: 0
  });

  // 计算属性
  const activeTaskCount = computed(() => {
    return Array.from(taskProgresses.values()).filter(
      task => task.status === TASK_STATUS.PROCESSING
    ).length;
  });

  const totalProgress = computed(() => {
    const activeTasks = Array.from(taskProgresses.values()).filter(
      task => task.status === TASK_STATUS.PROCESSING
    );
    
    if (activeTasks.length === 0) return 0;
    
    const totalProgress = activeTasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / activeTasks.length);
  });

  const totalSpeed = computed(() => {
    const activeTasks = Array.from(taskProgresses.values()).filter(
      task => task.status === TASK_STATUS.PROCESSING
    );
    
    return activeTasks.reduce((sum, task) => sum + task.speed, 0);
  });

  // WebSocket事件处理器
  const handleUploadProgress = (data: UploadProgressData) => {
    const progress: TaskProgress = {
      taskId: data.taskId,
      progress: data.progress,
      speed: data.speed,
      transferredBytes: data.transferredBytes,
      totalBytes: data.totalBytes,
      remainingTime: data.remainingTime,
      status: data.status,
      lastUpdate: Date.now()
    };
    
    taskProgresses.set(data.taskId, progress);
    
    // 更新统计信息
    updateStatistics();
  };

  const handleUploadStatusChange = (data: any) => {
    const { taskId, oldStatus, newStatus, statusInfo } = data;
    
    // 更新任务进度状态
    const progress = taskProgresses.get(taskId);
    if (progress) {
      progress.status = newStatus;
      progress.lastUpdate = Date.now();
    }
    
    // 显示状态变更通知
    showStatusChangeNotification(taskId, oldStatus, newStatus, statusInfo);
    
    // 更新统计信息
    updateStatistics();
  };

  const handleUploadStarted = (data: any) => {
    const { taskId, taskInfo } = data;
    
    ElNotification({
      title: '上传开始',
      message: `任务 "${taskInfo.taskName}" 开始上传`,
      type: 'info',
      duration: 3000
    });
    
    // 自动订阅任务进度
    subscribeTaskProgress(taskId);
  };

  const handleUploadCompleted = (data: any) => {
    const { taskId, resultInfo } = data;
    
    // 更新任务进度为100%
    const progress = taskProgresses.get(taskId);
    if (progress) {
      progress.progress = 100;
      progress.status = TASK_STATUS.COMPLETED;
      progress.lastUpdate = Date.now();
    }
    
    ElNotification({
      title: '上传完成',
      message: `任务 "${resultInfo.taskName}" 上传成功`,
      type: 'success',
      duration: 5000
    });
    
    // 取消订阅任务进度
    setTimeout(() => {
      unsubscribeTaskProgress(taskId);
    }, 5000);
    
    updateStatistics();
  };

  const handleUploadFailed = (data: any) => {
    const { taskId, errorInfo } = data;
    
    // 更新任务状态
    const progress = taskProgresses.get(taskId);
    if (progress) {
      progress.status = TASK_STATUS.FAILED;
      progress.lastUpdate = Date.now();
    }
    
    ElNotification({
      title: '上传失败',
      message: `任务 "${errorInfo.taskName}" 上传失败: ${errorInfo.errorMessage}`,
      type: 'error',
      duration: 0 // 不自动关闭
    });
    
    updateStatistics();
  };

  const handleUploadCancelled = (data: any) => {
    const { taskId, cancelInfo } = data;
    
    // 更新任务状态
    const progress = taskProgresses.get(taskId);
    if (progress) {
      progress.status = TASK_STATUS.CANCELLED;
      progress.lastUpdate = Date.now();
    }
    
    ElMessage.info(`任务 "${cancelInfo.taskName}" 已取消`);
    
    // 取消订阅任务进度
    unsubscribeTaskProgress(taskId);
    
    updateStatistics();
  };

  const handleQueueStatus = (data: QueueStatus) => {
    Object.assign(queueStatus, data);
  };

  const handleSystemAlert = (data: any) => {
    ElNotification({
      title: '系统告警',
      message: data.message,
      type: data.level === 'ERROR' ? 'error' : 'warning',
      duration: 0
    });
  };

  const handleErrorNotification = (data: any) => {
    ElNotification({
      title: '错误通知',
      message: data.message,
      type: 'error',
      duration: 0
    });
  };

  // 显示状态变更通知
  const showStatusChangeNotification = (taskId: number, oldStatus: string, newStatus: string, statusInfo: any) => {
    const statusMap = {
      [TASK_STATUS.PENDING]: '待处理',
      [TASK_STATUS.PROCESSING]: '处理中',
      [TASK_STATUS.COMPLETED]: '已完成',
      [TASK_STATUS.FAILED]: '失败',
      [TASK_STATUS.CANCELLED]: '已取消'
    };
    
    const oldStatusText = statusMap[oldStatus] || oldStatus;
    const newStatusText = statusMap[newStatus] || newStatus;
    
    if (newStatus === TASK_STATUS.PROCESSING) {
      ElMessage.info(`任务 ${taskId} 状态变更: ${oldStatusText} → ${newStatusText}`);
    }
  };

  // 更新统计信息
  const updateStatistics = () => {
    const tasks = Array.from(taskProgresses.values());
    
    statistics.totalTasks = tasks.length;
    statistics.activeTasks = tasks.filter(task => task.status === TASK_STATUS.PROCESSING).length;
    statistics.completedTasks = tasks.filter(task => task.status === TASK_STATUS.COMPLETED).length;
    statistics.failedTasks = tasks.filter(task => task.status === TASK_STATUS.FAILED).length;
    
    statistics.totalTransferred = tasks.reduce((sum, task) => sum + task.transferredBytes, 0);
    statistics.avgSpeed = tasks.length > 0 
      ? tasks.reduce((sum, task) => sum + task.speed, 0) / tasks.length 
      : 0;
  };

  // WebSocket连接管理
  const connect = async () => {
    try {
      await serverFileUploadWS.connect();
      isConnected.value = true;
      connectionStatus.value = 'CONNECTED';
      
      // 注册事件监听器
      serverFileUploadWS.on(MessageType.UPLOAD_PROGRESS, handleUploadProgress);
      serverFileUploadWS.on(MessageType.UPLOAD_STATUS_CHANGE, handleUploadStatusChange);
      serverFileUploadWS.on(MessageType.UPLOAD_STARTED, handleUploadStarted);
      serverFileUploadWS.on(MessageType.UPLOAD_COMPLETED, handleUploadCompleted);
      serverFileUploadWS.on(MessageType.UPLOAD_FAILED, handleUploadFailed);
      serverFileUploadWS.on(MessageType.UPLOAD_CANCELLED, handleUploadCancelled);
      serverFileUploadWS.on(MessageType.QUEUE_STATUS, handleQueueStatus);
      serverFileUploadWS.on(MessageType.SYSTEM_ALERT, handleSystemAlert);
      serverFileUploadWS.on(MessageType.ERROR_NOTIFICATION, handleErrorNotification);
      
      // 订阅系统告警
      serverFileUploadWS.subscribeSystemAlerts();
      
      ElMessage.success('WebSocket连接成功');
      
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      isConnected.value = false;
      connectionStatus.value = 'ERROR';
      ElMessage.error('WebSocket连接失败');
    }
  };

  const disconnect = () => {
    serverFileUploadWS.disconnect();
    isConnected.value = false;
    connectionStatus.value = 'DISCONNECTED';
  };

  // 订阅管理
  const subscribeTaskProgress = (taskId: number) => {
    if (isConnected.value) {
      serverFileUploadWS.subscribeTaskProgress(taskId);
    }
  };

  const unsubscribeTaskProgress = (taskId: number) => {
    if (isConnected.value) {
      serverFileUploadWS.unsubscribeTaskProgress(taskId);
      taskProgresses.delete(taskId);
    }
  };

  const subscribeServerStatus = (serverId: number) => {
    if (isConnected.value) {
      serverFileUploadWS.subscribeServerStatus(serverId);
    }
  };

  const unsubscribeServerStatus = (serverId: number) => {
    if (isConnected.value) {
      serverFileUploadWS.unsubscribeServerStatus(serverId);
    }
  };

  // 工具方法
  const getTaskProgress = (taskId: number): TaskProgress | undefined => {
    return taskProgresses.get(taskId);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 0) return '--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // 生命周期管理
  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    // 状态
    isConnected,
    connectionStatus,
    taskProgresses,
    queueStatus,
    statistics,
    
    // 计算属性
    activeTaskCount,
    totalProgress,
    totalSpeed,
    
    // 方法
    connect,
    disconnect,
    subscribeTaskProgress,
    unsubscribeTaskProgress,
    subscribeServerStatus,
    unsubscribeServerStatus,
    getTaskProgress,
    
    // 工具方法
    formatFileSize,
    formatSpeed,
    formatDuration
  };
}

export type { TaskProgress, QueueStatus };
