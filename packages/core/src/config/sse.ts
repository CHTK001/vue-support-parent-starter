/**
 * SSE (Server-Sent Events) 协议实现
 * 封装 EventSource API，提供统一的 SocketTemplate 接口
 *
 * @author CH
 * @version 2.0.0
 * @since 2024-12-25
 */

import { ref, type InjectionKey } from "vue";
import { getToken } from "../utils/auth";
import type { SocketTemplate, SocketTemplateListenOptions } from "./socketTemplate";
import { parseSocketMessage, buildAuthUrl } from "./socketUtils";

/**
 * SSE 配置接口
 */
export interface SseConfig {
  /**
   * SSE 服务器地址列表
   */
  urls: string[];

  /**
   * SSE 路径
   */
  path?: string;

  /**
   * 查询参数
   */
  query?: Record<string, string>;

  /**
   * 客户端ID（可选）
   */
  clientId?: string;

  /**
   * 是否携带凭证
   */
  withCredentials?: boolean;

  /**
   * 自动重连，默认 true
   */
  reconnection?: boolean;

  /**
   * 重连延迟（毫秒），默认 3000
   */
  reconnectionDelay?: number;
}

/**
 * SSE 服务接口
 */
export interface SseService extends SocketTemplate {
  /**
   * EventSource 实例
   */
  readonly eventSource: EventSource | null;
}

/**
 * SSE 服务注入键
 */
export const SseServiceKey: InjectionKey<SseService> = Symbol("SseService");

/**
 * 创建 SSE 服务
 *
 * @param config SSE 配置
 * @returns SseService 实例
 */
export function createSseService(config: SseConfig): SseService {
  let eventSource: EventSource | null = null;
  const isConnected = ref(false);
  const listeners = new Map<string, Set<Function>>();

  // 构建连接URL
  const buildUrl = (): string => {
    const token = getToken();
    let baseUrl = config.urls[Math.floor(Math.random() * config.urls.length)];
    
    // 添加路径
    if (config.path) {
      baseUrl = baseUrl.replace(/\/$/, "") + config.path;
    }
    
    const queryParams: Record<string, string> = { ...config.query };
    if (config.clientId) {
      queryParams.clientId = config.clientId;
    }
    
    return buildAuthUrl(baseUrl, token?.accessToken, queryParams);
  };

  /**
   * 连接 SSE
   */
  const connect = () => {
    if (eventSource) {
      console.warn("[SSE] 已连接，请先断开连接");
      return;
    }

    const url = buildUrl();
    eventSource = new EventSource(url, {
      withCredentials: config.withCredentials ?? false,
    });

    eventSource.onopen = () => {
      isConnected.value = true;
      console.log("[SSE] 连接成功");
    };

    eventSource.onerror = (error) => {
      console.error("[SSE] 连接错误", error);
      if (eventSource?.readyState === EventSource.CLOSED) {
        isConnected.value = false;
      }
    };

    // 监听默认消息
    eventSource.onmessage = (event) => {
      const data = parseSocketMessage(event.data);
      triggerListeners("message", data);
    };

    // 监听连接成功事件
    eventSource.addEventListener("connected", (event: MessageEvent) => {
      const data = parseSocketMessage(event.data);
      console.log("[SSE] 连接确认", data);
      triggerListeners("connected", data);
    });
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      isConnected.value = false;
      console.log("[SSE] 已断开连接");
    }
  };

  /**
   * 触发监听器
   */
  const triggerListeners = (event: string, data: any) => {
    const eventListeners = listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[SSE] 事件处理错误: ${event}`, e);
        }
      });
    }
  };

  /**
   * 监听事件
   *
   * @param event 事件名称
   * @param callback 回调函数
   * @param options 可选配置
   */
  const on = (
    event: string,
    callback: (data: unknown) => void,
    options?: SocketTemplateListenOptions
  ) => {
    // 注册到内部监听器Map
    if (!listeners.has(event)) {
      listeners.set(event, new Set());

      // 为 EventSource 添加事件监听
      if (eventSource) {
        eventSource.addEventListener(event, (e: MessageEvent) => {
          const data = parseSocketMessage(e.data);

          // dataId 过滤
          if (options?.dataId !== undefined) {
            if (String(data?.dataId) !== String(options.dataId)) {
              return;
            }
          }

          triggerListeners(event, data);
        });
      }
    }

    // 添加回调
    const wrappedCallback = (data: any) => {
      // dataId 过滤
      if (options?.dataId !== undefined) {
        if (String(data?.dataId) !== String(options.dataId)) {
          return;
        }
      }
      callback(data);
    };

    listeners.get(event)?.add(wrappedCallback);

    // 如果 EventSource 已存在，立即添加监听器
    if (eventSource && !listeners.get(event)?.has(wrappedCallback)) {
      eventSource.addEventListener(event, (e: MessageEvent) => {
        const data = parseSocketMessage(e.data);
        wrappedCallback(data);
      });
    }
  };

  /**
   * 移除事件监听
   *
   * @param event 事件名称
   */
  const off = (event: string) => {
    listeners.delete(event);
    // 注意：EventSource 不支持直接移除特定事件的监听器
    // 这里只清理内部的回调映射
  };

  /**
   * 发送事件（SSE 不支持，打印警告）
   *
   * @param _event 事件名称
   * @param _data 数据
   */
  const emit = (_event: string, _data?: unknown) => {
    console.warn(
      "[SSE] SSE 是单向通信协议，不支持客户端发送消息。如需双向通信，请使用 WebSocket 或 Socket.IO。"
    );
  };

  /**
   * 关闭连接
   */
  const close = () => {
    disconnect();
    listeners.clear();
  };

  return {
    protocol: "sse" as const,
    get socket() {
      return eventSource;
    },
    get eventSource() {
      return eventSource;
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
 * 提供全局 SSE 服务
 *
 * @param config SSE 配置
 * @returns SseService 实例
 */
export function provideGlobalSse(config: SseConfig): SseService {
  const service = createSseService(config);
  return service;
}
