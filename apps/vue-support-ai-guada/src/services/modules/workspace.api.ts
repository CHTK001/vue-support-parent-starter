import type { ApiContext } from "./api-context";
import { currentToken } from "@/framework/context";

/** 无法携带请求头的资源地址（img / iframe）用查询参数传令牌，参数名与后端 oauth 客户端 tokenName 一致 */
function authTokenQuery(): string {
  const token = currentToken();
  return token ? `x-oauth-token=${encodeURIComponent(token)}` : '';
}

export interface WorkspaceApi {
  getWorkspaceTree(sessionId: string): Promise<{ tree: any[] }>;
  getWorkspaceChildren(sessionId: string, dirPath: string): Promise<{ children: any[] }>;
  getWorkspaceFile(sessionId: string, filePath: string): Promise<{
    path: string;
    name: string;
    extension: string;
    size: number;
    content: string;
    mimeType: string;
  }>;
  getWorkspaceRawFileUrl(sessionId: string, filePath: string): string;
  getWorkspaceHtmlPreviewUrl(sessionId: string, filePath: string): string;
  deleteWorkspaceFile(sessionId: string, filePath: string): Promise<{ success: boolean; isDirectory?: boolean }>;
  renameWorkspaceFile(sessionId: string, filePath: string, newName: string): Promise<{ success: boolean; isDirectory?: boolean; newPath?: string }>;
}

export const workspaceApi: WorkspaceApi = {
  async getWorkspaceTree(this: ApiContext, sessionId: string) {
    return await this._request(`/sessions/${sessionId}/workspace/tree`);
  },

  async getWorkspaceChildren(this: ApiContext, sessionId: string, dirPath: string) {
    return await this._request(
      `/sessions/${sessionId}/workspace/children?path=${encodeURIComponent(dirPath)}`,
    );
  },

  async getWorkspaceFile(this: ApiContext, sessionId: string, filePath: string) {
    return await this._request(
      `/sessions/${sessionId}/workspace/file?path=${encodeURIComponent(filePath)}`,
    );
  },

  getWorkspaceRawFileUrl(this: ApiContext, sessionId: string, filePath: string) {
    const baseUrl = this.baseURL.replace(/\/$/, '');
    const query = authTokenQuery();
    return `${baseUrl}/sessions/${sessionId}/workspace/raw-file?path=${encodeURIComponent(filePath)}${query ? `&${query}` : ''}`;
  },

  getWorkspaceHtmlPreviewUrl(this: ApiContext, sessionId: string, filePath: string) {
    const baseUrl = this.baseURL.replace(/\/$/, '');
    // 按路径段编码，保留 / 作为路径分隔符，使浏览器能正确解析相对资源（CSS/JS 等）
    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
    const query = authTokenQuery();
    return `${baseUrl}/sessions/${sessionId}/workspace/html-preview/${encodedPath}${query ? `?${query}` : ''}`;
  },

  async deleteWorkspaceFile(this: ApiContext, sessionId: string, filePath: string) {
    return await this._request(
      `/sessions/${sessionId}/workspace/file?path=${encodeURIComponent(filePath)}`,
      { method: "DELETE" },
    );
  },

  async renameWorkspaceFile(this: ApiContext, sessionId: string, filePath: string, newName: string) {
    return await this._request(`/sessions/${sessionId}/workspace/rename`, {
      method: "POST",
      data: { path: filePath, newName },
    });
  },
};
