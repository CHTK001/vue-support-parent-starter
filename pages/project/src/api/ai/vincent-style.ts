import { http, type ReturnResult } from "@repo/utils";

/**
 * 文生图模型风格
 */
export const fetchListForModelStyle = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/vincent/style/list", {
    params,
  });
};
/**
 * 文生图模型风格新增
 */
export const fetchSaveForModelStyle = (params) => {
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/vincent/style/save", {
    data: params,
  });
};
/**
 * 文生图模型风格更新
 */
export const fetchUpdateForModelStyle = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/ai/vincent/style/update", {
    data: params,
  });
};
/**
 * 文生图模型风格删除
 */
export const fetchDeleteForModelStyle = (params) => {
  return http.request<ReturnResult<object[]>>("delete", "/v2/ai/vincent/style/delete", {
    params,
  });
};
