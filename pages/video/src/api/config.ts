/**
 * 视频配置管理API接口
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

import { http } from "@repo/utils";
import type { ApiResponse, PageResponse, VideoSyncConfig } from "./types";

// API基础路径
const API_BASE = "v1/video/sync";

/**
 * 获取同步配置列表
 * @param page 页码
 * @param size 每页大小
 * @param keyword 搜索关键词
 * @returns 分页配置列表
 */
export const getSyncConfigs = (page: number = 1, size: number = 10, keyword?: string): Promise<PageResponse<VideoSyncConfig>> => {
  return http.get(`${API_BASE}/page`, {
    params: { page, size, keyword },
  });
};

/**
 * 获取同步配置详情
 * @param configId 配置ID
 * @returns 配置详情
 */
export const getSyncConfigDetail = (configId: string): Promise<ApiResponse<VideoSyncConfig>> => {
  return http.get(`${API_BASE}/detail/${configId}`);
};

/**
 * 添加同步配置
 * @param config 配置信息
 * @returns 操作结果
 */
export const addSyncConfig = (config: VideoSyncConfig): Promise<ApiResponse<string>> => {
  return http.post(`${API_BASE}/save`, config);
};

/**
 * 修改同步配置
 * @param config 配置信息
 * @returns 操作结果
 */
export const updateSyncConfig = (config: VideoSyncConfig): Promise<ApiResponse<boolean>> => {
  return http.put(`${API_BASE}/update`, config);
};

/**
 * 删除同步配置
 * @param configId 配置ID
 * @returns 操作结果
 */
export const deleteSyncConfig = (configId: string): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/delete/${configId}`);
};

/**
 * 启用/禁用同步配置
 * @param configId 配置ID
 * @param status 状态 (1: 启用, 0: 禁用)
 * @returns 操作结果
 */
export const toggleSyncConfigStatus = (configId: string, status: number): Promise<ApiResponse<boolean>> => {
  return http.put(`${API_BASE}/toggle-status/${configId}`, { status });
};

/**
 * 执行手动同步
 * @param configId 配置ID
 * @returns 操作结果
 */
export const executeSyncConfig = (configId: string): Promise<ApiResponse<boolean>> => {
  return http.post(`${API_BASE}/execute/${configId}`);
};

/**
 * 批量执行同步
 * @param configIds 配置ID列表
 * @returns 操作结果
 */
export const batchExecuteSyncConfigs = (configIds: string[]): Promise<ApiResponse<boolean>> => {
  return http.post(`${API_BASE}/batch-execute`, { configIds });
};

/**
 * 获取同步历史记录
 * @param configId 配置ID
 * @param page 页码
 * @param size 每页大小
 * @returns 同步历史列表
 */
export const getSyncHistory = (configId: string, page: number = 1, size: number = 10): Promise<PageResponse<any>> => {
  return http.get(`${API_BASE}/history/${configId}`, {
    params: { page, size },
  });
};

/**
 * 获取同步状态
 * @param configId 配置ID
 * @returns 同步状态信息
 */
export const getSyncStatus = (configId: string): Promise<ApiResponse<any>> => {
  return http.get(`${API_BASE}/status/${configId}`);
};

/**
 * 停止正在执行的同步任务
 * @param configId 配置ID
 * @returns 操作结果
 */
export const stopSyncTask = (configId: string): Promise<ApiResponse<boolean>> => {
  return http.post(`${API_BASE}/stop/${configId}`);
};

/**
 * 测试同步配置连接
 * @param config 配置信息
 * @returns 测试结果
 */
export const testSyncConfig = (config: Partial<VideoSyncConfig>): Promise<ApiResponse<boolean>> => {
  return http.post(`${API_BASE}/test`, config);
};

/**
 * 获取支持的数据源列表
 * @returns 数据源列表
 */
export const getSupportedSources = (): Promise<ApiResponse<string[]>> => {
  return http.get(`${API_BASE}/sources`);
};

/**
 * 验证Cron表达式
 * @param cronExpression Cron表达式
 * @returns 验证结果
 */
export const validateCronExpression = (cronExpression: string): Promise<ApiResponse<boolean>> => {
  return http.post(`${API_BASE}/validate-cron`, { cronExpression });
};
