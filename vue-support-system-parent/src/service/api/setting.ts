import { request } from '../request';

/**
 * 获取默认设置
 *
 * @returns 默认设置
 */
export function fetchDefaultSetting() {
  return request<Api.Common.Setting[]>({
    url: '/v2/setting/default'
  });
}
