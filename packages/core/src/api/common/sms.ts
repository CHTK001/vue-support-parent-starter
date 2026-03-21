import { http, type ReturnResult } from "@repo/utils";
import type { UserResult } from "./user";

/**
 * 发送短信
 */
export const fetchSmsSender = (params: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/sms", {
    data: params,
  });
};

/**
 * 同步短信
 */
export const fetchSmsSync = (params: any) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sms/syncTemplate", {
    data: params,
  });
};

/**
 * 发送登录验证码
 */
export const fetchSendSmsCode = (params: { phone: string; bizType?: string }) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sms/sendCode", {
    data: params,
  });
};

/**
 * 短信验证码登录
 */
export const fetchSmsLogin = (params: { phone: string; code: string }) => {
  return http.request<ReturnResult<UserResult>>("post", "/v2/login/sms", {
    data: params,
  });
};
