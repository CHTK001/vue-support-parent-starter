import request from "@/utils/request";

/**
 * API 功能开关信息
 */
export interface ApiFeatureVO {
  /** 功能标识 */
  featureId: string;
  /** 功能描述 */
  description: string;
  /** 功能分组 */
  group: string;
  /** 默认是否启用 */
  defaultEnabled: boolean;
  /** 当前是否启用 */
  enabled: boolean;
  /** 关闭时的响应消息 */
  disabledMessage: string;
  /** 关闭时的响应状态码 */
  disabledStatus: number;
  /** 所属类名 */
  className: string;
  /** 方法名 */
  methodName: string;
  /** 接口路径 */
  patterns: string[];
}

/**
 * 功能开关统计
 */
export interface ApiFeatureStats {
  /** 总数 */
  total: number;
  /** 启用数 */
  enabled: number;
  /** 禁用数 */
  disabled: number;
}

/**
 * 获取节点功能开关列表
 * @param ipAddress 节点IP
 * @param port 节点端口
 */
export function getNodeFeatures(ipAddress: string, port: number) {
  return request({
    url: "/monitor/api-features/node",
    method: "get",
    params: { ipAddress, port },
  });
}

/**
 * 获取节点功能开关统计
 * @param ipAddress 节点IP
 * @param port 节点端口
 */
export function getNodeFeatureStats(ipAddress: string, port: number) {
  return request({
    url: "/monitor/api-features/node/stats",
    method: "get",
    params: { ipAddress, port },
  });
}

/**
 * 设置节点功能开关状态
 * @param ipAddress 节点IP
 * @param port 节点端口
 * @param featureId 功能标识
 * @param enabled 是否启用
 */
export function setNodeFeatureEnabled(
  ipAddress: string,
  port: number,
  featureId: string,
  enabled: boolean
) {
  return request({
    url: `/monitor/api-features/node/${featureId}`,
    method: "put",
    params: { ipAddress, port, enabled },
  });
}

/**
 * 批量设置节点功能开关状态
 * @param ipAddress 节点IP
 * @param port 节点端口
 * @param states 状态映射
 */
export function setNodeFeatureEnabledBatch(
  ipAddress: string,
  port: number,
  states: Record<string, boolean>
) {
  return request({
    url: "/monitor/api-features/node/batch",
    method: "put",
    params: { ipAddress, port },
    data: states,
  });
}

/**
 * 重置节点所有功能开关
 * @param ipAddress 节点IP
 * @param port 节点端口
 */
export function resetNodeAllFeatures(ipAddress: string, port: number) {
  return request({
    url: "/monitor/api-features/node/reset-all",
    method: "post",
    params: { ipAddress, port },
  });
}
