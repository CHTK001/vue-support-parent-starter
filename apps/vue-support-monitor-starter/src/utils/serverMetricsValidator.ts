/**
 * 服务器指标数据验证和转换工具
 */

import type { ServerMetricsData } from '@/composables/useServerMetricsSocket';

/**
 * 验证服务器指标数据结构
 */
export function validateServerMetricsData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // 检查必需的顶级字段
  const requiredFields = ['serverId', 'collectTime', 'status'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.warn(`缺少必需字段: ${field}`);
      return false;
    }
  }

  // 检查CPU数据结构
  if (data.cpu) {
    if (typeof data.cpu !== 'object' || typeof data.cpu.usage !== 'number') {
      console.warn('CPU数据结构无效:', data.cpu);
      return false;
    }
  }

  // 检查内存数据结构
  if (data.memory) {
    if (typeof data.memory !== 'object' || typeof data.memory.usage !== 'number') {
      console.warn('内存数据结构无效:', data.memory);
      return false;
    }
  }

  // 检查磁盘数据结构
  if (data.disk) {
    if (typeof data.disk !== 'object' || typeof data.disk.usage !== 'number') {
      console.warn('磁盘数据结构无效:', data.disk);
      return false;
    }
  }

  return true;
}

/**
 * 安全地获取数值，如果无效则返回默认值
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 安全地获取字符串，如果无效则返回默认值
 */
export function safeString(value: any, defaultValue: string = ''): string {
  return typeof value === 'string' ? value : String(value || defaultValue);
}

/**
 * 标准化服务器指标数据
 */
export function normalizeServerMetricsData(rawData: any): ServerMetricsData {
  if (!rawData) {
    throw new Error('原始数据不能为空');
  }

  return {
    serverId: safeNumber(rawData.serverId || rawData.monitorSysGenServerId),
    collectTime: safeString(rawData.collectTime || rawData.monitorSysGenServerMetricsCollectTime || new Date().toISOString()),
    status: safeNumber(rawData.status, 1),
    responseTime: safeNumber(rawData.responseTime),
    cpu: {
      usage: safeNumber(rawData.cpuUsage || rawData.monitorSysGenServerMetricsCpuUsage || (rawData.cpu && rawData.cpu.usage)),
      cores: safeNumber(rawData.cpuCores || rawData.monitorSysGenServerMetricsCpuCores || (rawData.cpu && rawData.cpu.cores), 1),
      load1m: safeNumber(rawData.cpuLoad1m || rawData.monitorSysGenServerMetricsCpuLoad1m || (rawData.cpu && rawData.cpu.load1m)),
      load5m: safeNumber(rawData.cpuLoad5m || rawData.monitorSysGenServerMetricsCpuLoad5m || (rawData.cpu && rawData.cpu.load5m)),
      load15m: safeNumber(rawData.cpuLoad15m || rawData.monitorSysGenServerMetricsCpuLoad15m || (rawData.cpu && rawData.cpu.load15m)),
    },
    memory: {
      total: safeNumber(rawData.memoryTotal || rawData.monitorSysGenServerMetricsMemoryTotal || (rawData.memory && rawData.memory.total)),
      used: safeNumber(rawData.memoryUsed || rawData.monitorSysGenServerMetricsMemoryUsed || (rawData.memory && rawData.memory.used)),
      free: safeNumber(rawData.memoryFree || rawData.monitorSysGenServerMetricsMemoryFree || (rawData.memory && rawData.memory.free)),
      usage: safeNumber(rawData.memoryUsage || rawData.monitorSysGenServerMetricsMemoryUsage || (rawData.memory && rawData.memory.usage)),
    },
    disk: {
      total: safeNumber(rawData.diskTotal || rawData.monitorSysGenServerMetricsDiskTotal || (rawData.disk && rawData.disk.total)),
      used: safeNumber(rawData.diskUsed || rawData.monitorSysGenServerMetricsDiskUsed || (rawData.disk && rawData.disk.used)),
      free: safeNumber(rawData.diskFree || rawData.monitorSysGenServerMetricsDiskFree || (rawData.disk && rawData.disk.free)),
      usage: safeNumber(rawData.diskUsage || rawData.monitorSysGenServerMetricsDiskUsage || (rawData.disk && rawData.disk.usage)),
    },
    network: {
      in: safeNumber(rawData.networkIn || rawData.monitorSysGenServerMetricsNetworkIn || (rawData.network && rawData.network.in)),
      out: safeNumber(rawData.networkOut || rawData.monitorSysGenServerMetricsNetworkOut || (rawData.network && rawData.network.out)),
    },
    osInfo: safeString(rawData.osInfo || rawData.monitorSysGenServerMetricsOsInfo),
    uptime: safeNumber(rawData.uptime || rawData.monitorSysGenServerMetricsUptime),
    processCount: safeNumber(rawData.processCount || rawData.monitorSysGenServerMetricsProcessCount),
    extraInfo: safeString(rawData.extraInfo || rawData.monitorSysGenServerMetricsExtraInfo),
  };
}

/**
 * 检查服务器指标是否处于警告状态
 */
export function isMetricsInWarning(metrics: ServerMetricsData): boolean {
  try {
    // CPU使用率超过70%
    if (metrics.cpu && metrics.cpu.usage > 70) {
      return true;
    }
    
    // 内存使用率超过80%
    if (metrics.memory && metrics.memory.usage > 80) {
      return true;
    }
    
    // 磁盘使用率超过85%
    if (metrics.disk && metrics.disk.usage > 85) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('检查指标警告状态时出错:', error);
    return false;
  }
}

/**
 * 获取服务器健康状态
 */
export function getMetricsHealthStatus(metrics: ServerMetricsData | null): 'healthy' | 'warning' | 'critical' | 'offline' {
  if (!metrics || metrics.status === 0) {
    return 'offline';
  }

  if (isMetricsInWarning(metrics)) {
    // 检查是否为严重状态
    const isCritical = (
      (metrics.cpu && metrics.cpu.usage > 90) ||
      (metrics.memory && metrics.memory.usage > 95) ||
      (metrics.disk && metrics.disk.usage > 95)
    );
    
    return isCritical ? 'critical' : 'warning';
  }

  return 'healthy';
}

/**
 * 格式化指标数据用于显示
 */
export function formatMetricsForDisplay(metrics: ServerMetricsData) {
  return {
    cpu: `${metrics.cpu?.usage?.toFixed(1) || 0}%`,
    memory: `${metrics.memory?.usage?.toFixed(1) || 0}%`,
    disk: `${metrics.disk?.usage?.toFixed(1) || 0}%`,
    networkIn: `${(metrics.network?.in || 0).toFixed(2)} KB/s`,
    networkOut: `${(metrics.network?.out || 0).toFixed(2)} KB/s`,
    uptime: formatUptime(metrics.uptime || 0),
    collectTime: new Date(metrics.collectTime).toLocaleString(),
  };
}

/**
 * 格式化运行时间
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

/**
 * 创建默认的服务器指标数据
 */
export function createDefaultMetrics(serverId: number): ServerMetricsData {
  return {
    serverId,
    collectTime: new Date().toISOString(),
    status: 0,
    responseTime: 0,
    cpu: { usage: 0, cores: 1, load1m: 0, load5m: 0, load15m: 0 },
    memory: { total: 0, used: 0, free: 0, usage: 0 },
    disk: { total: 0, used: 0, free: 0, usage: 0 },
    network: { in: 0, out: 0 },
    osInfo: '',
    uptime: 0,
    processCount: 0,
    extraInfo: '',
  };
}
