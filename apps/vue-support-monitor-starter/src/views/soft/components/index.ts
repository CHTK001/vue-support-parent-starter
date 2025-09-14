/**
 * 软件管理组件统一导出
 * @author CH
 * @version 1.0.0
 * @since 2024-01-01
 */

// 容器相关组件
export { default as ContainerCard } from './ContainerCard.vue';
export { default as ContainerActions } from './ContainerActions.vue';

// 日志查看组件
export { default as LogViewer } from './LogViewer.vue';

// 统计信息组件
export { default as StatsCard } from './StatsCard.vue';

// 安装进度组件
export { default as InstallProgress } from './InstallProgress.vue';

// 版本管理组件
export { default as SoftVersionManager } from './SoftVersionManager.vue';

// 组件类型定义
export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting' | 'error';
  cpuUsage?: number;
  memoryUsage?: number;
  networkIO?: string;
  ports?: string[];
  createdAt?: string;
  updatedAt?: string;
  loading?: boolean;
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
}

export interface StatItem {
  key: string;
  label: string;
  value: number | string;
  icon: any;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  format?: 'number' | 'percentage' | 'bytes' | 'duration';
  description?: string;
  trend?: {
    type: 'up' | 'down';
    value: string;
  };
  chart?: boolean;
}

export interface ProgressStep {
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  duration?: number;
}

export interface SoftwareVersion {
  id: string;
  version: string;
  description: string;
  releaseDate: string;
  size: number;
  downloadCount: number;
  isCurrent: boolean;
  changelog?: string;
  downloadUrl?: string;
}

// 事件类型定义
export interface ContainerEvents {
  start: (containerId: string) => void;
  stop: (containerId: string) => void;
  pause: (containerId: string) => void;
  restart: (containerId: string) => void;
  remove: (containerId: string) => void;
  'view-logs': (containerId: string) => void;
  'open-terminal': (containerId: string) => void;
  'view-details': (containerId: string) => void;
  export: (containerId: string) => void;
  inspect: (containerId: string) => void;
}

export interface LogViewerEvents {
  clear: () => void;
  export: (format: 'txt' | 'json' | 'csv') => void;
  'filter-change': (filters: LogFilters) => void;
  'search-change': (query: string) => void;
}

export interface LogFilters {
  level?: string[];
  source?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface InstallProgressEvents {
  cancel: () => void;
  retry: () => void;
  close: () => void;
  clearLogs: () => void;
}

export interface VersionManagerEvents {
  'add-version': (version: Partial<SoftwareVersion>) => void;
  'switch-version': (versionId: string) => void;
  'delete-version': (versionId: string) => void;
  'download-version': (versionId: string) => void;
}

// 工具函数
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
};

export const getContainerStatusType = (status: string): string => {
  switch (status) {
    case 'running':
      return 'success';
    case 'stopped':
      return 'info';
    case 'paused':
      return 'warning';
    case 'error':
      return 'danger';
    case 'restarting':
      return 'warning';
    default:
      return 'info';
  }
};

export const getContainerStatusText = (status: string): string => {
  switch (status) {
    case 'running':
      return '运行中';
    case 'stopped':
      return '已停止';
    case 'paused':
      return '已暂停';
    case 'error':
      return '异常';
    case 'restarting':
      return '重启中';
    default:
      return '未知';
  }
};

export const getLogLevelColor = (level: string): string => {
  switch (level) {
    case 'error':
      return '#f56c6c';
    case 'warn':
      return '#e6a23c';
    case 'info':
      return '#409eff';
    case 'debug':
      return '#909399';
    default:
      return '#303133';
  }
};