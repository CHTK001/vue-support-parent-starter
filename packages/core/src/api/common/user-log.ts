import { http, type ReturnResult } from "@repo/utils";
import type { UserLog } from "@repo/core";

/** 获取用户日志列表 */
export const fetchPageUserLog = params => {
  return http.request<ReturnResult<UserLog[]>>("get", "/v2/user/log/page", {
    params
  });
};
