/** 服务管理接口 */
import { get, post } from './request';
import { ServiceStatus } from './types';

export const servicesApi = {
  /** 查询所有服务运行状态 */
  list: () => get<ServiceStatus[]>('/services/status'),
  /** 启动服务 */
  start: (name: string) => post<void>(`/services/${name}/start`),
  /** 停止服务 */
  stop: (name: string) => post<void>(`/services/${name}/stop`),
};