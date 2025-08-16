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
import request from "../config";

// ==================== 类型定义 ====================

/**
 * 服务器脚本接口（与后端MonitorSysGenScript实体类对应）
 */
export interface ServerScript {
  monitorSysGenScriptId: number;
  monitorSysGenScriptName: string;
  monitorSysGenScriptDescription?: string;
  monitorSysGenScriptContent: string;
  monitorSysGenScriptType: string;
  monitorSysGenScriptLanguage: string;
  monitorSysGenScriptVersion: string;
  monitorSysGenScriptCategory?: string;
  monitorSysGenScriptTags?: string;
  monitorSysGenScriptParameters?: string;
  monitorSysGenScriptTimeoutSeconds: number;
  monitorSysGenScriptRetryCount: number;
  monitorSysGenScriptIsTemplate: number;
  monitorSysGenScriptIsPublic: number;
  monitorSysGenScriptExecutionMode: string;
  monitorSysGenScriptWorkingDirectory?: string;
  monitorSysGenScriptEnvironmentVars?: string;
  monitorSysGenScriptDependencies?: string;
  monitorSysGenScriptValidationRules?: string;
  monitorSysGenScriptAuthor: string;
  monitorSysGenScriptLastExecuteTime?: string;
  monitorSysGenScriptExecuteCount: number;
  monitorSysGenScriptStatus: "ENABLED" | "DISABLED";
  // 继承自SysBase的字段
  createTime: string;
  updateTime: string;
  createBy: string;
  updateBy: string;
}

/**
 * 脚本执行记录接口（与后端MonitorSysGenScriptExecution实体类对应）
 */
export interface ScriptExecution {
  monitorSysGenScriptExecutionId: number;
  monitorSysGenScriptId: number;
  monitorSysGenServerId: number;
  monitorSysGenScriptExecutionName?: string;
  monitorSysGenScriptExecutionParameters?: string;
  monitorSysGenScriptExecutionStatus: string;
  monitorSysGenScriptExecutionMode: string;
  monitorSysGenScriptExecutionPriority: number;
  monitorSysGenScriptExecutionStartTime?: string;
  monitorSysGenScriptExecutionEndTime?: string;
  monitorSysGenScriptExecutionDurationMs?: number;
  monitorSysGenScriptExecutionExitCode?: number;
  monitorSysGenScriptExecutionOutput?: string;
  monitorSysGenScriptExecutionErrorOutput?: string;
  monitorSysGenScriptExecutionWorkingDirectory?: string;
  monitorSysGenScriptExecutionEnvironmentVars?: string;
  monitorSysGenScriptExecutionProcessId?: string;
  monitorSysGenScriptExecutionTriggerType: string;
  monitorSysGenScriptExecutionTriggerUser?: string;
  monitorSysGenScriptExecutionRetryCount: number;
  monitorSysGenScriptExecutionMaxRetry: number;
  monitorSysGenScriptExecutionParentId?: number;
  monitorSysGenScriptExecutionScheduledTime?: string;
  monitorSysGenScriptExecutionTimeoutSeconds: number;
  monitorSysGenScriptExecutionTags?: string;
  monitorSysGenScriptExecutionMetadata?: string;
  monitorSysGenScriptExecutionCreateTime: string;
  monitorSysGenScriptExecutionUpdateTime: string;
}

/**
 * 服务器脚本分页查询参数（与后端实体类字段对应）
 */
export interface ServerScriptPageParams {
  page?: number;
  pageSize?: number;
  monitorSysGenScriptName?: string;
  monitorSysGenScriptType?: string;
  monitorSysGenScriptCategory?: string;
  monitorSysGenScriptCreateUser?: string;
  monitorSysGenScriptIsTemplate?: number;
  monitorSysGenScriptIsPublic?: number;
  monitorSysGenScriptStatus?: number;
}

/**
 * 脚本执行记录分页查询参数（与后端实体类字段对应）
 */
export interface ScriptExecutionPageParams {
  page?: number;
  pageSize?: number;
  monitorSysGenScriptId?: number;
  monitorSysGenServerId?: number;
  monitorSysGenScriptExecutionStatus?: string;
  monitorSysGenScriptExecutionTriggerType?: string;
  monitorSysGenScriptExecutionTriggerUser?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * 服务器脚本保存参数（与后端实体类字段对应）
 */
export interface ServerScriptSaveParams {
  monitorSysGenScriptId?: number;
  monitorSysGenScriptName: string;
  monitorSysGenScriptDescription?: string;
  monitorSysGenScriptContent: string;
  monitorSysGenScriptType: string;
  monitorSysGenScriptLanguage?: string;
  monitorSysGenScriptVersion?: string;
  monitorSysGenScriptCategory?: string;
  monitorSysGenScriptTags?: string;
  monitorSysGenScriptParameters?: string;
  monitorSysGenScriptTimeout?: number;
  monitorSysGenScriptAuthor?: string;
  monitorSysGenScriptStatus?: "ENABLED" | "DISABLED";
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
  action: "enable" | "disable" | "delete" | "export";
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
  // 转换参数格式以匹配后端ScriptQueryDTO
  const queryDTO = {
    scriptName: params.monitorSysGenScriptName,
    scriptType: params.monitorSysGenScriptType,
    scriptCategory: params.monitorSysGenScriptCategory,
    scriptStatus: params.monitorSysGenScriptStatus,
    scriptAuthor: params.monitorSysGenScriptCreateUser,
    pageNum: params.page || 1,
    pageSize: params.pageSize || 10,
  };

  // 后端返回的是IPage<ScriptManagementDTO>格式
  return http.request<
    ReturnResult<{
      records: ServerScript[];
      total: number;
      current: number;
      size: number;
    }>
  >("post", "script/page", { data: queryDTO });
}

/**
 * 获取服务器脚本详情
 * @param id 脚本ID
 * @returns 脚本详细信息
 */
export function getServerScriptDetail(id: number) {
  return http.request<ReturnResult<ServerScript>>("get", `script/${id}`);
}

/**
 * 保存服务器脚本
 * @param data 脚本数据
 * @returns 保存结果
 */
export function saveServerScript(data: ServerScriptSaveParams) {
  return http.request<ReturnResult<ServerScript>>("post", "script", {
    data: data,
  });
}

/**
 * 更新服务器脚本
 * @param data 脚本数据
 * @returns 更新结果
 */
export function updateServerScript(data: ServerScriptSaveParams) {
  return http.request<ReturnResult<ServerScript>>("put", "script", {
    data: data,
  });
}

/**
 * 删除服务器脚本
 * @param id 脚本ID
 * @returns 删除结果
 */
export function deleteServerScript(id: number) {
  return http.request<ReturnResult<boolean>>("delete", `script/${id}`);
}

/**
 * 复制服务器脚本
 * @param id 脚本ID
 * @param newScriptName 新脚本名称
 * @returns 复制结果
 */
export function duplicateServerScript(id: number, newScriptName?: string) {
  return http.request<ReturnResult<ServerScript>>("post", `script/${id}/copy`, {
    params: { newScriptName: newScriptName || `脚本副本_${Date.now()}` },
  });
}

/**
 * 执行服务器脚本
 * @param params 执行参数
 * @returns 执行结果
 */
export function executeServerScript(params: ScriptExecuteParams) {
  return http.request<ReturnResult<ScriptExecution>>(
    "post",
    `script/${params.scriptId}/execute`,
    {
      data: {
        ...params,
      },
    }
  );
}

/**
 * 在节点上执行脚本
 */
export function executeNodeScript(params: {
  nodeId: string | number;
  script: string;
  scriptType?: string;
  workingDirectory?: string;
  timeout?: number;
}) {
  const {
    nodeId,
    script,
    scriptType = "SHELL",
    workingDirectory,
    timeout = 300,
  } = params;
  return http.request<ReturnResult<any>>(
    "post",
    "/node-remote/execute-script",
    {
      params: { nodeId, script, scriptType, workingDirectory, timeout },
    }
  );
}

/**
 * 批量删除服务器脚本
 * @param scriptIds 脚本ID列表
 * @returns 删除结果
 */
export function batchDeleteServerScripts(scriptIds: number[]) {
  return http.request<ReturnResult<boolean>>("delete", "script/batch", {
    data: scriptIds,
  });
}

/**
 * 获取脚本模板
 * @param scriptType 脚本类型
 * @returns 脚本模板内容
 */
export function getScriptTemplate(scriptType: string) {
  return http.request<ReturnResult<string>>(
    "get",
    `script/template/${scriptType}`
  );
}

/**
 * 获取脚本统计信息
 * @returns 统计信息
 */
export function getScriptStatistics() {
  return http.request<ReturnResult<any>>("get", "script/statistics");
}

/**
 * 验证脚本语法
 * @param content 脚本内容
 * @param type 脚本类型
 * @returns 验证结果
 */
export function validateScript(content: string, type: string) {
  return http.request<ReturnResult<boolean>>("post", "script/validate", {
    params: { scriptType: type },
    data: content,
  });
}

/**
 * 导出脚本
 * @param id 脚本ID
 * @returns 文件数据
 */
export function exportScript(id: number) {
  return request({
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

  return request({
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
  // 后端返回的是IPage<MonitorSysGenScriptExecution>格式
  return http.request<
    ReturnResult<{
      records: ScriptExecution[];
      total: number;
      current: number;
      size: number;
    }>
  >("get", "script/execution/history", {
    params: {
      pageNum: params.page || 1,
      pageSize: params.pageSize || 10,
      scriptId: params.monitorSysGenScriptId,
      serverId: params.monitorSysGenServerId,
      status: params.monitorSysGenScriptExecutionStatus,
      triggerType: params.monitorSysGenScriptExecutionTriggerType,
      triggerUser: params.monitorSysGenScriptExecutionTriggerUser,
      startTime: params.startTime,
      endTime: params.endTime,
    },
  });
}

/**
 * 获取所有脚本执行历史（不分页）
 * @param params 查询参数
 * @returns 执行记录列表
 */
export function getAllScriptExecutionHistory(
  params?: Partial<ScriptExecutionPageParams>
) {
  return http.request<ReturnResult<ScriptExecution[]>>(
    "get",
    "script/execution/history/all",
    {
      params: {
        scriptId: params?.monitorSysGenScriptId,
        serverId: params?.monitorSysGenServerId,
        status: params?.monitorSysGenScriptExecutionStatus,
        triggerType: params?.monitorSysGenScriptExecutionTriggerType,
        triggerUser: params?.monitorSysGenScriptExecutionTriggerUser,
        startTime: params?.startTime,
        endTime: params?.endTime,
      },
    }
  );
}

/**
 * 获取脚本执行记录详情
 * @param executionId 执行记录ID
 * @returns 执行记录详细信息
 */
export function getScriptExecutionDetail(executionId: number) {
  return http.request<ReturnResult<ScriptExecution>>(
    "get",
    `script/execution/${executionId}`
  );
}

/**
 * 停止脚本执行
 * @param executionId 执行记录ID
 * @returns 停止结果
 */
export function stopScriptExecution(executionId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `script/execution/${executionId}/stop`
  );
}

/**
 * 获取支持的脚本类型
 * @returns 脚本类型列表
 */
export function getSupportedScriptTypes() {
  return http.request<ReturnResult<any[]>>("get", "script/types");
}

/**
 * 检查脚本名称是否可用
 * @param scriptName 脚本名称
 * @param excludeId 排除的脚本ID
 * @returns 是否可用
 */
export function checkScriptName(scriptName: string, excludeId?: number) {
  return http.request<ReturnResult<boolean>>("get", "script/name/check", {
    params: { scriptName, excludeId },
  });
}

/**
 * 根据分类获取脚本
 * @param category 脚本分类
 * @returns 脚本列表
 */
export function getScriptsByCategory(category: string) {
  return http.request<ReturnResult<ServerScript[]>>(
    "get",
    `script/category/${category}`
  );
}

/**
 * 根据标签搜索脚本
 * @param tag 标签
 * @returns 脚本列表
 */
export function searchScriptsByTag(tag: string) {
  return http.request<ReturnResult<ServerScript[]>>(
    "get",
    "script/search/tag",
    {
      params: { tag },
    }
  );
}

/**
 * 获取最近执行的脚本
 * @param limit 限制数量
 * @returns 脚本列表
 */
export function getRecentExecutedScripts(limit: number = 10) {
  return http.request<ReturnResult<ServerScript[]>>("get", "script/recent", {
    params: { limit },
  });
}

/**
 * 获取热门脚本
 * @param limit 限制数量
 * @returns 脚本列表
 */
export function getPopularScripts(limit: number = 10) {
  return http.request<ReturnResult<ServerScript[]>>("get", "script/popular", {
    params: { limit },
  });
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
  return http.request<ReturnResult<any>>("get", "script/execution/statistics", {
    params: scriptId ? { scriptId } : undefined,
  });
}

/**
 * 获取正在运行的脚本执行记录
 * @returns 正在运行的执行记录列表
 */
export function getRunningScriptExecutions() {
  return http.request<ReturnResult<ScriptExecution[]>>(
    "get",
    "script/execution/running"
  );
}

/**
 * 清理过期的执行记录
 * @param days 保留天数
 * @returns 清理结果
 */
export function cleanExpiredExecutions(days: number) {
  return http.request<ReturnResult<number>>(
    "delete",
    "script/execution/clean",
    { params: { days } }
  );
}

/**
 * 批量删除执行记录
 * @param executionIds 执行记录ID列表
 * @returns 删除结果
 */
export function batchDeleteExecutions(executionIds: number[]) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "script/execution/batch",
    { data: executionIds }
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

export type ScriptType = (typeof SCRIPT_TYPE)[keyof typeof SCRIPT_TYPE];

/**
 * 执行模式枚举
 */
export const EXECUTION_MODE = {
  SYNC: "SYNC",
  ASYNC: "ASYNC",
} as const;

export type ExecutionMode =
  (typeof EXECUTION_MODE)[keyof typeof EXECUTION_MODE];

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

export type ExecutionStatus =
  (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

/**
 * 触发类型枚举
 */
export const TRIGGER_TYPE = {
  MANUAL: "MANUAL",
  SCHEDULED: "SCHEDULED",
  API: "API",
  EVENT: "EVENT",
} as const;

export type TriggerType = (typeof TRIGGER_TYPE)[keyof typeof TRIGGER_TYPE];
