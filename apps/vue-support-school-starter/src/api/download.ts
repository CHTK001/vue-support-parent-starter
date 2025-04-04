import { http, type ReturnResult } from "@repo/utils";
import type { DownloadItem } from "../types/upload";


/**
 * 创建新上传下载地址
 * @param data 上传下载地址数据
 * @returns 创建结果
 */
export const createDownload = (data: DownloadItem) => {
  return http.request<ReturnResult<any>>("post", "/v1/video/download/save", { data: data });
};

/**
 * 更新上传下载地址信息
 * @param data 更新的上传下载地址数据
 * @returns 更新结果
 */
export const updateDownload = (data: DownloadItem) => {
  return http.request<ReturnResult<any>>("put", "/v1/video/download/update", { data: data });
};

/**
 * 删除上传下载地址
 * @param downloadId 上传下载地址ID
 * @returns 删除结果
 */
export const deleteDownload = (downloadId: number | string) => {
  return http.request<ReturnResult<any>>("delete", `/v1/video/download/${downloadId}`);
};