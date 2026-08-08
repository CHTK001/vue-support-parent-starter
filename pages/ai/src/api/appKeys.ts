/** AppKey 管理接口 */
import { get, post, put, del } from './request';
import { AppKey } from './types';

export const appKeysApi = {
  /** 查询所有 AppKey */
  list: () => get<AppKey[]>('/v2/app-keys'),
  /** 新建 AppKey */
  create: (data: Omit<AppKey, 'id' | 'createdAt'>) => post<AppKey>('/v2/app-keys', data),
  /** 更新 AppKey */
  update: (id: number, data: Partial<AppKey>) => put<AppKey>(`/v2/app-keys/${id}`, data),
  /** 删除 AppKey */
  delete: (id: number) => del<void>(`/v2/app-keys/${id}`),
  /** 开关 AppKey 状态 */
  toggle: (id: number, enabled: boolean) => put<AppKey>(`/v2/app-keys/${id}/toggle?enabled=${enabled}`),
};