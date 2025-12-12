import { http, type ReturnResult } from "@repo/utils";

/**
 * 备份信息
 */
export interface BackupInfo {
  fileName: string;
  size: number;
  lastModified: number;
  description?: string;
  backupTime?: number;
  applicationName?: string;
}

/**
 * 升级包信息
 */
export interface UpgradePackageInfo {
  fileName: string;
  size: number;
  lastModified: number;
}

/**
 * 升级状态
 */
export interface UpgradeStatus {
  applicationName: string;
  currentVersion: string;
  jarPath: string;
  jarSize: number;
  lastModified: number;
}

/**
 * 还原预览
 */
export interface RestorePreview {
  backupTime: number;
  description: string;
  differenceCount: number;
  differences: RestoreDifference[];
}

/**
 * 还原差异
 */
export interface RestoreDifference {
  key: string;
  backupValue: string;
  currentValue: string;
  status: "新增" | "修改";
}

// ==================== 备份功能 ====================

/**
 * 创建节点配置备份
 */
export function createBackupForMaintenance(
  ipAddress: string,
  port: number,
  description: string = "手动备份"
) {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "post",
    "/v1/node/maintenance/backup/create",
    { params: { ipAddress, port, description } }
  );
}

/**
 * 获取节点备份列表
 */
export function listBackupsForMaintenance(ipAddress: string, port: number) {
  return http.request<ReturnResult<BackupInfo[]>>(
    "get",
    "/v1/node/maintenance/backup/list",
    { params: { ipAddress, port } }
  );
}

/**
 * 删除节点备份
 */
export function deleteBackupForMaintenance(
  ipAddress: string,
  port: number,
  fileName: string
) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "/v1/node/maintenance/backup/delete",
    { params: { ipAddress, port, fileName } }
  );
}

/**
 * 获取备份内容
 */
export function getBackupContentForMaintenance(
  ipAddress: string,
  port: number,
  fileName: string
) {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    "/v1/node/maintenance/backup/content",
    { params: { ipAddress, port, fileName } }
  );
}

// ==================== 升级功能 ====================

/**
 * 获取升级包列表
 */
export function listUpgradePackagesForMaintenance(
  ipAddress: string,
  port: number
) {
  return http.request<ReturnResult<UpgradePackageInfo[]>>(
    "get",
    "/v1/node/maintenance/upgrade/list",
    { params: { ipAddress, port } }
  );
}

/**
 * 上传升级包
 */
export function uploadUpgradePackageForMaintenance(
  ipAddress: string,
  port: number,
  fileName: string,
  fileContent: string
) {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "post",
    "/v1/node/maintenance/upgrade/upload",
    { params: { ipAddress, port, fileName }, data: fileContent }
  );
}

/**
 * 执行升级
 */
export function executeUpgradeForMaintenance(
  ipAddress: string,
  port: number,
  fileName: string,
  autoRestart: boolean = true,
  autoBackup: boolean = true
) {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "post",
    "/v1/node/maintenance/upgrade/execute",
    { params: { ipAddress, port, fileName, autoRestart, autoBackup } }
  );
}

/**
 * 获取升级状态
 */
export function getUpgradeStatusForMaintenance(ipAddress: string, port: number) {
  return http.request<ReturnResult<UpgradeStatus>>(
    "get",
    "/v1/node/maintenance/upgrade/status",
    { params: { ipAddress, port } }
  );
}

// ==================== 还原功能 ====================

/**
 * 预览还原
 */
export function previewRestoreForMaintenance(
  ipAddress: string,
  port: number,
  fileName: string
) {
  return http.request<ReturnResult<RestorePreview>>(
    "get",
    "/v1/node/maintenance/restore/preview",
    { params: { ipAddress, port, fileName } }
  );
}

/**
 * 执行还原
 */
export function executeRestoreForMaintenance(
  ipAddress: string,
  port: number,
  fileName: string
) {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "post",
    "/v1/node/maintenance/restore/execute",
    { params: { ipAddress, port, fileName } }
  );
}
