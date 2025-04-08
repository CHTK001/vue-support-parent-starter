import { http, type ReturnResult } from "@repo/utils";

/** 订单统计数据接口 */
export interface PayOrderStatisticDTO {
  /** 订单总数 */
  totalCount: number;
  /** 已完成订单数 */
  completedCount: number;
  /** 待支付订单数 */
  pendingCount: number;
  /** 已关闭订单数 */
  closedCount: number;
}

/** 获取订单 */
export const fetchPageOrder = (params: any) => {
  return http.request<ReturnResult<object[]>>("get", "/v3/pay/order/history/page", {
    params,
  });
};
/** 获取订单流水 */
export const fetchPageOrderWater = (params: any) => {
  return http.request<ReturnResult<object[]>>("get", "/v3/pay/order/history/water", {
    params,
  });
};

/** 获取订单统计数据 */
export const fetchStatisticOrder = (params?: any) => {
  return http.request<ReturnResult<PayOrderStatisticDTO>>("get", "/v3/pay/order/history/statistic", {
    params,
  });
};
