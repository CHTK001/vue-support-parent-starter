import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 服务器指标数据类型
 */
export interface ServerMetricsData {
  serverId: number;
  serverName?: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  loadAverage?: string;
  uptime?: number;
  processCount?: number;
  temperature?: number;
  status?: 'online' | 'offline' | 'error';
  collectTime?: string;
}

/**
 * 服务器状态汇总
 */
export interface ServerStatusSummary {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  warningServers: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgDiskUsage: number;
}

/**
 * 服务器指标数据状态管理
 * 移除Socket连接，改为纯数据存储
 */
export const useServerMetricsStore = defineStore('serverMetrics', () => {
  // 服务器指标数据缓存
  const metricsCache = ref<Map<number, ServerMetricsData>>(new Map());

  // 服务器状态汇总缓存
  const statusSummaryCache = ref<ServerStatusSummary | null>(null);

  // 最后更新时间
  const lastUpdateTime = ref<number>(0);

  /**
   * 更新服务器指标数据
   */
  const updateServerMetrics = (serverId: number, data: Partial<ServerMetricsData>) => {
    const existingData = metricsCache.value.get(serverId);
    const updatedData: ServerMetricsData = {
      serverId,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIn: 0,
      networkOut: 0,
      status: 'offline',
      ...existingData,
      ...data,
    };

    metricsCache.value.set(serverId, updatedData);
    lastUpdateTime.value = Date.now();
    console.log(`更新服务器 ${serverId} 指标数据`);
  };

  /**
   * 更新服务器状态汇总
   */
  const updateStatusSummary = (data: ServerStatusSummary) => {
    statusSummaryCache.value = data;
    lastUpdateTime.value = Date.now();
    console.log('更新服务器状态汇总');
  };

  /**
   * 获取服务器指标数据
   */
  const getServerMetrics = (serverId: number): ServerMetricsData | null => {
    return metricsCache.value.get(serverId) || null;
  };

  /**
   * 获取所有服务器指标数据
   */
  const getAllServerMetrics = computed(() => {
    return Array.from(metricsCache.value.entries()).map(([serverId, metrics]) => ({
      serverId,
      ...metrics
    }));
  });

  /**
   * 获取服务器状态汇总
   */
  const getStatusSummary = computed(() => statusSummaryCache.value);

  /**
   * 检查服务器是否有告警
   */
  const isServerInWarning = (serverId: number): boolean => {
    const metrics = getServerMetrics(serverId);
    if (!metrics) return false;

    // 简单的告警逻辑：CPU或内存使用率超过80%
    return metrics.cpuUsage > 80 || metrics.memoryUsage > 80;
  };

  /**
   * 清理缓存数据
   */
  const clearCache = () => {
    metricsCache.value.clear();
    statusSummaryCache.value = null;
    lastUpdateTime.value = 0;
    console.log('服务器指标缓存已清理');
  };

  /**
   * 移除特定服务器的数据
   */
  const removeServerData = (serverId: number) => {
    metricsCache.value.delete(serverId);
    console.log(`已移除服务器 ${serverId} 的指标数据`);
  };

  /**
   * 获取在线服务器数量
   */
  const getOnlineServerCount = computed(() => {
    return Array.from(metricsCache.value.values()).filter(metrics =>
      metrics.status === 'online'
    ).length;
  });

  /**
   * 获取告警服务器数量
   */
  const getWarningServerCount = computed(() => {
    return Array.from(metricsCache.value.entries()).filter(([serverId]) =>
      isServerInWarning(serverId)
    ).length;
  });

  /**
   * 获取最后更新时间
   */
  const getLastUpdateTime = computed(() => lastUpdateTime.value);

  return {
    // 数据
    metricsCache,
    statusSummaryCache,

    // 计算属性
    getAllServerMetrics,
    getStatusSummary,
    getOnlineServerCount,
    getWarningServerCount,
    getLastUpdateTime,

    // 方法
    updateServerMetrics,
    updateStatusSummary,
    getServerMetrics,
    isServerInWarning,
    clearCache,
    removeServerData,
  };
});