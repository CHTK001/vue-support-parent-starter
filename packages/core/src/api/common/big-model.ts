import { http, type ReturnResult } from "@repo/utils";
import { encodeSearchParams } from "@repo/utils";
import { getConfig } from "@repo/config";
export type BigModel = {
  to: string;
  content: string;
};

/**
 * 获取模型列表
 */
export const fetchListModel = () => {
  return http.request<ReturnResult<boolean>>("get", "/v2/bigmodel/models", {});
};
/**
 * 获取模型列表
 */
export const fetchCall = params => {
  return http.request<ReturnResult<boolean>>("get", "/v2/bigmodel/call", { params });
};
/**
 * 获取模型列表
 */
export const fetchCallStream = params => {
  return getConfig().baseUrl + "/v2/bigmodel/stream?" + encodeSearchParams(params);
};
