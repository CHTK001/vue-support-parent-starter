import { http, type ReturnResult } from "@repo/utils";

export interface AiSession {
  sysAiSessionId: number;
  sysAiSessionTitle: string;
  sysAiSessionType: string;
  sysAiModuleCode?: string;
  sysUserId?: string;
  sysAiSessionStatus?: number;
  createTime?: string;
  updateTime?: string;
}

export interface AiMessage {
  sysAiMessageId: number;
  sysAiSessionId: number;
  sysAiMessageRole: string;
  sysAiMessageType: string;
  sysAiMessageContent: string;
  sysAiMessageAttachment?: string;
  createTime?: string;
}

export const listAiSessions = async (sessionType = "CHAT") => {
  return http.request<ReturnResult<AiSession[]>>("get", "/v2/ai/session/list", {
    params: { sessionType },
  });
};

export const saveAiSession = async (data: Partial<AiSession>) => {
  return http.request<ReturnResult<AiSession>>("post", "/v2/ai/session/save", {
    data,
  });
};

export const updateAiSession = async (data: Partial<AiSession>) => {
  return http.request<ReturnResult<AiSession>>("put", "/v2/ai/session/update", {
    data,
  });
};

export const deleteAiSession = async (sysAiSessionId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/ai/session/delete", {
    params: { sysAiSessionId },
  });
};

export const listAiMessages = async (sysAiSessionId: number) => {
  return http.request<ReturnResult<AiMessage[]>>(
    "get",
    "/v2/ai/session/message/list",
    { params: { sysAiSessionId } },
  );
};

export const saveAiMessages = async (
  sysAiSessionId: number,
  messages: Array<{
    role: string;
    type?: string;
    content: string;
    attachment?: string;
  }>,
) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/ai/session/message/save", {
    data: {
      sysAiSessionId,
      messages,
    },
  });
};
