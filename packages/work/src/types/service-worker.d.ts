/**
 * Service Worker 全局最小类型（work 包 tsc 使用）
 *
 * 包内 tsc 仅引入 DOM lib（types: []），Service Worker 全局符号
 * （ServiceWorkerGlobalScope / ExtendableMessageEvent / clients）由
 * lib.webworker 提供但不可用，这里以最小声明替代，避免引入整个
 * WebWorker lib 与 DOM lib 冲突。运行时由 SW/Worker 上下文提供。
 */

/** Service Worker 受控客户端（仅用到 postMessage） */
interface ServiceWorkerClient {
  postMessage(message: unknown): void;
}

/** Service Worker clients 注册表（仅用到 matchAll / claim） */
interface ServiceWorkerClients {
  matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<ReadonlyArray<ServiceWorkerClient>>;
  claim(): Promise<void>;
}

/** Service Worker 全局作用域（仅用到 clients / skipWaiting / 生命周期监听） */
interface ServiceWorkerGlobalScope {
  clients: ServiceWorkerClients;
  skipWaiting(): Promise<void>;
  addEventListener(type: "install", listener: (event: Event) => void): void;
  addEventListener(type: "activate", listener: (event: ExtendableMessageEvent) => void): void;
  addEventListener(type: "message", listener: (event: ExtendableMessageEvent) => void): void;
  postMessage(message: unknown): void;
}

/** 可扩展消息事件（install / activate / message，支持 waitUntil） */
interface ExtendableMessageEvent<T = any> extends MessageEvent<T> {
  waitUntil(promise: Promise<unknown>): void;
}

/** Service Worker 上下文全局 clients */
declare const clients: ServiceWorkerClients;
