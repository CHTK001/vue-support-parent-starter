/**
 * 统一 Socket 服务入口
 * 支持多种协议: Socket.IO, RSocket, WebSocket, SSE
 * 对外提供统一的 API 接口，实现无缝切换
 * 支持全局实例和命名实例
 *
 * @author CH
 * @version 2.0.0
 * @since 2024-12-25
 */

import { inject, provide } from "vue";
import type { SocketTemplate } from "./socketTemplate";
import { SocketTemplateKey, createSocketTemplateKey } from "./socketTemplate";

// 导入各协议实现
import { createSocketIOService, type SocketIOConfig } from "./socket.io";
import { createRSocketService, type RSocketConfig } from "./rsocket";
import { createWebSocketService, type WebSocketConfig } from "./websocket";
import { createSseService, type SseConfig } from "./sse";

// 重新导出各协议的类型和工厂函数
export { createSocketIOService, type SocketIOConfig } from "./socket.io";
export { createRSocketService, type RSocketConfig } from "./rsocket";
export { createWebSocketService, type WebSocketConfig } from "./websocket";
export { createSseService, type SseConfig } from "./sse";
export { parseSocketMessage, buildAuthUrl, toWebSocketUrl } from "./socketUtils";

/**
 * 协议类型
 */
export type ProtocolType = "socketio" | "rsocket" | "websocket" | "sse";

/**
 * Socket 服务统一配置
 */
export interface SocketServiceConfig {
  /** 协议类型，默认从全局配置获取 */
  protocol?: ProtocolType;
  /** 服务器地址列表，不传则从全局配置获取 */
  urls?: string[];
  /** 上下文路径（Socket.IO/WebSocket 专用） */
  context?: string;
  /** WebSocket/SSE 路径 */
  path?: string;
  /** 查询参数 */
  query?: Record<string, string>;
  /** 自动连接，默认 true */
  autoConnect?: boolean;
  /** 自动重连，默认 true */
  reconnection?: boolean;
  /** 重连尝试次数，默认 3 */
  reconnectionAttempts?: number;
  /** 重连延迟（毫秒），默认 1000 */
  reconnectionDelay?: number;
  /** 心跳间隔（毫秒），WebSocket 专用，默认 30000 */
  heartbeatInterval?: number;
  /** SSE 客户端ID */
  clientId?: string;
  /** 是否携带凭证（SSE 专用） */
  withCredentials?: boolean;
}

/**
 * 全局 Socket 服务实例
 */
let globalSocketService: SocketTemplate | null = null;

/**
 * 命名 Socket 服务实例集合
 */
const namedSocketServices = new Map<string, SocketTemplate>();

/**
 * 当前协议类型
 */
let currentProtocol: ProtocolType = "socketio";

/**
 * 全局 Socket 配置缓存
 */
let globalSocketConfig: { protocol?: ProtocolType; urls?: string[]; context?: string } = {};

/**
 * 设置全局 Socket 配置（由 ConfigStore 调用）
 */
export function setGlobalSocketConfig(config: { protocol?: ProtocolType; urls?: string[]; context?: string }): void {
  globalSocketConfig = { ...globalSocketConfig, ...config };
}

/**
 * 获取全局 Socket 配置
 */
export function getGlobalSocketConfig(): { protocol: ProtocolType; urls: string[]; context?: string } {
  return {
    protocol: globalSocketConfig.protocol || "socketio",
    urls: globalSocketConfig.urls || [],
    context: globalSocketConfig.context,
  };
}

/**
 * 创建 Socket 服务
 * 根据协议类型自动选择实现
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function createSocketService(config: SocketServiceConfig): SocketTemplate {
  const protocol = config.protocol || "socketio";
  currentProtocol = protocol;

  console.log(`[SocketService] 创建 ${protocol.toUpperCase()} 服务`);

  switch (protocol) {
    case "socketio":
      return createSocketIOService({
        urls: config.urls,
        context: config.context,
        query: config.query,
        autoConnect: config.autoConnect,
        reconnection: config.reconnection,
        reconnectionAttempts: config.reconnectionAttempts,
        reconnectionDelay: config.reconnectionDelay,
      });

    case "rsocket":
      return createRSocketService({
        url: config.urls[0],
        keepAlive: config.heartbeatInterval,
      });

    case "websocket":
      return createWebSocketService({
        urls: config.urls,
        path: config.path || config.context,
        query: config.query,
        reconnection: config.reconnection,
        reconnectionAttempts: config.reconnectionAttempts,
        reconnectionDelay: config.reconnectionDelay,
        heartbeatInterval: config.heartbeatInterval,
      });

    case "sse":
      return createSseService({
        urls: config.urls,
        path: config.path,
        query: config.query,
        clientId: config.clientId,
        withCredentials: config.withCredentials,
        reconnection: config.reconnection,
        reconnectionDelay: config.reconnectionDelay,
      });

    default:
      console.warn(`[SocketService] 未知协议类型: ${protocol}，使用默认 Socket.IO`);
      return createSocketIOService({
        urls: config.urls,
        context: config.context,
        query: config.query,
      });
  }
}

// ==================== 全局实例管理 ====================

/**
 * 初始化全局 Socket 服务
 * 根据配置自动选择协议
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function initGlobalSocketService(config: SocketServiceConfig): SocketTemplate {
  // 关闭旧连接
  if (globalSocketService) {
    globalSocketService.close();
  }

  globalSocketService = createSocketService(config);
  provide(SocketTemplateKey, globalSocketService);

  return globalSocketService;
}

/**
 * 获取全局 Socket 服务
 */
export function getGlobalSocketService(): SocketTemplate | null {
  return globalSocketService;
}

/**
 * 使用全局 Socket 服务（Vue 组合式 API）
 */
export function useSocketService(): SocketTemplate | null {
  // 优先从 inject 获取
  const injected = inject(SocketTemplateKey, null);
  if (injected) {
    return injected;
  }

  // 回退到全局实例
  return globalSocketService;
}

/**
 * 关闭全局 Socket 服务
 */
export function closeGlobalSocketService(): void {
  if (globalSocketService) {
    globalSocketService.close();
    globalSocketService = null;
  }
}

// ==================== 命名实例管理 ====================

/**
 * 创建命名 Socket 服务
 * 用于服务器管理等场景，需要多个独立的 Socket 连接
 * 如果不指定 protocol 和 urls，会自动从全局配置中获取
 *
 * @param name 实例名称
 * @param config 配置（可选，不传则使用全局配置）
 * @returns SocketTemplate 实例
 */
export function createNamedSocketService(
  name: string,
  config?: SocketServiceConfig
): SocketTemplate {
  // 如果已存在，先关闭旧连接
  if (namedSocketServices.has(name)) {
    const existing = namedSocketServices.get(name)!;
    existing.close();
  }

  // 从全局配置获取默认值
  const globalConfig = getGlobalSocketConfig();
  const mergedConfig: SocketServiceConfig = {
    protocol: config?.protocol || globalConfig.protocol,
    urls: config?.urls || globalConfig.urls,
    context: config?.context || globalConfig.context,
    ...config,
  };

  const service = createSocketService(mergedConfig);
  namedSocketServices.set(name, service);

  console.log(`[SocketService] 创建命名实例: ${name}, 协议: ${mergedConfig.protocol}`);
  return service;
}

/**
 * 获取命名 Socket 服务
 *
 * @param name 实例名称
 * @returns SocketTemplate 实例或 null
 */
export function getNamedSocketService(name: string): SocketTemplate | null {
  return namedSocketServices.get(name) || null;
}

/**
 * 关闭命名 Socket 服务
 *
 * @param name 实例名称
 */
export function closeNamedSocketService(name: string): void {
  const service = namedSocketServices.get(name);
  if (service) {
    service.close();
    namedSocketServices.delete(name);
    console.log(`[SocketService] 关闭命名实例: ${name}`);
  }
}

/**
 * 关闭所有命名 Socket 服务
 */
export function closeAllNamedSocketServices(): void {
  namedSocketServices.forEach((service, name) => {
    service.close();
    console.log(`[SocketService] 关闭命名实例: ${name}`);
  });
  namedSocketServices.clear();
}

/**
 * 获取所有命名实例的名称列表
 */
export function getNamedSocketServiceNames(): string[] {
  return Array.from(namedSocketServices.keys());
}

/**
 * 检查命名实例是否存在
 *
 * @param name 实例名称
 */
export function hasNamedSocketService(name: string): boolean {
  return namedSocketServices.has(name);
}

// ==================== 工具函数 ====================

/**
 * 获取当前协议类型
 */
export function getCurrentProtocol(): ProtocolType {
  return currentProtocol;
}

/**
 * 提供命名 Socket 服务到 Vue 上下文
 *
 * @param name 实例名称
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function provideNamedSocketService(
  name: string,
  config: SocketServiceConfig
): SocketTemplate {
  const service = createNamedSocketService(name, config);
  const key = createSocketTemplateKey(name);
  provide(key, service);
  return service;
}

/**
 * 注入命名 Socket 服务从 Vue 上下文
 *
 * @param name 实例名称
 * @returns SocketTemplate 实例或 null
 */
export function useNamedSocketService(name: string): SocketTemplate | null {
  const key = createSocketTemplateKey(name);
  const injected = inject(key, null);
  if (injected) {
    return injected;
  }
  // 回退到命名实例集合
  return getNamedSocketService(name);
}
