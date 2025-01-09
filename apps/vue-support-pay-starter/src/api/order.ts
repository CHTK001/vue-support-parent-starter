import { http, type ReturnResult } from "@repo/utils";

/** 获取订单 */
export const fetchPageOrder = params => {
  return http.request<ReturnResult<object[]>>("get", "/v3/pay/order/history/page", {
    params
  });
};
/** 获取订单流水 */
export const fetchPageOrderWater = params => {
  return http.request<ReturnResult<object[]>>("get", "/v3/pay/order/history/water", {
    params
  });
};
