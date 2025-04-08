import { http, type ReturnResult } from "@repo/utils";

/** 保存商户配置 */
export const fetchSaveMerchant = (params) => {
  return http.request<ReturnResult<object>>("post", "/v3/pay/merchant/save", {
    data: params,
  });
};
/** 更新商户信息 */
export const fetchUpdateMerchant = (setting) => {
  return http.request<ReturnResult<object>>("put", "/v3/pay/merchant/update", {
    data: setting,
  });
};

/** 删除商户配置 */
export const fetchDeleteMerchant = (params) => {
  return http.request<ReturnResult<object>>("delete", "/v3/pay/merchant/delete", {
    params,
  });
};

/** 获取商户配置 */
export const fetchPageMerchant = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v3/pay/merchant/page", {
    params,
  });
};
