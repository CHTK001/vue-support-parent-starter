import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取prometheus配置
 */
export const fetchPrometheusListConfig = (params: any) => {
  return http.request<ReturnResult<MonitorSysGenPrometheusConfig[]>>("get", "/v2/prometheus/config/list", { params });
};
/**
 * 共享prometheus配置
 */
export const fetchPrometheusShareConfig = (params: any) => {
  return http.request<ReturnResult<MonitorSysGenPrometheusConfig[]>>("get", "/v2/prometheus/config/share", { params });
};

/**
 * 保存prometheus配置
 */
export const fetchPrometheusSaveConfig = (params: MonitorSysGenPrometheusConfig) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/prometheus/config/save", { data: params });
};

/**
 * 更新prometheus配置
 */
export const fetchPrometheusUpdateConfig = (params: MonitorSysGenPrometheusConfig) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/prometheus/config/update", { data: params });
};

/**
 * 删除prometheus配置
 */
export const fetchPrometheusDeleteConfig = (params: MonitorSysGenPrometheusConfig) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/prometheus/config/delete", { params });
};

export interface MonitorSysGenPrometheusConfig {
  createName: string;
  createBy: number;
  createTime: string;
  updateTime: string;
  updateName: string;
  updateBy: number;
  monitorSysGenPrometheusConfigId: number;
  monitorSysGenPrometheusConfigName: string;
  monitorSysGenPrometheusConfigPostion: string;
  monitorSysGenPrometheusConfigQl: string;
  monitorSysGenPrometheusConfigChartType: string;
  monitorSysGenPrometheusConfigEnable: boolean;
  monitorSysGenPrometheusConfigType: string;
  monitorSysGenId: number;
  monitorSysGenPrometheusConfigShare: boolean;
  monitorSysGenPrometheusConfigOrigin: string;
}
