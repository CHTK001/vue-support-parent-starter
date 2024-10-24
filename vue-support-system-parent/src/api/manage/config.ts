import { http, type ReturnResult } from "@/utils/http";

export type Config = {
  sysConfigId: number;
  sysConfigName: string;
  sysConfigValue: string;
  sysConfigRemark: string;
  sysConfigStatus: number;
  sysConfigValueType: string;
  sysConfigGroup: string;
  sysConfigFromApp: string;
  sysConfigAppInner: string;
  sysConfigConfig: string;
};

/** 删除系统配置 */
export const fetchDeleteConfig = id => {
  const params = { sysConfigId: id };
  return http.request<ReturnResult<Boolean>>("delete", "/v2/config/delete", {
    params
  });
};

/** 保存系统配置 */
export const fetchSaveConfig = config => {
  return http.request<Boolean>("post", "/v2/config/save", { data: config });
};

/** 更新系统配置 */
export const fetchUpdateConfig = config => {
  if (!config.sysConfigId) {
    return;
  }
  return http.request<Config>("put", "/v2/config/update", { data: config });
};

/** 获取系统配置 */
export const fetchConfigPage = params => {
  return http.request<ReturnResult<Config[]>>("get", "/v2/config/page", {
    params
  });
};
/** 获取系统配置 */
export const fetchConfig = param => {
  const params = { sysConfigGroup: param };
  return http.request<ReturnResult<Config[]>>("get", "/v2/config/list", {
    params
  });
};
