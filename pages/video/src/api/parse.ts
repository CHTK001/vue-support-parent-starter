/**
 * 视频解析API接口
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

import { http } from "@repo/utils";
import type { ApiResponse } from "./types";

// API基础路径
const API_BASE = "/api/video/parse";

// 解析接口配置
export interface ParseApiConfig {
  label: string;
  value: string;
  url: string;
  platform?: string;
  description?: string;
}

// 解析结果
export interface ParseResult {
  success: boolean;
  url: string;
  title?: string;
  duration?: string;
  quality?: string;
  size?: string;
  error?: string;
}

// 解析历史记录
export interface ParseHistory {
  id: string;
  originalUrl: string;
  parsedUrl: string;
  apiUsed: string;
  success: boolean;
  createTime: string;
  title?: string;
  platform?: string;
}

/**
 * 获取可用的解析接口列表
 * @returns 解析接口配置列表
 */
export const getParseApis = (): Promise<ApiResponse<ParseApiConfig[]>> => {
  return http.get(`${API_BASE}/apis`);
};

/**
 * 解析视频URL
 * @param url 原始视频URL
 * @param apiId 解析接口ID
 * @returns 解析结果
 */
export const parseVideoUrl = (url: string, apiId: string): Promise<ApiResponse<ParseResult>> => {
  return http.post(`${API_BASE}/parse`, {
    url,
    apiId,
  });
};

/**
 * 批量解析视频URL
 * @param urls 原始视频URL列表
 * @param apiId 解析接口ID
 * @returns 解析结果列表
 */
export const batchParseVideoUrls = (urls: string[], apiId: string): Promise<ApiResponse<ParseResult[]>> => {
  return http.post(`${API_BASE}/batch-parse`, {
    urls,
    apiId,
  });
};

/**
 * 获取解析历史记录
 * @param page 页码
 * @param size 每页大小
 * @returns 解析历史列表
 */
export const getParseHistory = (
  page: number = 1,
  size: number = 20
): Promise<
  ApiResponse<{
    records: ParseHistory[];
    total: number;
    current: number;
    size: number;
  }>
> => {
  return http.get(`${API_BASE}/history`, {
    params: { page, size },
  });
};

/**
 * 清空解析历史记录
 * @returns 操作结果
 */
export const clearParseHistory = (): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/history`);
};

/**
 * 删除指定解析历史记录
 * @param historyId 历史记录ID
 * @returns 操作结果
 */
export const deleteParseHistory = (historyId: string): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/history/${historyId}`);
};

/**
 * 检测视频URL有效性
 * @param url 视频URL
 * @returns 检测结果
 */
export const validateVideoUrl = (
  url: string
): Promise<
  ApiResponse<{
    valid: boolean;
    platform?: string;
    title?: string;
    error?: string;
  }>
> => {
  return http.post(`${API_BASE}/validate`, { url });
};

/**
 * 获取解析统计信息
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 统计信息
 */
export const getParseStats = (
  startDate?: string,
  endDate?: string
): Promise<
  ApiResponse<{
    totalParses: number;
    successParses: number;
    failedParses: number;
    successRate: number;
    popularApis: Array<{ apiId: string; count: number; label: string }>;
    popularPlatforms: Array<{ platform: string; count: number }>;
  }>
> => {
  return http.get(`${API_BASE}/stats`, {
    params: { startDate, endDate },
  });
};

/**
 * 测试解析接口可用性
 * @param apiId 解析接口ID
 * @returns 测试结果
 */
export const testParseApi = (
  apiId: string
): Promise<
  ApiResponse<{
    available: boolean;
    responseTime?: number;
    error?: string;
  }>
> => {
  return http.post(`${API_BASE}/test-api`, { apiId });
};

/**
 * 获取热门视频网站列表
 * @returns 热门网站列表
 */
export const getPopularVideoSites = (): Promise<
  ApiResponse<
    Array<{
      name: string;
      url: string;
      icon: string;
      platform: string;
    }>
  >
> => {
  return http.get(`${API_BASE}/popular-sites`);
};

/**
 * 添加自定义解析接口
 * @param config 解析接口配置
 * @returns 操作结果
 */
export const addCustomParseApi = (config: Omit<ParseApiConfig, "value">): Promise<ApiResponse<string>> => {
  return http.post(`${API_BASE}/custom-api`, config);
};

/**
 * 更新自定义解析接口
 * @param apiId 接口ID
 * @param config 解析接口配置
 * @returns 操作结果
 */
export const updateCustomParseApi = (apiId: string, config: Partial<ParseApiConfig>): Promise<ApiResponse<boolean>> => {
  return http.put(`${API_BASE}/custom-api/${apiId}`, config);
};

/**
 * 删除自定义解析接口
 * @param apiId 接口ID
 * @returns 操作结果
 */
export const deleteCustomParseApi = (apiId: string): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/custom-api/${apiId}`);
};
