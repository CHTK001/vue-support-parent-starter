import type { UserLog } from "@repo/core";
import { http, type ReturnResult } from "@repo/utils";

/** 获取用户日志列表 */
export const fetchPageUserLog = params => {
  return http.request<ReturnResult<UserLog[]>>("get", "/v2/user/log/page", {
    params
  });
};

/** 获取系统日志列表 */
export const fetchPageLog = params => {
  return http.request<ReturnResult<UserLog[]>>("get", "/v2/log/page", {
    params
  });
};
