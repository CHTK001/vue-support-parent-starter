import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取应用列表
 */
export const fetchListFileSystem = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v2/filesystem/list", { params });
};
