import { http, type ReturnResult } from "@/utils/http";
import { encodeSearchParams } from "@repo/utils/objects";
import { getConfig } from "@/config/index";
export type BigModel = {
  to: string;
  content: string;
};

/**
 * 获取模型列表
 */
export const fetchListModel = () => {
  return http.request<ReturnResult<Boolean>>("get", "/v2/bigmodel/models", {});
};
/**
 * 获取模型列表
 */
export const fetchCall = params => {
  return http.request<ReturnResult<Boolean>>("get", "/v2/bigmodel/call", { params });
};
/**
 * 获取模型列表
 */
export const fetchCallStream = params => {
  return getConfig().baseUrl + "/v2/bigmodel/stream?" + encodeSearchParams(params);
};
