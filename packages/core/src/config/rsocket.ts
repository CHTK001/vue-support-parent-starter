/**
 * RSocket 客户端封装
 * 提供与 Socket.IO 一致的 API 接口
 *
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */

import { getToken } from "@repo/core";
import { inject, provide, ref, type InjectionKey } from "vue";
import {
  createSocketTemplateKey,
  type ProtocolType,
  type SocketTemplateListenOptions,
  type SocketTemplate,
  SocketTemplateKey,
} from "./socketTemplate";
import { parseSocketMessage } from "./socket";

/**
 * RSocket 连接配置
 */
export interface RSocketConfig {
  /**
   * 服务器地址
   */
  url: string;

  /**
   * 心跳间隔（毫秒）
   */
  keepAlive?: number;

  /**
   * 心跳超时（毫秒）
   */
  lifetime?: number;

  /**
   * 数据序列化类型
   */
  dataMimeType?: string;

  /**
   * 元数据序列化类型
   */
  metadataMimeType?: string;
}

/**
 * RSocket 事件监听器Map
 */
const eventListeners = new Map<string, Set<(data: unknown) => void>>();

/**
 * RSocket 服务接口
 */
export interface RSocketService extends SocketTemplate {
  readonly protocol: "rsocket";
}

/**
 * RSocket 注入键
 */
export const RSocketKey: InjectionKey<RSocketService> = Symbol("RSocket");

/**
 * RSocket 键名映射
 */
const rsocketKeyMap = new Map<string, InjectionKey<RSocketService>>();

/**
 * 创建 RSocket 服务
 *
 * @param config RSocket 配置
 * @returns RSocket 服务实例
 */
export function createRSocketService(config: RSocketConfig): RSocketService {
  let rsocketInstance: WebSocket | null = null;
  const isConnected = ref(false);
  const localEventListeners = new Map<string, Set<(data: unknown) => void>>();

  /**
   * 连接 RSocket
   * 注意：这里使用 WebSocket 作为底层传输，模拟 RSocket 协议
   * 实际生产环境应使用 rsocket-js 库
   */
  const connect = () => {
    if (rsocketInstance) {
      console.warn("[RSocket] 已连接");
      return;
    }

    try {
      // 构建 WebSocket URL，添加认证信息
      const token = getToken();
      const wsUrl = config.url.replace(/^http/, "ws");
      const url = new URL(wsUrl);
      if (token?.accessToken) {
        url.searchParams.set("x-oauth-token", token.accessToken);
      }

      rsocketInstance = new WebSocket(url.toString());

      rsocketInstance.onopen = () => {
        isConnected.value = true;
        console.log("[RSocket] 连接成功");
        // 触发 connect 事件
        triggerEvent("connect", { connected: true });
      };

      rsocketInstance.onclose = () => {
        isConnected.value = false;
        console.log("[RSocket] 连接关闭");
        // 触发 disconnect 事件
        triggerEvent("disconnect", { connected: false });
      };

      rsocketInstance.onerror = (error) => {
        console.error("[RSocket] 连接错误:", error);
        triggerEvent("error", error);
      };

      rsocketInstance.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const eventName = message.event || "message";
          const data = parseSocketMessage(message.data || message);
          triggerEvent(eventName, data);
        } catch (error) {
          console.error("[RSocket] 消息解析错误:", error);
        }
      };
    } catch (error) {
      console.error("[RSocket] 创建连接失败:", error);
    }
  };

  /**
   * 触发事件
   */
  const triggerEvent = (event: string, data: unknown) => {
    const listeners = localEventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[RSocket] 事件处理错误 [${event}]:`, error);
        }
      });
    }
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (rsocketInstance) {
      rsocketInstance.close();
      rsocketInstance = null;
      isConnected.value = false;
    }
  };

  /**
   * 监听事件
   */
  const on = (
    event: string,
    callback: (data: unknown) => void,
    options?: SocketTemplateListenOptions
  ) => {
    if (!localEventListeners.has(event)) {
      localEventListeners.set(event, new Set());
    }

    // 包装回调以支持 dataId 过滤
    const wrappedCallback = (data: unknown) => {
      if (options?.dataId !== undefined) {
        const messageDataId = (data as Record<string, unknown>)?.dataId;
        if (String(messageDataId) !== String(options.dataId)) {
          return;
        }
      }
      callback(data);
    };

    localEventListeners.get(event)!.add(wrappedCallback);
  };

  /**
   * 移除事件监听
   */
  const off = (event: string) => {
    localEventListeners.delete(event);
  };

  /**
   * 发送事件
   */
  const emit = (event: string, data?: unknown) => {
    if (rsocketInstance && rsocketInstance.readyState === WebSocket.OPEN) {
      rsocketInstance.send(
        JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        })
      );
    } else {
      console.warn("[RSocket] 未连接，无法发送消息");
    }
  };

  /**
   * 关闭连接
   */
  const close = () => {
    disconnect();
    localEventListeners.clear();
  };

  return {
    protocol: "rsocket" as const,
    get socket() {
      return rsocketInstance;
    },
    get isConnected() {
      return isConnected.value;
    },
    connect,
    disconnect,
    on,
    off,
    emit,
    close,
  };
}

/**
 * 提供全局 RSocket 服务
 *
 * @param config RSocket 配置
 * @returns RSocket 服务实例
 */
export function provideGlobalRSocket(config: RSocketConfig): RSocketService {
  const rsocketService = createRSocketService(config);
  provide(RSocketKey, rsocketService);
  provide(SocketTemplateKey, rsocketService);
  return rsocketService;
}

/**
 * 注入全局 RSocket 服务
 */
export function useGlobalRSocket(): RSocketService | null {
  const rsocketService = inject(RSocketKey);
  if (!rsocketService) {
    console.warn(
      "[RSocket] 服务未提供，请确保在父组件中调用了 provideGlobalRSocket()"
    );
    return null;
  }
  return rsocketService;
}

/**
 * 创建或获取指定名称的 RSocket Key
 *
 * @param keyName RSocket 键名称
 * @returns InjectionKey<RSocketService>
 */
export function createRSocketKey(
  keyName: string
): InjectionKey<RSocketService> {
  if (!rsocketKeyMap.has(keyName)) {
    rsocketKeyMap.set(keyName, Symbol(`RSocket_${keyName}`));
  }
  return rsocketKeyMap.get(keyName)!;
}

/**
 * 提供指定名称的 RSocket 服务
 *
 * @param keyName RSocket 键名称
 * @param config RSocket 配置
 * @returns RSocket 服务实例
 */
export function provideRSocket(
  keyName: string,
  config: RSocketConfig
): RSocketService {
  const rsocketKey = createRSocketKey(keyName);
  const rsocketService = createRSocketService(config);
  provide(rsocketKey, rsocketService);

  // 同时提供为 SocketTemplate
  const socketTemplateKey = createSocketTemplateKey(keyName);
  provide(socketTemplateKey, rsocketService);

  return rsocketService;
}

/**
 * 注入指定名称的 RSocket 服务
 *
 * @param keyName RSocket 键名称，不传则使用全局
 */
export function useRSocket(keyName?: string): RSocketService | null {
  if (!keyName) {
    return useGlobalRSocket();
  }

  const rsocketKey = createRSocketKey(keyName);
  const rsocketService = inject(rsocketKey);

  if (!rsocketService) {
    console.warn(
      `[RSocket] 服务"${keyName}"未提供，请确保在父组件中调用了 provideRSocket("${keyName}", ...)`
    );
    return null;
  }

  return rsocketService;
}
