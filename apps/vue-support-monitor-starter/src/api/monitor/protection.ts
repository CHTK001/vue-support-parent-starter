import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取应用列表
 */
export const fetchProtectionList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/protection/list", { params });
};

/**
 * 获取应用列表
 */
export const fetchProtectionPageList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/protection/page", { params });
};

/**
 * 新增应用
 */
export const fetchProtectionSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/protection/save", { data: params });
};

/**
 * 修改应用
 */
export const fetchProtectionUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/protection/update", { data: params });
};

/**
 * 删除应用
 */
export const fetchProtectionDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/protection/delete", { params });
};
