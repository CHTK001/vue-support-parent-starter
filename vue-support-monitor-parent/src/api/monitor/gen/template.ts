import { http, type ReturnResult } from "@/utils/http";

/**
 * 分页查询
 */
export const fetchGenTemplatePage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/template/page", { params });
};
/**
 * 获取表信息
 */
export const fetchGenTemplateInfo = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/template/info", { params });
};

/**
 * 保存
 */
export const fetchGenTemplateSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/template/save", { data: params });
};

/**
 * 删除
 */
export const fetchGenTemplateDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/template/delete", { params });
};

/**
 * 修改
 */
export const fetchGenTemplateUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/gen/template/update", { data: params });
};
