/** 告警规则管理接口 */
import { get, post, put, del } from './request';
import { Alert } from './types';

export const alertsApi = {
  /** 查询所有告警规则 */
  list: () => get<Alert[]>('/v2/alerts'),
  /** 新建告警规则 */
  create: (data: Omit<Alert, 'id' | 'createdAt'>) => post<Alert>('/v2/alerts', data),
  /** 更新告警规则 */
  update: (id: number, data: Partial<Alert>) => put<Alert>(`/v2/alerts/${id}`, data),
  /** 删除告警规则 */
  delete: (id: number) => del<void>(`/v2/alerts/${id}`),
  /** 开关告警规则状态 */
  toggle: (id: number, enabled: boolean) => put<Alert>(`/v2/alerts/${id}/toggle?enabled=${enabled}`),
};