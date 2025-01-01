import { http, type ReturnResult } from "@repo/utils";

/**
 * 分页查询
 */
export const fetchGenColumnPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/column/page", { params });
};
/**
 * 获取表信息
 */
export const fetchGenColumnInfo = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/column/info", { params });
};

/**
 * 保存
 */
export const fetchGenColumnSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/column/save", { data: params });
};

/**
 * 删除
 */
export const fetchGenColumnDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/column/delete", { params });
};

/**
 * 修改
 */
export const fetchGenColumnUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/gen/column/update", { data: params });
};
