import { http, type ReturnResult } from "@repo/utils";

export interface SysSecret {
  sysSecretId?: number;
  sysSecretName?: string;
  sysSecretVender?: number;
  sysSecretFunction?: string;
  sysSecretFunctionDefaultIds?: string;
  sysSecretIcon?: string;
  sysSecretGroup?: string;
  sysSecretSort?: number;
  sysSecretStatus?: 0 | 1;
  sysSecretRemark?: string;
  projectId?: number;
  sysSecretAppId?: string;
  sysSecretAppSecret?: string;
  sysSecretAppEndpoint?: string;
  createTime?: string;
  updateTime?: string;
  // 运行时扩展字段（前端计算）
  source?: Array<{
    label: boolean;
    value: number;
    name: string;
    code: string;
    icon: string;
  }>;
}

/**
 * 密钥分页列表
 */
export const fetchPageSecret = (params?: Record<string, unknown>) => {
  return http.request<ReturnResult<SysSecret[]>>("get", "/v2/secret/page", {
    params,
  });
};

/**
 * 新增密钥
 */
export const fetchSaveSecret = (params: Partial<SysSecret>) => {
  return http.request<ReturnResult<object>>("post", "/v2/secret/save", {
    data: params,
  });
};

/**
 * 更新密钥
 */
export const fetchUpdateSecret = (params: Partial<SysSecret>) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/secret/update", {
    data: params,
  });
};

/**
 * 删除密钥
 */
export const fetchDeleteSecret = (params: { sysSecretId: number }) => {
  if (params.sysSecretId == null) {
    return Promise.reject("参数不能为空");
  }
  return http.request<ReturnResult<boolean>>("delete", "/v2/secret/delete", {
    params,
  });
};

/**
 * 更新密钥默认值
 */
export const fetchUpdateSecretDefault = (params: {
  sysSecretId: number;
  sysSecretDefaultType: number;
  sysSetDefault: 0 | 1;
}) => {
  return http.request<ReturnResult<boolean>>(
    "put",
    "/v2/secret/updateDefault",
    {
      data: params,
    },
  );
};

/**
 * 获取密钥详情（供 AI/Device/短信/邮件等子模块获取 appKey 配置）
 */
export const fetchSecretInfo = (secretId: number) => {
  return http.request<ReturnResult<SysSecret>>(
    "get",
    `/v2/secret/info/${secretId}`,
  );
};
