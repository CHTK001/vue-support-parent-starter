import { http, type ReturnResult } from "@repo/utils";

/**
 * 服务器设置接口（对应后端 MonitorSysGenServerSetting 实体）
 */
export interface ServerSetting {
  /** 服务器配置设置ID */
  monitorSysGenServerSettingId?: number;
  /** 服务器ID */
  monitorSysGenServerId?: number;
  /** 是否启用监控 0:否 1:是 */
  monitorSysGenServerSettingMonitorEnabled?: number;
  /** 是否启用上报 0:否 1:是 */
  monitorSysGenServerSettingReportEnabled?: number;
  /** 数据上报方式 */
  monitorSysGenServerSettingDataReportMethod?: string;
  /** 监控间隔(秒) */
  monitorSysGenServerSettingMonitorInterval?: number;
  /** 数据收集频率(秒) */
  monitorSysGenServerSettingDataCollectionFrequency?: number;
  /** 指标保留天数 */
  monitorSysGenServerSettingMetricsRetentionDays?: number;
  /** 是否启用告警 0:否 1:是 */
  monitorSysGenServerSettingAlertEnabled?: number;
  /** CPU使用率告警阈值 */
  monitorSysGenServerSettingCpuAlertThreshold?: number;
  /** 内存使用率告警阈值 */
  monitorSysGenServerSettingMemoryAlertThreshold?: number;
  /** 磁盘使用率告警阈值 */
  monitorSysGenServerSettingDiskAlertThreshold?: number;
  /** 网络延迟告警阈值(毫秒) */
  monitorSysGenServerSettingNetworkLatencyThreshold?: number;
  /** 告警通知方式 */
  monitorSysGenServerSettingAlertNotificationMethod?: string;
  /** 告警邮件地址 */
  monitorSysGenServerSettingAlertEmailAddresses?: string;
  /** 告警Webhook地址 */
  monitorSysGenServerSettingAlertWebhookUrl?: string;
  /** 是否启用Docker监控 0:否 1:是 */
  monitorSysGenServerSettingDockerMonitorEnabled?: number;
  /** Docker API地址 */
  monitorSysGenServerSettingDockerApiUrl?: string;
  /** Docker API版本 */
  monitorSysGenServerSettingDockerApiVersion?: string;
  /** 是否启用代理 0:否 1:是 */
  monitorSysGenServerSettingProxyEnabled?: number;
  /** 代理类型 */
  monitorSysGenServerSettingProxyType?: string;
  /** 代理主机 */
  monitorSysGenServerSettingProxyHost?: string;
  /** 代理端口 */
  monitorSysGenServerSettingProxyPort?: number;
  /** 代理用户名 */
  monitorSysGenServerSettingProxyUsername?: string;
  /** 代理密码 */
  monitorSysGenServerSettingProxyPassword?: string;
  /** 自定义标签 */
  monitorSysGenServerSettingCustomTags?: string;
  /** 配置描述 */
  monitorSysGenServerSettingDescription?: string;
  /** 配置状态 0:停用 1:启用 */
  monitorSysGenServerSettingStatus?: number;
  /** 监控的端口列表 */
  monitorSysGenServerSettingMonitorPorts?: string;
  /** 是否启用日志监控 0:否 1:是 */
  monitorSysGenServerSettingLogMonitorEnabled?: number;
  /** 日志文件路径列表 */
  monitorSysGenServerSettingLogFilePaths?: string;
  /** 连接超时时间(秒) */
  monitorSysGenServerSettingConnectionTimeout?: number;
  /** 读取超时时间(秒) */
  monitorSysGenServerSettingReadTimeout?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 服务器设置查询参数
 */
export interface ServerSettingPageParams {
  /** 当前页 */
  current?: number;
  /** 页大小 */
  size?: number;
  /** 服务器ID */
  monitorSysGenServerId?: number;
  /** 是否启用监控 */
  monitorSysGenServerSettingMonitorEnabled?: number;
  /** 是否启用上报 */
  monitorSysGenServerSettingReportEnabled?: number;
  /** 数据上报方式 */
  monitorSysGenServerSettingDataReportMethod?: string;
  /** 是否启用告警 */
  monitorSysGenServerSettingAlertEnabled?: number;
  /** 配置状态 */
  monitorSysGenServerSettingStatus?: number;
}

/**
 * 批量操作参数
 */
export interface BatchSettingOperationParams {
  /** 服务器ID列表 */
  serverIds: number[];
  /** 操作类型 */
  operation: string;
  /** 操作值 */
  value?: any;
}

/**
 * 分页查询服务器设置列表
 * @param params 查询参数
 * @returns 服务器设置分页数据
 */
export function getServerSettingPageList(params: ServerSettingPageParams) {
  return http.request<ReturnResult<{ records: ServerSetting[]; total: number }>>(
    "get",
    "v1/gen/server/setting/page",
    { params }
  );
}

/**
 * 根据ID获取服务器设置详情
 * @param id 设置ID
 * @returns 服务器设置详情
 */
export function getServerSettingById(id: number) {
  return http.request<ReturnResult<ServerSetting>>(
    "get",
    `v1/gen/server/setting/${id}`
  );
}

/**
 * 根据服务器ID获取设置
 * @param serverId 服务器ID
 * @returns 服务器设置
 */
export function getServerSettingByServerId(serverId: number) {
  return http.request<ReturnResult<ServerSetting>>(
    "get",
    `v1/gen/server/setting/server/${serverId}`
  );
}

/**
 * 获取或创建服务器设置
 * @param serverId 服务器ID
 * @returns 服务器设置
 */
export function getOrCreateServerSetting(serverId: number) {
  return http.request<ReturnResult<ServerSetting>>(
    "get",
    `v1/gen/server/setting/server/${serverId}/or-create`
  );
}

/**
 * 保存服务器设置
 * @param data 设置数据
 * @returns 保存结果
 */
export function saveServerSetting(data: Partial<ServerSetting>) {
  return http.request<ReturnResult<ServerSetting>>(
    "post",
    "v1/gen/server/setting/save",
    { data }
  );
}

/**
 * 更新服务器设置
 * @param data 设置数据
 * @returns 更新结果
 */
export function updateServerSetting(data: Partial<ServerSetting>) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "v1/gen/server/setting/update",
    { data }
  );
}

/**
 * 保存或更新服务器设置
 * @param data 设置数据
 * @returns 保存结果
 */
export function saveOrUpdateServerSetting(data: Partial<ServerSetting>) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/setting/save",
    { data }
  );
}

/**
 * 删除服务器设置
 * @param id 设置ID
 * @returns 删除结果
 */
export function deleteServerSetting(id: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/setting/delete",
    { params: { id } }
  );
}

/**
 * 批量删除服务器设置
 * @param ids 设置ID列表
 * @returns 删除结果
 */
export function batchDeleteServerSettings(ids: number[]) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/setting/batch-delete",
    { data: { ids } }
  );
}

/**
 * 获取启用监控的服务器设置
 * @returns 启用监控的服务器设置列表
 */
export function getMonitorEnabledSettings() {
  return http.request<ReturnResult<ServerSetting[]>>(
    "get",
    "v1/gen/server/setting/monitor/enabled"
  );
}

/**
 * 获取启用告警的服务器设置
 * @returns 启用告警的服务器设置列表
 */
export function getAlertEnabledSettings() {
  return http.request<ReturnResult<ServerSetting[]>>(
    "get",
    "v1/gen/server/setting/alert/enabled"
  );
}

/**
 * 获取启用上报的服务器设置
 * @param reportMethod 上报方式
 * @returns 启用上报的服务器设置列表
 */
export function getReportEnabledSettings(reportMethod?: string) {
  return http.request<ReturnResult<ServerSetting[]>>(
    "get",
    "v1/gen/server/setting/report/enabled",
    { params: { reportMethod } }
  );
}

/**
 * 批量保存或更新服务器设置
 * @param settings 设置列表
 * @returns 保存结果
 */
export function batchSaveOrUpdateSettings(settings: Partial<ServerSetting>[]) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/setting/batch-save-or-update",
    { data: { settings } }
  );
}

/**
 * 批量更新监控启用状态
 * @param params 批量操作参数
 * @returns 更新结果
 */
export function batchUpdateMonitorEnabled(params: BatchSettingOperationParams) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "v1/gen/server/setting/batch-update-monitor-enabled",
    { data: params }
  );
}

/**
 * 验证服务器设置
 * @param setting 设置数据
 * @returns 验证结果
 */
export function validateServerSetting(setting: Partial<ServerSetting>) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/setting/validate",
    { data: setting }
  );
}

/**
 * 测试告警配置
 * @param serverId 服务器ID
 * @returns 测试结果
 */
export function testAlertConfiguration(serverId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/gen/server/setting/test-alert/${serverId}`
  );
}

/**
 * 测试上报配置
 * @param serverId 服务器ID
 * @returns 测试结果
 */
export function testReportConfiguration(serverId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/gen/server/setting/test-report/${serverId}`
  );
}

/**
 * 获取设置模板
 * @param templateType 模板类型
 * @returns 设置模板
 */
export function getSettingTemplate(templateType: string) {
  return http.request<ReturnResult<ServerSetting>>(
    "get",
    "v1/gen/server/setting/template",
    { params: { templateType } }
  );
}

/**
 * 应用模板到服务器
 * @param templateType 模板类型
 * @param serverIds 服务器ID列表
 * @returns 应用结果
 */
export function applyTemplateToServers(templateType: string, serverIds: number[]) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/setting/apply-template",
    { data: { templateType, serverIds } }
  );
}

/**
 * 更新服务器设置状态
 * @param serverId 服务器ID
 * @param status 状态
 * @returns 更新结果
 */
export function updateServerSettingStatus(serverId: number, status: number) {
  return http.request<ReturnResult<boolean>>(
    "put",
    `v1/gen/server/setting/server/${serverId}/status/${status}`
  );
}

/**
 * 获取设置统计信息
 * @returns 统计信息
 */
export function getSettingsStatistics() {
  return http.request<ReturnResult<any>>(
    "get",
    "v1/gen/server/setting/statistics"
  );
}
