import { http, type ReturnResult } from "@/utils/http";

/**
 * 分页查询
 */
export const fetchGenRemarkPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/remark/page", { params });
};
/**
 * 获取表信息
 */
export const fetchGenRemarkInfo = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/remark/info", { params });
};

/**
 * 保存
 */
export const fetchGenRemarkSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/remark/save", { data: params });
};

/**
 * 删除
 */
export const fetchGenRemarkDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/remark/delete", { params });
};

/**
 * 修改
 */
export const fetchGenRemarkUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/gen/remark/update", { data: params });
};
