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

/**
 * 获取数据库所有表/字段
 */
export const fetchGenSessionHits = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/session/hits", { params });
};

/**
 * 复制表结构
 */
export const fetchGenSessionCopyTableConstruct = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/session/copyTableConstruct", { params });
};

/**
 * 删除表
 */
export const fetchGenSessionDropTable = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/session/dropTable", { params });
};

/**
 * 重命名表
 */
export const fetchGenSessionRenameTable = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/session/renameTable", { params });
};
/**
 * 获取表结构
 */
export const fetchGenSessionGetTableConstruct = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/session/getTableConstruct", { params });
};
