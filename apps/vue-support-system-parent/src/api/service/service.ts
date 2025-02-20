import { http, type ReturnResult } from "@repo/utils";
/**
 * 服务列表
 */
export const fetchListService = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/service/list", {
    params,
  });
};
/**
 * 服务列表
 */
export const fetchPageService = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/service/page", {
    params,
  });
};

/**
 * 新增服务
 */
export const fetchSaveService = (setting) => {
  return http.request<ReturnResult<object>>("post", "/v2/service/save", {
    data: setting,
  });
};

/**
 * 更新服务
 */
export const fetchUpdateService = (setting) => {
  return http.request<ReturnResult<object>>("put", "/v2/service/update", {
    data: setting,
  });
};
/**
 * 删除服务
 */
export const fetchDeleteService = (params) => {
  return http.request<ReturnResult<object>>("delete", "/v2/service/delete", {
    params,
  });
};

/**
 * 绑定服务
 */
export const fetchBindService = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/service/bind", {
    data: params,
  });
};
