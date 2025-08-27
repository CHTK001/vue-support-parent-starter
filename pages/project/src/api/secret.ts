import { http, type ReturnResult } from "@repo/utils";

export type Secret = {
  sysSecretId: number;
  sysSecretName: string;
  sysSecretCode: string;
  sysSecretGroup: string;
};

/**
 * 删除密钥
 */
export const fetchDeleteSecret = sysSecretId => {
  if (null == sysSecretId) {
    return Promise.reject("参数不能为空");
  }
  const params = { sysSecretId: sysSecretId };
  return http.request<ReturnResult<boolean>>("delete", "/v2/secret/delete", {
    params
  });
};

/**
 * 新增密钥
 */
export const fetchSaveSecret = params => {
  return http.request<ReturnResult<Secret>>("post", "/v2/secret/save", {
    data: params
  });
};

/**
 * 更新密钥
 */
export const fetchUpdateSecret = params => {
  if (!params.sysSecretId) {
    return;
  }
  return http.request<ReturnResult<boolean>>("put", "/v2/secret/update", {
    data: params
  });
};

/**
 * 密钥列表
 */
export const fetchPageSecret = params => {
  return http.request<ReturnResult<Secret[]>>("get", "/v2/secret/page", {
    params
  });
};