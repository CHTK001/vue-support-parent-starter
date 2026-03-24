import { http, type ReturnResult } from "@repo/utils";

/**
 * 更新项目默认值
 */
export const fetchDefaultNameProject = params => {
  return http.request<ReturnResult<boolean>>("put", "/v2/project/updateDefault", {
    data: params
  });
};

/**
 * 项目列表
 */
export const fetchPageProject = params => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/page", {
    params
  });
};

/**
 * 项目默认值
 */
export const fetchDefaultProject = params => {
  return http.request<ReturnResult<object>>("get", "/v2/project/default", {
    params
  });
}
/**
 * 更新项目
 */
export const fetchUpdateProject = params => {
  return http.request<ReturnResult<boolean>>("put", "/v2/project/update", {
    data: params
  });
};