import { http, type RequestMethods, type ReturnResult } from "@repo/utils";

/**
 * 获取应用文档列表
 */
export const fetchAppDocumentList = (params: any) => {
  return http.request<ReturnResult<any>>("get", `/v1/app/api-docs/${params.monitorId}/${params.serverId}`);
};

/**
 * 获取应用文档
 */
export const fetchForwardDocument = (method, params: any) => {
  return http.request<ReturnResult<any>>("post", `/v2/document/forward`, {
    params: {
      remoteUrl: params.url,
    },
    data: params,
    headers: params.headers,
  });
};
