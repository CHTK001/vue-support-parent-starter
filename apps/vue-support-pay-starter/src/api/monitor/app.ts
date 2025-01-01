import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取应用列表
 */
export const fetchAppList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/app/list", { params });
};

/**
 * 获取应用列表
 */
export const fetchAppPageList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/app/page", { params });
};

/**
 * 新增应用
 */
export const fetchAppSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/app/save", { data: params });
};

/**
 * 修改应用
 */
export const fetchAppUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/app/update", { data: params });
};

/**
 * 删除应用
 */
export const fetchAppDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/app/delete", { params });
};
