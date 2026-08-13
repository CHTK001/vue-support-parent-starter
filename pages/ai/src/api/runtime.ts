/** AI 对话路由（runtime 分组）配置与聚合协议服务接口 */
import { get, post, put } from './request';

/** runtime 分组配置项 */
export interface RuntimeConfigItem {
  field: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN';
  description: string;
  sort: number;
}

/** 聚合协议服务状态 */
export interface ProtocolServerStatus {
  running: boolean;
  port: number;
  clientCount: number;
}

/** runtime 分组配置与协议服务 API */
export const runtimeApi = {
  /** 获取 runtime 分组配置（LLM 路由 + 聚合协议服务） */
  config: () => get<RuntimeConfigItem[]>('/v2/runtime/config'),
  /** 更新 runtime 分组配置 */
  updateConfig: (fields: { field: string; value: string }[]) =>
    put<unknown>('/v2/runtime/config', { fields }),

  /** 查询聚合协议服务状态 */
  protocolStatus: () => get<ProtocolServerStatus>('/v2/protocol-server/status'),
  /** 启动聚合协议服务 */
  protocolStart: () => post<string>('/v2/protocol-server/start'),
  /** 停止聚合协议服务 */
  protocolStop: () => post<string>('/v2/protocol-server/stop'),
  /** 热更新聚合客户端（按厂商表增删） */
  protocolReload: () => post<string>('/v2/protocol-server/reload'),
};
