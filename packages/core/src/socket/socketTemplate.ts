/**
 * 统一 Socket 模板接口
 *
 * 定义 Socket.IO / WebSocket / SSE 三种协议共同的操作方法，
 * 上层通过 socketService 按配置的 protocol 自动选择实现，无需关心底层细节。
 *
 * 用法：
 *   const service = createSocketService({ protocol: "websocket", urls: [...] });
 *   service.on("message", (data) => ...);
 *   service.subscribe("JVM", "JVM_INFO", (msg) => ...);
 */
import type { InjectionKey, Ref } from "vue";

/** 支持的 Socket 协议类型 */
export type ProtocolType = "socketio" | "websocket" | "sse";

/** subscribe 消息结构（module + event 分发模式） */
export interface WsMessage {
  module: string;
  event: string;
  data: unknown;
  timestamp?: number | string;
  [key: string]: unknown;
}

/** Socket 监听选项（统一接口） */
export interface SocketTemplateListenOptions {
  /** 数据ID过滤：指定后只接收 dataId 匹配的消息 */
  dataId?: string | number;
  /** 请求ID过滤：指定后只接收 requestId 匹配的消息 */
  requestId?: string | number;
}

/** Socket 消息数据结构 */
export interface SocketMessage {
  data: string;
  encrypted: boolean;
  timestamp: string;
  uuid?: string;
  dataId?: string | number;
  requestId?: string | number;
  [key: string]: unknown;
}

/** Socket 模板接口（统一 Socket.IO / WebSocket / SSE 的操作接口） */
export interface SocketTemplate {
  /** 协议类型 */
  readonly protocol: ProtocolType;
  /** 底层连接实例 */
  readonly socket: unknown;
  /** 是否已连接（boolean，用于非响应式场景） */
  readonly isConnected: boolean;
  /** 响应式连接状态（Ref<boolean>，用于 Vue 模板/computed） */
  readonly connected: Ref<boolean>;

  /** 连接 */
  connect(): void;
  /** 断开连接 */
  disconnect(): void;
  /** 监听事件（底层 API） */
  on(
    event: string,
    callback: (data: unknown) => void,
    options?: SocketTemplateListenOptions,
  ): void;
  /** 移除事件监听 */
  off(event: string): void;
  /** 发送事件 */
  emit(event: string, data?: unknown): void;
  /** 关闭连接并清理监听 */
  close(): void;
  /** 按 module + event 订阅消息（业务层 API，服务端消息需包含 module、event 字段） */
  subscribe(
    module: string,
    event: string,
    handler: (msg: WsMessage) => void,
  ): () => void;
}

/** Socket 模板注入键（全局） */
export const SocketTemplateKey: InjectionKey<SocketTemplate> =
  Symbol("SocketTemplate");

/** Socket 键名映射（命名实例用） */
export const socketTemplateKeyMap = new Map<
  string,
  InjectionKey<SocketTemplate>
>();

/**
 * 创建或获取指定名称的 Socket 模板 Key
 *
 * @param keyName Socket 键名称
 * @returns InjectionKey<SocketTemplate>
 */
export function createSocketTemplateKey(
  keyName: string,
): InjectionKey<SocketTemplate> {
  if (!socketTemplateKeyMap.has(keyName)) {
    socketTemplateKeyMap.set(keyName, Symbol(`SocketTemplate_${keyName}`));
  }
  return socketTemplateKeyMap.get(keyName)!;
}
