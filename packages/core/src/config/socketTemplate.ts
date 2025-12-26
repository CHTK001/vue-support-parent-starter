/**
 * 统一 Socket 模板接口
 * 定义了 Socket.IO 和 RSocket 共同的操作方法
 *
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */

import type { InjectionKey, Ref } from "vue";

/**
 * Socket 监听选项（统一接口）
 */
export interface SocketTemplateListenOptions {
  /**
   * 数据ID过滤
   * 如果指定，只接收 dataId 匹配的消息
   */
  dataId?: string | number;
}

/**
 * Socket 消息数据结构
 */
export interface SocketMessage {
  data: string;
  encrypted: boolean;
  timestamp: string;
  uuid?: string;
  dataId?: string | number;
  [key: string]: unknown;
}

/**
 * 协议类型
 */
export type ProtocolType = "socketio" | "rsocket" | "websocket" | "sse";

/**
 * Socket 模板接口
 * 统一 Socket.IO 和 RSocket 的操作接口
 */
export interface SocketTemplate {
  /**
   * 协议类型
   */
  readonly protocol: ProtocolType;

  /**
   * 底层连接实例
   */
  readonly socket: unknown;

  /**
   * 是否已连接
   */
  readonly isConnected: boolean;

  /**
   * 连接
   */
  connect(): void;

  /**
   * 断开连接
   */
  disconnect(): void;

  /**
   * 监听事件
   *
   * @param event 事件名称
   * @param callback 回调函数
   * @param options 可选配置
   */
  on(
    event: string,
    callback: (data: unknown) => void,
    options?: SocketTemplateListenOptions
  ): void;

  /**
   * 移除事件监听
   *
   * @param event 事件名称
   */
  off(event: string): void;

  /**
   * 发送事件
   *
   * @param event 事件名称
   * @param data 数据
   */
  emit(event: string, data?: unknown): void;

  /**
   * 关闭连接
   */
  close(): void;
}

/**
 * Socket 模板注入键
 */
export const SocketTemplateKey: InjectionKey<SocketTemplate> =
  Symbol("SocketTemplate");

/**
 * Socket 键名映射
 */
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
  keyName: string
): InjectionKey<SocketTemplate> {
  if (!socketTemplateKeyMap.has(keyName)) {
    socketTemplateKeyMap.set(keyName, Symbol(`SocketTemplate_${keyName}`));
  }
  return socketTemplateKeyMap.get(keyName)!;
}
