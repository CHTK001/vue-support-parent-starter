import { http, type ReturnResult } from "@repo/utils";

/**
 * 项目短信列表
 */
export const fetchPageProjectForSms = params => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/template/sms/page", {
    params
  });
};
/**
 * 同步短信列表
 */
export const fetchSyncProjectForSms = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/sms/syncTemplate", {
    data: params
  });
};
/**
 * 删除短信模板
 */
export const fetchDeleteProjectForSms = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/sms/delete", {
    data: params
  });
};
/**
 * 更新短信模板
 */
export const fetchUpdateProjectForSms = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/sms/update", {
    data: params
  });
};
/**
 * 新增短信模板
 */
export const fetchSaveProjectForSms = params => {
  return http.request<ReturnResult<object[]>>("post", "/v2/project/template/sms/save", {
    data: params
  });
};

/**
 * 发送短信
 */
export const fetctSenderProjectForSms = (params: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/project/template/sms", {
    data: params
  });
};
