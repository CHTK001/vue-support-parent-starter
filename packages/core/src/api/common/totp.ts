import { http, type ReturnResult } from "@repo/utils";
import { encodeSearchParams } from "@repo/utils";
import { getConfig } from "@repo/config";
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
  return http.request<ReturnResult<boolean>>("get", "/v2/user/totp/generateUri", {});
};
