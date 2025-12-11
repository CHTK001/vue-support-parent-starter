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
  monitorSysGenScriptName?: string;
  monitorSysGenScriptType?: string;
  monitorSysGenScriptStatus?: string;
  monitorSysGenScriptCategory?: string;
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
 */
export function updateScriptStatus(scriptId: number, status: string) {
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
