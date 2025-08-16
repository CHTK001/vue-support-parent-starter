import { http, type ReturnResult } from "@repo/utils";

/**
 * 连接指定节点的 Arthas（后端负责与 arthas-console 建立连接/代理）
 * 返回值推荐包含 { consoleUrl?: string }，若无则仅改变连接态
 */
export function connectArthasNode(nodeId: string) {
  return http.request<ReturnResult<{ consoleUrl?: string } | string>>("post", 
    "/v1/arthas/connect", {
      params: { nodeId },
    }
  );
}

/**
 * 可选：断开连接（占位，后端可选择实现）
 */
export function disconnectArthasNode(nodeId: string) {
  return http.request<ReturnResult<boolean>>("post", 
    "/v1/arthas/disconnect", {
      params: { nodeId },
    }
  );
}

