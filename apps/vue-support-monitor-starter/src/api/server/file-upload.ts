///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { http, type ReturnResult } from "@repo/utils";

// ==================== 类型定义 ====================

/**
 * 服务器文件上传任务接口
 */
export interface ServerFileUploadTask {
  monitorSysGenServerFileUploadTaskId: number;
  monitorSysGenServerId: number;
  monitorSysGenServerFileUploadTaskName: string;
  monitorSysGenServerFileUploadFileName: string;
  monitorSysGenServerFileUploadFilePath: string;
  monitorSysGenServerFileUploadFileSize: number;
  monitorSysGenServerFileUploadFileMd5: string;
  monitorSysGenServerFileUploadTargetPath: string;
  monitorSysGenServerFileUploadMode: string;
  monitorSysGenServerFileUploadStatus: string;
  monitorSysGenServerFileUploadScheduledTime?: string;
  monitorSysGenServerFileUploadPriority: number;
  monitorSysGenServerFileUploadRetryCount: number;
  monitorSysGenServerFileUploadMaxRetry: number;
  monitorSysGenServerFileUploadTimeoutSeconds: number;
  monitorSysGenServerFileUploadOverwriteEnabled: boolean;
  monitorSysGenServerFileUploadBackupEnabled: boolean;
  monitorSysGenServerFileUploadCompressEnabled: boolean;
  monitorSysGenServerFileUploadVerifyEnabled: boolean;
  monitorSysGenServerFileUploadDescription?: string;
  monitorSysGenServerFileUploadTags?: string;
  monitorSysGenServerFileUploadCreateUser: string;
  monitorSysGenServerFileUploadCreateTime: string;
  monitorSysGenServerFileUploadUpdateTime: string;
  monitorSysGenServerFileUploadStartTime?: string;
  monitorSysGenServerFileUploadEndTime?: string;
  monitorSysGenServerFileUploadTaskStatus: number;
}

/**
 * 服务器文件上传记录接口
 */
export interface ServerFileUploadRecord {
  monitorSysGenServerFileUploadRecordId: number;
  monitorSysGenServerFileUploadTaskId: number;
  monitorSysGenServerId: number;
  monitorSysGenServerFileUploadTargetPath: string;
  monitorSysGenServerFileUploadStatus: string;
  monitorSysGenServerFileUploadProgress: number;
  monitorSysGenServerFileUploadSpeed: number;
  monitorSysGenServerFileUploadTransferredBytes: number;
  monitorSysGenServerFileUploadTotalBytes: number;
  monitorSysGenServerFileUploadStartTime?: string;
  monitorSysGenServerFileUploadEndTime?: string;
  monitorSysGenServerFileUploadDurationMs?: number;
  monitorSysGenServerFileUploadErrorMessage?: string;
  monitorSysGenServerFileUploadErrorCode?: string;
  monitorSysGenServerFileUploadRetryCount: number;
  monitorSysGenServerFileUploadFileMd5Remote?: string;
  monitorSysGenServerFileUploadVerificationStatus?: string;
  monitorSysGenServerFileUploadBackupPath?: string;
  monitorSysGenServerFileUploadCreateTime: string;
  monitorSysGenServerFileUploadUpdateTime: string;
}

/**
 * 服务器文件上传请求参数
 */
export interface ServerFileUploadRequest {
  serverId: number;
  taskName: string;
  targetPath: string;
  uploadMode?: string;
  scheduledTime?: string;
  priority?: number;
  overwrite?: boolean;
  backup?: boolean;
  compress?: boolean;
  verify?: boolean;
  description?: string;
  tags?: string;
  timeoutSeconds?: number;
  maxRetry?: number;
}

/**
 * 服务器文件上传任务分页查询参数
 */
export interface ServerFileUploadTaskPageParams {
  current?: number;
  size?: number;
  monitorSysGenServerId?: number;
  monitorSysGenServerFileUploadTaskName?: string;
  monitorSysGenServerFileUploadStatus?: string;
  monitorSysGenServerFileUploadMode?: string;
  monitorSysGenServerFileUploadCreateUser?: string;
}

/**
 * 批量操作参数
 */
export interface BatchServerFileUploadOperationParams {
  taskIds: number[];
  action: 'start' | 'cancel' | 'retry' | 'delete';
}

// ==================== API 函数 ====================

/**
 * 创建服务器文件上传任务
 * @param file 文件对象
 * @param request 上传请求参数
 * @returns 创建结果
 */
export function createServerFileUploadTask(file: File, request: ServerFileUploadRequest) {
  const formData = new FormData();
  formData.append("file", file);
  
  // 添加其他参数
  Object.keys(request).forEach(key => {
    const value = request[key as keyof ServerFileUploadRequest];
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  return http.post("server/file-upload/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/**
 * 分页查询服务器文件上传任务列表
 * @param params 查询参数
 * @returns 任务分页数据
 */
export function getServerFileUploadTaskPage(params: ServerFileUploadTaskPageParams) {
  return http.request<ReturnResult<{ records: ServerFileUploadTask[]; total: number }>>(
    "get",
    "server/file-upload/page",
    { params }
  );
}

/**
 * 根据ID查询服务器文件上传任务
 * @param taskId 任务ID
 * @returns 任务详细信息
 */
export function getServerFileUploadTaskById(taskId: number) {
  return http.request<ReturnResult<ServerFileUploadTask>>(
    "get",
    `server/file-upload/${taskId}`
  );
}

/**
 * 查询服务器的活跃上传任务
 * @param serverId 服务器ID
 * @returns 活跃任务
 */
export function getActiveTaskByServerId(serverId: number) {
  return http.request<ReturnResult<ServerFileUploadTask | null>>(
    "get",
    `server/file-upload/active/${serverId}`
  );
}

/**
 * 启动服务器文件上传任务
 * @param taskId 任务ID
 * @returns 启动结果
 */
export function startServerFileUploadTask(taskId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `server/file-upload/${taskId}/start`
  );
}

/**
 * 取消服务器文件上传任务
 * @param taskId 任务ID
 * @returns 取消结果
 */
export function cancelServerFileUploadTask(taskId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `server/file-upload/${taskId}/cancel`
  );
}

/**
 * 重试服务器文件上传任务
 * @param taskId 任务ID
 * @returns 重试结果
 */
export function retryServerFileUploadTask(taskId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `server/file-upload/${taskId}/retry`
  );
}

/**
 * 删除服务器文件上传任务
 * @param taskId 任务ID
 * @returns 删除结果
 */
export function deleteServerFileUploadTask(taskId: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `server/file-upload/${taskId}`
  );
}

/**
 * 获取服务器文件上传任务统计信息
 * @returns 统计数据
 */
export function getServerFileUploadTaskStatistics() {
  return http.request<ReturnResult<any>>(
    "get",
    "server/file-upload/statistics"
  );
}

/**
 * 验证服务器是否支持文件上传
 * @param serverId 服务器ID
 * @returns 验证结果
 */
export function validateServerForUpload(serverId: number) {
  return http.request<ReturnResult<boolean>>(
    "get",
    `server/file-upload/server/${serverId}/validate`
  );
}

/**
 * 获取任务队列状态
 * @returns 队列状态
 */
export function getTaskQueueStatus() {
  return http.request<ReturnResult<any>>(
    "get",
    "server/file-upload/queue/status"
  );
}

/**
 * 优化任务队列
 * @returns 优化结果
 */
export function optimizeTaskQueue() {
  return http.request<ReturnResult<any>>(
    "post",
    "server/file-upload/queue/optimize"
  );
}

/**
 * 批量取消任务
 * @param taskIds 任务ID列表
 * @returns 操作结果
 */
export function batchCancelTasks(taskIds: number[]) {
  return http.request<ReturnResult<any>>(
    "post",
    "server/file-upload/batch/cancel",
    { data: { taskIds } }
  );
}

/**
 * 批量重试任务
 * @param taskIds 任务ID列表
 * @returns 操作结果
 */
export function batchRetryTasks(taskIds: number[]) {
  return http.request<ReturnResult<any>>(
    "post",
    "server/file-upload/batch/retry",
    { data: { taskIds } }
  );
}

// ==================== 常量和枚举 ====================

/**
 * 上传模式枚举
 */
export const UPLOAD_MODE = {
  REALTIME: "REALTIME",
  SCHEDULED: "SCHEDULED",
} as const;

export type UploadMode = typeof UPLOAD_MODE[keyof typeof UPLOAD_MODE];

/**
 * 任务状态枚举
 */
export const TASK_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

/**
 * 上传状态枚举
 */
export const UPLOAD_STATUS = {
  PENDING: "PENDING",
  UPLOADING: "UPLOADING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type UploadStatus = typeof UPLOAD_STATUS[keyof typeof UPLOAD_STATUS];