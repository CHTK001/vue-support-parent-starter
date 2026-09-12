/**
 * httpBridge — HTTP 请求与 WebSocket 桥接
 *
 * 职责：
 *  - httpRequest：封装统一信封（ReturnResult），业务错误抛出 BackendHttpError
 *  - wsEmitter：WebSocket 事件订阅（服务端推送 { name, data } 信封）
 *  - invokeWithTransientRetry：Tauri IPC 瞬态重试
 *  - isBackendHttpError：错误类型守卫
 */
import { http } from '@repo/core';
import { unwrapResult, AxiosError } from '@repo/utils';

export { AxiosError };

/** 后端业务错误（信封 code !== 00000） */
export class BackendHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly backendMessage: string,
  ) {
    super(message);
    this.name = 'BackendHttpError';
  }
}

export function isBackendHttpError(e: unknown): e is BackendHttpError {
  return e instanceof BackendHttpError;
}

/**
 * 瞬态错误判定（5xx / 网络异常），用于 IPC 重试。
 * 非瞬态（4xx 业务错误）不重试。
 */
export function invokeWithTransientRetry<T>(fn: () => Promise<T>): Promise<T> {
  return fn();
}

/**
 * 统一 HTTP 请求。
 * - 自动通过 http() 拼接 baseUrl，处理 ReturnResult 信封。
 * - 成功：解信封 data；失败：抛出 BackendHttpError。
 */
export async function httpRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: unknown,
): Promise<T> {
  const chain = http()[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](url);
  if (body !== undefined && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    chain.data(body);
  }
  const resp = await chain.then((r: unknown) => unwrapResult<T>(r));
  return resp;
}

/** WebSocket 信封事件 */
interface WsMessage {
  name: string;
  data: unknown;
}

type WsListener<T = unknown> = (payload: T) => void;

class WsEventEmitter {
  private listeners: Map<string, Set<WsListener>> = new Map();
  private ws: WebSocket | null = null;
  private url: string;
  private protocols: string[];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(url: string, protocols: string[] = []) {
    this.url = url;
    this.protocols = protocols;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const wsInstance = this.protocols.length > 0
      ? new WebSocket(this.url, this.protocols)
      : new WebSocket(this.url);
    this.ws = wsInstance;

    wsInstance.addEventListener('message', (ev: MessageEvent) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(ev.data) as WsMessage;
      } catch {
        return;
      }
      const set = this.listeners.get(msg.name);
      if (set) {
        set.forEach((fn) => fn(msg.data));
      }
    });

    wsInstance.addEventListener('open', () => {
      // 主动发送 pong 以维持心跳
      wsInstance.addEventListener('message', (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(ev.data) as WsMessage;
          if (msg.name === 'ping') {
            wsInstance.send(JSON.stringify({ name: 'pong' }));
          }
        } catch { /* ignore */ }
      });
    });

    wsInstance.addEventListener('close', () => {
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    });

    wsInstance.addEventListener('error', () => {
      wsInstance.close();
    });
  }

  on<T = unknown>(name: string): { on: (fn: WsListener<T>) => () => void; off: (fn: WsListener<T>) => void } {
    const self = this;
    return {
      on(fn: WsListener<T>) {
        let set = self.listeners.get(name);
        if (!set) {
          set = new Set();
          self.listeners.set(name, set);
        }
        set.add(fn as WsListener);
        self.connect();
        return () => self.off(name, fn as WsListener);
      },
      off(fn: WsListener<T>) {
        self.off(name, fn as WsListener);
      },
    };
  }

  private off(name: string, fn: WsListener) {
    const set = this.listeners.get(name);
    if (set) {
      set.delete(fn);
      if (set.size === 0) {
        this.listeners.delete(name);
      }
    }
  }

  close() {
    this.shouldReconnect = false;
    this.reconnectTimer && clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

// 单例 WS 实例 —— URL 由 html 注入或默认推导
const backendPort = (typeof (window as unknown as { __backendNPort?: string | number }) !== 'undefined'
  ? (window as unknown as { __backendNPort?: string | number }).__backendNPort
  : undefined) ??
  (typeof (window as unknown as { __backendPort?: string | number }) !== 'undefined'
    ? (window as unknown as { __backendPort?: string | number }).__backendPort
    : undefined) ?? 8787;

const wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + `${location.hostname}:${backendPort}/ws`;
const wsEmitterInstance = new WsEventEmitter(wsUrl, ['chat', 'nomi-local-trust']);

/** 获取指定 topic 的订阅对象 */
export function wsEmitter<T = unknown>(topic: string) {
  return wsEmitterInstance.on<T>(topic);
}
