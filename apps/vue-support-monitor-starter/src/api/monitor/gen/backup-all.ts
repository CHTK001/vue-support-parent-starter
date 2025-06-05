import { http, type ReturnResult } from "@repo/utils";

/**
 * 保存备份设置
 * @param data
 * @returns
 */
export const fetchGenBackupSave = (data: any) => {
  return http.request<ReturnResult<Boolean>>("post", "v1/gen/backup/save", { data });
};

/**
 * 编辑备份设置
 * @param data
 * @returns
 */
export const fetchGenBackupEdit = (data: any) => {
  return http.request<ReturnResult<Boolean>>("put", "v1/gen/backup/update", { data });
};

/**
 * 删除备份设置
 * @param data
 * @returns
 */
export const fetchGenBackupDelete = (data: any) => {
  return http.request<ReturnResult<Boolean>>("delete", `v1/gen/backup/delete/${data.monitorSysGenBackupId}`);
};

/**
 * 查询备份设置
 * @param data
 * @returns
 */
export const fetchGenBackupGet = (data: any) => {
  return http.request<ReturnResult<MonitorSysGenBackup>>("get", `v1/gen/backup/${data.monitorSysGenId}`);
};

/**
 * 启动备份任务
 * @param data
 * @returns
 */
export const fetchGenBackupRun = (data: any) => {
  return http.request<ReturnResult<Boolean>>("get", `v1/gen/backup/run/${data.id}`);
};

export interface MonitorSysGenBackup {
  createName: string;
  createBy: number;
  createTime: string;
  updateTime: string;
  updateName: string;
  updateBy: number;
  monitorSysGenBackupId: number;
  monitorSysGenBackupDay: number;
  monitorSysGenBackupPath: string;
  monitorSysGenBackupStatus: string;
  monitorSysGenBackupRetry: number;
  monitorSysGenBackupEnable: boolean;
  monitorSysGenBackupTimeout: number;
  monitorSysGenBackupRetentionDays: number;
  monitorSysGenId: number;
}
