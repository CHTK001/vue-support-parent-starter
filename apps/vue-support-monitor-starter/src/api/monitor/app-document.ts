import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取应用文档列表
 */
export const fetchAppDocumentList = (params: any) => {
  return http.request<ReturnResult<any>>("get", `/v1/app/api-docs/${params.monitorId}/${params.serverId}`);
};
