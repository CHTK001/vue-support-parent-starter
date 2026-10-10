import type { ApiContext } from "./api-context";

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
  getWorkspaceHtmlPreviewBaseUrl(sessionId: string, dirPath?: string): string;
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

  /**
   * 工作区原始文件地址（**不含令牌**）。
   *
   * <p>原先这里拼 `&x-oauth-token=…`。该地址是给 `<img :src>` 用的，
   * 而查询参数会进浏览器历史、各级访问日志，以及最致命的 <b>Referer</b> ——
   * 用户从预览面板点一个外链，外站就能在自己的日志里看到完整的 accessToken。</p>
   * <p>现在改为「本函数只给裸地址，调用方用 {@code loadAuthenticatedImage}
   * 带请求头取回 blob 后再交给 `<img>`」，令牌不出现在任何 URL 里。</p>
   */
  getWorkspaceRawFileUrl(this: ApiContext, sessionId: string, filePath: string) {
    const baseUrl = this.baseURL.replace(/\/$/, '');
    return `${baseUrl}/sessions/${sessionId}/workspace/raw-file?path=${encodeURIComponent(filePath)}`;
  },

  /**
   * HTML 预览的资源基址（**不含任何令牌**）。
   *
   * <p>原先这里是 {@code getWorkspaceHtmlPreviewUrl}，把 accessToken 拼进
   * {@code ?x-oauth-token=} 交给 {@code <iframe src>}。查询参数会进服务端
   * access log，并作为 Referer 发给页面内的外链资源。</p>
   *
   * <p>现在预览正文改走 {@code getWorkspaceFile}（带鉴权请求头）取回，
   * 再用 srcdoc 渲染；本函数只负责给出 srcdoc 里 {@code <base href>} 用的
   * 目录地址，让 HTML 内的相对资源仍落到正确的服务端路径上。</p>
   *
   * @param sessionId 会话 id
   * @param dirPath 目录路径（斜杠或反斜杠均可）；留空表示工作区根目录
   */
  getWorkspaceHtmlPreviewBaseUrl(this: ApiContext, sessionId: string, dirPath = '') {
    const root = this.baseURL.replace(/\/+$/, '');
    const normalized = (dirPath || '').replace(/\\/g, '/');
    const segments = normalized.split('/').filter(Boolean).map(encodeURIComponent);
    const suffix = segments.length > 0 ? `${segments.join('/')}/` : '';
    return `${root}/sessions/${sessionId}/workspace/html-preview/${suffix}`;
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
