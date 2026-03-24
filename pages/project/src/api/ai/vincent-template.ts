import { http, type ReturnResult } from "@repo/utils";

/**
 * 文生图模型模板
 */
export const fetchListForModelTemplate = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/vincent/template/list", {
    params,
  });
};
/**
 * 文生图模型模板新增
 */
export const fetchSaveForModelTemplate = (params) => {
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/vincent/template/save", {
    data: params,
  });
};
/**
 * 文生图模型模板更新
 */
export const fetchUpdateForModelTemplate = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/ai/vincent/template/update", {
    data: params,
  });
};
/**
 * 文生图模型模板删除
 */
export const fetchDeleteForModelTemplate = (params) => {
  return http.request<ReturnResult<object[]>>("delete", "/v2/ai/vincent/template/delete", {
    params,
  });
};
