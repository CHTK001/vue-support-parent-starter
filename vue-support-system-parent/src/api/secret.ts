import { http, type ReturnResult } from "@/utils/http";

export type Secret = {
  sysSecretId: number;
  sysSecretName: string;
  sysSecretCode: string;
  sysSecretGroup: string;
};

/**
 * 删除组织机构
 */
export const fetchDeleteSecret = sysSecretId => {
  return http.request<ReturnResult<Boolean>>("delete", "/v2/secret/delete", {
    data: { sysSecretId: sysSecretId }
  });
};

/**
 * 新增组织机构
 */
export const fetchSaveSecret = params => {
  return http.request<ReturnResult<Secret>>("post", "/v2/secret/save", {
    data: params
  });
};

/**
 * 更新组织机构
 */
export const fetchUpdateSecret = params => {
  return http.request<ReturnResult<Boolean>>("put", "/v2/secret/update", {
    data: params
  });
};

/**
 * 组织机构列表
 */
export const fetchPageSecret = params => {
  return http.request<ReturnResult<Secret[]>>("get", "/v2/secret/page", {
    params
  });
};
