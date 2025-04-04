import { http, type ReturnResult } from "@repo/utils";
import { Base64 } from "js-base64";

/**
 * 查询选项
 */
export const fetchOptionGet = (params: any) => {
  params.type = Base64.encode(params.type);
  return http.request<ReturnResult<any>>("get", "/v1/option/get", { params });
};
/**
 * 查询选项
 */
export const fetchOptionObjectsList = (params: any) => {
  params.type = Base64.encode(params.type);
  return http.request<ReturnResult<any>>("get", "/v1/option/objects/get", { params });
};
/**
 * 查询选项
 */
export const fetchOptionList = (params: any) => {
  params.type = Base64.encode(params.type);
  return http.request<ReturnResult<any>>("get", "/v1/option/list", { params });
};
