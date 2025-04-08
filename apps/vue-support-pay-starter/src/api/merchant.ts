import { http, type ReturnResult } from "@repo/utils";

/** 商户统计数据接口 */
export interface MerchantStatisticDTO {
  /** 商户总数 */
  totalCount: number;
  /** 活跃商户数 */
  activeCount: number;
  /** 待审核商户数 */
  pendingCount: number;
  /** 停用商户数 */
  disabledCount: number;
}

/** 保存商户配置 */
export const fetchSaveMerchant = (params: any) => {
  return http.request<ReturnResult<object>>("post", "/v3/pay/merchant/save", {
    data: params,
  });
};
/** 更新商户信息 */
export const fetchUpdateMerchant = (setting: any) => {
  return http.request<ReturnResult<object>>("put", "/v3/pay/merchant/update", {
    data: setting,
  });
};

/** 删除商户配置 */
export const fetchDeleteMerchant = (params: any) => {
  return http.request<ReturnResult<object>>("delete", "/v3/pay/merchant/delete", {
    params,
  });
};
/** 获取商户统计数据 */
export const fetchStatisticMerchant = (params?: any) => {
  return http.request<ReturnResult<MerchantStatisticDTO>>("get", "/v3/pay/merchant/statistic", {
    params,
  });
};

/** 获取商户配置 */
export const fetchPageMerchant = (params: any) => {
  return http.request<ReturnResult<object[]>>("get", "/v3/pay/merchant/page", {
    params,
  });
};
