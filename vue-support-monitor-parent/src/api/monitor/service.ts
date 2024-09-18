import { http, type ReturnResult } from "@/utils/http";

/** 获取服务列表 */
export const fetchServiceList = uriSpec => {
  return http.request<ReturnResult<any>>("get", "/v2/service/list", {
    params: uriSpec,
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/** 获取指标数据 */
export const fetchIndicatorQuery = (params: any) =>
  http.request<ReturnResult<any>>("get", "/v1/time/series", {
    params: params
  });

/** 获取指标数据 */
export const fetchIndicatorGet = (params: any) =>
  http.request<ReturnResult<any>>("get", "/v1/time/get", {
    params: params
  });
