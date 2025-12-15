/**
 * 消息通知 API 接口
 * 提供未读消息、历史消息的查询和操作功能
 *
 * @author CH
 * @version 1.0.0
 * @since 2024-12-15
 */
import { http, type ReturnResult, type PageResult } from "@repo/utils";

/**
 * 消息项接口
 */
export interface MessageItem {
  /** 消息ID */
  sysMessageId: number;
  /** 消息标题 */
  sysMessageTitle: string;
  /** 消息内容 */
  sysMessageContent: string;
  /** 消息类型: system-系统通知 notice-公告 message-私信 warning-警告 info-信息 */
  sysMessageType: string;
  /** 消息级别: low-低 normal-普通 high-高 urgent-紧急 */
  sysMessageLevel: string;
  /** 发送者ID */
  sysMessageSenderId: number;
  /** 发送者名称 */
  sysMessageSenderName: string;
  /** 接收者ID */
  sysMessageReceiverId: number;
  /** 是否已读: 0-未读 1-已读 */
  sysMessageRead: number;
  /** 发送时间 */
  sysMessageSendTime: string;
  /** 业务类型 */
  sysMessageBizType?: string;
  /** 业务ID */
  sysMessageBizId?: string;
  /** 跳转链接 */
  sysMessageUrl?: string;
}

/**
 * 历史消息项接口
 */
export interface MessageHistoryItem {
  /** 历史记录ID */
  sysMessageHistoryId: number;
  /** 原消息ID */
  sysMessageHistoryMessageId: number;
  /** 消息标题 */
  sysMessageHistoryTitle: string;
  /** 消息内容 */
  sysMessageHistoryContent: string;
  /** 消息类型 */
  sysMessageHistoryType: string;
  /** 消息级别 */
  sysMessageHistoryLevel: string;
  /** 发送者ID */
  sysMessageHistorySenderId: number;
  /** 发送者名称 */
  sysMessageHistorySenderName: string;
  /** 接收者ID */
  sysMessageHistoryReceiverId: number;
  /** 发送时间 */
  sysMessageHistorySendTime: string;
  /** 阅读时间 */
  sysMessageHistoryReadTime: string;
  /** 业务类型 */
  sysMessageHistoryBizType?: string;
  /** 业务ID */
  sysMessageHistoryBizId?: string;
  /** 跳转链接 */
  sysMessageHistoryUrl?: string;
}

/**
 * Socket 推送的消息数据格式
 */
export interface SocketMessageData {
  /** 消息ID */
  messageId: number;
  /** 消息标题 */
  title: string;
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  type: string;
  /** 消息级别 */
  level: string;
  /** 发送者ID */
  senderId: number;
  /** 发送者名称 */
  senderName: string;
  /** 接收者ID */
  receiverId: number;
  /** 业务类型 */
  bizType?: string;
  /** 业务ID */
  bizId?: string;
  /** 跳转链接 */
  url?: string;
  /** 发送时间 */
  sendTime: string;
  /** 数据ID（用于 Socket 过滤） */
  dataId: string;
}

/**
 * 获取未读消息列表
 *
 * @returns 未读消息列表
 */
export function fetchUnreadMessages() {
  return http.get<ReturnResult<MessageItem[]>>("/v2/message/unread");
}

/**
 * 获取历史消息分页列表
 *
 * @param page 页码，从1开始
 * @param size 每页数量
 * @returns 历史消息分页结果
 */
export function fetchHistoryMessages(page: number = 1, size: number = 20) {
  return http.get<PageResult<MessageHistoryItem>>("/v2/message/history", {
    params: { page, size },
  });
}

/**
 * 获取未读消息数量
 *
 * @returns 未读消息数量
 */
export function fetchUnreadCount() {
  return http.get<ReturnResult<number>>("/v2/message/count");
}

/**
 * 标记消息为已读
 *
 * @param messageId 消息ID
 * @returns 操作结果
 */
export function markAsRead(messageId: number) {
  return http.post<ReturnResult<boolean>>(`/v2/message/read/${messageId}`);
}

/**
 * 批量标记消息为已读
 *
 * @param messageIds 消息ID列表
 * @returns 操作结果
 */
export function batchMarkAsRead(messageIds: number[]) {
  return http.post<ReturnResult<boolean>>("/v2/message/read/batch", messageIds);
}

/**
 * 标记所有消息为已读
 *
 * @returns 操作结果
 */
export function markAllAsRead() {
  return http.post<ReturnResult<boolean>>("/v2/message/read/all");
}

/**
 * 删除消息
 *
 * @param messageId 消息ID
 * @returns 操作结果
 */
export function deleteMessage(messageId: number) {
  return http.delete<ReturnResult<boolean>>(`/v2/message/${messageId}`);
}

/**
 * 删除历史消息
 *
 * @param historyId 历史记录ID
 * @returns 操作结果
 */
export function deleteHistoryMessage(historyId: number) {
  return http.delete<ReturnResult<boolean>>(`/v2/message/history/${historyId}`);
}

/**
 * 将 Socket 推送的消息转换为 MessageItem 格式
 *
 * @param data Socket 推送的消息数据
 * @returns MessageItem 格式的消息
 */
export function convertSocketMessageToItem(data: SocketMessageData): MessageItem {
  return {
    sysMessageId: data.messageId,
    sysMessageTitle: data.title,
    sysMessageContent: data.content,
    sysMessageType: data.type,
    sysMessageLevel: data.level,
    sysMessageSenderId: data.senderId,
    sysMessageSenderName: data.senderName,
    sysMessageReceiverId: data.receiverId,
    sysMessageRead: 0,
    sysMessageSendTime: data.sendTime,
    sysMessageBizType: data.bizType,
    sysMessageBizId: data.bizId,
    sysMessageUrl: data.url,
  };
}
