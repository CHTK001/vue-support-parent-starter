/**
 * 统一 Socket 管理器
 * 根据协议类型创建对应的 Socket 服务
 *
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */

import { inject, provide } from "vue";
import {
  createRSocketService,
  provideGlobalRSocket,
  type RSocketConfig,
  type RSocketService,
} from "./rsocket";
import {
  createGlobalSocketService,
  provideGlobalSocket,
  type GlobalSocketService,
} from "./socket";
import {
  createSseService,
  provideGlobalSse,
  type SseConfig,
  type SseService,
} from "./sse";
import {
  type ProtocolType,
  type SocketTemplate,
  SocketTemplateKey,
  createSocketTemplateKey,
} from "./socketTemplate";

/**
 * Socket 管理器配置
 */
export interface SocketManagerConfig {
  /**
   * 协议类型
   */
  protocol: ProtocolType;

  /**
   * Socket.IO 配置（当 protocol 为 socketio 时使用）
   */
  socketio?: {
    urls: string[];
    context?: string;
    query?: Record<string, string>;
    options?: {
      transports?: string[];
      autoConnect?: boolean;
      reconnection?: boolean;
      reconnectionAttempts?: number;
      reconnectionDelay?: number;
    };
  };

  /**
   * RSocket 配置（当 protocol 为 rsocket 时使用）
   */
  rsocket?: RSocketConfig;

  /**
   * SSE 配置（当 protocol 为 sse 时使用）
   */
  sse?: SseConfig;
}

/**
 * 创建 Socket 服务
 * 根据协议类型创建对应的服务实例
 *
 * @param config Socket 管理器配置
 * @returns SocketTemplate 实例
 */
export function createSocketService(
  config: SocketManagerConfig
): SocketTemplate {
  if (config.protocol === "rsocket" && config.rsocket) {
    return createRSocketService(config.rsocket);
  }

  if (config.protocol === "sse" && config.sse) {
    return createSseService(config.sse);
  }

  // 默认使用 Socket.IO
  if (config.socketio) {
    const defaultOptions = {
      transports: ["websocket"] as string[],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    };
    const service = createGlobalSocketService(
      config.socketio.urls,
      config.socketio.context,
      config.socketio.query,
      { ...defaultOptions, ...config.socketio.options }
    );
    // 转换为 SocketTemplate 接口
    return {
      protocol: "socketio" as const,
      get socket() {
        return service.socket;
      },
      get isConnected() {
        return service.isConnected;
      },
      connect: service.connect,
      disconnect: service.disconnect,
      on: service.on,
      off: service.off,
      emit: service.emit,
      close: service.close,
    };
  }

  throw new Error(
    "[SocketManager] 无效的配置，需要提供 socketio、rsocket 或 sse 配置"
  );
}

/**
 * 提供全局 Socket 服务
 * 根据协议类型提供对应的服务
 *
 * @param config Socket 管理器配置
 * @returns SocketTemplate 实例
 */
export function provideSocketService(
  config: SocketManagerConfig
): SocketTemplate {
  const service = createSocketService(config);
  provide(SocketTemplateKey, service);
  return service;
}

/**
 * 注入全局 Socket 服务
 * 返回统一的 SocketTemplate 接口
 */
export function useSocketService(): SocketTemplate | null {
  const service = inject(SocketTemplateKey);
  if (!service) {
    console.warn("[SocketManager] Socket 服务未提供");
    return null;
  }
  return service;
}

/**
 * 提供指定名称的 Socket 服务
 *
 * @param keyName Socket 键名称
 * @param config Socket 管理器配置
 * @returns SocketTemplate 实例
 */
export function provideNamedSocketService(
  keyName: string,
  config: SocketManagerConfig
): SocketTemplate {
  const service = createSocketService(config);
  const socketTemplateKey = createSocketTemplateKey(keyName);
  provide(socketTemplateKey, service);
  return service;
}

/**
 * 注入指定名称的 Socket 服务
 *
 * @param keyName Socket 键名称，不传则使用全局
 */
export function useNamedSocketService(keyName?: string): SocketTemplate | null {
  if (!keyName) {
    return useSocketService();
  }

  const socketTemplateKey = createSocketTemplateKey(keyName);
  const service = inject(socketTemplateKey);

  if (!service) {
    console.warn(`[SocketManager] Socket 服务"${keyName}"未提供`);
    return null;
  }

  return service;
}

/**
 * 根据配置自动初始化 Socket 服务
 * 从配置中读取 protocol 并创建对应服务
 *
 * @param protocol 协议类型
 * @param urls 服务器地址数组
 * @param context 上下文路径
 * @param options 额外选项
 * @returns SocketTemplate 实例
 */
export function initSocketByProtocol(
  protocol: ProtocolType = "socketio",
  urls: string[],
  context?: string,
  options?: Record<string, unknown>
): SocketTemplate {
  if (protocol === "rsocket") {
    // RSocket 使用第一个 URL
    const rsocketConfig: RSocketConfig = {
      url: urls[0].replace(/^http/, "ws"),
      keepAlive: (options?.keepAlive as number) || 30000,
      lifetime: (options?.lifetime as number) || 120000,
      dataMimeType: (options?.dataMimeType as string) || "application/json",
      metadataMimeType:
        (options?.metadataMimeType as string) || "message/x.rsocket.routing.v0",
    };
    return provideGlobalRSocket(rsocketConfig);
  }

  if (protocol === "sse") {
    // SSE 使用第一个 URL
    const sseConfig: SseConfig = {
      url: urls[0] + (context || "/sse/connect"),
      clientId: options?.clientId as string,
      withCredentials: (options?.withCredentials as boolean) ?? false,
    };
    return provideGlobalSse(sseConfig);
  }

  // 默认 Socket.IO
  const socketService = provideGlobalSocket(
    urls,
    context,
    options?.query || {},
    {
      transports: (options?.transports as string[]) || ["websocket"],
      autoConnect: (options?.autoConnect as boolean) ?? true,
      reconnection: (options?.reconnection as boolean) ?? true,
      reconnectionAttempts: (options?.reconnectionAttempts as number) || 3,
      reconnectionDelay: (options?.reconnectionDelay as number) || 1000,
    }
  );

  // 转换为 SocketTemplate
  return {
    protocol: "socketio" as const,
    get socket() {
      return socketService.socket;
    },
    get isConnected() {
      return socketService.isConnected;
    },
    connect: socketService.connect,
    disconnect: socketService.disconnect,
    on: socketService.on,
    off: socketService.off,
    emit: socketService.emit,
    close: socketService.close,
  };
}
