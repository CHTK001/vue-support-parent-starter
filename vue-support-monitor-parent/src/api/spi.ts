import { http, type ReturnResult } from "@/utils/http";
import Base64 from "@/utils/base64";

/**
 * 查询选项
 */
export const fetchOptionGet = (params: any) => {
  const base64 = new Base64();
  params.type = base64.encode(params.type);
  return http.request<ReturnResult<any>>("get", "/v1/option/get", { params });
};
/**
 * 查询选项
 */
export const fetchOptionObjectsList = (params: any) => {
  const base64 = new Base64();
  params.type = base64.encode(params.type);
  return http.request<ReturnResult<any>>("get", "/v1/option/objects/get", { params });
};
/**
 * 查询选项
 */
export const fetchOptionList = (params: any) => {
  const base64 = new Base64();
  params.type = base64.encode(params.type);
  return http.request<ReturnResult<any>>("get", "/v1/option/list", { params });
};
