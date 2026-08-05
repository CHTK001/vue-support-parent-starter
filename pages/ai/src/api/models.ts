/** 模型定义管理接口 */
import { get, post, put, del } from './request';
import { AiModel } from './types';

export const modelsApi = {
  /** 查询所有模型 */
  list: () => get<AiModel[]>('/models'),
  /** 新建模型 */
  create: (data: Omit<AiModel, 'id' | 'createdAt' | 'providerName'>) => post<AiModel>('/models', data),
  /** 更新模型 */
  update: (id: number, data: Partial<AiModel>) => put<AiModel>(`/models/${id}`, data),
  /** 删除模型 */
  delete: (id: number) => del<void>(`/models/${id}`),
};