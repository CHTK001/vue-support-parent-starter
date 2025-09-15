/**
 * 视频搜索API接口
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

import { http } from "@repo/utils";
import type { ApiResponse, PageResponse, VideoKeyword, PanSouResult, PanType } from './types';

// API基础路径
const API_BASE = '/api/video';
const PANSOU_API_BASE = '/api/pansou';

/**
 * 获取热门搜索关键词
 * @param limit 数量限制
 * @returns 热门关键词列表
 */
export const getHotKeywords = (limit: number = 10): Promise<ApiResponse<VideoKeyword[]>> => {
  return http.get(`${API_BASE}/keywords/hot`, { params: { limit } });
};

/**
 * 获取关键词分页列表
 * @param page 页码
 * @param size 每页大小
 * @param keyword 搜索关键词
 * @returns 分页关键词列表
 */
export const getKeywords = (page: number = 1, size: number = 10, keyword?: string): Promise<PageResponse<VideoKeyword>> => {
  return http.get(`${API_BASE}/keywords/list`, {
    params: { page, size, keyword }
  });
};

/**
 * 添加关键词
 * @param keywordData 关键词信息
 * @returns 操作结果
 */
export const addKeyword = (keywordData: VideoKeyword): Promise<ApiResponse<string>> => {
  return http.post(`${API_BASE}/keywords/add`, keywordData);
};

/**
 * 修改关键词
 * @param keywordData 关键词信息
 * @returns 操作结果
 */
export const updateKeyword = (keywordData: VideoKeyword): Promise<ApiResponse<boolean>> => {
  return http.put(`${API_BASE}/keywords/update`, keywordData);
};

/**
 * 删除关键词
 * @param keywordId 关键词ID
 * @returns 操作结果
 */
export const deleteKeyword = (keywordId: string): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/keywords/delete/${keywordId}`);
};

/**
 * 在线搜索视频
 * @param keyword 搜索关键词
 * @param source 搜索源
 * @param page 页码
 * @param size 每页大小
 * @returns 搜索结果
 */
export const searchOnlineVideos = (keyword: string, source?: string, page: number = 1, size: number = 20): Promise<ApiResponse<any>> => {
  return http.get(`${API_BASE}/online/search`, {
    params: { keyword, source, page, size }
  });
};

/**
 * PanSou网盘资源搜索
 * @param keyword 搜索关键词
 * @param panType 网盘类型
 * @param page 页码
 * @param size 每页大小
 * @returns 搜索结果
 */
export const searchPanSouResources = (keyword: string, panType?: PanType, page: number = 1, size: number = 20): Promise<ApiResponse<PanSouResult>> => {
  return http.get(`${PANSOU_API_BASE}/search`, {
    params: { keyword, panType, page, size }
  });
};

/**
 * 获取支持的网盘类型列表
 * @returns 网盘类型列表
 */
export const getSupportedPanTypes = (): Promise<ApiResponse<PanType[]>> => {
  return http.get(`${PANSOU_API_BASE}/pan-types`);
};

/**
 * 获取搜索历史
 * @param limit 数量限制
 * @returns 搜索历史列表
 */
export const getSearchHistory = (limit: number = 10): Promise<ApiResponse<string[]>> => {
  return http.get(`${API_BASE}/search/history`, { params: { limit } });
};

/**
 * 清空搜索历史
 * @returns 操作结果
 */
export const clearSearchHistory = (): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/search/history`);
};

/**
 * 获取搜索建议
 * @param keyword 关键词前缀
 * @param limit 数量限制
 * @returns 搜索建议列表
 */
export const getSearchSuggestions = (keyword: string, limit: number = 10): Promise<ApiResponse<string[]>> => {
  return http.get(`${API_BASE}/search/suggestions`, {
    params: { keyword, limit }
  });
};

/**
 * 记录搜索行为
 * @param keyword 搜索关键词
 * @param source 搜索源
 * @param resultCount 结果数量
 * @returns 操作结果
 */
export const recordSearchBehavior = (keyword: string, source?: string, resultCount?: number): Promise<ApiResponse<boolean>> => {
  return http.post(`${API_BASE}/search/record`, {
    keyword,
    source,
    resultCount,
    timestamp: new Date().toISOString()
  });
};

/**
 * 获取搜索统计信息
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 统计信息
 */
export const getSearchStats = (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
  return http.get(`${API_BASE}/search/stats`, {
    params: { startDate, endDate }
  });
};