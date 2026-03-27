import { http, type ReturnResult } from "@repo/utils";

export const fetchPageDeviceMerchant = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/device/merchant/page", {
    params,
  });
};

export const fetchListDeviceMerchant = (params = {}) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/device/merchant/list", {
    params,
  });
};

export const fetchSaveDeviceMerchant = (data) => {
  return http.request<ReturnResult<object>>("post", "/v2/device/merchant/save", {
    data,
  });
};

export const fetchUpdateDeviceMerchant = (data) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/device/merchant/update", {
    data,
  });
};

export const fetchDeleteDeviceMerchant = (params) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/device/merchant/delete", {
    params,
  });
};

export const fetchTestDeviceMerchantConnection = (params) => {
  return http.request<ReturnResult<boolean>>("get", "/v2/device/merchant/testConnection", {
    params,
  });
};
