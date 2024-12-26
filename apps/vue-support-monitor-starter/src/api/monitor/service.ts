import { http, type ReturnResult } from "@repo/utils";

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
export const fetchSearchQuery = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/search/series", {
    params: params
  });
};

export const fetchSearchAggregate = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/search/aggregate", {
    params: params
  });
};

/** 获取指标数据 */
export const fetchIndicatorQuery = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/time/series", {
    params: params
  });
};
/** 获取指标数据 */
export const fetchIndicatoryQps = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/time/qps", {
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
/** 获取指标数据 */
export const fetchIndicatorHGet = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/time/hGet", {
    params: params
  });
};
