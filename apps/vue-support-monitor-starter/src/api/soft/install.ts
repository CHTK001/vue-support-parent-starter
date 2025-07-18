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
  type?: string; // 增加日志类型参数：install, start, stop, restart, uninstall
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
 * 添加安装服务
 */
export const fetchSoftServiceInstallAdd = (data: any) => {
  return http.request<ReturnResult<any>>("post", `v1/soft/service/install/add`, {
    data,
  });
};
/**
 * 更新安装服务
 */
export const fetchSoftServiceInstallUpdate = (data: any) => {
  return http.request<ReturnResult<any>>("put", `v1/soft/service/install/update`, {
    data,
  });
};

export const fetchSoftServiceInstallByServiceId = (data: any) => {
  return http.request<ReturnResult<any>>("get", `v1/soft/service/install/service/${data.softServiceId}`);
};

/**
 * 删除安装服务
 */
export const fetchSoftServiceInstallDelete = (data: any) => {
  return http.request<ReturnResult<any>>("delete", `v1/soft/service/install/delete/${data.installId}`);
};
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
  let url = `/v1/soft/service/install/log/${params.installId}`;
  // 如果指定了日志类型，添加到URL中
  if (params.type) {
    url += `/${params.type}`;
  }
  // 如果指定了行数，添加到URL中
  if (params.lines) {
    url += `?lines=${params.lines}`;
  }

  return http.request<ReturnResult<string>>("get", url);
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
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/install/log/monitor/start/${params.installId}`);
};

/**
 * 停止服务日志
 */
export const fetchSoftMonitorLogStop = (params: ServiceRequest) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/install/log/monitor/stop/${params.installId}`);
};

export interface SoftServiceInstall {
  createName: string;
  createBy: number;
  createTime: string;
  updateTime: string;
  updateName: string;
  updateBy: number;
  installId: number;
  sshId: string;
  softServiceId: number;
  installStatus: number;
  installPath: string;
  installLogPath: string;
  serviceLogPath: string;
  installVersion: string;
  installTime: number;
  installLastStartTime: number;
  installLastStopTime: number;
  installRunStatus: number;
  installConfigPath: string;
  installLastCheckTime: number;
  sshHost: string;
  sshPort: number;
  sshName: string;
  softServiceName: string;
  softServiceInstallCommand: string;
  softServiceInstallCommandType: number;
  softServiceUninstallCommand: string;
  softServiceUninstallCommandType: number;
  softServiceStartCommand: string;
  softServiceStartCommandType: number;
  softServiceStopCommand: string;
  softServiceStopCommandType: number;
  softServiceRestartCommand: string;
  softServiceRestartCommandType: number;
  softServiceStatusCheckCommand: string;
  softServiceStatusCheckCommandType: number;
  softServiceStatusCheckSuccessFlag: string;
  softServiceStatusCheckFailureFlag: string;
  softServiceInstallSuccessFlag: string;
  softServiceInstallFailureFlag: string;
  softServiceUninstallSuccessFlag: string;
  softServiceUninstallFailureFlag: string;
  softServiceStartSuccessFlag: string;
  softServiceStartFailureFlag: string;
  softServiceStopSuccessFlag: string;
  softServiceStopFailureFlag: string;
  softServiceRestartSuccessFlag: string;
  softServiceRestartFailureFlag: string;
  serviceConfig: string;
  installPathCustom: string;
  installPort: string;
  installDefaultPort: string;
}
