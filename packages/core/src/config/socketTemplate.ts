/**
 * 统一 Socket 模板接口
 * 定义了 Socket.IO 和 RSocket 共同的操作方法
 *
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */

import type { InjectionKey, Ref } from "vue";
import type { ProtocolType } from "./socketService";

/**
 * subscribe 消息结构（module + event 分发模式）
 */
export interface WsMessage {
  module: string;
  event: string;
  data: unknown;
  timestamp?: number | string;
  [key: string]: unknown;
}

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
   * 是否已连接（boolean，用于非响应式场景）
   */
  readonly isConnected: boolean;

  /**
   * 响应式连接状态（Ref<boolean>，用于 Vue 模板/computed）
   */
  readonly connected: Ref<boolean>;

  /**
   * 连接
   */
  connect(): void;

  /**
   * 断开连接
   */
  disconnect(): void;

  /**
   * 监听事件（底层 API）
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

  /**
   * 按 module + event 订阅消息（业务层 API）
   * 服务端消息格式需包含 module、event 字段
   *
   * @param module 模块名（如 "JVM"、"SQL"）
   * @param event 事件名（如 "JVM_INFO"、"SQL_RECORD"）
   * @param handler 消息处理函数
   * @returns unsubscribe 函数
   */
  subscribe(module: string, event: string, handler: (msg: WsMessage) => void): () => void;
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
