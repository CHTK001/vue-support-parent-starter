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

/** 获取系统配置 */
export const fetchDefaultSetting = () => {
  return http.request<Setting[]>("get", "/v2/setting/default");
};

export const fetchVerifyCode = () => {
  return http.request("get", "/v1/captcha");
};