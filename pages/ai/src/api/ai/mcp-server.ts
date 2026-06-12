import { http, type ReturnResult } from "@repo/utils";

export type AiMcpServerStatus = 0 | 1;

export interface AiMcpServer {
  sysAiMcpServerId?: number;
  sysAiMcpServerName: string;
  sysAiMcpServerCode: string;
  sysAiMcpServerUrl?: string;
  sysAiMcpServerApiKey?: string;
  sysAiMcpServerStatus?: AiMcpServerStatus;
  sysAiMcpServerSort?: number;
  sysAiMcpServerTimeout?: number;
  sysAiMcpServerRemark?: string;
}

export const listAiMcpServers = async (
  sysAiMcpServerName?: string,
  sysAiMcpServerStatus?: AiMcpServerStatus,
) => {
  return http.request<ReturnResult<AiMcpServer[]>>("get", "/v2/ai/mcp-server/list", {
    params: { sysAiMcpServerName, sysAiMcpServerStatus },
  });
};

export const saveAiMcpServer = async (data: AiMcpServer) => {
  return http.request<ReturnResult<AiMcpServer>>("post", "/v2/ai/mcp-server/save", {
    data,
  });
};

export const updateAiMcpServer = async (data: AiMcpServer) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/ai/mcp-server/update", {
    data,
  });
};

export const deleteAiMcpServer = async (sysAiMcpServerId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/ai/mcp-server/delete", {
    params: { sysAiMcpServerId },
  });
};

export const updateAiMcpServerApiKey = async (
  sysAiMcpServerId: number,
  sysAiMcpServerApiKey: string,
) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/ai/mcp-server/update-api-key", {
    params: { sysAiMcpServerId, sysAiMcpServerApiKey },
  });
};
