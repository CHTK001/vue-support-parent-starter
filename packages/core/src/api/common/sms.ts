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

export type SmsCodeRequest = {
  phone: string;
  bizType: "login" | "register" | "reset" | string;
};

export type SmsLoginRequest = {
  phone: string;
  code: string;
};

export const fetchSendSmsCode = (data: SmsCodeRequest) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sms/send", {
    data,
  });
};

export const fetchSmsLogin = (data: SmsLoginRequest) => {
  return http.request<ReturnResult<UserResult>>("post", "/v2/sms/login", {
    data,
  });
};
