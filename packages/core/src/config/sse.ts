/**
 * SSE (Server-Sent Events) 协议实现
 * 使用 @microsoft/fetch-event-source 提供统一的 SocketTemplate 接口
 *
 * @author CH
 * @version 2.0.0
 * @since 2024-12-25
 */

import { ref, type InjectionKey } from "vue";
import { fetchEventSource, EventStreamContentType } from "@microsoft/fetch-event-source";
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

  /**
   * 最大重连次数，默认 5
   */
  reconnectionAttempts?: number;
}

/**
 * SSE 服务接口
 */
export interface SseService extends SocketTemplate {
  /**
   * AbortController 实例（用于取消连接）
   */
  readonly abortController: AbortController | null;
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
  let abortController: AbortController | null = null;
  const isConnected = ref(false);
  const listeners = new Map<string, Set<Function>>();
  let reconnectAttempts = 0;
  const maxReconnectAttempts = config.reconnectionAttempts ?? 5;

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
    if (abortController) {
      console.warn("[SSE] 已连接，请先断开连接");
      return;
    }

    abortController = new AbortController();
    const url = buildUrl();
    const token = getToken();

    fetchEventSource(url, {
      method: "GET",
      headers: {
        "Accept": "text/event-stream",
        "Authorization": token?.accessToken ? `Bearer ${token.accessToken}` : "",
        ...(config.query || {}),
      },
      signal: abortController.signal,
      openWhenHidden: true, // 保持后台连接
      
      async onopen(response) {
        if (response.ok && response.headers.get("content-type")?.includes(EventStreamContentType)) {
          isConnected.value = true;
          reconnectAttempts = 0;
          console.log("[SSE] 连接成功");
          triggerListeners("connect", { connected: true });
        } else {
          throw new Error(`[SSE] 连接失败: ${response.status} ${response.statusText}`);
        }
      },

      onmessage(event) {
        // 处理事件名称
        const eventName = event.event || "message";
        const data = parseSocketMessage(event.data);
        
        // 处理连接确认事件
        if (eventName === "connected") {
          console.log("[SSE] 连接确认", data);
        }
        
        triggerListeners(eventName, data);
      },

      onerror(error) {
        console.error("[SSE] 连接错误", error);
        isConnected.value = false;
        triggerListeners("error", error);
        
        // 自动重连逻辑
        if (config.reconnection !== false && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = config.reconnectionDelay ?? 3000;
          console.log(`[SSE] 将在 ${delay}ms 后尝试重连 (${reconnectAttempts}/${maxReconnectAttempts})`);
          // fetchEventSource 会自动重试，这里抛出错误表示需要重连
          throw error;
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error("[SSE] 达到最大重连次数，停止重连");
          abortController?.abort();
          abortController = null;
        }
      },

      onclose() {
        isConnected.value = false;
        console.log("[SSE] 连接已关闭");
        triggerListeners("close", { closed: true });
      },
    }).catch((error) => {
      if (error.name !== "AbortError") {
        console.error("[SSE] fetchEventSource 错误:", error);
      }
    });
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      isConnected.value = false;
      reconnectAttempts = maxReconnectAttempts; // 阻止自动重连
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
    }

    // 添加回调（带 dataId 过滤）
    const wrappedCallback = (data: any) => {
      if (options?.dataId !== undefined) {
        if (String(data?.dataId) !== String(options.dataId)) {
          return;
        }
      }
      callback(data);
    };

    listeners.get(event)?.add(wrappedCallback);
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
      return abortController;
    },
    get abortController() {
      return abortController;
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
