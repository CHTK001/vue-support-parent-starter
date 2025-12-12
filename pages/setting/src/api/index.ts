import { http, type ReturnResult } from "@repo/utils";

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
  sysSettingConfig: string;
};

/** 删除系统配置 */
export const fetchDeleteSetting = (id) => {
  const params = { sysSettingId: id };
  return http.request<ReturnResult<Boolean>>("delete", "/v2/setting/delete", {
    params,
  });
};

/** 保存系统配置 */
export const fetchSaveSetting = (setting) => {
  return http.request<Boolean>("post", "/v2/setting/save", { data: setting });
};

/** 更新系统配置 */
export const fetchUpdateSetting = (setting) => {
  if (!setting.sysSettingId) {
    return;
  }
  return http.request<Setting>("put", "/v2/setting/update", { data: setting });
};

/** 更新系统配置 */
export const fetchUpdateBatchSetting = (settings) => {
  return http.request<Setting>("put", "/v2/setting/updateBatch", {
    data: settings,
  });
};

/** 获取系统配置 */
export const fetchSettingPage = (params) => {
  return http.request<ReturnResult<Setting[]>>("get", "/v2/setting/page", {
    params,
  });
};
/** 获取系统配置 */
export const fetchSetting = (param) => {
  const params = { sysSettingGroup: param };
  return http.request<ReturnResult<Setting[]>>("get", "/v2/setting/list", {
    params,
    timeout: 5000, // 5秒超时，避免远程服务器不通时长时间等待
  });
};

/** 获取系统配置 */
export const fetchDefaultSetting = () => {
  return http
    .request<ReturnResult<Setting[]>>("get", "/v2/setting/default", {
      timeout: 5000, // 5秒超时，避免长时间等待
    })
    .catch(() => {
      // 接口异常时返回空数据，保证登录页面正常显示
      return { data: [] };
    });
};
