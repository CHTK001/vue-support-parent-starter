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

import { getConfig } from "@repo/config";
import type { App } from "vue";
import { computed, getCurrentScope, inject, onScopeDispose, provide, ref } from "vue";
import type { ProtocolType, SocketTemplate, WsMessage } from "./socketTemplate";
import { SocketTemplateKey, createSocketTemplateKey } from "./socketTemplate";

// 导入各协议实现
import { createSocketIOService } from "./socket.io";
import { createRSocketService } from "./rsocket";
import { createWebSocketService } from "./websocket";
import { createSseService } from "./sse";

// 重新导出各协议的类型和工厂函数
export { createSocketIOService, type SocketIOConfig } from "./socket.io";
export { createRSocketService, type RSocketConfig } from "./rsocket";
export { createWebSocketService, type WebSocketConfig } from "./websocket";
export { createSseService, type SseConfig } from "./sse";
export {
  parseSocketMessage,
  buildAuthUrl,
  toWebSocketUrl,
} from "./socketUtils";

/**
 * 协议类型
 */
export type { ProtocolType } from "./socketTemplate";

/**
 * Socket 服务统一配置
 */
export interface SocketServiceConfig {
  /** 协议类型，默认从全局配置获取 */
  protocol?: ProtocolType;
  /** 服务器地址列表，不传则从全局配置获取 */
  urls?: string[];
  /** Socket.IO/WebSocket 传输策略 */
  transports?: Array<"polling" | "websocket">;
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

export interface ManagedSocketState {
  source: "provider" | "global" | "named" | "created" | "missing";
  connected: boolean;
  error: string | null;
}

export interface ManagedSocketResolution {
  service: SocketTemplate | null;
  source: ManagedSocketState["source"];
  error: string | null;
}

export interface ManagedSocketOptions {
  /** 命名实例名称 */
  name: string;
  /** 可选：优先使用外部 provider 注入的 socket */
  preferredSocket?: SocketTemplate | null;
  /** 当既没有 provider/global/named 时，用于生成命名 socket 配置；默认直接使用 getGlobalSocketConfig() */
  resolveConfig?: () => SocketServiceConfig | null | undefined;
  /** 解析失败时的报错文案 */
  missingError?: string;
  /** 未显式指定时默认 false，避免组合式初始化时自动连线 */
  autoConnect?: boolean;
}

export interface ModuleSocketOptions<TState = ManagedSocketState>
  extends ManagedSocketOptions {
  /** 可选：将统一状态映射成模块自己的兼容状态结构 */
  mapState?: (state: ManagedSocketState) => TState;
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
let globalSocketConfig: {
  protocol?: ProtocolType;
  urls?: string[];
  context?: string;
} = {};

const splitUrls = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
};

const resolveOrigin = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      return new URL(value, window.location.origin).origin;
    }
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getWindowGlobalSocketService = (): SocketTemplate | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    (window.__GLOBAL_SOCKET_SERVICE__ as SocketTemplate | undefined) ?? null
  );
};

const syncWindowGlobalSocketService = (
  service: SocketTemplate | null,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (service) {
    window.__GLOBAL_SOCKET_SERVICE__ = service;
    return;
  }

  delete window.__GLOBAL_SOCKET_SERVICE__;
};

/**
 * 设置全局 Socket 配置（由 ConfigStore 调用）
 */
export function setGlobalSocketConfig(config: {
  protocol?: ProtocolType;
  urls?: string[];
  context?: string;
}): void {
  globalSocketConfig = { ...globalSocketConfig, ...config };
}

/**
 * 获取全局 Socket 配置
 */
export function getGlobalSocketConfig(): {
  protocol: ProtocolType;
  urls: string[];
  context?: string;
} {
  const appConfig = getConfig() || {};
  const explicitUrls = splitUrls(appConfig.SocketUrl);
  const protocol =
    globalSocketConfig.protocol ||
    (typeof appConfig.SocketProtocol === "string" &&
    appConfig.SocketProtocol.trim()
      ? appConfig.SocketProtocol.trim().toLowerCase()
      : "socketio");
  const context =
    globalSocketConfig.context ||
    appConfig.SocketPath ||
    "/socket.io";

  if (explicitUrls.length > 0) {
    return {
      protocol,
      urls: explicitUrls,
      context,
    };
  }

  if (globalSocketConfig.urls?.length) {
    return {
      protocol,
      urls: globalSocketConfig.urls,
      context,
    };
  }

  const baseUrl =
    resolveOrigin(appConfig.BaseUrl) ||
    resolveOrigin(appConfig.Request?.baseURL) ||
    (typeof window !== "undefined" ? window.location.origin : null);

  return {
    protocol,
    urls: baseUrl ? [baseUrl] : [],
    context,
  };
}

/**
 * 创建 Socket 服务
 * 根据协议类型自动选择实现
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function createSocketService(
  config: SocketServiceConfig,
): SocketTemplate {
  const protocol = config.protocol || "socketio";
  currentProtocol = protocol;

  console.log(`[SocketService] 创建 ${protocol.toUpperCase()} 服务`);

  switch (protocol) {
    case "socketio":
      return createSocketIOService({
        urls: config.urls,
        transports: config.transports,
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
      console.warn(
        `[SocketService] 未知协议类型: ${protocol}，使用默认 Socket.IO`,
      );
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
export function initGlobalSocketService(
  config: SocketServiceConfig,
): SocketTemplate {
  // 关闭旧连接
  if (globalSocketService) {
    globalSocketService.close();
  }

  globalSocketService = createSocketService(config);
  syncWindowGlobalSocketService(globalSocketService);

  return globalSocketService;
}

/**
 * 将全局 Socket 服务提供到 Vue 应用上下文
 *
 * @param app Vue 应用实例
 * @param service SocketTemplate 实例
 * @returns SocketTemplate 实例
 */
export function provideGlobalSocketService(
  app: App,
  service: SocketTemplate,
): SocketTemplate {
  globalSocketService = service;
  syncWindowGlobalSocketService(service);
  app.provide(SocketTemplateKey, service);
  return service;
}

/**
 * 获取全局 Socket 服务
 */
export function getGlobalSocketService(): SocketTemplate | null {
  if (globalSocketService) {
    return globalSocketService;
  }

  const windowService = getWindowGlobalSocketService();
  if (windowService) {
    globalSocketService = windowService;
    return windowService;
  }

  return null;
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
  return getGlobalSocketService();
}

/**
 * 关闭全局 Socket 服务
 */
export function closeGlobalSocketService(): void {
  const service = getGlobalSocketService();
  if (service) {
    service.close();
  }
  globalSocketService = null;
  syncWindowGlobalSocketService(null);
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
  config?: SocketServiceConfig,
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

  console.log(
    `[SocketService] 创建命名实例: ${name}, 协议: ${mergedConfig.protocol}`,
  );
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
 * 解析一个“受控命名 socket”实例。
 * 顺序固定为：preferred provider -> injected/global -> named cache -> create named。
 */
export function resolveManagedSocketService(
  options: ManagedSocketOptions,
): ManagedSocketResolution {
  if (options.preferredSocket) {
    return {
      service: options.preferredSocket,
      source: "provider",
      error: null,
    };
  }

  const globalService = useSocketService();
  if (globalService) {
    return {
      service: globalService,
      source: "global",
      error: null,
    };
  }

  const existing = getNamedSocketService(options.name);
  if (existing) {
    return {
      service: existing,
      source: "named",
      error: null,
    };
  }

  const config = options.resolveConfig?.() ?? getGlobalSocketConfig();
  if (!config?.urls?.length) {
    return {
      service: null,
      source: "missing",
      error: options.missingError || "未解析到可用的 Socket 地址",
    };
  }

  return {
    service: createNamedSocketService(options.name, {
      ...config,
      autoConnect: config.autoConnect ?? options.autoConnect ?? false,
    }),
    source: "created",
    error: null,
  };
}

/**
 * 确保“受控命名 socket”已连接。
 */
export function ensureManagedSocketConnected(
  options: ManagedSocketOptions,
): ManagedSocketResolution {
  const resolved = resolveManagedSocketService(options);
  if (!resolved.service) {
    return resolved;
  }

  if (!resolved.service.isConnected) {
    resolved.service.connect();
  }

  return resolved;
}

/**
 * 当命名 socket 未连接时关闭并清理实例。
 */
export function closeNamedSocketServiceIfIdle(name: string): void {
  const named = getNamedSocketService(name);
  if (named && !named.isConnected) {
    closeNamedSocketService(name);
  }
}

/**
 * 通用的“受控命名 socket”组合式。
 * 模块侧只需要提供 name 与 resolveConfig，即可复用统一的创建、连接、订阅与销毁逻辑。
 */
export function useManagedSocketService(options: ManagedSocketOptions) {
  const state = ref<ManagedSocketState>({
    source: options.preferredSocket ? "provider" : "missing",
    connected: false,
    error: null,
  });
  const subscriptions: Array<() => void> = [];

  const syncState = (resolved: ManagedSocketResolution): SocketTemplate | null => {
    state.value.source = resolved.source;
    state.value.connected = resolved.service?.isConnected ?? false;
    state.value.error = resolved.error;
    return resolved.service;
  };

  const getService = (): SocketTemplate | null =>
    syncState(resolveManagedSocketService(options));

  const ensureConnected = (): SocketTemplate | null => {
    const resolved = ensureManagedSocketConnected(options);
    const service = syncState(resolved);
    if (!service) {
      return null;
    }
    state.value.connected = service.isConnected || state.value.connected;
    return service;
  };

  const subscribe = (
    module: string,
    event: string,
    handler: (message: WsMessage) => void,
  ) => {
    const service = ensureConnected();
    if (!service) {
      return () => {};
    }
    const unsubscribe = service.subscribe(module, event, handler);
    subscriptions.push(unsubscribe);
    return () => {
      unsubscribe();
      const index = subscriptions.indexOf(unsubscribe);
      if (index >= 0) {
        subscriptions.splice(index, 1);
      }
    };
  };

  const clearSubscriptions = () => {
    while (subscriptions.length) {
      subscriptions.pop()?.();
    }
  };

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearSubscriptions();
      if (!options.preferredSocket) {
        closeNamedSocketServiceIfIdle(options.name);
      }
    });
  }

  return {
    state: computed(() => state.value),
    getService,
    ensureConnected,
    subscribe,
    clearSubscriptions,
  };
}

/**
 * 面向模块使用的轻量封装。
 * 在 useManagedSocketService 基础上，额外支持状态映射，方便旧模块保持自己的 state 结构。
 */
export function useModuleSocketService<TState = ManagedSocketState>(
  options: ModuleSocketOptions<TState>,
) {
  const managed = useManagedSocketService(options);

  return {
    state: computed(() =>
      options.mapState
        ? options.mapState(managed.state.value)
        : (managed.state.value as TState),
    ),
    getService: managed.getService,
    ensureConnected: managed.ensureConnected,
    subscribe: managed.subscribe,
    clearSubscriptions: managed.clearSubscriptions,
  };
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
  config: SocketServiceConfig,
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
