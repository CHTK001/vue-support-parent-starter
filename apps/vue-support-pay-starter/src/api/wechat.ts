import { http, type ReturnResult } from "@repo/utils";

/** 保存商户配置 */
export const fetchSaveMerchantWechat = (params) => {
  return http.request<ReturnResult<object>>("post", "/v3/pay/merchant/wechat/save", {
    data: params,
  });
};
/** 更新商户信息 */
export const fetchUpdateMerchantWechat = (setting) => {
  return http.request<ReturnResult<object>>("put", "/v3/pay/merchant/wechat/update", {
    data: setting,
  });
};

/** 生成测试支付二维码 */
export const fetchGenerateTestQrCode = (params) => {
  return http.request<ReturnResult<{ qrCodeUrl: string }>>("post", "/v3/pay/merchant/test/qrcode", {
    data: params,
    responseType: "blob",
  });
};

/** 获取商户配置 */
export const fetchListMerchantWechat = (params) => {
  params = { payMerchantId: params.payMerchantId };
  return http.request<ReturnResult<object[]>>("get", "/v3/pay/merchant/wechat/list", {
    params,
  });
};
/** 获取商户配置 */
export const fetchDeleteMerchantWechat = (params) => {
  params = { payMerchantId: params.payMerchantId };
  return http.request<ReturnResult<object[]>>("delete", "/v3/pay/merchant/wechat/delete", {
    params,
  });
};
