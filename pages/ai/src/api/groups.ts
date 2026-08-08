/** 分组管理接口 */
import { get, post, put, del } from './request';
import { Group } from './types';

export const groupsApi = {
  /** 查询所有分组 */
  list: () => get<Group[]>('/v2/groups'),
  /** 新建分组 */
  create: (data: Omit<Group, 'id' | 'createdAt'>) => post<Group>('/v2/groups', data),
  /** 更新分组 */
  update: (id: number, data: Partial<Group>) => put<Group>(`/v2/groups/${id}`, data),
  /** 删除分组 */
  delete: (id: number) => del<void>(`/v2/groups/${id}`),
};