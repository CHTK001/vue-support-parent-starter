/**
 * Socket.IO 协议实现
 * 基于 socket.io-client，支持自动连接/重连与统一消息解析
 *
 * 用法：
 *   const io = createSocketIOService({ urls: [...], context: "/socket.io" });
 *   io.on("message", (data) => ...);
 */
import { ref } from "vue";
import type { Socket } from "socket.io-client";
import { log } from "@repo/utils";
import {
  getSocketToken,
  matchesSocketListenOptions,
  parseSocketMessage,
} from "./socketUtils";
import { createUrlSelector } from "./urlSelector";
import type {
  SocketTemplate,
  SocketTemplateListenOptions,
  WsMessage,
} from "./socketTemplate";

/** Socket.IO 配置 */
export interface SocketIOConfig {
  urls: string[];
  context?: string;
  query?: Record<string, string>;
  transports?: string[];
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  /** 是否携带同源/跨源 Cookie（用于服务端 Cookie 鉴权），默认 true */
  withCredentials?: boolean;
  /** 失败地址黑名单缓存时长（毫秒），默认 60_000 */
  blacklistTtlMs?: number;
}

/**
 * 清除服务端握手响应（Set-Cookie）种下的陈旧会话 cookie。
 *
 * netty-socketio 的 AuthorizeHandler 在 randomSession=false（默认）时会直接取
 * 请求里的 io cookie 值作为新会话 id。浏览器把上一次握手的 io=<sid> 存在源上，
 * 之后任何新建的 socket.io 客户端握手都会带着它「复用」该会话。旧实例被
 * disconnect 后，netty 侧会话与通道仍是僵尸态（releasePollingChannel 只解绑
 * channel、不删 ClientHead，pingTimeout 到期前会话一直可查），新实例复用僵尸
 * 会话后 CONNECT_ACK 永远投递不到，表现为 connect 事件永不触发、全部订阅静默
 * ——监控页数值冻结的根因。每次新建连接前清掉该 cookie，强制服务端签发全新会话。
 */
function clearSocketSessionCookie(): void {
  if (typeof document === "undefined") {
    return;
  }
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  // Set-Cookie 未带 Path 时默认路径为请求 URI 目录（/socket.io），多写几个路径兜底
  for (const path of ["/socket.io", "/socket.io/", "/"]) {
    document.cookie = `io=; path=${path}; ${expired}`;
  }
}

/**
 * socket.io-client 按需动态加载。
 *
 * 该包体积大，而并非每个宿主都启用 socket（socket.enable=false 或协议配成
 * sse / websocket 的应用完全用不到）。静态 import 会把它无条件打进每个宿主入口；
 * 改为首次真正建连时才 import()，未启用 socket 的宿主首包不再携带该包。
 * 加载失败时清空缓存 promise，由看门狗下一轮 connect() 重新拉取。
 */
type IoFactory = typeof import("socket.io-client").io;
let ioFactoryPromise: Promise<IoFactory> | null = null;

function loadSocketIOClient(): Promise<IoFactory> {
  if (!ioFactoryPromise) {
    ioFactoryPromise = import("socket.io-client")
      .then((mod) => mod.io)
      .catch((error: unknown) => {
        ioFactoryPromise = null;
        throw error;
      });
  }
  return ioFactoryPromise;
}

/**
 * 创建 Socket.IO 服务
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function createSocketIOService(config: SocketIOConfig): SocketTemplate {
  const isConnected = ref(false);
  let socketInstance: Socket | null = null;
  const eventListeners = new Map<string, Set<(data: unknown) => void>>();
  /** socket 实例就绪前 on() 登记的监听：openConnection 建好实例后统一补挂 */
  const pendingListeners = new Map<string, Set<(data: unknown) => void>>();
  /** socket.io-client 动态加载 / 建连在途标记：看门狗与多个订阅方同时触发时只走一次 */
  let connecting = false;
  /** 主动断开后置位：阻止在途的异步加载回调复活连接 */
  let closed = false;
  const autoConnect = config.autoConnect ?? true;
  /** 多地址负载均衡 / 失败降级选择器 */
  const selector = createUrlSelector({
    urls: config.urls,
    blacklistTtlMs: config.blacklistTtlMs,
  });
  // 默认先 polling 建连再升级 websocket：纯 websocket 在代理/停机场景下可能一直握手失败，
  // polling 能保证连接建立（socket.io 会在可用时自动升级到 websocket），兼顾可靠与实时性。
  const transports =
    config.transports && config.transports.length > 0
      ? config.transports
      : ["polling", "websocket"];

  /** 看门狗定时器：长时间未连接时强制重建，避免库自身重连卡死导致永久失联 */
  let watchdog: ReturnType<typeof setInterval> | null = null;
  /** 连续未连接起始时间戳，0 表示当前已连 */
  let downSince = 0;

  const connect = () => {
    closed = false;
    if (socketInstance?.connected) {
      return;
    }

    if (socketInstance) {
      socketInstance.connect();
      return;
    }

    // 动态加载 / 建连已在途中：不重复触发（加载完成后由 openConnection 接手）
    if (connecting) {
      return;
    }

    // 未登录时不要创建连接：此时 token 为空，服务端会拒绝握手，
    // 并产生持续 xhr poll error。登录后 token provider 已有值，
    // 看门狗会再次调用 connect()，用新 token 建立连接。
    startWatchdog();
    const token = getSocketToken();
    if (!token) {
      if (!downSince) {
        downSince = Date.now();
      }
      return;
    }
    const url = selector.next();
    if (!url) {
      log.warn("[Socket.IO] 无可用的连接地址");
      return;
    }

    // 新建连接前清掉陈旧会话 cookie：netty 会用 io cookie 复用上一个已被
    // disconnect 的僵尸会话，导致新实例永远收不到 CONNECT_ACK（详见
    // clearSocketSessionCookie 注释）
    clearSocketSessionCookie();
    connecting = true;

    // socket.io-client 动态加载：首次真正建连时才拉取（见 loadSocketIOClient 注释）。
    // 加载窗口内 on() 新登记的监听先进 pendingListeners，实例就绪后统一补挂。
    void loadSocketIOClient()
      .then((io) => {
        connecting = false;
        // 加载期间可能已被 disconnect / forceRebuild 处理：不要用旧地址复活连接
        if (closed || socketInstance) {
          return;
        }
        openConnection(io, url, token);
      })
      .catch((error: unknown) => {
        connecting = false;
        // 加载失败：降级该地址，交给看门狗下一轮重试（loadSocketIOClient 已清缓存）
        selector.markFailure(url);
        log.error(`[Socket.IO] 客户端加载失败 ${url}:`, error);
      });
  };

  /**
   * 用已加载的 io 工厂在指定地址上建连并挂接内部事件。
   *
   * @param io socket.io-client 的 io 工厂（动态加载产物）
   * @param url 本次连接的目标地址
   * @param token 握手鉴权令牌（走 x-oauth-token 消息头）
   */
  function openConnection(io: IoFactory, url: string, token: string): void {
    const socket = io(url, {
      path: config.context || "/socket.io",
      transports,
      autoConnect,
      reconnection: config.reconnection ?? true,
      reconnectionAttempts: config.reconnectionAttempts ?? Infinity,
      reconnectionDelay: config.reconnectionDelay ?? 1000,
      reconnectionDelayMax: 5000,
      timeout: 8000,
      // token 走消息头，不再拼进 URL query：accessToken 是长 JWT，放进 query 会让
      // 握手 URL 变得很长，还会泄进访问日志 / 浏览器历史 / 代理访问记录。
      //
      // 传输限制（务必知情）：extraHeaders 只在 **polling** 传输的 HTTP 握手里以
      // x-oauth-token 头发送；纯 websocket 传输下浏览器 WebSocket 握手不允许自定义头，
      // 该头不发送。服务端现已启用 SocketAuthFactory 握手鉴权，因此优先保留 polling
      // 作为初始传输（代码默认 ["polling","websocket"] 正是为此）；若部署强制
      // websocket-only，可依赖同源 Cookie（withCredentials）鉴权，查询参数仅作兜底。
      extraHeaders: {
        "x-oauth-token": token,
      },
      withCredentials: config.withCredentials ?? true,
      query: {
        ...config.query,
      },
    });
    socketInstance = socket;

    socket.on("connect", () => {
      isConnected.value = true;
      downSince = 0;
      // 连接成功：恢复该地址健康状态
      selector.markSuccess(url);
    });

    socket.on("disconnect", () => {
      isConnected.value = false;
      if (!downSince) downSince = Date.now();
    });

    // 重连次数耗尽（理论上 Infinity 不触发，兜底）：强制整体重建
    socket.io.on("reconnect_failed", () => {
      forceRebuild("reconnect_failed");
    });

    socket.on("connect_error", (error) => {
      log.error(`[Socket.IO] 连接错误 ${url}:`, error);
      // 连接失败：降级该地址（进入黑名单）
      selector.markFailure(url);
      if (selector.availableCount() > 0) {
        // 多地址且仍有健康地址：销毁当前连接，重建到下一地址
        if (socketInstance) {
          socketInstance.removeAllListeners();
          socketInstance.disconnect();
          socketInstance = null;
          isConnected.value = false;
        }
        connect();
      }
      // 单地址（或全部地址都在黑名单）：不销毁，交给 socket.io 自身 reconnection
      // 持续重试，后端恢复 / 黑名单到期后自动连上，避免永久失联。
    });

    // message 事件分发（必须在 socketInstance 创建后注册）
    socket.on("message", (raw: unknown) => {
      try {
        const parsed = parseSocketMessage(raw);
        const msg = (
          typeof parsed === "string" ? JSON.parse(parsed) : parsed
        ) as WsMessage;
        if (!msg?.module || !msg?.event) return;
        const key = `${msg.module}_${msg.event}`;
        subscribeHandlers.get(key)?.forEach((h) => {
          try {
            h(msg);
          } catch {
            /* 忽略单个订阅者异常 */
          }
        });
      } catch {
        /* 忽略解析异常 */
      }
    });

    // 补挂实例就绪前 on() 登记的监听（动态加载窗口内的订阅不丢）
    for (const [event, callbacks] of pendingListeners) {
      for (const callback of callbacks) {
        socket.on(event, callback);
      }
    }
    pendingListeners.clear();

    if (!autoConnect) {
      socket.connect();
    }
    startWatchdog();
  }

  /**
   * 彻底拆除当前连接并整体重建（看门狗 / 重连失败兜底）。
   *
   * @param reason 触发原因，用于日志
   */
  function forceRebuild(reason: string): void {
    log.warn(`[Socket.IO] 强制重建连接（${reason}）`);
    try {
      socketInstance?.removeAllListeners();
      socketInstance?.disconnect();
    } catch {
      /* 忽略拆除异常 */
    }
    socketInstance = null;
    isConnected.value = false;
    downSince = Date.now();
    connect();
  }

  /**
   * 启动连接看门狗：未连接超过 20s 则强制重建，从未建连时主动发起。
   */
  function startWatchdog(): void {
    if (watchdog) {
      return;
    }
    watchdog = setInterval(() => {
      if (isConnected.value) {
        downSince = 0;
        return;
      }
      if (!socketInstance) {
        if (!downSince) downSince = Date.now();
        connect();
      }
      if (!downSince) downSince = Date.now();
      if (Date.now() - downSince > 20000) {
        forceRebuild("watchdog-timeout");
      }
    }, 5000);
  }

  /** 停止看门狗（主动关闭时） */
  function stopWatchdog(): void {
    if (watchdog) {
      clearInterval(watchdog);
      watchdog = null;
    }
  }

  const disconnect = () => {
    closed = true;
    connecting = false;
    stopWatchdog();
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      isConnected.value = false;
      downSince = 0;
    }
    // 加载窗口内登记、尚未挂上实例的监听随连接一并作废（监听随 socket 销毁的既有口径）
    pendingListeners.clear();
    // 主动拆除时同步清掉会话 cookie，避免后续新建连接复用僵尸会话
    clearSocketSessionCookie();
  };

  const on = (
    event: string,
    callback: (data: unknown) => void,
    options?: SocketTemplateListenOptions,
  ) => {
    if (!socketInstance) {
      connect();
    }

    const wrappedCallback = (rawData: unknown) => {
      const data = parseSocketMessage(rawData);
      if (!matchesSocketListenOptions(data, options, rawData)) {
        return;
      }
      callback(data);
    };

    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(wrappedCallback);

    if (socketInstance) {
      socketInstance.on(event, wrappedCallback);
    } else {
      // socket.io-client 尚在动态加载（或暂无 token 未能建连）：
      // 先登记到 pendingListeners，实例在 openConnection 里就绪后统一补挂。
      if (!pendingListeners.has(event)) {
        pendingListeners.set(event, new Set());
      }
      pendingListeners.get(event)!.add(wrappedCallback);
    }
  };

  const off = (event: string) => {
    if (socketInstance) {
      socketInstance.off(event);
    }
    eventListeners.delete(event);
    pendingListeners.delete(event);
  };

  const emit = (event: string, data?: unknown) => {
    if (!socketInstance) {
      connect();
    }

    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
      return;
    }

    log.warn("[Socket.IO] 未连接，无法发送消息");
  };

  const close = () => {
    stopWatchdog();
    disconnect();
    eventListeners.clear();
  };

  const subscribeHandlers = new Map<string, Set<(msg: WsMessage) => void>>();

  const subscribe = (
    module: string,
    event: string,
    handler: (msg: WsMessage) => void,
  ): (() => void) => {
    if (!socketInstance) {
      connect();
    }
    const key = `${module}_${event}`;
    if (!subscribeHandlers.has(key)) subscribeHandlers.set(key, new Set());
    subscribeHandlers.get(key)!.add(handler);
    return () => subscribeHandlers.get(key)?.delete(handler);
  };

  // autoConnect=true：创建服务即发起首次连接（io 实例在 connect() 内才创建，
  // 不主动调用则只能等 on/subscribe 懒触发，导致页面加载后长时间未连接）
  if (autoConnect) {
    connect();
  }

  return {
    protocol: "socketio",
    get socket() {
      return socketInstance;
    },
    get isConnected() {
      return isConnected.value;
    },
    get connected() {
      return isConnected;
    },
    connect,
    disconnect,
    on,
    off,
    emit,
    close,
    subscribe,
  };
}
