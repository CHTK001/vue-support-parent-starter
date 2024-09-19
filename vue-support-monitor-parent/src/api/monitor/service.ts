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
export const fetchIndicatorQuery = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/time/series", {
    params: params
  });
};

/**
 * 获取指标数据
 * @param params
 */
export const fetchIndicatorMulti = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/time/multi", {
    params: params
  });
};
/** 获取指标数据 */
export const fetchIndicatorGet = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/time/get", {
    params: params
  });
};
