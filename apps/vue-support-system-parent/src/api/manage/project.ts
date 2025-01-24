import { http, type ReturnResult } from "@repo/utils";
/**
 * 删除项目
 */
export const fetchDeleteProject = (sysSecretId) => {
  if (null == sysSecretId) {
    return Promise.reject("参数不能为空");
  }
  const params = { sysSecretId: sysSecretId };
  return http.request<ReturnResult<boolean>>("delete", "/v2/project/delete", {
    params,
  });
};

/**
 * 新增项目
 */
export const fetchSaveProject = (params) => {
  return http.request<ReturnResult<object>>("post", "/v2/project/save", {
    data: params,
  });
};

/**
 * 更新项目
 */
export const fetchUpdateProject = (params) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/project/update", {
    data: params,
  });
};

/**
 * 项目列表
 */
export const fetchPageProject = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/page", {
    params,
  });
};
