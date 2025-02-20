import { http, type ReturnResult } from "@repo/utils";
/**
 * 租户模块列表
 */
export const fetchPageTenant = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/tenant/page", {
    params,
  });
};

export const feechSyncTenant = (params) => {
  return http.request<ReturnResult<object>>("put", "/v2/tenant/sync", {
    data: params,
  });
};
/**
 * 新增租户模块
 */
export const fetchSaveTenant = (setting) => {
  return http.request<ReturnResult<object>>("post", "/v2/tenant/save", {
    data: setting,
  });
};

/**
 * 更新租户模块
 */
export const fetchUpdateTenant = (setting) => {
  return http.request<ReturnResult<object>>("put", "/v2/tenant/update", {
    data: setting,
  });
};
/**
 * 删除租户模块
 */
export const fetchDeleteTenant = (params) => {
  return http.request<ReturnResult<object>>("delete", "/v2/tenant/delete", {
    params,
  });
};

/**
 * 绑定租户模块
 */
export const fetchBindTenant = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/tenant/bind", {
    data: params,
  });
};
