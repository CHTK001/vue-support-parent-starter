/**
 * 软件管理WebSocket连接管理
 * @author CH
 * @date 2025-01-16
 * @version 1.0.0
 */

import { ref, reactive, onUnmounted } from "vue";
import { WebSocketManager } from "@/utils/websocket";
import { ElMessage } from "element-plus";
import { getWebSocketTopics } from "@/api/soft";

// WebSocket消息类型
export const SOFT_WS_MESSAGE_TYPE = {
  // 容器状态相关
  CONTAINER_STATUS_CHANGED: "container_status_changed",
  CONTAINER_CREATED: "container_created",
  CONTAINER_REMOVED: "container_removed",
  CONTAINER_STARTED: "container_started",
  CONTAINER_STOPPED: "container_stopped",
  CONTAINER_RESTARTED: "container_restarted",
  
  // 容器日志相关
  CONTAINER_LOG: "container_log",
  CONTAINER_LOG_ERROR: "container_log_error",
  
  // 容器统计相关
  CONTAINER_STATS: "container_stats",
  CONTAINER_RESOURCE_USAGE: "container_resource_usage",
  
  // 安装进度相关
  INSTALL_PROGRESS: "install_progress",
  INSTALL_STARTED: "install_started",
  INSTALL_COMPLETED: "install_completed",
  INSTALL_FAILED: "install_failed",
  
  // 卸载进度相关
  UNINSTALL_PROGRESS: "uninstall_progress",
  UNINSTALL_STARTED: "uninstall_started",
  UNINSTALL_COMPLETED: "uninstall_completed",
  UNINSTALL_FAILED: "uninstall_failed",
  
  // 软件同步相关
  SOFT_SYNC_PROGRESS: "soft_sync_progress",
  SOFT_SYNC_COMPLETED: "soft_sync_completed",
  SOFT_SYNC_FAILED: "soft_sync_failed",
  
  // 系统事件
  SYSTEM_STATUS: "system_status",
  HEARTBEAT: "heartbeat"
} as const;

export type SoftWebSocketMessageType = typeof SOFT_WS_MESSAGE_TYPE[keyof typeof SOFT_WS_MESSAGE_TYPE];

// WebSocket消息接口
export interface SoftWebSocketMessage {
  type: SoftWebSocketMessageType;
  timestamp: number;
  data?: any;
  softId?: number;
  containerId?: string;
  serverId?: number;
  recordId?: number;
  error?: string;
}

// 容器状态变化消息
export interface ContainerStatusMessage extends SoftWebSocketMessage {
  type: typeof SOFT_WS_MESSAGE_TYPE.CONTAINER_STATUS_CHANGED;
  data: {
    containerId: string;
    status: string;
    previousStatus: string;
    softId: number;
    serverId: number;
  };
}

// 安装进度消息
export interface InstallProgressMessage extends SoftWebSocketMessage {
  type: typeof SOFT_WS_MESSAGE_TYPE.INSTALL_PROGRESS;
  data: {
    recordId: number;
    softId: number;
    serverId: number;
    progress: number;
    stage: string;
    message: string;
  };
}

// 容器日志消息
export interface ContainerLogMessage extends SoftWebSocketMessage {
  type: typeof SOFT_WS_MESSAGE_TYPE.CONTAINER_LOG;
  data: {
    containerId: string;
    log: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
  };
}

// 容器统计消息
export interface ContainerStatsMessage extends SoftWebSocketMessage {
  type: typeof SOFT_WS_MESSAGE_TYPE.CONTAINER_STATS;
  data: {
    containerId: string;
    cpuUsage: number;
    memoryUsage: number;
    networkIO: {
      rx: number;
      tx: number;
    };
    diskIO: {
      read: number;
      write: number;
    };
  };
}

// 连接状态
export interface SoftWebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastHeartbeat: number;
  reconnectAttempts: number;
}

// 消息处理器类型
export type SoftMessageHandler<T = SoftWebSocketMessage> = (message: T) => void;

/**
 * 软件管理WebSocket管理类
 */
export function useSoftWebSocket() {
  const wsManager = ref<WebSocketManager | null>(null);
  const state = reactive<SoftWebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastHeartbeat: 0,
    reconnectAttempts: 0
  });
  
  // 消息处理器映射
  const messageHandlers = new Map<SoftWebSocketMessageType, Set<SoftMessageHandler>>();
  
  // 主题订阅映射
  const topicSubscriptions = new Map<string, Set<string>>();
  
  // WebSocket主题信息
  const topics = ref<{
    containerStatus: string;
    containerLogs: string;
    containerStatistics: string;
    containerEvents: string;
  } | null>(null);
  
  /**
   * 初始化WebSocket连接
   */
  const connect = async (): Promise<boolean> => {
    if (state.connecting || state.connected) {
      return state.connected;
    }
    
    try {
      state.connecting = true;
      state.error = null;
      
      // 获取WebSocket主题信息
      const topicsRes = await getWebSocketTopics();
      if (topicsRes.code === "00000" && topicsRes.data) {
        topics.value = topicsRes.data;
      }
      
      // 创建WebSocket连接
      const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080';
      const fullUrl = `${wsUrl}/ws/soft`;
      
      wsManager.value = new WebSocketManager({
        url: fullUrl,
        reconnectInterval: 3000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        heartbeatMessage: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }),
        
        onOpen: (event) => {
          console.log('软件管理WebSocket连接已建立');
          state.connected = true;
          state.connecting = false;
          state.reconnectAttempts = 0;
          state.error = null;
          
          // 发送认证信息（如果需要）
          sendAuth();
        },
        
        onMessage: (event) => {
          try {
            const message: SoftWebSocketMessage = JSON.parse(event.data);
            handleMessage(message);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        },
        
        onError: (event) => {
          console.error('软件管理WebSocket错误:', event);
          state.error = '连接错误';
        },
        
        onClose: (event) => {
          console.log('软件管理WebSocket连接已关闭:', event.code, event.reason);
          state.connected = false;
          state.connecting = false;
          
          if (event.code !== 1000) {
            state.error = `连接关闭: ${event.reason || '未知原因'}`;
          }
        },
        
        onReconnect: (attempt) => {
          console.log(`软件管理WebSocket重连尝试: ${attempt}`);
          state.reconnectAttempts = attempt;
          state.connecting = true;
        },
        
        onMaxReconnectAttemptsReached: () => {
          console.error('软件管理WebSocket重连次数已达上限');
          state.error = '连接失败，请刷新页面重试';
          ElMessage.error('WebSocket连接失败，实时功能不可用');
        }
      });
      
      wsManager.value.connect();
      return true;
      
    } catch (error) {
      console.error('初始化软件管理WebSocket失败:', error);
      state.connecting = false;
      state.error = error instanceof Error ? error.message : '连接失败';
      return false;
    }
  };
  
  /**
   * 断开WebSocket连接
   */
  const disconnect = (): void => {
    if (wsManager.value) {
      wsManager.value.disconnect();
      wsManager.value = null;
    }
    
    state.connected = false;
    state.connecting = false;
    state.error = null;
    
    // 清理订阅
    messageHandlers.clear();
    topicSubscriptions.clear();
  };
  
  /**
   * 发送认证信息
   */
  const sendAuth = (): void => {
    if (!wsManager.value?.isConnected()) return;
    
    const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (authToken) {
      wsManager.value.sendJSON({
        type: 'auth',
        token: authToken,
        timestamp: Date.now()
      });
    }
  };
  
  /**
   * 处理WebSocket消息
   */
  const handleMessage = (message: SoftWebSocketMessage): void => {
    // 更新心跳时间
    if (message.type === SOFT_WS_MESSAGE_TYPE.HEARTBEAT) {
      state.lastHeartbeat = Date.now();
      return;
    }
    
    // 调用注册的消息处理器
    const handlers = messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`处理WebSocket消息失败 [${message.type}]:`, error);
        }
      });
    } else {
      console.warn(`未处理的WebSocket消息类型: ${message.type}`);
    }
  };
  
  /**
   * 注册消息处理器
   */
  const onMessage = <T extends SoftWebSocketMessage>(
    type: SoftWebSocketMessageType,
    handler: SoftMessageHandler<T>
  ): void => {
    if (!messageHandlers.has(type)) {
      messageHandlers.set(type, new Set());
    }
    messageHandlers.get(type)!.add(handler as SoftMessageHandler);
  };
  
  /**
   * 移除消息处理器
   */
  const offMessage = (
    type: SoftWebSocketMessageType,
    handler: SoftMessageHandler
  ): void => {
    const handlers = messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        messageHandlers.delete(type);
      }
    }
  };
  
  /**
   * 订阅容器状态变化
   */
  const subscribeContainerStatus = (containerId: string): void => {
    if (!wsManager.value?.isConnected()) return;
    
    wsManager.value.sendJSON({
      type: 'subscribe',
      topic: 'container_status',
      containerId,
      timestamp: Date.now()
    });
    
    // 记录订阅
    if (!topicSubscriptions.has('container_status')) {
      topicSubscriptions.set('container_status', new Set());
    }
    topicSubscriptions.get('container_status')!.add(containerId);
  };
  
  /**
   * 取消订阅容器状态
   */
  const unsubscribeContainerStatus = (containerId: string): void => {
    if (!wsManager.value?.isConnected()) return;
    
    wsManager.value.sendJSON({
      type: 'unsubscribe',
      topic: 'container_status',
      containerId,
      timestamp: Date.now()
    });
    
    // 移除订阅记录
    const subscriptions = topicSubscriptions.get('container_status');
    if (subscriptions) {
      subscriptions.delete(containerId);
    }
  };
  
  /**
   * 订阅容器日志
   */
  const subscribeContainerLogs = (containerId: string): void => {
    if (!wsManager.value?.isConnected()) return;
    
    wsManager.value.sendJSON({
      type: 'subscribe',
      topic: 'container_logs',
      containerId,
      timestamp: Date.now()
    });
  };
  
  /**
   * 取消订阅容器日志
   */
  const unsubscribeContainerLogs = (containerId: string): void => {
    if (!wsManager.value?.isConnected()) return;
    
    wsManager.value.sendJSON({
      type: 'unsubscribe',
      topic: 'container_logs',
      containerId,
      timestamp: Date.now()
    });
  };
  
  /**
   * 订阅安装进度
   */
  const subscribeInstallProgress = (recordId: number): void => {
    if (!wsManager.value?.isConnected()) return;
    
    wsManager.value.sendJSON({
      type: 'subscribe',
      topic: 'install_progress',
      recordId,
      timestamp: Date.now()
    });
  };
  
  /**
   * 取消订阅安装进度
   */
  const unsubscribeInstallProgress = (recordId: number): void => {
    if (!wsManager.value?.isConnected()) return;
    
    wsManager.value.sendJSON({
      type: 'unsubscribe',
      topic: 'install_progress',
      recordId,
      timestamp: Date.now()
    });
  };
  
  /**
   * 发送消息
   */
  const sendMessage = (message: Partial<SoftWebSocketMessage>): boolean => {
    if (!wsManager.value?.isConnected()) {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }
    
    const fullMessage = {
      timestamp: Date.now(),
      ...message
    };
    
    return wsManager.value.sendJSON(fullMessage);
  };
  
  // 组件卸载时清理
  onUnmounted(() => {
    disconnect();
  });
  
  return {
    // 状态
    state,
    topics,
    
    // 连接管理
    connect,
    disconnect,
    
    // 消息处理
    onMessage,
    offMessage,
    sendMessage,
    
    // 订阅管理
    subscribeContainerStatus,
    unsubscribeContainerStatus,
    subscribeContainerLogs,
    unsubscribeContainerLogs,
    subscribeInstallProgress,
    unsubscribeInstallProgress,
    
    // 消息类型常量
    SOFT_WS_MESSAGE_TYPE
  };
}

// 导出类型
export type {
  SoftWebSocketMessage,
  ContainerStatusMessage,
  InstallProgressMessage,
  ContainerLogMessage,
  ContainerStatsMessage,
  SoftWebSocketState,
  SoftMessageHandler
};