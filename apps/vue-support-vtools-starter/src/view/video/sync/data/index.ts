// 同步状态类型定义
export const syncStatusTypes = [
  { label: '全部状态', value: undefined },
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
  { label: '执行中', value: 2 }
];

// 同步类型选项
export const syncTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '定时', value: '定时' },
  { label: '手动', value: '手动' },
  { label: '自动', value: '自动' }
];

// 获取状态样式
export const getSyncStatusType = (status?: number): string => {
  if (status === 1) return 'success';
  if (status === 0) return 'danger';
  if (status === 2) return 'warning';
  return 'info';
};

// 获取状态文本
export const getSyncStatusText = (status?: number): string => {
  if (status === 1) return '启用';
  if (status === 0) return '禁用';
  if (status === 2) return '执行中';
  return '未知';
};

// 默认查询参数
export const defaultSyncQueryParams = {
  syncName: '',
  syncType: '',
  syncStatus: undefined,
  pageNum: 1,
  pageSize: 10
};

// 格式化日期时间
export const formatDateTime = (dateTime?: string): string => {
  if (!dateTime) return '未设置';
  
  try {
    const date = new Date(dateTime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return dateTime;
  }
}; 