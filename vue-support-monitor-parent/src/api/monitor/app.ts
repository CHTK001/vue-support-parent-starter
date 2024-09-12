import { http, type ReturnResult } from "@/utils/http";

/**
 * 获取应用列表
 */
export const fetchAppPageList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/app/page", { params });
};

/**
 * 新增应用
 */
export const fetchAppAdd = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/app/add", { params });
};

/**
 * 修改应用
 */
export const fetchAppUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/app/update", { params });
};

/**
 * 删除应用
 */
export const fetchAppDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/app/delete", { params });
};
