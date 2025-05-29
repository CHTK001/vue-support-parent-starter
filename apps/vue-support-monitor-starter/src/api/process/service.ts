import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取进程列表
 */
export const fetchProcessList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/process/list", { params });
};
