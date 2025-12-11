/**
 * 简化版脚本管理类型定义
 * 只保留核心的脚本管理功能
 * @author CH
 * @since 2024-12-11
 */

/**
 * 脚本类型枚举
 */
export enum ScriptType {
  SHELL = "SHELL",
  PYTHON = "PYTHON",
  POWERSHELL = "POWERSHELL",
  BATCH = "BATCH",
  JAVASCRIPT = "JAVASCRIPT",
  SQL = "SQL",
}

/**
 * 脚本状态枚举
 */
export enum ScriptStatus {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
}

/**
 * 脚本实体接口
 */
export interface Script {
  monitorSysGenScriptId?: number;
  monitorSysGenScriptName: string;
  monitorSysGenScriptType: ScriptType;
  monitorSysGenScriptDescription?: string;
  monitorSysGenScriptContent: string;
  monitorSysGenScriptStatus: ScriptStatus;
  monitorSysGenScriptVersion?: string;
  monitorSysGenScriptTimeout?: number;
  monitorSysGenScriptCategory?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
}

/**
 * 脚本查询参数接口
 */
export interface ScriptQueryParams {
  page: number;
  pageSize: number;
  monitorSysGenScriptName?: string;
  monitorSysGenScriptType?: ScriptType;
  monitorSysGenScriptStatus?: ScriptStatus;
  monitorSysGenScriptCategory?: string;
}

/**
 * 分页响应接口
 */
export interface PageResponse<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  msg?: string;
  code?: number;
}
