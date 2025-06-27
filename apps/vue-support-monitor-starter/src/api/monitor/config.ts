import { http, type ReturnResult } from "@repo/utils";

/**
 * 监控阈值配置接口
 */
export interface MonitorThresholds {
  cpuWarningThreshold?: number;
  cpuCriticalThreshold?: number;
  memoryWarningThreshold?: number;
  memoryCriticalThreshold?: number;
  diskWarningThreshold?: number;
  diskCriticalThreshold?: number;
  networkThreshold?: number;
  responseTimeThreshold?: number;
}

/**
 * 全局监控配置接口
 */
export interface GlobalMonitorConfig {
  defaultMonitorInterval?: number;
  dataRetentionDays?: number;
  alertNotificationMethod?: string;
}

/**
 * 获取监控阈值配置
 */
export const getMonitorThresholds = () => {
  return http.request<ReturnResult<MonitorThresholds>>("get", "/v1/monitor/config/thresholds");
};

/**
 * 保存监控阈值配置
 */
export const saveMonitorThresholds = (data: MonitorThresholds) => {
  return http.request<ReturnResult<boolean>>("post", "/v1/monitor/config/thresholds", { data });
};

/**
 * 获取全局监控配置
 */
export const getGlobalMonitorConfig = () => {
  return http.request<ReturnResult<GlobalMonitorConfig>>("get", "/v1/monitor/config/global");
};

/**
 * 保存全局监控配置
 */
export const saveGlobalMonitorConfig = (data: GlobalMonitorConfig) => {
  return http.request<ReturnResult<boolean>>("post", "/v1/monitor/config/global", { data });
};

/**
 * 重置监控配置为默认值
 */
export const resetMonitorConfig = () => {
  return http.request<ReturnResult<boolean>>("post", "/v1/monitor/config/reset");
};

/**
 * 测试告警配置
 */
export const testAlertConfig = (data: { type: string; config: any }) => {
  return http.request<ReturnResult<boolean>>("post", "/v1/monitor/config/test-alert", { data });
};
