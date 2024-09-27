import { http, type ReturnResult } from "@/utils/http";

/**
 * 获取关键字
 */
export const fetchGenSessionKeyword = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/session/keyword", { params });
};
/**
 * 获取子节点
 */
export const fetchGenSessionChildren = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/session/children", { params });
};
/**
 * 解析
 */
export const fetchGenSessionExplain = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/session/explain", { data: params });
};
/**
 * 执行
 */
export const fetchGenSessionExecute = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/session/execute", { data: params });
};
