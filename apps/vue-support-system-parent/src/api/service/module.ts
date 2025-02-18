import { http, type ReturnResult } from "@repo/utils";
/**
 * 服务模块列表
 */
export const fetchListServiceModule = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/service/module/list", {
    params,
  });
};
/**
 * 服务模块列表
 */
export const fetchPageServiceModule = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/service/module/page", {
    params,
  });
};

/**
 * 新增服务模块
 */
export const fetchSaveServiceModule = (setting) => {
  return http.request<ReturnResult<object>>("post", "/v2/service/module/save", {
    data: setting,
  });
};

/**
 * 更新服务模块
 */
export const fetchUpdateServiceModule = (setting) => {
  return http.request<ReturnResult<object>>("put", "/v2/service/module/update", {
    data: setting,
  });
};
/**
 * 删除服务模块
 */
export const fetchDeleteServiceModule = (params) => {
  return http.request<ReturnResult<object>>("delete", "/v2/service/module/delete", {
    params,
  });
};

/**
 * 绑定服务模块
 */
export const fetchBindServiceModule = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/service/module/bind", {
    data: params,
  });
};
