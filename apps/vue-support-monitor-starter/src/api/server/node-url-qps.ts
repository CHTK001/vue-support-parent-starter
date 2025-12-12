import { http } from "@repo/utils";

/**
 * 获取节点 URL 映射列表
 * @param nodeUrl 节点URL（Base64编码）
 */
export const getNodeUrlMappings = (nodeUrl: string) => {
  return http.request<any>("get", "/v1/node/url/mappings", {
    params: { nodeUrl },
  });
};

/**
 * 获取节点 URL QPS 统计
 * @param nodeUrl 节点URL（Base64编码）
 */
export const getNodeUrlQps = (nodeUrl: string) => {
  return http.request<any>("get", "/v1/node/url/qps", {
    params: { nodeUrl },
  });
};

/**
 * 获取节点 QPS 汇总统计
 * @param nodeUrl 节点URL（Base64编码）
 */
export const getNodeQpsSummary = (nodeUrl: string) => {
  return http.request<any>("get", "/v1/node/url/qps/summary", {
    params: { nodeUrl },
  });
};

/**
 * 清除节点 QPS 数据
 * @param nodeUrl 节点URL（Base64编码）
 */
export const clearNodeQpsData = (nodeUrl: string) => {
  return http.request<any>("delete", "/v1/node/url/qps/clear", {
    params: { nodeUrl },
  });
};
