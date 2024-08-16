import { http } from "@/utils/http";

export type Setting = {
  sysSettingId: number;
  sysSettingName: string;
  sysSettingValue: string;
  sysSettingRemark: string;
  sysSettingStatus: number;
  sysSettingValueType: string;
  sysSettingGroup: string;
  sysSettingFromApp: string;
  sysSettingAppInner: string;
};

/** 删除系统配置 */
export const fetchDeleteSetting = id => {
  return http.request<Boolean>("delete", "/v2/setting/delete", {
    data: { sysSettingId: id }
  });
};

/** 保存系统配置 */
export const fetchSaveSetting = setting => {
  return http.request<Boolean>("post", "/v2/setting/save", { data: setting });
};

/** 更新系统配置 */
export const fetchUpdateSetting = setting => {
  return http.request<Setting>("put", "/v2/setting/update", { data: setting });
};

/** 获取系统配置 */
export const fetchSettingPage = params => {
  return http.request<Setting[]>("get", "/v2/setting/page", { data: params });
};

/** 获取系统配置 */
export const fetchDefaultSetting = () => {
  return http.request<Setting[]>("get", "/v2/setting/default");
};

/** 获取验证码 */
export const fetchVerifyCode = () => {
  return http.request("get", "/v1/captcha");
};
