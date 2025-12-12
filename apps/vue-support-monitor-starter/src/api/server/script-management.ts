/**
 * 脚本管理API服务
 * 只保留核心的CRUD操作
 * @author CH
 * @since 2024-12-11
 */

import { http } from "@repo/utils";

/**
 * 脚本查询参数接口
 */
export interface ScriptQueryParams {
  page: number;
  pageSize: number;
  scriptName?: string;
  scriptType?: string;
  scriptStatus?: number;
  scriptCategory?: string;
}

/**
 * 分页查询脚本列表
 */
export function getScriptPage(params: ScriptQueryParams) {
  return http.post("/script/page", params);
}

/**
 * 根据ID获取脚本详情
 */
export function getScriptById(scriptId: number) {
  return http.get(`/script/${scriptId}`);
}

/**
 * 创建脚本
 */
export function createScript(script: any) {
  return http.post("/script", script);
}

/**
 * 更新脚本
 */
export function updateScript(script: any) {
  return http.put("/script", script);
}

/**
 * 删除脚本
 */
export function deleteScript(scriptId: number) {
  return http.delete(`/script/${scriptId}`);
}

/**
 * 批量删除脚本
 */
export function batchDeleteScripts(scriptIds: number[]) {
  return http.delete("/script/batch", { data: scriptIds });
}

/**
 * 更新脚本状态
 * @param scriptId 脚本 ID
 * @param status 状态（0: 禁用, 1: 启用）
 */
export function updateScriptStatus(scriptId: number, status: number) {
  return http.put(`/script/${scriptId}/status`, null, { params: { status } });
}

/**
 * 复制脚本
 */
export function copyScript(scriptId: number, newScriptName?: string) {
  return http.post(`/script/${scriptId}/copy`, null, {
    params: { newScriptName },
  });
}

/**
 * 检查脚本名称是否可用
 */
export function checkScriptName(scriptName: string, excludeId?: number) {
  return http.get("/script/check-name", {
    params: { scriptName, excludeId },
  });
}

/**
 * 脚本执行记录接口
 */
export interface ScriptExecuteRecord {
  /** 记录ID */
  monitorSysGenScriptExecuteRecordId: number;
  /** 脚本ID */
  monitorSysGenScriptId: number;
  /** 脚本名称 */
  monitorSysGenScriptName?: string;
  /** 脚本类型 */
  monitorSysGenScriptType?: string;
  /** 脚本内容 */
  monitorSysGenScriptContent?: string;
  /** 执行方式: SSH, NODE */
  monitorSysGenScriptExecuteMethod: "SSH" | "NODE";
  /** 执行服务器ID列表（逗号分隔） */
  monitorSysGenScriptExecuteServerIds: string;
  /** 执行服务器名称列表（逗号分隔） */
  monitorSysGenScriptExecuteServerNames?: string;
  /** 执行时间 */
  monitorSysGenScriptExecuteTime: string;
  /** 执行结果: SUCCESS, FAILED, RUNNING, TIMEOUT */
  monitorSysGenScriptExecuteResult: "SUCCESS" | "FAILED" | "RUNNING" | "TIMEOUT";
  /** 执行输出 */
  monitorSysGenScriptExecuteOutput?: string;
  /** 错误信息 */
  monitorSysGenScriptExecuteError?: string;
  /** 耗时（毫秒） */
  monitorSysGenScriptExecuteDuration?: number;
  /** 退出码 */
  monitorSysGenScriptExecuteExitCode?: number;
  /** 执行人 */
  monitorSysGenScriptExecuteUser?: string;
  /** 创建时间 */
  createTime?: string;
}

/**
 * 脚本执行记录查询参数
 */
export interface ScriptExecuteRecordQueryParams {
  page: number;
  pageSize: number;
  scriptId?: number;
  scriptName?: string;
  executeMethod?: string;
  executeResult?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * 脚本执行参数接口
 */
export interface ScriptExecuteParams {
  /** 脚本ID */
  scriptId: number;
  /** 服务器ID */
  serverId: number;
  /** 执行方式: SSH, NODE */
  executeMethod: "SSH" | "NODE";
  /** 执行参数（可选） */
  params?: Record<string, string>;
}

/**
 * 脚本执行结果接口
 */
export interface ScriptExecuteResult {
  /** 是否成功 */
  success: boolean;
  /** 执行输出 */
  output?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 执行时间（毫秒） */
  executionTime?: number;
  /** 退出码 */
  exitCode?: number;
}

/**
 * 执行脚本
 * @param params 执行参数
 */
export function executeScript(params: ScriptExecuteParams) {
  return http.post("/script/execute", params);
}

/**
 * 获取脚本执行历史（按脚本ID）
 * @param scriptId 脚本ID
 * @param page 页码
 * @param pageSize 每页数量
 */
export function getScriptExecuteHistory(scriptId: number, page: number = 1, pageSize: number = 10) {
  return http.get(`/script/${scriptId}/history`, {
    params: { page, pageSize },
  });
}

/**
 * 分页查询脚本执行记录
 * @param params 查询参数
 */
export function getScriptExecuteRecordPage(params: ScriptExecuteRecordQueryParams) {
  return http.post("/script/execute-record/page", params);
}

/**
 * 获取执行记录详情
 * @param recordId 记录ID
 */
export function getScriptExecuteRecordDetail(recordId: number) {
  return http.get(`/script/execute-record/${recordId}`);
}

/**
 * 删除执行记录
 * @param recordId 记录ID
 */
export function deleteScriptExecuteRecord(recordId: number) {
  return http.delete(`/script/execute-record/${recordId}`);
}

/**
 * 批量删除执行记录
 * @param recordIds 记录ID列表
 */
export function batchDeleteScriptExecuteRecords(recordIds: number[]) {
  return http.delete("/script/execute-record/batch", { data: recordIds });
}

/**
 * 清空脚本执行记录
 * @param scriptId 脚本ID（可选，不传则清空所有）
 */
export function clearScriptExecuteRecords(scriptId?: number) {
  return http.delete("/script/execute-record/clear", {
    params: { scriptId },
  });
}
