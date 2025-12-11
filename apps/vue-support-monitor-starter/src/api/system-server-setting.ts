import request from "./config";

// 系统服务器配置设置相关接口

/**
 * 系统服务器配置设置接口
 */
export interface SystemServerSetting {
  systemServerSettingId?: number;
  systemServerSettingServerId: number;
  systemServerSettingName: string;
  systemServerSettingType: string;
  systemServerSettingDescription?: string;
  systemServerSettingEnabled?: boolean;
  systemServerSettingSortOrder?: number;
  systemServerSettingConfig?: string;
  systemServerSettingClassName?: string;
  systemServerSettingVersion?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * ServletFilter对象接口
 */
export interface ServletFilterObject {
  type: string;
  name: string;
  describe?: string;
  describeType?: string;
  describeDetail?: string;
  className: string;
  version: string;
  configItems?: FilterConfigItem[];
  /** 过滤器支持的协议类型数组，如 ['HTTP', 'HTTPS', 'WEBSOCKET'] */
  supportedTypes?: string[];
}

/**
 * Filter配置项接口
 */
export interface FilterConfigItem {
  name: string;
  type: string;
  defaultValue?: string;
  description?: string;
  required?: boolean;
  validationRule?: string;
}

/**
 * 分页查询参数
 */
export interface SystemServerSettingPageParams {
  current?: number;
  size?: number;
  serverId?: number;
  settingName?: string;
  settingType?: string;
  enabled?: boolean;
}

/**
 * 分页查询配置设置
 */
export function getSystemServerSettingPage(
  params: SystemServerSettingPageParams
) {
  return request({
    url: "/system/server/setting/page",
    method: "get",
    params,
  });
}

/**
 * 根据ID查询配置设置
 */
export function getSystemServerSettingById(id: number) {
  return request({
    url: `/system/server/setting/${id}`,
    method: "get",
  });
}

/**
 * 根据服务器ID查询配置设置列表
 */
export function getSystemServerSettingByServerId(serverId: number) {
  return request({
    url: `/system/server/setting/server/${serverId}`,
    method: "get",
  });
}

/**
 * 安装ServletFilter
 */
export function installServletFilter(serverId: number, filterType: string) {
  return request({
    url: "/system/server/setting/install",
    method: "post",
    params: {
      serverId,
      filterType,
    },
  });
}

/**
 * 卸载ServletFilter
 */
export function uninstallServletFilter(id: number) {
  return request({
    url: `/system/server/setting/${id}/uninstall`,
    method: "delete",
  });
}

/**
 * 启用ServletFilter
 */
export function enableServletFilter(id: number) {
  return request({
    url: `/system/server/setting/${id}/enable`,
    method: "post",
  });
}

/**
 * 禁用ServletFilter
 */
export function disableServletFilter(id: number) {
  return request({
    url: `/system/server/setting/${id}/disable`,
    method: "post",
  });
}

/**
 * 更新ServletFilter排序
 */
export function updateServletFilterOrder(
  serverId: number,
  settingOrders: Array<{ id: number; sortOrder: number }>
) {
  return request({
    url: `/system/server/setting/server/${serverId}/order`,
    method: "post",
    data: settingOrders,
  });
}

/**
 * 更新ServletFilter配置
 */
export function updateServletFilterConfig(
  id: number,
  config: Record<string, any>
) {
  return request({
    url: `/system/server/setting/${id}/config`,
    method: "put",
    data: config,
  });
}

/**
 * 获取ServletFilter配置
 */
export function getServletFilterConfig(id: number) {
  return request({
    url: `/system/server/setting/${id}/config`,
    method: "get",
  });
}

/**
 * 获取所有可用的ServletFilter类型
 */
export function getAvailableServletFilterTypes() {
  return request({
    url: "/system/server/setting/types",
    method: "get",
  });
}

/**
 * 获取ServletFilter对象列表（用于前端显示可安装的Filter）
 */
export function getAvailableServletFilterObjects() {
  return request({
    url: "/system/server/setting/objects",
    method: "get",
  });
}

/**
 * 批量安装ServletFilter
 */
export function batchInstallServletFilters(
  serverId: number,
  filterTypes: string[]
) {
  return request({
    url: "/system/server/setting/batch-install",
    method: "post",
    params: {
      serverId,
    },
    data: filterTypes,
  });
}

/**
 * 批量操作ServletFilter
 */
export function batchOperationServletFilter(
  settingIds: number[],
  operation: string
) {
  return request({
    url: "/system/server/setting/batch",
    method: "post",
    params: {
      settingIds: settingIds.join(","),
      operation,
    },
  });
}

/**
 * 重置ServletFilter配置为默认值
 */
export function resetServletFilterConfig(id: number) {
  return request({
    url: `/system/server/setting/${id}/reset`,
    method: "post",
  });
}

/**
 * 导出服务器的ServletFilter配置
 */
export function exportServerFiltersConfig(serverId: number) {
  return request({
    url: `/system/server/setting/server/${serverId}/export`,
    method: "get",
  });
}

/**
 * 导入服务器的ServletFilter配置
 */
export function importServerFiltersConfig(
  serverId: number,
  configData: Record<string, any>
) {
  return request({
    url: `/system/server/setting/server/${serverId}/import`,
    method: "post",
    data: configData,
  });
}

/**
 * 获取ServletFilter配置项定义
 */
export function getServletFilterConfigItems(filterType: string) {
  return request({
    url: `/system/server/setting/servlet-filters/${filterType}/config-items`,
    method: "get",
  });
}

/**
 * 应用配置到运行中的服务器
 */
export function applyConfigToRunningServer(serverId: number) {
  return request({
    url: `/system/server/setting/server/${serverId}/apply`,
    method: "post",
  });
}

/**
 * 克隆服务器配置
 */
export function cloneServerSettings(
  sourceServerId: number,
  targetServerId: number
) {
  return request({
    url: "/system/server/setting/clone",
    method: "post",
    params: { sourceServerId, targetServerId },
  });
}

/**
 * 根据服务器ID和启用状态查询配置列表
 */
export function getSystemServerSettingByServerIdAndEnabled(
  serverId: number,
  enabled: boolean
) {
  return request({
    url: `/system/server/setting/server/${serverId}/enabled/${enabled}`,
    method: "get",
  });
}

/**
 * 批量启用/禁用ServletFilter
 */
export function batchUpdateServletFilterEnabled(
  settingIds: number[],
  enabled: boolean
) {
  return request({
    url: "/system/server/setting/batch-enabled",
    method: "put",
    params: { settingIds, enabled },
  });
}

// ==================== ServiceDiscovery 配置 ====================
export interface ServiceDiscoveryConfig {
  systemServerSettingServiceDiscoveryId?: number;
  serviceDiscoveryServerId: number;
  serviceDiscoveryMode?: string; // MONITOR/SPRING/TABLE/HAZELCAST
  serviceDiscoveryBeanName?: string;
  serviceDiscoveryBalance?: string; // 负载均衡策略，如 weight/round/random/...
  serviceDiscoveryEnabled?: boolean;
  // Monitor 服务配置
  serviceDiscoveryMonitorHost?: string;
  serviceDiscoveryMonitorPort?: number;
  // Hazelcast 集群配置
  serviceDiscoveryHazelcastClusterName?: string;
  serviceDiscoveryHazelcastMembers?: string;
  serviceDiscoveryHazelcastPort?: number;
  serviceDiscoveryHazelcastTimeout?: number;
}

export interface ServiceDiscoveryMapping {
  systemServerSettingServiceDiscoveryMappingId?: number;
  serviceDiscoveryServerId?: number;
  serviceDiscoveryName: string;
  serviceDiscoveryAddress: string;
  serviceDiscoveryWeight?: number;
  serviceDiscoveryEnabled?: boolean;
}

export function getServiceDiscoveryConfig(serverId: number) {
  return request({
    url: `/system/server/setting/service-discovery/${serverId}`,
    method: "get",
  });
}

export function saveServiceDiscoveryConfig(data: ServiceDiscoveryConfig) {
  return request({
    url: "/system/server/setting/service-discovery/save",
    method: "post",
    data,
  });
}

export function deleteServiceDiscoveryConfig(serverId: number) {
  return request({
    url: `/system/server/setting/service-discovery/${serverId}`,
    method: "delete",
  });
}

export function getServiceDiscoveryMappings(serverId: number) {
  return request({
    url: `/system/server/setting/service-discovery/${serverId}/mappings`,
    method: "get",
  });
}

export function saveServiceDiscoveryMappings(
  serverId: number,
  mappings: ServiceDiscoveryMapping[]
) {
  return request({
    url: `/system/server/setting/service-discovery/${serverId}/mappings/save`,
    method: "post",
    data: mappings,
  });
}

// ==================== IP 限流 ====================
export interface IpRateLimitRule {
  systemServerSettingIpRateLimitId?: number;
  ipRateLimitServerId?: number;
  ipRateLimitIp: string;
  ipRateLimitQps?: number;
  ipRateLimitType?: "RATE_LIMIT" | "WHITELIST" | "BLACKLIST";
  ipRateLimitEnabled?: boolean;
}

export function getIpRateLimitRules(serverId: number, settingId: number) {
  return request({
    url: `/system/server/setting/rate-limit/ip/${serverId}/${settingId}`,
    method: "get",
  });
}

export function saveIpRateLimitRules(
  serverId: number,
  settingId: number,
  rules: IpRateLimitRule[]
) {
  return request({
    url: `/system/server/setting/rate-limit/ip/${serverId}/${settingId}/save`,
    method: "post",
    data: rules,
  });
}

export function deleteIpRateLimitRules(serverId: number, settingId: number) {
  return request({
    url: `/system/server/setting/rate-limit/ip/${serverId}/${settingId}`,
    method: "delete",
  });
}

// ==================== 地址 限流 ====================
export interface AddressRateLimitRule {
  systemServerSettingAddressRateLimitId?: number;
  addressRateLimitServerId?: number;
  addressRateLimitAddress: string;
  addressRateLimitQps?: number;
  addressRateLimitType?: "RATE_LIMIT" | "WHITELIST" | "BLACKLIST";
  addressRateLimitEnabled?: boolean;
}

export function getAddressRateLimitRules(serverId: number, settingId: number) {
  return request({
    url: `/system/server/setting/rate-limit/address/${serverId}/${settingId}`,
    method: "get",
  });
}

export function saveAddressRateLimitRules(
  serverId: number,
  settingId: number,
  rules: AddressRateLimitRule[]
) {
  return request({
    url: `/system/server/setting/rate-limit/address/${serverId}/${settingId}/save`,
    method: "post",
    data: rules,
  });
}

export function deleteAddressRateLimitRules(
  serverId: number,
  settingId: number
) {
  return request({
    url: `/system/server/setting/rate-limit/address/${serverId}/${settingId}`,
    method: "delete",
  });
}

// ==================== QPS 限流配置 ====================
export interface QpsRateLimitConfig {
  enabled: boolean;
  limiterType: string;
  threshold: number;
  timeUnit: string;
  rejectStrategy: string;
  penaltyDuration: string;
  penaltyPermanent: boolean;
  penaltyThreshold?: number | null;
  whitelistIps: string[];
  blacklistIps: string[];
}

export function saveServletFilterConfig(
  settingId: number,
  config: Record<string, unknown>
) {
  return request({
    url: `/system/server/setting/${settingId}/config`,
    method: "post",
    data: config,
  });
}

// ==================== 文件存储 ====================
export interface FileStorageConfig {
  systemServerSettingFileStorageId?: number;
  fileStorageServerId: number;
  fileStorageType?: string; // LOCAL/S3/MINIO/OSS
  fileStorageBasePath?: string;
  fileStorageEndpoint?: string;
  fileStorageBucket?: string;
  fileStorageAccessKey?: string;
  fileStorageSecretKey?: string;
  fileStorageRegion?: string;
  fileStorageEnabled?: boolean;
}

export function getFileStorageConfig(serverId: number) {
  return request({
    url: `/system/server/setting/file-storage/${serverId}`,
    method: "get",
  });
}

/**
 * 保存文件存储配置（新增）
 */
export function saveFileStorageConfig(data: FileStorageConfig) {
  return request({
    url: "/system/server/setting/file-storage/save",
    method: "post",
    data,
  });
}

/**
 * 更新文件存储配置
 */
export function updateFileStorageConfig(data: FileStorageConfig) {
  return request({
    url: "/system/server/setting/file-storage/update",
    method: "put",
    data,
  });
}

export function deleteFileStorageConfig(serverId: number) {
  return request({
    url: `/system/server/setting/file-storage/${serverId}`,
    method: "delete",
  });
}

/**
 * 删除单个文件存储配置
 *
 * @param storageId 存储配置ID
 */
export function deleteFileStorageById(storageId: number) {
  return request({
    url: `/system/server/setting/file-storage/item/${storageId}`,
    method: "delete",
  });
}

// ==================== 扩展名预览配置 ====================

/**
 * 扩展名预览配置接口
 */
export interface PreviewExtensionConfig {
  /** 服务器ID */
  serverId: number;
  /** 过滤器设置ID（可选，用于关联到具体的view过滤器） */
  filterSettingId?: number;
  /** 禁用预览的扩展名列表（黑名单） */
  disabledExtensions: string[];
  /** 允许预览的扩展名列表（白名单） */
  allowedExtensions: string[];
  /** 是否启用白名单模式（true=白名单模式，false=黑名单模式） */
  whitelistMode: boolean;
}

/**
 * 获取服务器的扩展名预览配置
 *
 * @param serverId 服务器ID
 */
export function getPreviewExtensionConfig(serverId: number) {
  return request({
    url: `/system/server/setting/preview-extension/${serverId}`,
    method: "get",
  });
}

/**
 * 保存扩展名预览配置
 *
 * @param config 配置对象
 */
export function savePreviewExtensionConfig(config: PreviewExtensionConfig) {
  return request({
    url: "/system/server/setting/preview-extension/save",
    method: "post",
    data: config,
  });
}

/**
 * 添加禁用预览的扩展名
 *
 * @param serverId 服务器ID
 * @param extensions 扩展名列表
 */
export function addDisabledExtensions(serverId: number, extensions: string[]) {
  return request({
    url: `/system/server/setting/preview-extension/${serverId}/disabled/add`,
    method: "post",
    data: extensions,
  });
}

/**
 * 移除禁用预览的扩展名
 *
 * @param serverId 服务器ID
 * @param extensions 扩展名列表
 */
export function removeDisabledExtensions(
  serverId: number,
  extensions: string[]
) {
  return request({
    url: `/system/server/setting/preview-extension/${serverId}/disabled/remove`,
    method: "post",
    data: extensions,
  });
}

/**
 * 添加允许预览的扩展名
 *
 * @param serverId 服务器ID
 * @param extensions 扩展名列表
 */
export function addAllowedExtensions(serverId: number, extensions: string[]) {
  return request({
    url: `/system/server/setting/preview-extension/${serverId}/allowed/add`,
    method: "post",
    data: extensions,
  });
}

/**
 * 移除允许预览的扩展名
 *
 * @param serverId 服务器ID
 * @param extensions 扩展名列表
 */
export function removeAllowedExtensions(
  serverId: number,
  extensions: string[]
) {
  return request({
    url: `/system/server/setting/preview-extension/${serverId}/allowed/remove`,
    method: "post",
    data: extensions,
  });
}

/**
 * 设置预览模式（白名单/黑名单）
 *
 * @param serverId 服务器ID
 * @param whitelistMode true=白名单模式，false=黑名单模式
 */
export function setPreviewMode(serverId: number, whitelistMode: boolean) {
  return request({
    url: `/system/server/setting/preview-extension/${serverId}/mode`,
    method: "put",
    params: { whitelistMode },
  });
}

/**
 * 清空预览扩展名配置
 *
 * @param serverId 服务器ID
 */
export function clearPreviewExtensionConfig(serverId: number) {
  return request({
    url: `/system/server/setting/preview-extension/${serverId}/clear`,
    method: "post",
  });
}

// ==================== Viewer 视图查看器配置 ====================

/**
 * 视图查看器信息
 */
export interface ViewerInfo {
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  supportedContentTypes: string[];
  supportedExtensions: string[];
  targetFormat: string;
  // OnlyOffice特有配置
  serverUrl?: string;
  jwtSecret?: string;
  jwtEnabled?: boolean;
}

/**
 * OnlyOffice配置
 */
export interface OnlyOfficeViewerConfig {
  serverUrl?: string;
  jwtSecret?: string;
  jwtEnabled?: boolean;
}

/**
 * 视图查看器配置
 */
export interface ViewerConfig {
  disabledViewers: string[];
  // OnlyOffice配置
  onlyoffice?: OnlyOfficeViewerConfig;
}

/**
 * 获取可用的视图查看器列表
 *
 * @param settingId 配置ID
 * @returns 查看器列表
 */
export function getViewerListForSetting(settingId: number) {
  return request<ViewerInfo[]>({
    url: `/system/server/setting/${settingId}/viewers`,
    method: "get",
  });
}

/**
 * 获取视图查看器配置
 *
 * @param settingId 配置ID
 * @returns 查看器配置
 */
export function getViewerConfigForSetting(settingId: number) {
  return request<ViewerConfig>({
    url: `/system/server/setting/${settingId}/viewer-config`,
    method: "get",
  });
}

/**
 * 保存视图查看器配置
 *
 * @param settingId 配置ID
 * @param config 查看器配置
 * @returns 保存结果
 */
export function saveViewerConfigForSetting(
  settingId: number,
  config: ViewerConfig
) {
  return request({
    url: `/system/server/setting/${settingId}/viewer-config`,
    method: "post",
    data: config,
  });
}
