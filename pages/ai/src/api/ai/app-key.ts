import { http, type ReturnResult } from "@repo/utils";

/**
 * App Key (临时令牌)
 */
export interface SysAiAppKey {
  sysAiAppKeyId?: number;
  sysAiAppKeyAppId?: string;
  sysAiAppKeyAppKey?: string;
  sysAiAppKeyAppKeyPrefix?: string;
  sysAiAppKeySecret?: string;
  sysAiAppKeyName?: string;
  sysUserId?: number;
  sysAiAppKeyStatus?: number;
  sysAiAppKeyDelete?: number;
  sysAiAppKeyGroupId?: number;
  sysAiAppKeyExpireTime?: string;
  sysAiAppKeyValidDays?: number;
  sysAiAppKeyIpWhitelist?: string;
  sysAiAppKeyRemark?: string;
  sysAiAppKeyLastUsedTime?: string;
  sysAiAppKeyUseCount?: number;
  sysAiAppKeyScope?: string;
}

/**
 * 获取 App Key 列表
 */
export const listAppKeys = async () => {
  return http.request<ReturnResult<SysAiAppKey[]>>("get", "/v2/ai/app-key/list");
};

/**
 * 创建 App Key
 */
export const saveAppKey = async (data: Omit<SysAiAppKey, "sysAiAppKeyId">) => {
  return http.request<ReturnResult<SysAiAppKey>>("post", "/v2/ai/app-key/save", { data });
};

/**
 * 删除 App Key
 */
export const deleteAppKey = async (appKeyId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/ai/app-key/delete", {
    params: { sysAiAppKeyId: appKeyId },
  });
};
