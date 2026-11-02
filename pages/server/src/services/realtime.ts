/**
 * 共享实时通道（单例） —— @pages/server 的 SSE 统一接入点
 *
 * <p>原则：
 *   - 连接按 topic 管理，不是按页面/组件：同一个 topic 只会建一条连接；
 *   - 用 {@code on(topic, handler[, url, eventNames])} 订阅，退订到 0 时自动关闭底层连接；
 *   - 首次 {@code on()} 时才建立连接（不订阅就不建连），断线由通道处理。</p>
 *
 * <p>当前消费端：<li>{@code mailbox}（ScCredentialTab，邮箱推送，{@code /sse/connect}）</li>
 * 及后续行为：日志/告警的 SSE 流。（{@code pages/docker} 的容器日志/终端 SSE 目前有自己的
 * 通道，随后再接入本通道。）</p>
 *
 * @since 4.0.0.46
 */

export type RealtimeEventType = string;

export interface RealtimeEvent {
  type: RealtimeEventType;
  data: unknown;
  ts: number;
}

export type RealtimeEventHandler = (event: RealtimeEvent) => void;

/** 事件处理器容器 */
class EventBus {
  private handlers = new Map<RealtimeEventType, Set<RealtimeEventHandler>>();
  private globalHandlers = new Set<RealtimeEventHandler>();

  on(type: RealtimeEventType, handler: RealtimeEventHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  onAll(handler: RealtimeEventHandler) {
    this.globalHandlers.add(handler);
  }

  off(type: RealtimeEventType, handler: RealtimeEventHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  offAll(handler: RealtimeEventHandler) {
    this.globalHandlers.delete(handler);
  }

  emit(event: RealtimeEvent) {
    this.handlers.get(event.type)?.forEach((h) => {
      try { h(event); } catch { /* 忽略处理器抛出的异常，不影响其他消费方 */ }
    });
    this.globalHandlers.forEach((h) => {
      try { h(event); } catch { /* 忽略 */ }
    });
  }
}

/**
 * 一条 SSE 连接的生命周期。
 *
 * <p>SSE 事件是带名称的（例如 {@code connected} / {@code mailbox}），所以每个处理器
 * 注册一个或多个事件名；同一个 converter 的处理器在退订时精确移除对应的监听器，
 * 避免重复推送/内存泄漏。</p>
 */
class SseStream {
  private es: EventSource | null = null;
  /** SSE 事件名称 → 运行时处理器 */
  private handlers = new Map<string, Set<RealtimeEventHandler>>();
  /** 运行时处理器 → 所有已注册的事件名，用于精确退订 */
  private listening = new Map<RealtimeEventHandler, Set<string>>();
  /** 运行时处理器 → 事件名 → EventSource 监听器，用于断线重连后重新绑定 */
  private listeners = new Map<RealtimeEventHandler, Map<string, EventListener>>();

  constructor(topic: string, private url: string) {}

  /** 退订后是否还有仍在运行的处理器（空 set 要算，否则连接不释放） */
  get active() {
    return [...this.handlers.values()].some((s) => s.size > 0);
  }

  /** 底层连接是否已经建立（未建连时先建连，否则事件名监听挂不到连接上） */
  get connected() { return this.es !== null; }

  /** 退订后是否还有处理器（事件名 key 无限膨胀） */
  private syncHandlers() {
    for (const [name, s] of this.handlers) {
      if (s.size === 0) this.handlers.delete(name);
    }
  }

  /** 订阅事件名 */
  on(name: string, handler: RealtimeEventHandler) {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, new Set());
    }
    this.handlers.get(name)!.add(handler);

    if (!this.listening.has(handler)) {
      this.listening.set(handler, new Set());
    }
    const names = this.listening.get(handler)!;
    if (names.has(name)) return;
    names.add(name);

    // 已建连：马上注册，否则等 connect() 时统一注册
    const listener: EventListener = (ev) => {
      try {
        handler({ type: name, data: (ev as MessageEvent).data, ts: Date.now() });
      } catch { /* 忽略 */ }
    };
    if (this.es) {
      this.es.addEventListener(name, listener);
      this.listeners.get(handler)!.set(name, listener);
    }
  }

  /** 退订事件名 */
  off(name: string, handler: RealtimeEventHandler) {
    this.handlers.get(name)?.delete(handler);
    this.syncHandlers();
    const names = this.listening.get(handler);
    if (!names) return;
    names.delete(name);

    const listeners = this.listeners.get(handler);
    const listener = listeners?.get(name);
    if (listener) {
      this.es?.removeEventListener(name, listener);
      listeners!.delete(name);
    }
  }

  /** 退订该处理器的全部事件名 */
  offHandlers(handler: RealtimeEventHandler) {
    for (const name of [...this.listening.get(handler) ?? []]) {
      this.off(name, handler);
    }
  }

  /** 按 eventNames 建连 */
  subscribe() {
    if (!this.es) {
      this.connect(this.url);
    }
  }

  /** 停止该流的所有连接和处理器 */
  stop() {
    for (const [handler, names] of this.listening) {
      for (const name of names) {
        this.off(name, handler);
      }
    }
    this.close();
  }

  private connect(url: string) {
    this.url = url;
    try {
      if (this.es) this.close();
      this.es = new EventSource(url);
      /* 重新绑定所有已注册的处理器（重连后需恢复监听器） */
      for (const [handler, nameSet] of this.listening) {
        for (const name of nameSet) {
          if (this.listeners.get(handler)?.has(name)) continue;
          const listener: EventListener = (ev) => {
            try {
              handler({ type: name, data: (ev as MessageEvent).data, ts: Date.now() });
            } catch { /* 忽略 */ }
          };
          this.es!.addEventListener(name, listener);
          this.listeners.get(handler)!.set(name, listener);
        }
      }
      this.es.onerror = () => {
        for (const [handler] of this.listening) {
          try { handler({ type: 'error', data: null, ts: Date.now() }); } catch { /* 忽略 */ }
        }
        /* eslint-disable no-console */
        console.warn('[sse] ' + this.url + ' 连接断开');
        /* eslint-enable no-console */
      };
    } catch { /* 当前环境不支持 SSE */ }
  }

  private close() {
    this.es?.close();
    this.es = null;
  }
}

/**
 * 通道：按 topic 建连/释放，消息经事件总线派发。
 *
 * <p>{@code realtimeChannel} 是默认导出的单例，所有页面/组件共享同一个通道实例。</p>
 */
export class RealtimeChannel {
  private bus = new EventBus();
  private streams = new Map<string, SseStream>();
  private urlFn: (topic: string) => string;
  /** 每个 topic 下处理器的注册事件名 */
  private reg = new Map<string, Map<RealtimeEventHandler, Set<string>>>();

  constructor(urlFn: (topic: string) => string = (topic) => `/sse/${topic}`) {
    this.urlFn = urlFn;
  }

  /** 根据已注册的 topic 取连接地址 */
  private getUrl(topic: string, url?: string): string {
    return url ?? this.urlFn(topic);
  }

  /**
   * 订阅：至少一个订阅者时建连，全部退订时释放。
   *
   * @param topic 推送主题
   * @param handler 事件处理器
   * @param url 覆盖默认地址（mailbox 需传入带 clientId 的完整地址）
   * @param eventNames 该主题下订阅的事件名，未提供时只监听内容事件
   */
  on(topic: string, handler: RealtimeEventHandler, url?: string, eventNames?: string[]) {
    // 未建连时重新建连（带上消费方指定的地址）
    let stream = this.streams.get(topic);
    if (!stream || !stream.connected) {
      stream = new SseStream(topic, this.getUrl(topic, url));
      this.streams.set(topic, stream);
    }
    const registrations = this.reg.get(topic) ?? new Map();
    this.reg.set(topic, registrations);
    if (!registrations.has(handler)) registrations.set(handler, new Set());
    const names = registrations.get(handler)!;

    const eventNamesByConsumer = eventNames ?? ['message'];
    // 预留连接：还没有建连（或已断连）时先建连，之后注册的事件名才能直接挂到该连接上
    if (names.size === 0 || !stream.connected) stream.subscribe();

    for (const nodeName of eventNamesByConsumer) {
      if (names.has(nodeName)) continue;
      names.add(nodeName);
      stream.on(nodeName, handler);
    }
  }

  /**
   * 退订某个 topic 的事件处理器。
   *
   * @param topic 推送主题
   * @param handler 事件处理器
   */
  off(topic: string, handler: RealtimeEventHandler) {
    const registrations = this.reg.get(topic);
    if (!registrations) return;
    const names = registrations.get(handler);
    if (!names) return;
    registrations.delete(handler);

    const stream = this.streams.get(topic);
    if (stream) {
      for (const name of names) stream.off(name, handler);
    }

    // 没有 handler 了，释放底层连接
    if (this.streams.get(topic)?.active === false) {
      this.streams.delete(topic);
    }
  }

  /** 停止指定 topic 的所有连接 */
  stop(topic: string) {
    const stream = this.streams.get(topic);
    if (stream) {
      stream.stop();
      this.streams.delete(topic);
    }
    this.reg.delete(topic);
  }

  /** 断开全部连接 */
  reset() {
    for (const [topic, stream] of this.streams) {
      stream.stop();
      this.streams.delete(topic);
    }
    this.reg.clear();
    this.bus.offAll(() => { /* pass */ });
  }

  onAll(handler: RealtimeEventHandler) {
    this.bus.onAll(handler);
  }

  offAll(handler: RealtimeEventHandler) {
    this.bus.offAll(handler);
  }

  /** 透传一个事件到事件总线 */
  emit(event: RealtimeEvent) {
    this.bus.emit(event);
  }
}

/** 共享通道单例 */
export const realtimeChannel = new RealtimeChannel();
