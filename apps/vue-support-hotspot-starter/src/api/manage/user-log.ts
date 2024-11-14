import { http, type ReturnResult } from "@/utils/http";
import type { UserLog } from "@/api/manage/user";

/** 获取用户日志列表 */
export const fetchPageUserLog = params => {
  return http.request<ReturnResult<UserLog[]>>("get", "/v2/user/log/page", {
    params
  });
};
