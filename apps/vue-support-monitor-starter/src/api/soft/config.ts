import { http, type ReturnResult } from "@repo/utils";

const BASE_URL = "/v1/soft/service/install";

/**
 * 获取服务配置项
 *
 * @param installId 安装记录ID
 * @returns 服务配置项JSON字符串
 */
export const getServiceConfig = (installId: number): Promise<ReturnResult<string>> => {
  return http.request<ReturnResult<string>>("get", `${BASE_URL}/config/${installId}`);
};

/**
 * 更新服务配置项
 *
 * @param installId 安装记录ID
 * @param config 配置项JSON字符串
 * @returns 操作结果
 */
export const updateServiceConfig = (installId: number, config: string): Promise<ReturnResult<boolean>> => {
  return http.request<ReturnResult<boolean>>("post", `${BASE_URL}/config/${installId}`, {
    data: config,
  });
};

/**
 * 解析服务配置项
 *
 * @param configJson 配置项JSON字符串
 * @returns 解析后的配置对象
 */
export const parseServiceConfig = (configJson: string): ServiceConfig => {
  try {
    return JSON.parse(configJson) as ServiceConfig;
  } catch (error) {
    console.error("解析服务配置项失败:", error);
    return {};
  }
};

/**
 * 序列化服务配置项
 *
 * @param config 配置对象
 * @returns 序列化后的JSON字符串
 */
export const stringifyServiceConfig = (config: ServiceConfig): string => {
  try {
    return JSON.stringify(config);
  } catch (error) {
    console.error("序列化服务配置项失败:", error);
    return "{}";
  }
};

/**
 * 服务配置项接口
 */
export interface ServiceConfig {
  [key: string]: any;
}

/**
 * 服务配置项响应接口
 */
export interface ServiceConfigResponse {
  config: string; // JSON字符串
}
