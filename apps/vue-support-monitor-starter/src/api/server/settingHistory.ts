import { http, ReturnResult } from "@repo/utils";

/**
 * 服务器配置历史记录接口
 */

// 历史记录类型定义
export interface ServerSettingHistory {
  monitorSysGenServerSettingHistoryId: number;
  monitorSysGenServerId: number;
  monitorSysGenServerSettingId: number;
  changeType: string;
  changeDescription: string;
  changeUser: string;
  changeTime: string;
  settingSnapshot?: string;
  changedFields?: string;
  oldValues?: string;
  newValues?: string;
  createTime: string;
  updateTime: string;
}

// 历史统计信息
export interface HistoryStatistics {
  totalCount: number;
  serverCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  latestChangeTime: string;
  earliestChangeTime: string;
}

// 变更摘要
export interface ChangeSummary {
  totalChanges: number;
  period: string;
  changeTypeCount: Record<string, number>;
}

// 最近变更
export interface RecentChange {
  id: number;
  changeType: string;
  description: string;
  user: string;
  time: string;
}

/**
 * 根据服务器ID查询历史记录
 */
export function getHistoryByServerId(serverId: number, limit: number = 20) {
  return http.request<ReturnResult<ServerSettingHistory[]>>('get',`/api/v1/monitor/server/setting/history/server/${serverId}`, {
    params: { limit }
  });
}

/**
 * 根据服务器ID和时间范围查询历史记录
 */
export function getHistoryByServerIdAndTimeRange(
  serverId: number,
  startTime?: string,
  endTime?: string
) {
  return http.request<ReturnResult<ServerSettingHistory[]>>("get", `/api/v1/monitor/server/setting/history/server/${serverId}/range`, {
    params: { startTime, endTime }
  });
}

/**
 * 根据变更类型查询历史记录
 */
export function getHistoryByChangeType(changeType: string, limit: number = 20) {
  return http.request<ReturnResult<ServerSettingHistory[]>>("get", `/api/v1/monitor/server/setting/history/type/${changeType}`, {
    params: { limit }
  });
}

/**
 * 获取历史记录统计信息
 */
export function getHistoryStatistics(serverId?: number) {
  return http.request<ReturnResult<HistoryStatistics>>("get", "/api/v1/monitor/server/setting/history/statistics", {
    params: { serverId }
  });
}

/**
 * 获取历史记录详情
 */
export function getHistoryDetail(historyId: number) {
  return http.request<ReturnResult<any>>("get", `/api/v1/monitor/server/setting/history/${historyId}/detail`);
}

/**
 * 恢复历史配置
 */
export function restoreFromHistory(historyId: number, user: string = "system") {
  return http.request<ReturnResult<any>>("post", `/api/v1/monitor/server/setting/history/${historyId}/restore`, null, {
    params: { user }
  });
}

/**
 * 比较两个历史记录的差异
 */
export function compareHistory(historyId1: number, historyId2: number) {
  return http.request<ReturnResult<any>>("get", "/api/v1/monitor/server/setting/history/compare", {
    params: { historyId1, historyId2 }
  });
}

/**
 * 获取最近的配置变更
 */
export function getRecentChanges(serverId: number, limit: number = 10) {
  return http.request<ReturnResult<RecentChange[]>>("get", `/api/v1/monitor/server/setting/history/server/${serverId}/recent`, {
    params: { limit }
  });
}

/**
 * 获取配置变更摘要
 */
export function getChangeSummary(serverId: number, days: number = 30) {
  return http.request<ReturnResult<ChangeSummary>>("get", `/api/v1/monitor/server/setting/history/server/${serverId}/summary`, {
    params: { days }
  });
}

/**
 * 获取配置变更趋势
 */
export function getChangeTrend(serverId: number, days: number = 30) {
  return http.request<ReturnResult<any[]>>("get", `/api/v1/monitor/server/setting/history/server/${serverId}/trend`, {
    params: { days }
  });
}

/**
 * 导出历史记录
 */
export function exportHistory(
  serverId: number,
  startTime?: string,
  endTime?: string,
  format: string = "json"
) {
  return http.request<ReturnResult<string>>("get", `/api/v1/monitor/server/setting/history/server/${serverId}/export`, {
    params: { startTime, endTime, format }
  });
}

/**
 * 删除指定时间之前的历史记录
 */
export function deleteHistoryBeforeTime(beforeTime: string) {
  return http.request<ReturnResult<number>>("delete", "/api/v1/monitor/server/setting/history/cleanup", {
    params: { beforeTime }
  });
}

/**
 * 根据服务器ID删除历史记录
 */
export function deleteHistoryByServerId(serverId: number) {
  return http.request<ReturnResult<number>>("delete", `/api/v1/monitor/server/setting/history/server/${serverId}`);
}

/**
 * 记录配置变更历史
 */
export function recordHistory(data: {
  serverId: number;
  settingId: number;
  changeType: string;
  description: string;
  user?: string;
  settingSnapshot?: string;
  changedFields?: string;
}) {
  return http.request<ReturnResult<boolean>>("post", "/api/v1/monitor/server/setting/history/record", null, {
    params: data
  });
}

/**
 * 检查配置是否有变更
 */
export function hasChanges(serverId: number, newSetting: any) {
  return http.request<ReturnResult<boolean>>("post", `/api/v1/monitor/server/setting/history/server/${serverId}/check-changes`, newSetting);
}

/**
 * 变更类型枚举
 */
export const ChangeType = {
  CREATE: "CREATE",
  UPDATE: "UPDATE", 
  DELETE: "DELETE",
  RESTORE: "RESTORE"
} as const;

/**
 * 变更类型显示名称
 */
export const ChangeTypeNames = {
  [ChangeType.CREATE]: "创建",
  [ChangeType.UPDATE]: "更新",
  [ChangeType.DELETE]: "删除",
  [ChangeType.RESTORE]: "恢复"
} as const;

/**
 * 变更类型颜色
 */
export const ChangeTypeColors = {
  [ChangeType.CREATE]: "success",
  [ChangeType.UPDATE]: "primary",
  [ChangeType.DELETE]: "danger",
  [ChangeType.RESTORE]: "warning"
} as const;
