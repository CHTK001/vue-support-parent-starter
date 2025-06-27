import { ref, onMounted, onUnmounted, reactive } from "vue";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { splitToArray } from "@repo/utils";

/**
 * 服务器指标数据类型
 */
export interface ServerMetricsData {
  serverId: number;
  collectTime: string;
  status: number;
  responseTime: number;
  cpu: {
    usage: number;
    cores: number;
    load1m: number;
    load5m: number;
    load15m: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    in: number;
    out: number;
  };
  osInfo: string;
  uptime: number;
  processCount: number;
  extraInfo: string;
}

/**
 * 服务器状态汇总数据
 */
export interface ServerStatusSummary {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  warningServers: number;
  healthyServers: number;
  timestamp: number;
}

/**
 * 性能趋势数据
 */
export interface PerformanceTrends {
  serverId: number;
  serverName: string;
  cpuTrend: Array<{ time: string; value: number }>;
  memoryTrend: Array<{ time: string; value: number }>;
  diskTrend: Array<{ time: string; value: number }>;
  networkTrend: Array<{ time: string; in: number; out: number }>;
  timestamp: number;
}

/**
 * 告警信息
 */
export interface ServerAlert {
  type: string;
  message: string;
  value: string;
  timestamp: number;
}

/**
 * 服务器告警数据
 */
export interface ServerAlerts {
  serverId: number;
  serverName: string;
  alerts: ServerAlert[];
}

/**
 * WebSocket 连接状态
 */
export interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

/**
 * 消息处理器类型
 */
export type MetricsMessageHandler<T = any> = (data: T) => void;

/**
 * 服务器指标Socket.IO客户端 Composable
 */
export function useServerMetricsSocket() {
  const socketClient = ref<any>(null);
  const state = reactive<SocketState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
  });

  // 消息处理器映射
  const messageHandlers = new Map<string, Set<MetricsMessageHandler>>();

  // 最新的服务器指标数据 - 限制最大保存数量防止内存溢出
  const latestMetrics = ref<Map<number, ServerMetricsData>>(new Map());
  const MAX_METRICS_CACHE = 100; // 最多缓存100个服务器的指标数据

  // 服务器状态汇总
  const statusSummary = ref<ServerStatusSummary | null>(null);

  // 性能趋势数据 - 限制最大保存数量
  const performanceTrends = ref<Map<number, PerformanceTrends>>(new Map());
  const MAX_TRENDS_CACHE = 50; // 最多缓存50个服务器的趋势数据

  // 告警信息 - 限制最大保存数量
  const serverAlerts = ref<Map<number, ServerAlerts>>(new Map());
  const MAX_ALERTS_CACHE = 50; // 最多缓存50个服务器的告警信息

  /**
   * 初始化 Socket.IO 连接
   */
  const connect = async (): Promise<boolean> => {
    if (socketClient.value && socketClient.value.connected) {
      return true;
    }

    if (state.connecting) {
      return false;
    }

    try {
      state.connecting = true;
      state.error = null;

      const config = getConfig();
      socketClient.value = socket(splitToArray(config.SocketUrl), undefined, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      // 设置连接事件监听
      setupEventListeners();

      // 连接成功
      state.connected = true;
      state.connecting = false;
      state.reconnectAttempts = 0;
      console.log("服务器指标 Socket.IO 连接成功");

      // 订阅服务器指标主题
      subscribeToMetricsTopic();

      return true;
    } catch (error) {
      console.error("Socket.IO 连接异常:", error);
      state.connected = false;
      state.connecting = false;
      state.error = error instanceof Error ? error.message : "连接失败";

      // 自动重连
      handleReconnect();

      return false;
    }
  };

  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    if (!socketClient.value) return;

    socketClient.value.on('connect', () => {
      console.log('Socket.IO 连接已建立');
      state.connected = true;
      state.connecting = false;
      state.reconnectAttempts = 0;
      state.error = null;
    });

    socketClient.value.on('disconnect', (reason: string) => {
      console.log('Socket.IO 连接已断开:', reason);
      state.connected = false;
      
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        handleReconnect();
      }
    });

    socketClient.value.on('connect_error', (error: Error) => {
      console.error('Socket.IO 连接错误:', error);
      state.connected = false;
      state.connecting = false;
      state.error = error.message;
      
      handleReconnect();
    });

    socketClient.value.on('reconnect', (attemptNumber: number) => {
      console.log('Socket.IO 重连成功，尝试次数:', attemptNumber);
      state.connected = true;
      state.reconnectAttempts = 0;
      state.error = null;
      
      // 重新订阅主题
      subscribeToMetricsTopic();
    });

    socketClient.value.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('Socket.IO 重连尝试:', attemptNumber);
      state.reconnectAttempts = attemptNumber;
    });

    socketClient.value.on('reconnect_failed', () => {
      console.error('Socket.IO 重连失败');
      state.error = '重连失败，请检查网络连接';
    });
  };

  /**
   * 订阅服务器指标主题
   */
  const subscribeToMetricsTopic = () => {
    if (!socketClient.value) return;

    const serverTopic = "gen/server";

    socketClient.value.on(serverTopic, (message: any) => {
      try {
        const data = JSON.parse(message.data);
        handleServerMessage(data);
      } catch (error) {
        console.error("解析服务器指标消息失败:", error);
      }
    });

    console.log("已订阅服务器指标主题:", serverTopic);
  };

  /**
   * 处理服务器消息
   */
  const handleServerMessage = (data: any) => {
    if (!data || !data.messageType) {
      console.warn("无效的服务器指标消息:", data);
      return;
    }

    const messageType = data.messageType;
    
    // 更新内部状态
    updateInternalState(messageType, data);
    
    // 触发消息处理器
    const handlers = messageHandlers.get(messageType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`处理消息类型 ${messageType} 失败:`, error);
        }
      });
    }
  };

  /**
   * 清理缓存以防止内存溢出
   */
  const cleanupCache = (cache: Map<number, any>, maxSize: number) => {
    if (cache.size > maxSize) {
      // 删除最旧的条目（保留最新的maxSize个）
      const entries = Array.from(cache.entries());
      const toDelete = entries.slice(0, entries.length - maxSize);
      toDelete.forEach(([key]) => cache.delete(key));
      console.log(`清理缓存，删除了 ${toDelete.length} 个旧条目`);
    }
  };

  /**
   * 更新内部状态
   */
  const updateInternalState = (messageType: string, data: any) => {
    switch (messageType) {
      case 'server_metrics':
        if (data.serverId && data.data) {
          latestMetrics.value.set(data.serverId, data.data);
          // 清理缓存防止内存溢出
          cleanupCache(latestMetrics.value, MAX_METRICS_CACHE);
        }
        break;

      case 'server_status_summary':
        if (data.data) {
          statusSummary.value = data.data;
        }
        break;

      case 'performance_trends':
        if (data.serverId && data.data) {
          performanceTrends.value.set(data.serverId, {
            serverId: data.serverId,
            serverName: data.serverName,
            ...data.data
          });
          // 清理缓存防止内存溢出
          cleanupCache(performanceTrends.value, MAX_TRENDS_CACHE);
        }
        break;

      case 'server_alerts':
        if (data.serverId && data.data) {
          serverAlerts.value.set(data.serverId, {
            serverId: data.serverId,
            serverName: data.serverName,
            alerts: data.data.alerts || []
          });
          // 清理缓存防止内存溢出
          cleanupCache(serverAlerts.value, MAX_ALERTS_CACHE);
        }
        break;
    }
  };

  /**
   * 处理重连
   */
  const handleReconnect = () => {
    if (state.reconnectAttempts >= 5) {
      console.error('Socket.IO 重连次数超限');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
    
    setTimeout(() => {
      if (!state.connected) {
        console.log(`Socket.IO 自动重连中... (${state.reconnectAttempts + 1}/5)`);
        connect();
      }
    }, delay);
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (socketClient.value) {
      socketClient.value.disconnect();
      socketClient.value = null;
    }
    
    state.connected = false;
    state.connecting = false;
    state.error = null;
    state.reconnectAttempts = 0;
    
    // 清空消息处理器
    messageHandlers.clear();
    
    console.log("Socket.IO 连接已断开");
  };

  /**
   * 添加消息处理器
   */
  const onMessage = <T = any>(messageType: string, handler: MetricsMessageHandler<T>) => {
    if (!messageHandlers.has(messageType)) {
      messageHandlers.set(messageType, new Set());
    }
    
    messageHandlers.get(messageType)!.add(handler);
    
    // 返回取消订阅函数
    return () => {
      const handlers = messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlers.delete(messageType);
        }
      }
    };
  };

  /**
   * 移除消息处理器
   */
  const offMessage = (messageType: string, handler?: MetricsMessageHandler) => {
    if (handler) {
      const handlers = messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlers.delete(messageType);
        }
      }
    } else {
      messageHandlers.delete(messageType);
    }
  };

  return {
    // 状态
    state,
    latestMetrics,
    statusSummary,
    performanceTrends,
    serverAlerts,
    
    // 方法
    connect,
    disconnect,
    onMessage,
    offMessage,
  };
}
