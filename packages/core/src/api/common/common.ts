import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取模型列表
 */
export const fetchOnline = (params) => {
  return http.request<ReturnResult<boolean>>("get", "/v2/event/online", { params });
};
