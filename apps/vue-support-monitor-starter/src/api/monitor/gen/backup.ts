import { http, type ReturnResult } from "@repo/utils";

/**
 * 启动备份任务
 */
export const fetchGenBackupStart = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/gen/backup/start", { data: params });
};
/**
 * 停止备份任务
 */
export const fetchGenBackupStop = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/gen/backup/stop", { data: params });
};
/**
 * 下载备份文件
 */
export const fetchGenBackupDownload = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/backup/download", { params });
};
