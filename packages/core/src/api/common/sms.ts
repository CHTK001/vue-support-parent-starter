import { http, type ReturnResult } from "@repo/utils";

/**
 * 发送短信
 */
export const fetchSmsSender = (params: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/sms", {
    data: params
  });
};

/**
 * 同步短信
 */
export const fetchSmsSync = (params: any) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sms/syncTemplate", {
    data: params
  });
};
