/**
 * SSH 连接管理
 *
 * 通用 SSH 连接抽象层，用于服务面板的服务器连接管理。
 * 优先尝试专用 SSH 端点（/v1/panel/ssh/open），
 * 后端未实现时自动降级到 Nginx API（/v1/panel/nginx/open）兼容。
 */
import { http, type ReturnResult } from "@repo/utils";
import { openNginxConnection, closeNginxConnection } from "./nginx";

const SSH_BASE = "/v1/panel/ssh";

export const openSshConnection = async (
  host: string,
  port: number,
  username: string,
  password?: string,
  privateKey?: string,
): Promise<ReturnResult<string>> => {
  try {
    // Try dedicated SSH endpoint first
    return await http.request<ReturnResult<string>>(
      "post",
      `${SSH_BASE}/open`,
      { data: { host, port, username, password, privateKey } },
    );
  } catch {
    // Fall back to Nginx SSH endpoint for backward compatibility
    return openNginxConnection(host, port, username, password, privateKey);
  }
};

export const closeSshConnection = async (
  connectionId: string,
): Promise<ReturnResult<void>> => {
  try {
    return await http.request<ReturnResult<void>>(
      "delete",
      `${SSH_BASE}/${connectionId}`,
    );
  } catch {
    return closeNginxConnection(connectionId);
  }
};

export const executeSshScript = async (
  connectionId: string,
  script: string,
): Promise<ReturnResult<string>> => {
  try {
    return await http.request<ReturnResult<string>>(
      "post",
      `${SSH_BASE}/${connectionId}/execute-script`,
      { data: { script } },
    );
  } catch {
    return http.request<ReturnResult<string>>(
      "post",
      `/v1/panel/nginx/${connectionId}/execute-script`,
      { data: { script } },
    );
  }
};
