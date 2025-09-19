import { http } from "@repo/utils";

/**
 * 查找在线视频资源
 * @param params 查询参数
 * @returns 视频资源列表
 */
export const findPlayAddress = (params: any) => {
  return http.request("get", `/v1/video/play/${params.videoId}`, { params });
};
