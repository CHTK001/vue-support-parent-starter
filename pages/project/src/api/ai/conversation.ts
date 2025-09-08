import { http } from "@repo/utils";

// 会话接口类型定义
export interface Conversation {
  sysAiGroupId: number;
  sysAiGroupName: string;
  sysProjectId: number;
  createTime: string;
  updateTime: string;
}

export interface ConversationCreateRequest {
  sysAiGroupName: string;
  sysProjectId: number;
}

export interface ConversationRenameRequest {
  sysAiGroupId: number;
  sysAiGroupName: string;
  sysProjectId: number;
}

// 获取会话列表
export const getConversationList = (sysProjectId: number) => {
  return http.request<Conversation[]>("get", "/v2/project/ai/group/group", {
    params: { sysProjectId },
  });
};

// 创建新会话
export const createConversation = (data: ConversationCreateRequest) => {
  return http.request<Conversation>("post", "/v2/project/ai/group/saveOrUpdate", {
    data,
  });
};

// 删除会话
export const deleteConversation = (sysAiGroupId: number) => {
  return http.request<boolean>("delete", "/v2/project/ai/group/delete", {
    params: { sysAiGroupId },
  });
};

// 重命名会话
export const renameConversation = (data: ConversationRenameRequest) => {
  return http.request<Conversation>("post", "/v2/project/ai/group/saveOrUpdate", {
    data,
  });
};

// 保存聊天消息（批量）
export const saveMessages = async (messages: MessageData[]): Promise<boolean> => {
  return http.request("post", "/v2/project/ai/group/message/saveOrUpdate", {
    data: messages,
  });
};

// 保存单个聊天消息（兼容性保留）
export const saveMessage = async (groupId: number, role: string, content: string, type: string = "text"): Promise<boolean> => {
  return saveMessages([
    {
      sysAiGroupId: groupId,
      sysAiGroupMessageRole: role,
      sysAiGroupMessageContent: content,
      sysAiGroupMessageType: type,
    },
  ]);
};

// 消息接口类型
export interface MessageData {
  sysAiGroupId: number;
  sysAiGroupMessageRole: string;
  sysAiGroupMessageContent: string;
  sysAiGroupMessageType?: string;
}

// 分页响应接口
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 获取会话历史消息（支持分页）
export const getConversationMessages = (sysAiGroupId: number, current: number = 1, size: number = 20) => {
  return http.request<PageResult<MessageData>>("get", "/v2/project/ai/group/message/list", {
    params: { sysAiGroupId, current, size },
  });
};
