import { http, type ReturnResult } from "@repo/utils";

// ==================== 类型定义 ====================

/**
 * SkyWalking 配置信息
 */
export interface SkywalkingConfig {
  skywalkingConfigId?: number;
  skywalkingConfigName: string;
  skywalkingConfigHost: string;
  skywalkingConfigPort: number;
  skywalkingConfigUsername?: string;
  skywalkingConfigPassword?: string;
  skywalkingConfigStatus: number;
  skywalkingConfigDesc?: string;
  skywalkingConfigUseHttps?: number;
  createTime?: string;
  updateTime?: string;
}

/**
 * 分页查询参数
 */
export interface ConfigPageParams {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: number;
}

// ==================== API 函数 ====================

/**
 * 分页查询配置列表
 */
export function getSkywalkingConfigPage(params: ConfigPageParams) {
  return http.request<ReturnResult<{ records: SkywalkingConfig[]; total: number }>>(
    "get",
    "v1/skywalking/config/page",
    { params }
  );
}

/**
 * 获取配置详情
 */
export function getSkywalkingConfigById(id: number) {
  return http.request<ReturnResult<SkywalkingConfig>>("get", `v1/skywalking/config/${id}`);
}

/**
 * 获取所有启用的配置
 */
export function getEnabledSkywalkingConfigs() {
  return http.request<ReturnResult<SkywalkingConfig[]>>("get", "v1/skywalking/config/enabled");
}

/**
 * 获取所有配置列表
 */
export function getSkywalkingConfigList() {
  return http.request<ReturnResult<SkywalkingConfig[]>>("get", "v1/skywalking/config/list");
}

/**
 * 新增配置
 */
export function saveSkywalkingConfig(data: SkywalkingConfig) {
  return http.request<ReturnResult<SkywalkingConfig>>("post", "v1/skywalking/config/save", { data });
}

/**
 * 更新配置
 */
export function updateSkywalkingConfig(data: SkywalkingConfig) {
  return http.request<ReturnResult<boolean>>("put", "v1/skywalking/config/update", { data });
}

/**
 * 删除配置
 */
export function deleteSkywalkingConfig(id: number) {
  return http.request<ReturnResult<boolean>>("delete", "v1/skywalking/config/delete", {
    params: { id },
  });
}

/**
 * 测试连接
 */
export function testSkywalkingConnection(data: SkywalkingConfig) {
  return http.request<ReturnResult<boolean>>("post", "v1/skywalking/config/test", { data });
}

/**
 * 测试已保存配置的连接
 */
export function testSkywalkingConnectionById(id: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/skywalking/config/test/${id}`);
}

/**
 * 切换配置状态
 */
export function toggleSkywalkingConfigStatus(id: number) {
  return http.request<ReturnResult<boolean>>("put", `v1/skywalking/config/toggle-status/${id}`);
}
