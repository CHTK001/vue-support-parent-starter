import { http } from "@repo/utils";
import {
  deleteAiSession,
  listAiMessages,
  listAiSessions,
  saveAiMessages,
  saveAiSession,
  updateAiSession,
  type AiMessage,
  type AiSession,
} from "./session";

export interface Conversation {
  sysAiGroupId: number;
  sysAiGroupName: string;
  sysProjectId: number;
  createTime?: string;
  updateTime?: string;
  sysAiModuleCode?: string;
}

export interface ConversationCreateRequest {
  sysAiGroupName: string;
  sysProjectId: number;
  sysAiModuleCode?: string;
}

export interface ConversationRenameRequest {
  sysAiGroupId: number;
  sysAiGroupName: string;
  sysProjectId: number;
  sysAiModuleCode?: string;
}

export interface MessageData {
  sysAiGroupMessageId?: number;
  sysAiGroupId: number;
  sysAiGroupMessageRole: string;
  sysAiGroupMessageContent: string;
  sysAiGroupMessageType?: string;
  createTime?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

function toConversation(session: AiSession): Conversation {
  return {
    sysAiGroupId: session.sysAiSessionId,
    sysAiGroupName: session.sysAiSessionTitle || "新建会话",
    sysProjectId: 0,
    createTime: session.createTime,
    updateTime: session.updateTime,
    sysAiModuleCode: session.sysAiModuleCode,
  };
}

function toMessage(groupId: number, message: AiMessage): MessageData {
  return {
    sysAiGroupMessageId: message.sysAiMessageId,
    sysAiGroupId: groupId,
    sysAiGroupMessageRole: message.sysAiMessageRole,
    sysAiGroupMessageContent: message.sysAiMessageContent,
    sysAiGroupMessageType: message.sysAiMessageType || "text",
    createTime: message.createTime,
  };
}

export const getConversationList = async (_sysProjectId: number) => {
  const result = await listAiSessions("CHAT");
  return {
    data: (result?.data || []).map(toConversation),
  };
};

export const createConversation = async (data: ConversationCreateRequest) => {
  const result = await saveAiSession({
    sysAiSessionTitle: data.sysAiGroupName,
    sysAiSessionType: "CHAT",
    sysAiModuleCode: data.sysAiModuleCode,
  });
  return result?.data ? toConversation(result.data) : null;
};

export const deleteConversation = async (sysAiGroupId: number) => {
  const result = await deleteAiSession(sysAiGroupId);
  return !!result?.data;
};

export const renameConversation = async (data: ConversationRenameRequest) => {
  const result = await updateAiSession({
    sysAiSessionId: data.sysAiGroupId,
    sysAiSessionTitle: data.sysAiGroupName,
    sysAiSessionType: "CHAT",
    sysAiModuleCode: data.sysAiModuleCode,
  });
  return result?.data ? toConversation(result.data) : null;
};

export const saveMessages = async (messages: MessageData[]): Promise<boolean> => {
  if (!messages?.length) {
    return true;
  }
  const sysAiSessionId = messages[0].sysAiGroupId;
  const result = await saveAiMessages(
    sysAiSessionId,
    messages.map((item) => ({
      role: item.sysAiGroupMessageRole,
      type: item.sysAiGroupMessageType || "text",
      content: item.sysAiGroupMessageContent,
    })),
  );
  return !!result?.data;
};

export const saveMessage = async (
  groupId: number,
  role: string,
  content: string,
  type: string = "text",
): Promise<boolean> => {
  return saveMessages([
    {
      sysAiGroupId: groupId,
      sysAiGroupMessageRole: role,
      sysAiGroupMessageContent: content,
      sysAiGroupMessageType: type,
    },
  ]);
};

export const getConversationMessages = async (
  sysAiGroupId: number,
  current: number = 1,
  size: number = 20,
) => {
  const result = await listAiMessages(sysAiGroupId);
  const records = (result?.data || []).map((item) => toMessage(sysAiGroupId, item));
  return {
    data: {
      records,
      total: records.length,
      size,
      current,
      pages: 1,
    } as PageResult<MessageData>,
  };
};

export const deleteConversationMessagesAfter = async (
  sysAiGroupId: number,
  fromMessageId: number,
) => {
  const result = await http.request(
    "delete",
    "/v2/ai/session/message/delete-after",
    {
      params: {
        sysAiSessionId: sysAiGroupId,
        fromMessageId,
      },
    },
  );
  return !!result?.data;
};
