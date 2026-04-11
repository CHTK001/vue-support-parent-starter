import { encodeSearchParams, http, type ReturnResult } from "@repo/utils";
/**
 * 绑定totp
 */
export const fetchBindTotp = () => {
  return http.request<ReturnResult<boolean>>("put", "/v2/user/totp/bind", {});
};
/**
 * 解绑totp
 */
export const fetchUnbindTotp = () => {
  return http.request<ReturnResult<boolean>>("put", "/v2/user/totp/unbind", {});
};
/**
 * 获取totp uri
 */
export const fetchGetTotpUri = () => {
  return http.request<ReturnResult<string>>(
    "get",
    "/v2/user/totp/generateUri",
    {},
  );
};

/**
 * 获取当前用户 OTP 状态
 */
export const fetchTotpStatus = () => {
  return http.request<ReturnResult<boolean>>("get", "/v2/user/totp/status", {});
};

/**
 * 校验 OTP 验证码
 */
export const fetchVerifyTotp = (params: { code: string; username: string }) => {
  return http.request<ReturnResult<boolean>>(
    "get",
    `/v2/user/totp/verify?${encodeSearchParams(params)}`,
    {},
  );
};
