/** 分组管理接口 */
import { get, post, put, del } from './request';
import { Group } from './types';

export const groupsApi = {
  /** 查询所有分组 */
  list: () => get<Group[]>('/groups'),
  /** 新建分组 */
  create: (data: Omit<Group, 'id' | 'createdAt'>) => post<Group>('/groups', data),
  /** 更新分组 */
  update: (id: string, data: Partial<Group>) => put<Group>(`/groups/${id}`, data),
  /** 删除分组 */
  delete: (id: string) => del<void>(`/groups/${id}`),
};