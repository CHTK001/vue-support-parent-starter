import type { VideoItem } from "@/types/video";
import { http, type ReturnResult } from "@repo/utils";

/**
 * 查找在线视频资源
 * @param params 查询参数
 * @returns 视频资源列表
 */
export const findOnlineResources = (params: any) => {
  return http.request<ReturnResult<VideoItem[]>>("get", "/v1/video/online/find", { params });
};
