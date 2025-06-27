import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useServerMetricsSocket } from '@/composables/useServerMetricsSocket';
import {
  normalizeServerMetricsData,
  validateServerMetricsData,
  isMetricsInWarning,
  createDefaultMetrics
} from '@/utils/serverMetricsValidator';
import type {
  ServerMetricsData,
  ServerStatusSummary,
  PerformanceTrends,
  ServerAlerts
} from '@/composables/useServerMetricsSocket';

/**
 * 服务器指标数据状态管理
 */
export const useServerMetricsStore = defineStore('serverMetrics', () => {
  // Socket.IO 客户端
  const metricsSocket = useServerMetricsSocket();

  // 是否已初始化
  const initialized = ref(false);

  // 服务器指标数据缓存
  const metricsCache = ref<Map<number, ServerMetricsData>>(new Map());
  
  // 服务器状态汇总缓存
  const statusSummaryCache = ref<ServerStatusSummary | null>(null);
  
  // 性能趋势数据缓存
  const trendsCache = ref<Map<number, PerformanceTrends>>(new Map());
  
  // 告警信息缓存
  const alertsCache = ref<Map<number, ServerAlerts>>(new Map());

  // 数据更新时间戳
  const lastUpdateTime = ref<number>(0);

  /**
   * 计算属性：在线服务器数量
   */
  const onlineServersCount = computed(() => {
    return Array.from(metricsCache.value.values())
      .filter(metrics => metrics.status === 1).length;
  });

  /**
   * 计算属性：离线服务器数量
   */
  const offlineServersCount = computed(() => {
    return Array.from(metricsCache.value.values())
      .filter(metrics => metrics.status === 0).length;
  });

  /**
   * 计算属性：警告服务器数量
   */
  const warningServersCount = computed(() => {
    return Array.from(metricsCache.value.values())
      .filter(metrics => isServerInWarning(metrics)).length;
  });

  /**
   * 计算属性：总告警数量
   */
  const totalAlertsCount = computed(() => {
    return Array.from(alertsCache.value.values())
      .reduce((total, serverAlerts) => total + serverAlerts.alerts.length, 0);
  });

  /**
   * 计算属性：服务器列表（按状态排序）
   */
  const serversList = computed(() => {
    const servers = Array.from(metricsCache.value.values());
    return servers.sort((a, b) => {
      // 在线服务器优先
      if (a.status !== b.status) {
        return b.status - a.status;
      }
      // 按服务器ID排序
      return a.serverId - b.serverId;
    });
  });

  /**
   * 初始化服务器指标监听
   */
  const initialize = async () => {
    if (initialized.value) {
      return;
    }

    try {
      // 连接Socket.IO
      const connected = await metricsSocket.connect();
      if (!connected) {
        throw new Error('Socket.IO连接失败');
      }

      // 设置消息监听器
      setupMessageListeners();

      initialized.value = true;
      console.log('服务器指标监听初始化成功');
    } catch (error) {
      console.error('服务器指标监听初始化失败:', error);
      throw error;
    }
  };

  /**
   * 验证并转换服务器指标数据
   */
  const validateAndTransformMetrics = (rawData: any): ServerMetricsData | null => {
    try {
      if (!rawData) return null;

      // 使用统一的验证和转换工具
      return normalizeServerMetricsData(rawData);
    } catch (error) {
      console.warn('转换服务器指标数据失败:', error, rawData);
      return null;
    }
  };

  /**
   * 设置消息监听器
   */
  const setupMessageListeners = () => {
    // 监听服务器指标数据
    metricsSocket.onMessage('server_metrics', (data: any) => {
      if (data.serverId && data.data) {
        const validatedMetrics = validateAndTransformMetrics(data.data);
        if (validatedMetrics) {
          metricsCache.value.set(data.serverId, validatedMetrics);
          lastUpdateTime.value = Date.now();
          console.log(`更新服务器 ${data.serverId} 指标数据`);
        } else {
          console.warn(`服务器 ${data.serverId} 指标数据格式无效:`, data.data);
        }
      }
    });

    // 监听服务器状态汇总
    metricsSocket.onMessage('server_status_summary', (data: any) => {
      if (data.data) {
        statusSummaryCache.value = data.data;
        lastUpdateTime.value = Date.now();
        console.log('更新服务器状态汇总');
      }
    });

    // 监听性能趋势数据
    metricsSocket.onMessage('performance_trends', (data: any) => {
      if (data.serverId && data.data) {
        trendsCache.value.set(data.serverId, {
          serverId: data.serverId,
          serverName: data.serverName,
          ...data.data
        });
        lastUpdateTime.value = Date.now();
        console.log(`更新服务器 ${data.serverId} 性能趋势`);
      }
    });

    // 监听告警信息
    metricsSocket.onMessage('server_alerts', (data: any) => {
      if (data.serverId && data.data) {
        alertsCache.value.set(data.serverId, {
          serverId: data.serverId,
          serverName: data.serverName,
          alerts: data.data.alerts || []
        });
        lastUpdateTime.value = Date.now();
        console.log(`更新服务器 ${data.serverId} 告警信息`);
      }
    });

    // 监听RDP连接状态
    metricsSocket.onMessage('rdp_connect', (data: any) => {
      console.log('RDP连接状态变化:', data);
    });

    // 监听VNC连接状态
    metricsSocket.onMessage('vnc_connect', (data: any) => {
      console.log('VNC连接状态变化:', data);
    });

    // 监听RDP数据
    metricsSocket.onMessage('rdp_data', (data: any) => {
      console.log('收到RDP数据:', data);
    });

    // 监听VNC数据
    metricsSocket.onMessage('vnc_data', (data: any) => {
      console.log('收到VNC数据:', data);
    });
  };

  /**
   * 销毁服务器指标监听
   */
  const destroy = () => {
    metricsSocket.disconnect();
    
    // 清空缓存
    metricsCache.value.clear();
    statusSummaryCache.value = null;
    trendsCache.value.clear();
    alertsCache.value.clear();
    
    initialized.value = false;
    lastUpdateTime.value = 0;
    
    console.log('服务器指标监听已销毁');
  };

  /**
   * 获取指定服务器的指标数据
   */
  const getServerMetrics = (serverId: number): ServerMetricsData | null => {
    return metricsCache.value.get(serverId) || null;
  };

  /**
   * 安全地获取服务器指标数据（带默认值）
   */
  const getServerMetricsSafe = (serverId: number): ServerMetricsData => {
    const metrics = metricsCache.value.get(serverId);
    if (metrics) {
      return metrics;
    }

    // 返回默认的空指标数据
    return createDefaultMetrics(serverId);
  };

  /**
   * 获取指定服务器的性能趋势
   */
  const getServerTrends = (serverId: number): PerformanceTrends | null => {
    return trendsCache.value.get(serverId) || null;
  };

  /**
   * 获取指定服务器的告警信息
   */
  const getServerAlerts = (serverId: number): ServerAlerts | null => {
    return alertsCache.value.get(serverId) || null;
  };

  /**
   * 判断服务器是否处于警告状态
   */
  const isServerInWarning = (metrics: ServerMetricsData): boolean => {
    return isMetricsInWarning(metrics);
  };

  /**
   * 获取服务器健康状态
   */
  const getServerHealthStatus = (serverId: number): 'healthy' | 'warning' | 'critical' | 'offline' => {
    const metrics = getServerMetrics(serverId);
    if (!metrics) {
      return 'offline';
    }

    if (metrics.status === 0) {
      return 'offline';
    }

    // 检查是否有告警
    const alerts = getServerAlerts(serverId);
    if (alerts && alerts.alerts.length > 0) {
      // 检查是否有严重告警
      const hasCriticalAlert = alerts.alerts.some(alert => 
        alert.type === 'CPU_HIGH' || 
        alert.type === 'MEMORY_HIGH' || 
        alert.type === 'DISK_HIGH'
      );
      
      if (hasCriticalAlert) {
        return 'critical';
      }
      
      return 'warning';
    }

    // 检查指标是否处于警告状态
    if (isServerInWarning(metrics)) {
      return 'warning';
    }

    return 'healthy';
  };

  /**
   * 强制刷新数据
   */
  const refresh = async () => {
    if (!initialized.value) {
      await initialize();
    } else {
      // 重新连接Socket.IO以获取最新数据
      metricsSocket.disconnect();
      await metricsSocket.connect();
    }
  };

  return {
    // 状态
    initialized,
    metricsCache,
    statusSummaryCache,
    trendsCache,
    alertsCache,
    lastUpdateTime,
    
    // 计算属性
    onlineServersCount,
    offlineServersCount,
    warningServersCount,
    totalAlertsCount,
    serversList,
    
    // Socket状态
    socketState: metricsSocket.state,
    
    // 方法
    initialize,
    destroy,
    getServerMetrics,
    getServerMetricsSafe,
    getServerTrends,
    getServerAlerts,
    getServerHealthStatus,
    validateAndTransformMetrics,
    isServerInWarning,
    refresh,
  };
});
