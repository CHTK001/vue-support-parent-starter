/**
 * 视频管理API接口
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

import { http } from "@repo/utils";
import type { ApiResponse, PageResponse, VideoDownload, VideoInfo, VideoRating, VideoSearchRequest, VideoStats } from "./types";

// API基础路径
const API_BASE = "/api/video";

/**
 * 搜索视频
 * @param params 搜索参数
 * @returns 分页视频列表
 */
export const searchVideos = (params: VideoSearchRequest): Promise<PageResponse<VideoInfo>> => {
  return http.post(`${API_BASE}/search`, params);
};

/**
 * 获取视频详情
 * @param videoId 视频ID
 * @returns 视频详情
 */
export const getVideoDetail = (videoId: string): Promise<ApiResponse<VideoInfo>> => {
  return http.get(`${API_BASE}/detail/${videoId}`);
};

/**
 * 添加视频
 * @param video 视频信息
 * @returns 操作结果
 */
export const addVideo = (video: VideoInfo): Promise<ApiResponse<string>> => {
  return http.post(`${API_BASE}/add`, video);
};

/**
 * 修改视频
 * @param video 视频信息
 * @returns 操作结果
 */
export const updateVideo = (video: VideoInfo): Promise<ApiResponse<boolean>> => {
  return http.put(`${API_BASE}/update`, video);
};

/**
 * 删除视频
 * @param videoId 视频ID
 * @returns 操作结果
 */
export const deleteVideo = (videoId: string): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/delete/${videoId}`);
};

/**
 * 批量删除视频
 * @param videoIds 视频ID列表
 * @returns 操作结果
 */
export const batchDeleteVideos = (videoIds: string[]): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/batch-delete`, { data: videoIds });
};

/**
 * 获取视频下载地址列表
 * @param videoId 视频ID
 * @returns 下载地址列表
 */
export const getVideoDownloads = (videoId: string): Promise<ApiResponse<VideoDownload[]>> => {
  return http.get(`${API_BASE}/downloads/${videoId}`);
};

/**
 * 添加视频下载地址
 * @param download 下载信息
 * @returns 操作结果
 */
export const addVideoDownload = (download: VideoDownload): Promise<ApiResponse<string>> => {
  return http.post(`${API_BASE}/download/add`, download);
};

/**
 * 更新视频下载地址
 * @param download 下载信息
 * @returns 操作结果
 */
export const updateVideoDownload = (download: VideoDownload): Promise<ApiResponse<boolean>> => {
  return http.put(`${API_BASE}/download/update`, download);
};

/**
 * 删除视频下载地址
 * @param downloadId 下载ID
 * @returns 操作结果
 */
export const deleteVideoDownload = (downloadId: string): Promise<ApiResponse<boolean>> => {
  return http.delete(`${API_BASE}/download/delete/${downloadId}`);
};

/**
 * 获取视频评分列表
 * @param videoId 视频ID
 * @returns 评分列表
 */
export const getVideoRatings = (videoId: string): Promise<ApiResponse<VideoRating[]>> => {
  return http.get(`${API_BASE}/ratings/${videoId}`);
};

/**
 * 添加视频评分
 * @param rating 评分信息
 * @returns 操作结果
 */
export const addVideoRating = (rating: VideoRating): Promise<ApiResponse<string>> => {
  return http.post(`${API_BASE}/rating/add`, rating);
};

/**
 * 获取统计信息
 * @returns 统计数据
 */
export const getVideoStats = (): Promise<ApiResponse<VideoStats>> => {
  return http.get(`${API_BASE}/stats`);
};

/**
 * 获取热门视频
 * @param limit 数量限制
 * @returns 热门视频列表
 */
export const getHotVideos = (limit: number = 10): Promise<ApiResponse<VideoInfo[]>> => {
  return http.get(`${API_BASE}/hot`, { params: { limit } });
};

/**
 * 获取最新视频
 * @param limit 数量限制
 * @returns 最新视频列表
 */
export const getLatestVideos = (limit: number = 10): Promise<ApiResponse<VideoInfo[]>> => {
  return http.get(`${API_BASE}/latest`, { params: { limit } });
};

/**
 * 获取推荐视频
 * @param videoId 基于的视频ID
 * @param limit 数量限制
 * @returns 推荐视频列表
 */
export const getRecommendVideos = (videoId: string, limit: number = 10): Promise<ApiResponse<VideoInfo[]>> => {
  return http.get(`${API_BASE}/recommend/${videoId}`, { params: { limit } });
};
