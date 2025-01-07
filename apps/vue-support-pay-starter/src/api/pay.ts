import { http, type ReturnResult } from "@repo/utils";

/** 退款 */
export const fetchRefundOrder = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/pay/order/refund", {
    data: params
  });
};

/** 关闭订单 */
export const fetchCancelOrder = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/pay/order/cancel", {
    data: params
  });
};

/** 创建订单 */
export const fetchCreateOrder = params => {
  return http.request<ReturnResult<object[]>>("put", "/v2/pay/order/createOrder", {
    data: params
  });
};
