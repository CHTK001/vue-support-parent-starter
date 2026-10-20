import { http, unwrapResult } from "@repo/utils";

/**
 * 在线节点 API
 *
 * 数据源：monitor 的 report 客户端注册（sync/client/register + monitor/app/report）。
 * 后端上下文：spring-api-support-monitor-starter / /ms/monitor/node。
 *
 * @author CH
 * @since 4.0.0.42
 */

const BASE = "/ms/monitor/node";

/** 在线节点 */
export interface MonitorNode {
  /** 会话标识（sync 注册标识） */
  clientId: string;
  /** 应用名 */
  applicationName?: string;
  /** 激活环境 */
  activeProfiles?: string;
  /** 主机名 */
  hostname?: string;
  /** IP 地址 */
  ipAddress?: string;
  /** 服务端口 */
  port?: number;
  /** 上下文路径 */
  contextPath?: string;
  /** 服务地址 */
  serviceUrl?: string;
  /** 操作系统 */
  osName?: string;
  /** Java 版本 */
  javaVersion?: string;
  /** 进程号 */
  pid?: number;
  /** 启动时间（毫秒） */
  startTime?: number;
  /** 注册时间（毫秒） */
  registerTime?: number;
  /** 最后心跳（毫秒） */
  lastHeartbeat?: number;
  /** 运行时长（毫秒） */
  uptime?: number;
  /** 是否在线 */
  online?: boolean;
  /** 扩展信息 */
  metadata?: Record<string, unknown>;
}

/** 节点统计 */
export interface MonitorNodeStats {
  total: number;
  online: number;
  offline: number;
}

/** 全部已注册节点（含离线） */
export const getMonitorNodes = () =>
  http().get(`${BASE}/list`).then(r => unwrapResult<MonitorNode[]>(r));

/** 仅在线节点 */
export const getOnlineMonitorNodes = () =>
  http().get(`${BASE}/online`).then(r => unwrapResult<MonitorNode[]>(r));

/** 节点统计 */
export const getMonitorNodeStats = () =>
  http().get(`${BASE}/stats`).then(r => unwrapResult<MonitorNodeStats>(r));
