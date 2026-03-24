import { http, type ReturnResult } from "@repo/utils";

/**
 * 更新nginx配置
 */
export const fetchSaveNginxEventsConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/event/saveOrUpdate", { data: params });
};
