import { http, type ReturnResult } from "@repo/utils";
import type { VideoItem, VideoSyncItem, VideoQuery, VideoSyncQuery } from "@/types/video";

// 视频管理接口
export const getVideoList = (params: any) => {
  return http.request<ReturnResult<VideoItem[]>>("post", "/v1/video/page", { data: params });
};

export const getVideoDetail = (id: string) => {
  return http.request<ReturnResult<VideoItem>>("get", `/v1/video/${id}`);
};

export const createVideo = (data: VideoItem) => {
  return http.request<ReturnResult<any>>("post", "/v1/video/save", { data: data });
};

export const updateVideo = (data: VideoItem) => {
  return http.request<ReturnResult<any>>("put", "/v1/video/update", { data: data });
};

export const deleteVideo = (videoId: number | string) => {
  return http.request<ReturnResult<any>>("delete", `/v1/video/${videoId}`);
};

// 视频同步管理接口
export const getVideoSyncList = (params: VideoSyncQuery) => {
  return http.request<ReturnResult<VideoSyncItem[]>>("get", "/v1/video/sync/page", { params });
};

export const getVideoSyncDetail = (syncId: number | string) => {
  return http.request<ReturnResult<VideoSyncItem>>("get", `/v1/video/sync/${syncId}`);
};

export const createVideoSync = (data: VideoSyncItem) => {
  return http.request<ReturnResult<any>>("post", "/v1/video/sync/save", { data: data });
};

export const updateVideoSync = (data: VideoSyncItem) => {
  return http.request<ReturnResult<any>>("put", "/v1/video/sync/update", { data: data });
};

export const deleteVideoSync = (syncId: number | string) => {
  return http.request<ReturnResult<any>>("delete", `/v1/video/sync/${syncId}`);
};

// 添加执行同步任务的API函数
export const executeSyncTask = (syncId: number | string) => {
  return http.request<ReturnResult<any>>("post", `/v1/video/sync/${syncId}/execute`);
};
