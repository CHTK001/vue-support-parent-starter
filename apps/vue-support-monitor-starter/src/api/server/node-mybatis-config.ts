import { http } from "@repo/utils";

/**
 * 获取节点 Mapper 列表
 * @param nodeUrl 节点URL（Base64编码）
 * @param keyword 搜索关键词
 */
export const getNodeMappers = (nodeUrl: string, keyword?: string) => {
  return http.request<any>("get", "/v1/node/mybatis/mappers", {
    params: { nodeUrl, keyword },
  });
};

/**
 * 获取 Mapper 详情
 * @param nodeUrl 节点URL（Base64编码）
 * @param mapperName Mapper 全限定名
 */
export const getMapperDetail = (nodeUrl: string, mapperName: string) => {
  return http.request<any>("get", "/v1/node/mybatis/mapper/detail", {
    params: { nodeUrl, mapperName },
  });
};

/**
 * 刷新指定 XML
 * @param nodeUrl 节点URL（Base64编码）
 * @param resourcePath XML 资源路径
 */
export const refreshXml = (nodeUrl: string, resourcePath: string) => {
  return http.request<any>("post", "/v1/node/mybatis/refresh", {
    params: { nodeUrl, resourcePath },
  });
};

/**
 * 刷新所有 XML
 * @param nodeUrl 节点URL（Base64编码）
 */
export const refreshAllXml = (nodeUrl: string) => {
  return http.request<any>("post", "/v1/node/mybatis/refresh/all", {
    params: { nodeUrl },
  });
};

/**
 * 获取 MyBatis 统计信息
 * @param nodeUrl 节点URL（Base64编码）
 */
export const getMyBatisStatistics = (nodeUrl: string) => {
  return http.request<any>("get", "/v1/node/mybatis/statistics", {
    params: { nodeUrl },
  });
};
