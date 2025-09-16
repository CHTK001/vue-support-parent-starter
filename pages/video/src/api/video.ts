import { http, type ReturnResult } from "@repo/utils";
import type { VideoItem, VideoSyncItem, VideoSyncQuery } from "../types/video";

/**
 * 视频管理接口部分
 */

/**
 * 获取视频列表
 * @param params 查询参数
 * @returns 视频列表数据
 */
export const getVideoList = (params: any) => {
  return http.request<ReturnResult<VideoItem[]>>("post", "/v1/video/page", { data: params });
};

/**
 * 获取视频详情
 * @param id 视频ID
 * @returns 视频详细信息
 */
export const getVideoDetail = (id: string) => {
  return http.request<ReturnResult<VideoItem>>("get", `/v1/video/${id}`);
};

/**
 * 获取热门搜索关键词
 * @returns 热门关键词列表
 */
export const getVideoHotKeywords = () => {
  return http.request<ReturnResult<any>>("get", "/v1/video/hotKeywords");
};

/**
 * 创建新视频
 * @param data 视频数据
 * @returns 创建结果
 */
export const createVideo = (data: VideoItem) => {
  return http.request<ReturnResult<any>>("post", "/v1/video/save", { data: data });
};

/**
 * 更新视频信息
 * @param data 更新的视频数据
 * @returns 更新结果
 */
export const updateVideo = (data: VideoItem) => {
  return http.request<ReturnResult<any>>("put", "/v1/video/update", { data: data });
};

/**
 * 删除视频
 * @param videoId 视频ID
 * @returns 删除结果
 */
export const deleteVideo = (videoId: number | string) => {
  return http.request<ReturnResult<any>>("delete", `/v1/video/${videoId}`);
};

/**
 * 视频同步管理接口部分
 */

/**
 * 获取视频同步列表
 * @param params 同步查询参数
 * @returns 视频同步列表数据
 */
export const getVideoSyncList = (params: VideoSyncQuery) => {
  return http.request<ReturnResult<VideoSyncItem[]>>("get", "/v1/video/sync/page", { params });
};

/**
 * 获取视频同步详情
 * @param syncId 同步ID
 * @returns 同步详细信息
 */
export const getVideoSyncDetail = (syncId: number | string) => {
  return http.request<ReturnResult<VideoSyncItem>>("get", `/v1/video/sync/${syncId}`);
};

/**
 * 创建视频同步任务
 * @param data 同步任务数据
 * @returns 创建结果
 */
export const createVideoSync = (data: VideoSyncItem) => {
  return http.request<ReturnResult<any>>("post", "/v1/video/sync/save", { data: data });
};

/**
 * 更新视频同步任务
 * @param data 更新的同步任务数据
 * @returns 更新结果
 */
export const updateVideoSync = (data: VideoSyncItem) => {
  return http.request<ReturnResult<any>>("put", "/v1/video/sync/update", { data: data });
};

/**
 * 删除视频同步任务
 * @param syncId 同步任务ID
 * @returns 删除结果
 */
export const deleteVideoSync = (syncId: number | string) => {
  return http.request<ReturnResult<any>>("delete", `/v1/video/sync/${syncId}`);
};

/**
 * 执行同步任务
 * @param syncId 同步任务ID
 * @returns 执行结果
 */
export const executeSyncTask = (syncId: number | string) => {
  return http.request<ReturnResult<any>>("post", `/v1/video/sync/${syncId}/execute`);
};
