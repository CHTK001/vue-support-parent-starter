import { http, type ReturnResult } from "@/utils/http";

/**
 * 更新表结构
 */
export const fetchGenTableUpdateConstruct = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/table/updateTableConstruct", { data: params });
};
/**
 * 同步表结构
 */
export const fetchGenTableSyncConstruct = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/table/syncTableConstruct", { data: params });
};

/**
 * 分页查询
 */
export const fetchGenTableSyncTable = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/table/syncTable", { params });
};
/**
 * 导入列
 */
export const fetchGenTableImportColumn = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/table/importColumn", { data: params });
};

/**
 * 生成代码
 */
export const fetchGenTableGenCode = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/table/batchGenCode", { data: params });
};
/**
 * 获取模板
 */
export const fetchGenTableTemplate = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/table/template", { data: params });
};

/**
 * 分页查询
 */
export const fetchGenTablePage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/table/page", { params });
};
/**
 * 获取表信息
 */
export const fetchGenTableInfo = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/table/info", { params });
};

/**
 * 保存
 */
export const fetchGenTableSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/table/save", { data: params });
};

/**
 * 删除
 */
export const fetchGenTableDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/table/delete", { params });
};

/**
 * 修改
 */
export const fetchGenTableUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/gen/table/update", { data: params });
};
