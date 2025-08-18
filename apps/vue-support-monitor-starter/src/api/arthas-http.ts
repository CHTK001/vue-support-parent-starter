import { http, type ReturnResult } from "@repo/utils";

const HTTP_TIMEOUT_KEY = "arthas.http.timeout";

export interface ArthasExecResp {
  nodeId: string;
  command: string;
  collectMillis: number;
  output: string;
}

/**
 * 通过后端HTTP执行arthas命令
 * - 后端路径：POST /v1/arthas/exec
 * - 请求体：{ nodeId, command, collectMillis }
 * - 超时时间：从本地设置(arthas.http.timeout)读取并作为Axios timeout，同时作为收集时长的默认值
 */
export function execArthasCommand(nodeId: string, command: string, collectMillis?: number) {
  const timeout = Number(localStorage.getItem(HTTP_TIMEOUT_KEY) || 15000);
  const ms = typeof collectMillis === "number" && collectMillis > 0 ? collectMillis : timeout;
  return http.request<ReturnResult<ArthasExecResp>>("post", "/v1/arthas/exec", {
    data: { nodeId, command, collectMillis: ms },
    timeout,
    headers: { "x-remote-animation": "false" },
  });
}

