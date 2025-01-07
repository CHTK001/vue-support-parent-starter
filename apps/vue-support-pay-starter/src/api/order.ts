import { http, type ReturnResult } from "@repo/utils";

/** 获取商户配置 */
export const fetchPageOrder = params => {
  return http.request<ReturnResult<object[]>>("get", "/v3/pay/order/history/page", {
    params
  });
};
