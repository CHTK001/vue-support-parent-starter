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
import axios from "../../config";

// ==================== 类型定义 ====================

/**
 * 服务器脚本接口
 */
export interface ServerScript {
  monitorSysGenServerScriptId: number;
  monitorSysGenServerScriptName: string;
  monitorSysGenServerScriptDescription?: string;
  monitorSysGenServerScriptContent: string;
  monitorSysGenServerScriptType: string;
  monitorSysGenServerScriptLanguage: string;
  monitorSysGenServerScriptVersion: string;
  monitorSysGenServerScriptCategory?: string;
  monitorSysGenServerScriptTags?: string;
  monitorSysGenServerScriptParameters?: string;
  monitorSysGenServerScriptTimeoutSeconds: number;
  monitorSysGenServerScriptRetryCount: number;
  monitorSysGenServerScriptIsTemplate: number;
  monitorSysGenServerScriptIsPublic: number;
  monitorSysGenServerScriptExecutionMode: string;
  monitorSysGenServerScriptWorkingDirectory?: string;
  monitorSysGenServerScriptEnvironmentVars?: string;
  monitorSysGenServerScriptDependencies?: string;
  monitorSysGenServerScriptValidationRules?: string;
  monitorSysGenServerScriptCreateUser: string;
  monitorSysGenServerScriptCreateTime: string;
  monitorSysGenServerScriptUpdateTime: string;
  monitorSysGenServerScriptLastExecutionTime?: string;
  monitorSysGenServerScriptExecutionCount: number;
  monitorSysGenServerScriptSuccessCount: number;
  monitorSysGenServerScriptStatus: number;
}

/**
 * 脚本执行记录接口
 */
export interface ScriptExecution {
  monitorSysGenServerScriptExecutionId: number;
  monitorSysGenServerScriptId: number;
  monitorSysGenServerId: number;
  monitorSysGenServerScriptExecutionName?: string;
  monitorSysGenServerScriptExecutionParameters?: string;
  monitorSysGenServerScriptExecutionStatus: string;
  monitorSysGenServerScriptExecutionMode: string;
  monitorSysGenServerScriptExecutionPriority: number;
  monitorSysGenServerScriptExecutionStartTime?: string;
  monitorSysGenServerScriptExecutionEndTime?: string;
  monitorSysGenServerScriptExecutionDurationMs?: number;
  monitorSysGenServerScriptExecutionExitCode?: number;
  monitorSysGenServerScriptExecutionOutput?: string;
  monitorSysGenServerScriptExecutionErrorOutput?: string;
  monitorSysGenServerScriptExecutionWorkingDirectory?: string;
  monitorSysGenServerScriptExecutionEnvironmentVars?: string;
  monitorSysGenServerScriptExecutionProcessId?: string;
  monitorSysGenServerScriptExecutionTriggerType: string;
  monitorSysGenServerScriptExecutionTriggerUser?: string;
  monitorSysGenServerScriptExecutionRetryCount: number;
  monitorSysGenServerScriptExecutionMaxRetry: number;
  monitorSysGenServerScriptExecutionParentId?: number;
  monitorSysGenServerScriptExecutionScheduledTime?: string;
  monitorSysGenServerScriptExecutionTimeoutSeconds: number;
  monitorSysGenServerScriptExecutionTags?: string;
  monitorSysGenServerScriptExecutionMetadata?: string;
  monitorSysGenServerScriptExecutionCreateTime: string;
  monitorSysGenServerScriptExecutionUpdateTime: string;
}

/**
 * 服务器脚本分页查询参数
 */
export interface ServerScriptPageParams {
  page?: number;
  pageSize?: number;
  monitorSysGenServerScriptName?: string;
  monitorSysGenServerScriptType?: string;
  monitorSysGenServerScriptCategory?: string;
  monitorSysGenServerScriptCreateUser?: string;
  monitorSysGenServerScriptIsTemplate?: number;
  monitorSysGenServerScriptIsPublic?: number;
  monitorSysGenServerScriptStatus?: number;
}

/**
 * 脚本执行记录分页查询参数
 */
export interface ScriptExecutionPageParams {
  page?: number;
  pageSize?: number;
  monitorSysGenServerScriptId?: number;
  monitorSysGenServerId?: number;
  monitorSysGenServerScriptExecutionStatus?: string;
  monitorSysGenServerScriptExecutionTriggerType?: string;
  monitorSysGenServerScriptExecutionTriggerUser?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * 服务器脚本保存参数
 */
export interface ServerScriptSaveParams {
  monitorSysGenServerScriptId?: number;
  monitorSysGenServerScriptName: string;
  monitorSysGenServerScriptDescription?: string;
  monitorSysGenServerScriptContent: string;
  monitorSysGenServerScriptType: string;
  monitorSysGenServerScriptLanguage: string;
  monitorSysGenServerScriptVersion?: string;
  monitorSysGenServerScriptCategory?: string;
  monitorSysGenServerScriptTags?: string;
  monitorSysGenServerScriptParameters?: string;
  monitorSysGenServerScriptTimeoutSeconds?: number;
  monitorSysGenServerScriptRetryCount?: number;
  monitorSysGenServerScriptIsTemplate?: number;
  monitorSysGenServerScriptIsPublic?: number;
  monitorSysGenServerScriptExecutionMode?: string;
  monitorSysGenServerScriptWorkingDirectory?: string;
  monitorSysGenServerScriptEnvironmentVars?: string;
  monitorSysGenServerScriptDependencies?: string;
  monitorSysGenServerScriptValidationRules?: string;
  monitorSysGenServerScriptCreateUser?: string;
  monitorSysGenServerScriptStatus?: number;
}

/**
 * 脚本执行参数
 */
export interface ScriptExecuteParams {
  scriptId: number;
  serverId: number;
  parameters?: string;
  executionMode?: string;
  priority?: number;
  timeoutSeconds?: number;
  workingDirectory?: string;
  environmentVars?: string;
}

/**
 * 批量脚本操作参数
 */
export interface BatchScriptOperationParams {
  ids: number[];
  action: 'enable' | 'disable' | 'delete' | 'export';
}

// ==================== API 函数 ====================

/**
 * 服务器脚本管理 API
 */

/**
 * 分页查询服务器脚本列表
 * @param params 查询参数
 * @returns 脚本分页数据
 */
export function getServerScriptPageList(params: ServerScriptPageParams) {
  return http.request<ReturnResult<{ records: ServerScript[]; total: number }>>(
    "get",
    "v1/gen/server-script/page",
    { params }
  );
}

/**
 * 获取服务器脚本详情
 * @param id 脚本ID
 * @returns 脚本详细信息
 */
export function getServerScriptDetail(id: number) {
  return http.request<ReturnResult<ServerScript>>(
    "get",
    "v1/gen/server-script/page",
    { params: { monitorSysGenServerScriptId: id } }
  );
}

/**
 * 保存服务器脚本
 * @param data 脚本数据
 * @returns 保存结果
 */
export function saveServerScript(data: ServerScriptSaveParams) {
  return http.request<ReturnResult<ServerScript>>(
    "post",
    "v1/gen/server-script/save",
    { data }
  );
}

/**
 * 更新服务器脚本
 * @param data 脚本数据
 * @returns 更新结果
 */
export function updateServerScript(data: ServerScriptSaveParams) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "v1/gen/server-script/update",
    { data }
  );
}

/**
 * 删除服务器脚本
 * @param id 脚本ID
 * @returns 删除结果
 */
export function deleteServerScript(id: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server-script/delete",
    { params: { id: id.toString() } }
  );
}

/**
 * 复制服务器脚本
 * @param id 脚本ID
 * @returns 复制结果
 */
export function duplicateServerScript(id: number) {
  return http.request<ReturnResult<ServerScript>>(
    "post",
    "v1/gen/server-script/duplicate",
    { params: { id: id.toString() } }
  );
}

/**
 * 执行服务器脚本
 * @param params 执行参数
 * @returns 执行结果
 */
export function executeServerScript(params: ScriptExecuteParams) {
  return http.request<ReturnResult<ScriptExecution>>(
    "post",
    "v1/gen/server-script/execute",
    { data: params }
  );
}

/**
 * 批量操作服务器脚本
 * @param params 批量操作参数
 * @returns 操作结果
 */
export function batchOperateServerScripts(params: BatchScriptOperationParams) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server-script/batch-operation",
    { data: params }
  );
}

/**
 * 获取脚本模板列表
 * @returns 模板列表
 */
export function getScriptTemplates() {
  return http.request<ReturnResult<ServerScript[]>>(
    "get",
    "v1/gen/server-script/templates"
  );
}

/**
 * 获取公开脚本列表
 * @returns 公开脚本列表
 */
export function getPublicScripts() {
  return http.request<ReturnResult<ServerScript[]>>(
    "get",
    "v1/gen/server-script/public"
  );
}

/**
 * 验证脚本语法
 * @param content 脚本内容
 * @param type 脚本类型
 * @returns 验证结果
 */
export function validateScript(content: string, type: string) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server-script/validate",
    { data: { content, type } }
  );
}

/**
 * 导出脚本
 * @param id 脚本ID
 * @returns 文件数据
 */
export function exportScript(id: number) {
  return axios({
    url: "v1/gen/server-script/export",
    method: "get",
    params: { id },
    responseType: "blob",
  });
}

/**
 * 导入脚本
 * @param file 脚本文件
 * @returns 导入结果
 */
export function importScript(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  return axios({
    url: "v1/gen/server-script/import",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// ==================== 脚本执行记录 API ====================

/**
 * 分页查询脚本执行记录列表
 * @param params 查询参数
 * @returns 执行记录分页数据
 */
export function getScriptExecutionPageList(params: ScriptExecutionPageParams) {
  return http.request<ReturnResult<{ records: ScriptExecution[]; total: number }>>(
    "get",
    "v1/gen/server-script-execution/page",
    { params }
  );
}

/**
 * 获取脚本执行记录详情
 * @param id 执行记录ID
 * @returns 执行记录详细信息
 */
export function getScriptExecutionDetail(id: number) {
  return http.request<ReturnResult<ScriptExecution>>(
    "get",
    "v1/gen/server-script-execution/page",
    { params: { monitorSysGenServerScriptExecutionId: id } }
  );
}

/**
 * 停止脚本执行
 * @param id 执行记录ID
 * @returns 停止结果
 */
export function stopScriptExecution(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server-script-execution/stop",
    { params: { id: id.toString() } }
  );
}

/**
 * 重试脚本执行
 * @param id 执行记录ID
 * @returns 重试结果
 */
export function retryScriptExecution(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server-script-execution/retry",
    { params: { id: id.toString() } }
  );
}

/**
 * 获取脚本执行输出
 * @param id 执行记录ID
 * @returns 执行输出
 */
export function getScriptExecutionOutput(id: number) {
  return http.request<ReturnResult<{ output: string; errorOutput: string }>>(
    "get",
    "v1/gen/server-script-execution/output",
    { params: { id: id.toString() } }
  );
}

/**
 * 获取脚本执行统计
 * @param scriptId 脚本ID（可选）
 * @returns 统计数据
 */
export function getScriptExecutionStatistics(scriptId?: number) {
  return http.request<ReturnResult<any>>(
    "get",
    "v1/gen/server-script-execution/statistics",
    { params: scriptId ? { scriptId } : undefined }
  );
}

// ==================== 常量和枚举 ====================

/**
 * 脚本类型枚举
 */
export const SCRIPT_TYPE = {
  SHELL: "SHELL",
  PYTHON: "PYTHON",
  POWERSHELL: "POWERSHELL",
  BATCH: "BATCH",
  JAVASCRIPT: "JAVASCRIPT",
} as const;

export type ScriptType = typeof SCRIPT_TYPE[keyof typeof SCRIPT_TYPE];

/**
 * 执行模式枚举
 */
export const EXECUTION_MODE = {
  SYNC: "SYNC",
  ASYNC: "ASYNC",
} as const;

export type ExecutionMode = typeof EXECUTION_MODE[keyof typeof EXECUTION_MODE];

/**
 * 执行状态枚举
 */
export const EXECUTION_STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  TIMEOUT: "TIMEOUT",
} as const;

export type ExecutionStatus = typeof EXECUTION_STATUS[keyof typeof EXECUTION_STATUS];

/**
 * 触发类型枚举
 */
export const TRIGGER_TYPE = {
  MANUAL: "MANUAL",
  SCHEDULED: "SCHEDULED",
  API: "API",
  EVENT: "EVENT",
} as const;

export type TriggerType = typeof TRIGGER_TYPE[keyof typeof TRIGGER_TYPE];
