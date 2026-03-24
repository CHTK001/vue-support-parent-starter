import { http, type ReturnResult } from "@repo/utils";

/**
 * 系统消息接口类型
 */
export interface SysMessage {
  sysMessageId: number;
  sysMessageTitle: string;
  sysMessageContent: string;
  sysMessageType: string;
  sysMessageLevel: string;
  sysMessageSenderId: number;
  sysMessageSenderName: string;
  sysMessageReceiverId: number;
  sysMessageReceiverName: string;
  sysMessageRead: number;
  sysMessageReadTime: string;
  sysMessageSendTime: string;
  sysMessageExpireTime: string;
  sysMessageBizType: string;
  sysMessageBizId: string;
  sysMessageUrl: string;
  sysMessageExtra: string;
  sysMessageStatus: number;
}

/**
 * 获取未读消息列表
 */
export const fetchUnreadMessages = () => {
  return http.request<ReturnResult<SysMessage[]>>("get", "/v2/message/unread", {
    timeout: 5000,
  });
};

/**
 * 获取未读消息数量
 */
export const fetchUnreadCount = () => {
  return http.request<ReturnResult<number>>("get", "/v2/message/count", {
    timeout: 5000,
  });
};

/**
 * 标记消息为已读
 * @param messageId 消息ID
 */
export const fetchMarkAsRead = (messageId: number) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/v2/message/read/${messageId}`
  );
};

/**
 * 批量标记消息为已读
 * @param messageIds 消息ID列表
 */
export const fetchBatchMarkAsRead = (messageIds: number[]) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/message/read/batch", {
    data: messageIds,
  });
};

/**
 * 标记所有消息为已读
 */
export const fetchMarkAllAsRead = () => {
  return http.request<ReturnResult<boolean>>("post", "/v2/message/read/all");
};

/**
 * 删除消息
 * @param messageId 消息ID
 */
export const fetchDeleteMessage = (messageId: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/v2/message/${messageId}`
  );
};
