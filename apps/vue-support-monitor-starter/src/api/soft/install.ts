import { http, type ReturnResult } from "@repo/utils";

/**
 * 安装服务
 */
export interface InstallRequest {
  softServiceId: number;
  sshIds: string[];
}
/**
 * 停止安装服务
 */
export interface StopInstallRequest {
  installId: string;
}
/**
 * 卸载服务
 */
export interface UninstallRequest {
  installId: string;
}
/**
 * 服务日志
 */
export interface ServiceRequest {
  installId: string;
  lines?: number;
}

/**
 * 安装软件服务
 */
export function fetchSoftServiceInstall(data: InstallRequest) {
  return http.request<ReturnResult<boolean>>("post", "/v1/soft/service/install/batch/install", {
    params: {
      softServiceId: data.softServiceId,
    },
    data: data.sshIds,
  });
}

/**
 * 停止安装服务
 */
export const fetchSoftServiceStopInstall = (params: StopInstallRequest) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/install/stopInstall/${params.installId}`);
};

/**
 * 卸载软件服务
 */
export function fetchSoftServiceUninstall(data: UninstallRequest) {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/install/uninstall/${data.installId}`);
}

/**
 * 启动软件服务
 */
export function fetchSoftServiceStartService(data: ServiceRequest) {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/install/start/${data.installId}`);
}

/**
 * 停止软件服务
 */
export function fetchSoftServiceStopService(data: ServiceRequest) {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/install/stop/${data.installId}`);
}

/**
 * 重启软件服务
 */
export function fetchSoftServiceRestartService(data: ServiceRequest) {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/install/restart/${data.installId}`);
}

/**
 * 获取服务日志
 */
export const fetchSoftServiceLog = (params: ServiceRequest) => {
  return http.request<ReturnResult<string>>("get", `/v1/soft/service/install/log/${params.installId}`);
};

/**
 * 获取软件安装状态
 */
export function fetchSoftServiceInstallStatus(params: ServiceRequest) {
  return http.request<ReturnResult<string>>("get", `/v1/soft/service/install/status/${params.installId}`);
}

/**
 * 启动服务日志
 */
export const fetchSoftMonitorLogStart = (params: ServiceRequest) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/log/monitor/start/${params.installId}`);
};

/**
 * 停止服务日志
 */
export const fetchSoftMonitorLogStop = (params: ServiceRequest) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/log/monitor/stop/${params.installId}`);
};
