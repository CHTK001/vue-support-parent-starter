///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useServerWebSocket } from './useServerWebSocket';

// 任务进度接口
interface TaskProgress {
  taskId: number;
  fileName: string;
  progress: number;
  speed: number;
  transferredBytes: number;
  totalBytes: number;
  status: string;
  startTime?: string;
  estimatedTime?: number;
}

// 队列状态接口
interface QueueStatus {
  totalTasks: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  maxConcurrent: number;
  currentConcurrent: number;
}

// 统计信息接口
interface Statistics {
  totalCount: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  successRate: number;
  avgUploadTime: number;
  totalFileSize: number;
}

/**
 * 服务器文件上传组合式函数
 */
export function useServerFileUpload() {
  // WebSocket连接状态
  const isConnected = ref(false);
  const connectionStatus = ref('disconnected');
  
  // 任务进度数据
  const taskProgresses = ref<Map<number, TaskProgress>>(new Map());
  
  // 队列状态
  const queueStatus = reactive<QueueStatus>({
    totalTasks: 0,
    pendingTasks: 0,
    processingTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    maxConcurrent: 5,
    currentConcurrent: 0,
  });
  
  // 统计信息
  const statistics = reactive<Statistics>({
    totalCount: 0,
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    failedCount: 0,
    cancelledCount: 0,
    successRate: 0,
    avgUploadTime: 0,
    totalFileSize: 0,
  });

  // 使用服务器WebSocket
  const { 
    connect: wsConnect, 
    disconnect: wsDisconnect, 
    isConnected: wsIsConnected,
    subscribe,
    unsubscribe
  } = useServerWebSocket();

  // 计算属性
  const activeTaskCount = computed(() => {
    return Array.from(taskProgresses.value.values()).filter(
      task => task.status === 'PROCESSING' || task.status === 'UPLOADING'
    ).length;
  });

  const totalProgress = computed(() => {
    const tasks = Array.from(taskProgresses.value.values());
    if (tasks.length === 0) return 0;
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  });

  const totalSpeed = computed(() => {
    return Array.from(taskProgresses.value.values()).reduce(
      (sum, task) => sum + (task.speed || 0), 0
    );
  });

  // WebSocket消息处理
  const handleWebSocketMessage = (message: any) => {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      
      switch (data.type) {
        case 'UPLOAD_PROGRESS':
          handleUploadProgress(data.payload);
          break;
        case 'UPLOAD_STATUS_CHANGE':
          handleStatusChange(data.payload);
          break;
        case 'QUEUE_STATUS':
          handleQueueStatus(data.payload);
          break;
        case 'UPLOAD_COMPLETED':
          handleUploadCompleted(data.payload);
          break;
        case 'UPLOAD_FAILED':
          handleUploadFailed(data.payload);
          break;
        default:
          console.log('未知的WebSocket消息类型:', data.type);
      }
    } catch (error) {
      console.error('处理WebSocket消息失败:', error);
    }
  };

  // 处理上传进度
  const handleUploadProgress = (payload: any) => {
    const progress: TaskProgress = {
      taskId: payload.taskId,
      fileName: payload.fileName,
      progress: payload.progress,
      speed: payload.speed,
      transferredBytes: payload.transferredBytes,
      totalBytes: payload.totalBytes,
      status: payload.status,
      startTime: payload.startTime,
      estimatedTime: payload.estimatedTime,
    };
    
    taskProgresses.value.set(payload.taskId, progress);
  };

  // 处理状态变更
  const handleStatusChange = (payload: any) => {
    const existingProgress = taskProgresses.value.get(payload.taskId);
    if (existingProgress) {
      existingProgress.status = payload.status;
      taskProgresses.value.set(payload.taskId, existingProgress);
    }
  };

  // 处理队列状态
  const handleQueueStatus = (payload: any) => {
    Object.assign(queueStatus, payload);
  };

  // 处理上传完成
  const handleUploadCompleted = (payload: any) => {
    const existingProgress = taskProgresses.value.get(payload.taskId);
    if (existingProgress) {
      existingProgress.status = 'COMPLETED';
      existingProgress.progress = 100;
      taskProgresses.value.set(payload.taskId, existingProgress);
    }
  };

  // 处理上传失败
  const handleUploadFailed = (payload: any) => {
    const existingProgress = taskProgresses.value.get(payload.taskId);
    if (existingProgress) {
      existingProgress.status = 'FAILED';
      taskProgresses.value.set(payload.taskId, existingProgress);
    }
  };

  // 连接WebSocket
  const connect = () => {
    wsConnect();
    isConnected.value = wsIsConnected.value;
    connectionStatus.value = wsIsConnected.value ? 'connected' : 'connecting';
    
    // 订阅文件上传相关的消息
    subscribe('server.file-upload.progress', handleWebSocketMessage);
    subscribe('server.file-upload.status', handleWebSocketMessage);
    subscribe('server.file-upload.queue', handleWebSocketMessage);
  };

  // 断开WebSocket
  const disconnect = () => {
    // 取消订阅
    unsubscribe('server.file-upload.progress');
    unsubscribe('server.file-upload.status');
    unsubscribe('server.file-upload.queue');
    
    wsDisconnect();
    isConnected.value = false;
    connectionStatus.value = 'disconnected';
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化速度
  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  // 格式化持续时间
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}小时${minutes}分`;
    }
  };

  // 清除任务进度
  const clearTaskProgress = (taskId: number) => {
    taskProgresses.value.delete(taskId);
  };

  // 清除所有任务进度
  const clearAllTaskProgress = () => {
    taskProgresses.value.clear();
  };

  // 生命周期
  onMounted(() => {
    // 自动连接WebSocket
    connect();
  });

  onUnmounted(() => {
    // 断开WebSocket连接
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
    clearTaskProgress,
    clearAllTaskProgress,
    formatFileSize,
    formatSpeed,
    formatDuration,
  };
}
