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
