import { ref, reactive, computed, onMounted, onUnmounted, readonly } from 'vue';
import { message } from '@repo/utils';
import { useServerWebSocket } from './useServerWebSocket';
import {
  getServerLatency,
  getBatchServerLatency,
  getLatencyStatistics,
  getLatencyStatusDistribution,
  checkLatencyAlerts,
  SERVER_WS_MESSAGE_TYPE,
  type ServerLatencyData,
  type LatencyStatistics,
  type ServerDisplayData,
  getLatencyStatus,
  formatLatencyText
} from '@/api/server';

/**
 * 延迟数据存储
 */
interface LatencyStore {
  [serverId: string]: {
    latency: number;
    timestamp: number;
    status: string;
  };
}

/**
 * 服务器延迟管理 Composable
 */
export function useServerLatency() {
  // WebSocket 连接
  const { onMessage, state: wsState } = useServerWebSocket();

  // 延迟数据存储
  const latencyStore = reactive<LatencyStore>({});
  
  // 统计数据
  const statistics = ref<LatencyStatistics | null>(null);
  const statusDistribution = ref<any>(null);
  const alerts = ref<any[]>([]);

  // 加载状态
  const loading = ref(false);
  const lastUpdateTime = ref<number>(0);

  /**
   * 获取服务器延迟
   */
  const getServerLatencyData = (serverId: string | number) => {
    const id = String(serverId);
    return latencyStore[id] || null;
  };

  /**
   * 获取格式化的延迟文本
   */
  const getFormattedLatency = (serverId: string | number) => {
    const data = getServerLatencyData(serverId);
    return data ? formatLatencyText(data.latency) : '未检测';
  };

  /**
   * 获取延迟状态
   */
  const getServerLatencyStatus = (serverId: string | number) => {
    const data = getServerLatencyData(serverId);
    return data ? getLatencyStatus(data.latency) : null;
  };

  /**
   * 批量获取服务器延迟
   */
  const fetchBatchLatency = async (serverIds: number[]) => {
    if(!serverIds.length) {
      return [];
    }
    try {
      
      loading.value = true;
      const result = await getBatchServerLatency(serverIds);
      
      if (result.code === '00000' && result.data) {
        // 更新延迟存储
        Object.entries(result.data).forEach(([serverId, latency]) => {
          updateLatencyData(Number(serverId), latency as any);
        });
      }
      
      return result;
    } catch (error) {
      console.error('批量获取延迟失败:', error);
      message.error('获取延迟数据失败');
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取延迟统计
   */
  const fetchLatencyStatistics = async () => {
    try {
      const result = await getLatencyStatistics();
      if (result.code === '00000') {
        statistics.value = result.data;
      }
      return result;
    } catch (error) {
      console.error('获取延迟统计失败:', error);
      return null;
    }
  };

  /**
   * 获取状态分布
   */
  const fetchStatusDistribution = async () => {
    try {
      const result = await getLatencyStatusDistribution();
      if (result.code === '00000') {
        statusDistribution.value = result.data;
      }
      return result;
    } catch (error) {
      console.error('获取状态分布失败:', error);
      return null;
    }
  };

  /**
   * 检查延迟告警
   */
  const fetchLatencyAlerts = async () => {
    try {
      const result = await checkLatencyAlerts();
      if (result.code === '00000') {
        alerts.value = result.data || [];
      }
      return result;
    } catch (error) {
      console.error('检查延迟告警失败:', error);
      return null;
    }
  };

  /**
   * 更新延迟数据
   */
  const updateLatencyData = (serverId: number, latency: number, timestamp?: number) => {
    const id = String(serverId);
    const status = getLatencyStatus(latency);
    
    latencyStore[id] = {
      latency,
      timestamp: timestamp || Date.now(),
      status: status.status
    };
    
    lastUpdateTime.value = Date.now();
  };

  /**
   * 更新服务器列表的延迟信息
   */
  const updateServerListLatency = (servers: ServerDisplayData[]) => {
    servers.forEach(server => {
      const latencyData = getServerLatencyData(server.id);
      if (latencyData) {
        server.latency = latencyData.latency;
        server.latencyStatus = getLatencyStatus(latencyData.latency);
        server.latencyText = formatLatencyText(latencyData.latency);
      }
    });
  };

  /**
   * 清理过期的延迟数据
   */
  const cleanupExpiredData = (maxAge: number = 5 * 60 * 1000) => {
    const now = Date.now();
    Object.keys(latencyStore).forEach(serverId => {
      const data = latencyStore[serverId];
      if (now - data.timestamp > maxAge) {
        delete latencyStore[serverId];
      }
    });
  };

  // 计算属性
  const totalServers = computed(() => Object.keys(latencyStore).length);
  
  const onlineServers = computed(() => {
    return Object.values(latencyStore).filter(data => data.latency >= 0).length;
  });
  
  const normalServers = computed(() => {
    return Object.values(latencyStore).filter(data => data.status === 'normal').length;
  });
  
  const highLatencyServers = computed(() => {
    return Object.values(latencyStore).filter(data => data.status === 'high').length;
  });
  
  const abnormalServers = computed(() => {
    return Object.values(latencyStore).filter(data => data.status === 'abnormal').length;
  });

  // WebSocket 消息处理
  const handleLatencyMessage = (message: any) => {
    try {
      const data = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
      
      switch (message.messageType) {
        case SERVER_WS_MESSAGE_TYPE.SERVER_LATENCY:
          // 单个服务器延迟更新
          if (data.serverId && typeof data.latency === 'number') {
            updateLatencyData(data.serverId, data.latency, data.timestamp);
          }
          break;
          
        case SERVER_WS_MESSAGE_TYPE.BATCH_SERVER_LATENCY:
          // 批量延迟更新
          if (Array.isArray(data)) {
            data.forEach((item: ServerLatencyData) => {
              if (item.serverId && typeof item.latency === 'number') {
                updateLatencyData(item.serverId, item.latency, item.timestamp);
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('处理延迟消息失败:', error);
    }
  };

  // 监听 WebSocket 消息
  onMessage(handleLatencyMessage);

  // 定期清理过期数据
  let cleanupTimer: NodeJS.Timeout;
  
  onMounted(() => {
    // 每5分钟清理一次过期数据
    cleanupTimer = setInterval(() => {
      cleanupExpiredData();
    }, 5 * 60 * 1000);
  });

  onUnmounted(() => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
    }
  });

  return {
    // 状态
    latencyStore: readonly(latencyStore),
    statistics,
    statusDistribution,
    alerts,
    loading,
    lastUpdateTime,
    wsState,

    // 计算属性
    totalServers,
    onlineServers,
    normalServers,
    highLatencyServers,
    abnormalServers,

    // 方法
    getServerLatencyData,
    getFormattedLatency,
    getServerLatencyStatus,
    fetchBatchLatency,
    fetchLatencyStatistics,
    fetchStatusDistribution,
    fetchLatencyAlerts,
    updateLatencyData,
    updateServerListLatency,
    cleanupExpiredData
  };
}

/**
 * 全局延迟管理实例
 */
let globalLatencyManager: ReturnType<typeof useServerLatency> | null = null;

/**
 * 获取全局延迟管理实例
 */
export function useGlobalServerLatency() {
  if (!globalLatencyManager) {
    globalLatencyManager = useServerLatency();
  }
  return globalLatencyManager;
}
