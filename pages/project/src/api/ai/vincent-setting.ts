import { http, type ReturnResult } from "@repo/utils";

/**
 * 文生图模型配置
 */
export const fetchGetForModelSetting = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/vincent/setting/config", {
    params,
  });
};
/**
 * 文生图模型配置新增
 */
export const fetchSaveForModelSetting = (params) => {
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/vincent/setting/save", {
    data: params,
  });
};
/**
 * 文生图模型配置更新
 */
export const fetchUpdateForModelSetting = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/ai/vincent/setting/update", {
    data: params,
  });
};
