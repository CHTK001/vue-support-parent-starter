import { http, type ReturnResult } from "@repo/utils";
import { SoftServiceLog } from "./types";

/**
 * 安装软件服务
 */
export function fetchSoftServiceInstallLog(data: { installId: string }) {
  return http.request<ReturnResult<boolean>>("get", `/v1/soft/service/install/ssh/${data.installId}`);
}

/**
 * 获取服务操作日志
 */
export function fetchServiceOperationLog(data: { installId: number; operationType: string }) {
  return http.request<ReturnResult<string>>("get", `/v1/soft/service/log/content`, {
    params: {
      installId: data.installId,
      operationType: data.operationType,
    },
  });
}

/**
 * 获取服务日志文件列表
 */
export function fetchServiceLogFiles(data: { installId: number }) {
  return http.request<ReturnResult<string[]>>("get", `/v1/soft/service/log/files/${data.installId}`);
}

/**
 * 下载服务操作日志文件
 */
export function downloadServiceOperationLog(data: { installId: number; operationType: string }) {
  const url = `/v1/soft/service/log/download?installId=${data.installId}&operationType=${data.operationType}`;
  window.open(url, "_blank");
  return Promise.resolve();
}

/**
 * 分页查询日志列表
 */
export function fetchServiceLogList(data: { page: number; size: number; installId?: number; serviceId?: number; sshId?: string; type?: number; status?: number; operationType?: string }) {
  return http.request<ReturnResult<{ records: SoftServiceLog[]; total: number }>>("get", `/v1/soft/service/log/page`, {
    params: {
      page: data.page,
      size: data.size,
      "softServiceLog.softServiceLogInstallId": data.installId,
      "softServiceLog.softServiceLogServiceId": data.serviceId,
      "softServiceLog.softServiceLogSshId": data.sshId,
      "softServiceLog.softServiceLogType": data.type,
      "softServiceLog.softServiceLogStatus": data.status,
      "softServiceLog.softServiceLogOperationType": data.operationType,
    },
  });
}

/**
 * 根据安装ID查询日志列表
 */
export function fetchLogsByInstallId(data: { installId: number }) {
  return http.request<ReturnResult<SoftServiceLog[]>>("get", `/v1/soft/service/log/list/${data.installId}`);
}

/**
 * 清理指定安装ID的日志
 */
export function cleanLogsByInstallId(data: { installId: number }) {
  return http.request<ReturnResult<boolean>>("delete", `/v1/soft/service/log/clean/${data.installId}`);
}

/**
 * 追加日志内容
 */
export function appendLogContent(data: { installId: number; operationType: string; content: string }) {
  return http.request<ReturnResult<boolean>>("post", `/v1/soft/service/log/append`, {
    params: {
      installId: data.installId,
      operationType: data.operationType,
    },
    data: data.content,
  });
}
