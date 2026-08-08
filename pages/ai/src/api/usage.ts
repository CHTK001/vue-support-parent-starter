/** 用量统计接口 */
import { get } from './request';
import { Usage } from './types';

export const usageApi = {
  /** 查询用量，可选指定模型过滤 */
  get: (model?: string) => get<Usage[]>(`/v2/usage${model ? `?model=${encodeURIComponent(model)}` : ''}`),
};