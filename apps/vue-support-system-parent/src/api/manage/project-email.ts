import { http, type ReturnResult } from "@repo/utils";

/**
 * 项目短信列表
 */
export const fetchPageProjectForEmail = params => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/template/email/page", {
    params
  });
};
/**
 * 同步短信列表
 */
export const fetchSyncProjectForEmail = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/email/syncTemplate", {
    data: params
  });
};
/**
 * 删除短信模板
 */
export const fetchDeleteProjectForEmail = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/email/delete", {
    data: params
  });
};
/**
 * 更新短信模板
 */
export const fetchUpdateProjectForEmail = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/email/update", {
    data: params
  });
};
/**
 * 新增短信模板
 */
export const fetchSaveProjectForEmail = params => {
  return http.request<ReturnResult<object[]>>("post", "/v2/project/template/email/save", {
    data: params
  });
};

/**
 * 发送短信
 */
export const fetctSenderProjectForEmail = (params: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/project/template/email", {
    data: params
  });
};
