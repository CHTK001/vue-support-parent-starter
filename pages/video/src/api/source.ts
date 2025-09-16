/**
 * 视频源管理API接口
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */
import { http } from "@repo/utils";
import type { PageResponse, VideoSource, ApiResponse } from "./types";

// API基础路径
const API_BASE = "v1/video/source";

/**
 * 视频源查询参数
 */
export interface SourceQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  platform?: string;
}

/**
 * 批量操作参数
 */
export interface BatchOperationParams {
  ids: number[];
  operation: 'enable' | 'disable' | 'delete';
}

/**
 * 连接测试结果
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  statusCode?: number;
}

/**
 * 获取视频源列表
 * @param params 查询参数
 * @returns 视频源列表
 */
export const getSourceList = (params: SourceQueryParams = {}): Promise<PageResponse<VideoSource>> => {
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...params
  };
  return http.get<PageResponse<VideoSource>>(`${API_BASE}/page`, { params: queryParams });
};

/**
 * 获取视频源详情
 * @param id 视频源ID
 * @returns 视频源详情
 */
export const getSourceDetail = (id: number): Promise<ApiResponse<VideoSource>> => {
  return http.get<ApiResponse<VideoSource>>(`${API_BASE}/detail/${id}`);
};

/**
 * 保存视频源
 * @param data 视频源数据
 * @returns 保存后的视频源
 */
export const saveSource = (data: Omit<VideoSource, 'videoSourceId'>): Promise<ApiResponse<VideoSource>> => {
  return http.post<ApiResponse<VideoSource>>(`${API_BASE}/save`, data);
};

/**
 * 更新视频源
 * @param data 视频源数据
 * @returns 更新后的视频源
 */
export const updateSource = (data: VideoSource): Promise<ApiResponse<VideoSource>> => {
  return http.put<ApiResponse<VideoSource>>(`${API_BASE}/update`, data);
};

/**
 * 删除视频源
 * @param id 视频源ID
 * @returns 删除结果
 */
export const deleteSource = (id: number): Promise<ApiResponse<void>> => {
  return http.delete<ApiResponse<void>>(`${API_BASE}/delete/${id}`);
};

/**
 * 批量删除视频源
 * @param ids 视频源ID数组
 * @returns 删除结果
 */
export const batchDeleteSources = (ids: number[]): Promise<ApiResponse<void>> => {
  return http.delete<ApiResponse<void>>(`${API_BASE}/batch/delete`, { data: { ids } });
};

/**
 * 批量操作视频源
 * @param params 批量操作参数
 * @returns 操作结果
 */
export const batchOperateSources = (params: BatchOperationParams): Promise<ApiResponse<void>> => {
  return http.post<ApiResponse<void>>(`${API_BASE}/batch/operate`, params);
};

/**
 * 切换视频源状态
 * @param id 视频源ID
 * @param enable 是否启用
 * @returns 操作结果
 */
export const toggleSourceStatus = (id: number, enable: boolean): Promise<ApiResponse<void>> => {
  return http.put<ApiResponse<void>>(`${API_BASE}/toggle/${id}`, { enable });
};

/**
 * 测试视频源连接
 * @param id 视频源ID
 * @returns 测试结果
 */
export const testSourceConnection = (id: number): Promise<ApiResponse<ConnectionTestResult>> => {
  return http.post<ApiResponse<ConnectionTestResult>>(`${API_BASE}/test/${id}`);
};

/**
 * 测试视频源连接（通过配置）
 * @param config 视频源配置
 * @returns 测试结果
 */
export const testSourceConnectionByConfig = (config: Partial<VideoSource>): Promise<ApiResponse<ConnectionTestResult>> => {
  return http.post<ApiResponse<ConnectionTestResult>>(`${API_BASE}/test/config`, config);
};

/**
 * 获取视频源统计信息
 * @returns 统计信息
 */
export const getSourceStats = (): Promise<ApiResponse<{
  total: number;
  enabled: number;
  disabled: number;
  platforms: { name: string; count: number }[];
}>> => {
  return http.get<ApiResponse<any>>(`${API_BASE}/stats`);
};

/**
 * 导出视频源配置
 * @param ids 视频源ID数组，为空则导出全部
 * @returns 导出文件流
 */
export const exportSources = (ids?: number[]): Promise<Blob> => {
  const params = ids ? { ids: ids.join(',') } : {};
  return http.get(`${API_BASE}/export`, { 
    params,
    responseType: 'blob'
  });
};

/**
 * 导入视频源配置
 * @param file 配置文件
 * @returns 导入结果
 */
export const importSources = (file: File): Promise<ApiResponse<{
  success: number;
  failed: number;
  errors: string[];
}>> => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<ApiResponse<any>>(`${API_BASE}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
