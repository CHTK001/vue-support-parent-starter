import { http, type ReturnResult } from "@/utils/http";

/**
 * 发送短信
 */
export const fetchSmsSender = (params: any) => {
  return http.request<ReturnResult<Boolean>>("get", "/v2/sms", {
    params
  });
};

/**
 * 同步短信
 */
export const fetchSmsSync = (params: any) => {
  return http.request<ReturnResult<Boolean>>("post", "/v2/sms/syncTemplate", {
    data: params
  });
};
