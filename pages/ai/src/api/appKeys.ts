/** AppKey 管理接口 */
import { get, post, put, del } from './request';
import { AppKey } from './types';

export const appKeysApi = {
  /** 查询所有 AppKey */
  list: () => get<AppKey[]>('/app-keys'),
  /** 新建 AppKey */
  create: (data: Omit<AppKey, 'id' | 'createdAt'>) => post<AppKey>('/app-keys', data),
  /** 更新 AppKey */
  update: (id: string, data: Partial<AppKey>) => put<AppKey>(`/app-keys/${id}`, data),
  /** 删除 AppKey */
  delete: (id: string) => del<void>(`/app-keys/${id}`),
  /** 开关 AppKey 状态 */
  toggle: (id: string, enabled: boolean) => put<AppKey>(`/app-keys/${id}/toggle`, { enabled }),
};