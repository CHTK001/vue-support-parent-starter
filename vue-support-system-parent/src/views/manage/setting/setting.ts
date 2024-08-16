import * as api from "@/api/setting";
/**
 *
 * 删除配置
 * @param setting 配置
 */
export const deleteSetting = id => {
  return api.fetchDeleteSetting(id);
};
/**
 *
 * 保存配置
 * @param setting 配置
 */
export const saveSetting = setting => {
  return api.fetchSaveSetting(setting);
};
/**
 *
 * 更新配置
 * @param setting 配置
 */
export const updateSetting = (event, setting) => {
  if (!setting.sysSettingId) {
    return;
  }
  return api.fetchUpdateSetting(setting);
};

/**
 * 查询配置
 * @param params 参数
 * @returns
 */
export const querySetting = params => {
  return api.fetchSettingPage(params);
};
