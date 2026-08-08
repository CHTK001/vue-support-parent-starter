/** 全局设置接口（与后端 AiGlobalSettingDTO 对齐） */
import { get, put } from './request';
import { GlobalSettings } from './types';

export const globalSettingsApi = {
  /** 获取全局设置 */
  get: () => get<GlobalSettings>('/v2/global-settings'),
  /** 更新全局设置 */
  update: (data: GlobalSettings) => put<GlobalSettings>('/v2/global-settings', data),
};