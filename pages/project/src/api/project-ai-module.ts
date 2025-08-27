import { http, type ReturnResult } from "@repo/utils";

/**
 * 项目模型分页列表
 */
export const fetchPageProjectForAiModule = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/ai/module/page", {
    params,
  });
};

/**
 * 项目模型列表
 */
export const fetchListProjectForAiModule = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/ai/module/list", {
    params,
  });
};

/**
 * 删除模型模板
 */
export const fetchDeleteProjectForAiModule = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/ai/module/delete", {
    data: params,
  });
};

/**
 * 更新模型模板
 */
export const fetchUpdateProjectForAiModule = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/ai/module/update", {
    data: params,
  });
};

/**
 * 新增模型模板
 */
export const fetchSaveProjectForAiModule = (params) => {
  return http.request<ReturnResult<object[]>>("post", "/v2/project/ai/module/save", {
    data: params,
  });
};