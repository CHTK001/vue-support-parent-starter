import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取模型列表
 */
export const fetchOnline = (params) => {
  return http.request<ReturnResult<boolean>>("get", "/v2/event/online", { params });
};
/** 获取验证码 */
export const fetchVerifyCode = () => {
  return http.request<ReturnResult<any>>("get", "/v1/captcha");
};
