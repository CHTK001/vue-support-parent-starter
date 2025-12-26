import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import { useConfigStoreHook } from '@repo/core';

/**
 * 同步任务状态数据
 */
export interface SyncTaskStatus {
  taskId: number;
  taskName?: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR';
  message?: string;
  time?: string;
}

/**
 * 同步任务日志数据
 */
export interface SyncTaskLog {
  taskId: number;
  logId?: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  nodeKey?: string;
  message: string;
  time: string;
}

/**
 * 同步任务进度数据
 */
export interface SyncTaskProgress {
  taskId: number;
  logId?: number;
  readCount: number;
  writeCount: number;
  successCount: number;
  failCount: number;
  progress: number; // 0-100
  time?: string;
}

/**
 * 同步任务指标数据
 */
export interface SyncTaskMetrics {
  taskId: number;
  logId?: number;
  throughput: number; // 条/秒
  avgProcessTime: number; // 毫秒
  cpuUsage?: number;
  memoryUsage?: number;
  time?: string;
}

/**
 * WebSocket Topic 常量（与后端 SyncTaskWebSocketService 对应）
 */
const TOPICS = {
  STATUS: '/monitor/sync/task/status',
  LOG: '/monitor/sync/task/log',
  PROGRESS: '/monitor/sync/task/progress',
  METRICS: '/monitor/sync/task/metrics',
};

/**
 * 同步任务实时数据状态管理
 * 通过 ConfigStore 的全局 Socket 连接接收实时推送
 */
export const useSyncTaskStore = defineStore('syncTask', () => {
  // 当前监听的任务ID
  const watchingTaskId = ref<number | null>(null);

  // 任务状态缓存 (taskId -> status)
  const statusCache = ref<Map<number, SyncTaskStatus>>(new Map());

  // 任务日志缓存 (taskId -> logs[])
  const logsCache = ref<Map<number, SyncTaskLog[]>>(new Map());

  // 任务进度缓存 (taskId -> progress)
  const progressCache = ref<Map<number, SyncTaskProgress>>(new Map());

  // 任务指标缓存 (taskId -> metrics)
  const metricsCache = ref<Map<number, SyncTaskMetrics>>(new Map());

  // 最大日志条数
  const MAX_LOGS = 500;

  // 最后更新时间
  const lastUpdateTime = ref<number>(0);

  // 连接状态
  const isConnected = ref(false);

  /**
   * 初始化 Socket 监听
   */
  const initSocketListeners = () => {
    const configStore = useConfigStoreHook();
    const socket = configStore.getSocket();

    if (!socket) {
      console.warn('[SyncTaskStore] Socket 服务未初始化');
      return;
    }

    isConnected.value = socket.isConnected;

    // 监听任务状态变更
    socket.on(TOPICS.STATUS, (data: any) => {
      handleStatusMessage(data);
    });

    // 监听任务日志
    socket.on(TOPICS.LOG, (data: any) => {
      handleLogMessage(data);
    });

    // 监听任务进度
    socket.on(TOPICS.PROGRESS, (data: any) => {
      handleProgressMessage(data);
    });

    // 监听任务指标
    socket.on(TOPICS.METRICS, (data: any) => {
      handleMetricsMessage(data);
    });

    console.log('[SyncTaskStore] Socket 监听已初始化');
  };

  /**
   * 处理状态消息
   */
  const handleStatusMessage = (rawData: any) => {
    const data = extractData(rawData);
    if (!data?.taskId) return;

    const status: SyncTaskStatus = {
      taskId: data.taskId,
      taskName: data.taskName,
      status: data.status,
      message: data.message,
      time: data.time,
    };

    statusCache.value.set(data.taskId, status);
    lastUpdateTime.value = Date.now();
    console.log('[SyncTaskStore] 状态更新:', status);
  };

  /**
   * 处理日志消息
   */
  const handleLogMessage = (rawData: any) => {
    const data = extractData(rawData);
    if (!data?.taskId) return;

    const log: SyncTaskLog = {
      taskId: data.taskId,
      logId: data.logId,
      level: data.level || 'INFO',
      nodeKey: data.nodeKey,
      message: data.message || '',
      time: data.time || new Date().toISOString(),
    };

    // 获取或创建日志数组
    let logs = logsCache.value.get(data.taskId);
    if (!logs) {
      logs = [];
      logsCache.value.set(data.taskId, logs);
    }

    // 添加日志，保持最大条数限制
    logs.push(log);
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }

    lastUpdateTime.value = Date.now();
  };

  /**
   * 处理进度消息
   */
  const handleProgressMessage = (rawData: any) => {
    const data = extractData(rawData);
    if (!data?.taskId) return;

    const progress: SyncTaskProgress = {
      taskId: data.taskId,
      logId: data.logId,
      readCount: data.readCount || 0,
      writeCount: data.writeCount || 0,
      successCount: data.successCount || 0,
      failCount: data.failCount || 0,
      progress: data.progress || 0,
      time: data.time,
    };

    progressCache.value.set(data.taskId, progress);
    lastUpdateTime.value = Date.now();
  };

  /**
   * 处理指标消息
   */
  const handleMetricsMessage = (rawData: any) => {
    const data = extractData(rawData);
    if (!data?.taskId) return;

    const metrics: SyncTaskMetrics = {
      taskId: data.taskId,
      logId: data.logId,
      throughput: data.throughput || 0,
      avgProcessTime: data.avgProcessTime || 0,
      cpuUsage: data.cpuUsage,
      memoryUsage: data.memoryUsage,
      time: data.time,
    };

    metricsCache.value.set(data.taskId, metrics);
    lastUpdateTime.value = Date.now();
  };

  /**
   * 从消息中提取数据
   */
  const extractData = (rawData: any): any => {
    if (!rawData) return null;
    // 支持直接数据或 ServerWebSocketMessage 格式
    return rawData.data || rawData;
  };

  /**
   * 开始监听指定任务
   */
  const watchTask = (taskId: number) => {
    watchingTaskId.value = taskId;
    // 清空该任务的旧数据
    logsCache.value.set(taskId, []);
    console.log('[SyncTaskStore] 开始监听任务:', taskId);
  };

  /**
   * 停止监听任务
   */
  const unwatchTask = () => {
    watchingTaskId.value = null;
  };

  /**
   * 获取任务状态
   */
  const getTaskStatus = (taskId: number): SyncTaskStatus | null => {
    return statusCache.value.get(taskId) || null;
  };

  /**
   * 获取任务日志
   */
  const getTaskLogs = (taskId: number): SyncTaskLog[] => {
    return logsCache.value.get(taskId) || [];
  };

  /**
   * 获取任务进度
   */
  const getTaskProgress = (taskId: number): SyncTaskProgress | null => {
    return progressCache.value.get(taskId) || null;
  };

  /**
   * 获取任务指标
   */
  const getTaskMetrics = (taskId: number): SyncTaskMetrics | null => {
    return metricsCache.value.get(taskId) || null;
  };

  /**
   * 当前监听任务的状态
   */
  const currentTaskStatus = computed(() => {
    if (!watchingTaskId.value) return null;
    return statusCache.value.get(watchingTaskId.value) || null;
  });

  /**
   * 当前监听任务的日志
   */
  const currentTaskLogs = computed(() => {
    if (!watchingTaskId.value) return [];
    return logsCache.value.get(watchingTaskId.value) || [];
  });

  /**
   * 当前监听任务的进度
   */
  const currentTaskProgress = computed(() => {
    if (!watchingTaskId.value) return null;
    return progressCache.value.get(watchingTaskId.value) || null;
  });

  /**
   * 当前监听任务的指标
   */
  const currentTaskMetrics = computed(() => {
    if (!watchingTaskId.value) return null;
    return metricsCache.value.get(watchingTaskId.value) || null;
  });

  /**
   * 清理指定任务的缓存
   */
  const clearTaskCache = (taskId: number) => {
    statusCache.value.delete(taskId);
    logsCache.value.delete(taskId);
    progressCache.value.delete(taskId);
    metricsCache.value.delete(taskId);
  };

  /**
   * 清理所有缓存
   */
  const clearAllCache = () => {
    statusCache.value.clear();
    logsCache.value.clear();
    progressCache.value.clear();
    metricsCache.value.clear();
    watchingTaskId.value = null;
    lastUpdateTime.value = 0;
  };

  /**
   * 销毁 Socket 监听
   */
  const destroySocketListeners = () => {
    const configStore = useConfigStoreHook();
    const socket = configStore.getSocket();

    if (socket) {
      socket.off(TOPICS.STATUS);
      socket.off(TOPICS.LOG);
      socket.off(TOPICS.PROGRESS);
      socket.off(TOPICS.METRICS);
    }

    console.log('[SyncTaskStore] Socket 监听已销毁');
  };

  return {
    // 状态
    watchingTaskId,
    isConnected,
    lastUpdateTime,

    // 缓存
    statusCache,
    logsCache,
    progressCache,
    metricsCache,

    // 计算属性
    currentTaskStatus,
    currentTaskLogs,
    currentTaskProgress,
    currentTaskMetrics,

    // 方法
    initSocketListeners,
    destroySocketListeners,
    watchTask,
    unwatchTask,
    getTaskStatus,
    getTaskLogs,
    getTaskProgress,
    getTaskMetrics,
    clearTaskCache,
    clearAllCache,
  };
});

/**
 * 在组件外部使用
 */
export function useSyncTaskStoreHook() {
  return useSyncTaskStore();
}
