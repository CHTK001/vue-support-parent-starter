import { http } from "@repo/utils";

/**
 * 获取 OpenAPI 文档
 * @returns OpenAPI 文档 JSON
 */
export const fetchOpenApiDoc = () => {
  return http.request<any>("get", "/v3/api-docs");
};

/**
 * 获取 OpenAPI 文档（带服务器信息）
 * @param serverUrl 服务器地址
 * @returns OpenAPI 文档 JSON
 */
export const fetchOpenApiDocByServer = (serverUrl: string) => {
  return http.request<any>("get", `${serverUrl}/v3/api-docs`);
};

