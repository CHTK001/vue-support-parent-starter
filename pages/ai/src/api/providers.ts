/** 模型供应商管理接口 */
import { get, post, put, del } from './request';
import { Provider } from './types';

export const providersApi = {
  /** 查询所有供应商 */
  list: () => get<Provider[]>('/providers'),
  /** 新建供应商 */
  create: (data: Omit<Provider, 'id' | 'createdAt'>) => post<Provider>('/providers', data),
  /** 更新供应商 */
  update: (id: string, data: Partial<Provider>) => put<Provider>(`/providers/${id}`, data),
  /** 删除供应商 */
  delete: (id: string) => del<void>(`/providers/${id}`),
  /** 开关供应商状态 */
  toggle: (id: string, enabled: boolean) => put<Provider>(`/providers/${id}/toggle`, { enabled }),
};