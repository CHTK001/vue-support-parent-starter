///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { http, type ReturnResult } from "@repo/utils";

// ==================== 类型定义 ====================

/**
 * 服务器基本信息接口（与后台实体类对应）
 */
export interface ServerInfo {
  /** 服务器配置ID */
  monitorSysGenServerId: number;
  /** 服务器名称 */
  monitorSysGenServerName: string;
  /** 服务器主机地址 */
  monitorSysGenServerHost: string;
  /** 服务器端口 */
  monitorSysGenServerPort: number;
  /** 连接协议 (SSH, RDP, TELNET, VNC等) */
  monitorSysGenServerProtocol: string;
  /** 用户名 */
  monitorSysGenServerUsername?: string;
  /** 密码 */
  monitorSysGenServerPassword?: string;
  /** 私钥文件路径 (SSH协议使用) */
  monitorSysGenServerPrivateKey?: string;
  /** 连接超时时间(毫秒) */
  monitorSysGenServerTimeout?: number;
  /** 服务器描述 */
  monitorSysGenServerDesc?: string;
  /** 服务器状态 0:停用 1:启用 */
  monitorSysGenServerStatus: number;
  /** 服务器标签 (用于分组) */
  monitorSysGenServerTags?: string;
  /** 连接状态 0:离线 1:在线 2:连接中 3:连接失败 */
  monitorSysGenServerConnectionStatus?: number;
  /** 最后连接时间 */
  monitorSysGenServerLastConnectTime?: string;
  /** 连接失败原因 */
  monitorSysGenServerConnectionError?: string;
  /** 创建时间 (继承自SysBase) */
  createTime?: string;
  /** 更新时间 (继承自SysBase) */
  updateTime?: string;
  /** 代理配置ID (关联代理配置表) */
  monitorSysGenServerProxyId?: number;
  /** 服务器IP地址列表 (JSON格式，支持多个IP) */
  monitorSysGenServerIpAddresses?: string;
  /** 是否本地服务器 0:否 1:是 (自动检测，不允许修改) */
  monitorSysGenServerIsLocal?: number;
  /** 是否支持Docker 0:否 1:是 */
  monitorSysGenServerDockerEnabled?: number;
  /** Docker连接方式 (SHELL:命令行, TCP:TCP连接) */
  monitorSysGenServerDockerConnectionType?: string;
  /** Docker TCP连接地址 */
  monitorSysGenServerDockerHost?: string;
  /** Docker TCP连接端口 */
  monitorSysGenServerDockerPort?: number;
  /** 操作系统类型 (自动检测) */
  monitorSysGenServerOsType?: string;
  /** 操作系统版本 (自动检测) */
  monitorSysGenServerOsVersion?: string;
  /** 操作系统架构 (自动检测) */
  monitorSysGenServerOsArch?: string;
}

/**
 * 服务器分页查询参数
 */
export interface ServerPageParams {
  page?: number;
  pageSize?: number;
  monitorSysGenServerName?: string;
  monitorSysGenServerHost?: string;
  monitorSysGenServerProtocol?: string;
  monitorSysGenServerStatus?: number;
  monitorSysGenServerMonitorEnabled?: number;
  monitorSysGenServerTags?: string;
}

/**
 * 服务器保存参数
 */
export interface ServerSaveParams {
  id?: number | string;
  monitorSysGenServerId?: number;
  /** 服务器名称 */
  monitorSysGenServerName: string;
  /** 服务器主机地址 */
  monitorSysGenServerHost: string;
  /** 服务器端口 */
  monitorSysGenServerPort: number;
  /** 连接协议 */
  monitorSysGenServerProtocol: string;
  /** 用户名 */
  monitorSysGenServerUsername?: string;
  /** 密码 */
  monitorSysGenServerPassword?: string;
  /** 私钥文件路径 */
  monitorSysGenServerPrivateKey?: string;
  /** 指标存储时间(天) */
  monitorSysGenServerMetricsRetentionDays?: number;
  /** 监控间隔(秒) */
  monitorSysGenServerMonitorInterval?: number;
  /** 连接超时时间(毫秒) */
  monitorSysGenServerTimeout?: number;
  /** 服务器描述 */
  monitorSysGenServerDesc?: string;
  /** 服务器状态 */
  monitorSysGenServerStatus?: number;
  /** 是否启用监控 */
  monitorSysGenServerMonitorEnabled?: number;
  /** 服务器标签 */
  monitorSysGenServerTags?: string;

  /** 是否需要上报 */
  monitorSysGenServerReportEnabled?: number;
  /** 代理配置ID */
  monitorSysGenServerProxyId?: number;
  /** 数据上报方式 */
  monitorSysGenServerDataReportMethod?: string;
  /** Prometheus服务器地址 */
  monitorSysGenServerPrometheusHost?: string;
  /** Prometheus服务器端口 */
  monitorSysGenServerPrometheusPort?: number;
  /** 代理服务器地址 */
  monitorSysGenServerProxyHost?: string;
  /** 代理服务器端口 */
  monitorSysGenServerProxyPort?: number;
  /** 服务器IP地址列表 (JSON格式，支持多个IP) */
  monitorSysGenServerIpAddresses?: string;
  /** 是否本地服务器 0:否 1:是 (自动检测，不允许修改) */
  monitorSysGenServerIsLocal?: number;
  /** 是否支持Docker 0:否 1:是 */
  monitorSysGenServerDockerEnabled?: number;
  /** Docker连接方式 (SHELL:命令行, TCP:TCP连接) */
  monitorSysGenServerDockerConnectionType?: string;
  /** Docker TCP连接地址 */
  monitorSysGenServerDockerHost?: string;
  /** Docker TCP连接端口 */
  monitorSysGenServerDockerPort?: number;
  /** 操作系统类型 (自动检测) */
  monitorSysGenServerOsType?: string;
  /** 操作系统版本 (自动检测) */
  monitorSysGenServerOsVersion?: string;
  /** 操作系统架构 (自动检测) */
  monitorSysGenServerOsArch?: string;
}

/**
 * 服务器连接测试结果
 */
export interface ServerConnectionTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

/**
 * 服务器统计信息
 */
export interface ServerStatistics {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  errorServers: number;
  protocolStats: Record<string, number>;
  groupStats: Record<string, number>;
}

/**
 * 服务器指标信息（与后台实体类对应）
 */
export interface ServerMetrics {
  /** 指标数据ID */
  monitorSysGenServerMetricsId: number;
  /** 服务器ID */
  monitorSysGenServerId: number;
  /** 抓取时间 */
  monitorSysGenServerMetricsCollectTime: string;
  /** CPU使用率 (百分比) */
  monitorSysGenServerMetricsCpuUsage: number;
  /** CPU核心数 */
  monitorSysGenServerMetricsCpuCores?: number;
  /** CPU负载 (1分钟) */
  monitorSysGenServerMetricsCpuLoad1m?: number;
  /** CPU负载 (5分钟) */
  monitorSysGenServerMetricsCpuLoad5m?: number;
  /** CPU负载 (15分钟) */
  monitorSysGenServerMetricsCpuLoad15m?: number;
  /** 内存总量 (MB) */
  monitorSysGenServerMetricsMemoryTotal?: number;
  /** 内存使用量 (MB) */
  monitorSysGenServerMetricsMemoryUsed?: number;
  /** 内存可用量 (MB) */
  monitorSysGenServerMetricsMemoryFree?: number;
  /** 内存使用率 (百分比) */
  monitorSysGenServerMetricsMemoryUsage: number;
  /** 磁盘总量 (GB) */
  monitorSysGenServerMetricsDiskTotal?: number;
  /** 磁盘使用量 (GB) */
  monitorSysGenServerMetricsDiskUsed?: number;
  /** 磁盘可用量 (GB) */
  monitorSysGenServerMetricsDiskFree?: number;
  /** 磁盘使用率 (百分比) */
  monitorSysGenServerMetricsDiskUsage: number;
  /** 网络入流量 (KB/s) */
  monitorSysGenServerMetricsNetworkIn: number;
  /** 网络出流量 (KB/s) */
  monitorSysGenServerMetricsNetworkOut: number;
  /** 系统运行时间 (秒) */
  monitorSysGenServerMetricsUptime: number;
  /** 进程数量 */
  monitorSysGenServerMetricsProcessCount?: number;
  /** 连接状态 0:离线 1:在线 */
  monitorSysGenServerMetricsStatus?: number;
  /** 响应时间 (毫秒) */
  monitorSysGenServerMetricsResponseTime?: number;
  /** 操作系统信息 */
  monitorSysGenServerMetricsOsInfo?: string;
  /** 扩展信息 (JSON格式) */
  monitorSysGenServerMetricsExtraInfo?: string;
}

/**
 * 批量操作参数
 */
export interface BatchOperationParams {
  ids: string[];
  action: "connect" | "disconnect" | "delete" | "enable-monitoring" | "disable-monitoring";
}

/**
 * 克隆服务器参数
 */
export interface CloneServerParams {
  sourceId: string;
  targetName: string;
}

/**
 * 数据上报配置参数
 */
export interface ReportConfigParams {
  reportEnabled?: boolean;
  dataReportMethod?: string;
  prometheusHost?: string;
  prometheusPort?: number;
  proxyType?: string;
  proxyHost?: string;
  proxyPort?: number;
}

/**
 * 服务器组件配置
 */
export interface ServerComponent {
  monitorSysGenServerDetailComponentName?: string;
  monitorSysGenServerComponentId?: number;
  monitorSysGenServerId: number;
  monitorSysGenServerComponentName: string;
  monitorSysGenServerComponentType: string;
  monitorSysGenServerComponentConfig?: string;
  monitorSysGenServerComponentPosition?: string;
  monitorSysGenServerComponentShared?: number;
  monitorSysGenServerComponentSourceServerId?: number;
  monitorSysGenServerComponentRefreshInterval?: number;
  monitorSysGenServerComponentStatus?: number;
  monitorSysGenServerComponentDescription?: string;
  monitorSysGenServerComponentFixed?: number;
  monitorSysGenServerComponentSort?: number;
  // 新增字段以支持前端表单
  monitorSysGenServerComponentExpressionType?: string;
  monitorSysGenServerComponentExpression?: string;
  monitorSysGenServerComponentUnit?: string;
  monitorSysGenServerComponentEnabled?: boolean | number;
  monitorSysGenServerComponentCreateTime?: string;
  createTime?: string;
  updateTime?: string;
}

// 服务器详情组件接口（与ServerComponent保持一致，避免字段名混淆）
export interface ServerDetailComponent extends ServerComponent {
  // 继承所有ServerComponent字段，不添加额外字段
  // 这样确保字段名的一致性
}

// ==================== API 函数 ====================

/**
 * 服务器管理 API
 */

/**
 * 分页查询服务器列表
 * @param params 查询参数
 * @returns 服务器分页数据
 */
export function getServerPageList(params: ServerPageParams) {
  return http.request<ReturnResult<{ records: ServerInfo[]; total: number }>>("get", "v1/gen/server/page", { params });
}

/**
 * 获取服务器列表（简化版本，用于兼容）
 * @param params 查询参数（可选）
 * @returns 服务器分页数据
 */
export function getServerList(params?: ServerPageParams) {
  return getServerPageList(params || { page: 1, pageSize: 1000 });
}

/**
 * 获取服务器详情
 * @param id 服务器ID
 * @returns 服务器详细信息
 */
export function getServerDetail(id: string) {
  return http.request<ReturnResult<any>>("get", `v1/gen/server/detail/${id}`);
}

/**
 * 保存服务器配置
 * @param data 服务器配置数据
 * @returns 保存结果
 */
export function saveServer(data: ServerSaveParams) {
  return http.request<ReturnResult<ServerInfo>>("post", "v1/gen/server/save", {
    data,
  });
}

export const updateServer = (data: ServerSaveParams) => {
  return http.request<ReturnResult<ServerInfo>>("put", "v1/gen/server/update", {
    data,
  });
};

/**
 * 删除服务器
 * @param id 服务器ID
 * @returns 删除结果
 */
export function deleteServer(id: string) {
  return http.request<ReturnResult<boolean>>("delete", "v1/gen/server/delete", {
    params: { id },
  });
}

/**
 * 测试服务器连接
 * @param id 服务器ID
 * @returns 连接测试结果
 */
export function testServerConnection(id: string) {
  return http.request<ReturnResult<ServerConnectionTestResult>>("get", "v1/gen/server/test", { params: { id } });
}

/**
 * 连接服务器
 * @param id 服务器ID
 * @returns 连接结果
 */
export function connectServer(id: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/connect", {
    params: { id },
  });
}

/**
 * 断开服务器连接
 * @param id 服务器ID
 * @returns 断开连接结果
 */
export function disconnectServer(id: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/disconnect", { params: { id } });
}

/**
 * 获取服务器连接状态
 * @param id 服务器ID
 * @returns 服务器状态信息
 */
export function getServerStatus(id: string) {
  return http.request<ReturnResult<{ status: number; message: string }>>("get", "v1/gen/server/status", { params: { id } });
}

/**
 * 执行服务器命令
 * @param id 服务器ID
 * @param command 要执行的命令
 * @returns 命令执行结果
 */
export function executeServerCommand(id: string, command: string) {
  return http.post("v1/gen/server/execute", command, {
    params: { id },
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

/**
 * 获取服务器信息
 * @param id 服务器ID
 * @returns 服务器信息
 */
export function getServerInfo(id: string) {
  return http.request<ReturnResult<ServerInfo>>("get", "v1/gen/server/info", {
    params: { id },
  });
}

/**
 * 获取服务器详情页指标数据
 * 当指标数据为空时自动触发指标推送
 * @param serverId 服务器ID
 * @returns 指标数据
 */
export function getServerDetailMetrics(serverId: number) {
  return http.request<ReturnResult<any>>("get", `v1/gen/server/detail/${serverId}/metrics`);
}

/**
 * 发送数据到服务器
 * @param id 服务器ID
 * @param data 要发送的数据
 * @returns 发送结果
 */
export function sendServerData(id: string, data: string) {
  return http.post("v1/gen/server/send", data, {
    params: { id },
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

/**
 * 调整终端大小
 * @param id 服务器ID
 * @param width 终端宽度
 * @param height 终端高度
 * @returns 调整结果
 */
export function resizeServerTerminal(id: string, width: number, height: number) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/resize", {
    params: { id, width, height },
  });
}

/**
 * 获取文件列表
 * @param serverId 服务器ID
 * @param path 文件路径
 * @param includeHidden 是否包含隐藏文件
 * @param sortBy 排序字段
 * @param sortOrder 排序顺序
 * @returns 文件列表
 */
export function getServerFiles(serverId: string, path: string, includeHidden: boolean = false, sortBy: string = "name", sortOrder: string = "asc") {
  return http.request<ReturnResult<any>>("get", "v1/file-management/list", {
    params: {
      serverId: parseInt(serverId),
      path,
      includeHidden,
      sortBy,
      sortOrder,
    },
  });
}

/**
 * 获取文件树
 * @param serverId 服务器ID
 * @param path 根路径
 * @param maxDepth 最大深度
 * @param includeHidden 是否包含隐藏文件
 * @returns 文件树
 */
export function getServerFileTree(serverId: string, path: string, maxDepth: number = 3, includeHidden: boolean = false) {
  return http.request<ReturnResult<any>>("get", "v1/file-management/tree", {
    params: {
      serverId: parseInt(serverId),
      path,
      maxDepth,
      includeHidden,
    },
  });
}

/**
 * 上传文件
 * @param serverId 服务器ID
 * @param targetPath 上传路径
 * @param file 文件对象
 * @returns 上传结果
 */
export function uploadServerFile(serverId: string, targetPath: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return http.post("v1/file-management/upload", formData, {
    params: {
      serverId: parseInt(serverId),
      targetPath,
      overwrite: false,
    },
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/**
 * 下载文件
 * @param serverId 服务器ID
 * @param filePath 文件路径
 * @returns 文件数据
 */
export function downloadServerFile(serverId: string, filePath: string) {
  return http.get("v1/file-management/download", {
    params: {
      serverId: parseInt(serverId),
      filePath,
    },
    responseType: "blob",
  });
}

/**
 * 删除文件
 * @param serverId 服务器ID
 * @param path 文件路径
 * @returns 删除结果
 */
export function deleteServerFile(serverId: string, path: string) {
  return http.request<ReturnResult<any>>("delete", "v1/file-management/delete", {
    params: {
      serverId: parseInt(serverId),
      path,
      recursive: false,
    },
  });
}

/**
 * 创建目录
 * @param serverId 服务器ID
 * @param path 目录路径
 * @returns 创建结果
 */
export function createServerDirectory(serverId: string, path: string) {
  return http.request<ReturnResult<any>>("post", "v1/file-management/mkdir", {
    params: {
      serverId: parseInt(serverId),
      path,
      recursive: true,
    },
  });
}

/**
 * 读取文件内容
 * @param id 服务器ID
 * @param path 文件路径
 * @returns 文件内容
 */
export function readServerFileContent(id: string, path: string) {
  return http.request<ReturnResult<string>>("get", "v1/gen/server/read-file", {
    params: { id, path },
  });
}

/**
 * 保存文件内容
 * @param id 服务器ID
 * @param path 文件路径
 * @param content 文件内容
 * @returns 保存结果
 */
export function saveServerFileContent(id: string, path: string, content: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/save-file", {
    data: content,
    params: { id, path },
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

/**
 * 重命名文件或文件夹
 * @param id 服务器ID
 * @param oldPath 原路径
 * @param newPath 新路径
 * @returns 重命名结果
 */
export function renameServerFile(id: string, oldPath: string, newPath: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/rename", {
    params: { id, oldPath, newPath },
  });
}

/**
 * 获取组件模板列表（使用共享组件作为模板）
 * @param category 模板分类（暂未使用）
 * @returns 模板列表
 */
export function getComponentTemplates(category?: string) {
  // TODO: 后端支持分类过滤时可以使用 category 参数
  return getSharedComponents();
}

/**
 * 保存组件模板（设置为共享组件）
 * @param template 模板数据
 * @returns 保存结果
 */
export async function saveComponentTemplate(template: any) {
  // 先创建组件
  const createRes = await createServerComponent(template);
  if (createRes.code !== "00000") {
    return createRes;
  }

  // 然后设置为共享
  const componentId = createRes.data?.monitorSysGenServerComponentId;
  if (componentId) {
    return shareComponent(componentId);
  }

  return createRes;
}

/**
 * 删除组件模板（删除共享组件）
 * @param templateId 模板ID
 * @returns 删除结果
 */
export function deleteComponentTemplate(templateId: string) {
  return deleteServerComponent(Number(templateId));
}

/**
 * 获取布局模板列表
 * @param category 模板分类
 * @returns 模板列表
 */
export function getLayoutTemplates(category?: string) {
  return http.request<ReturnResult<any[]>>("get", "v1/gen/server/layout-templates", { params: { category } });
}

/**
 * 保存布局模板
 * @param template 模板数据
 * @returns 保存结果
 */
export function saveLayoutTemplate(template: any) {
  return http.request<ReturnResult<any>>("post", "v1/gen/server/layout-template", { data: template });
}

/**
 * 删除布局模板
 * @param templateId 模板ID
 * @returns 删除结果
 */
export function deleteLayoutTemplate(templateId: string) {
  return http.request<ReturnResult<boolean>>("delete", `v1/gen/server/layout-template/${templateId}`);
}

/**
 * 应用布局模板
 * @param serverId 服务器ID
 * @param templateId 模板ID
 * @returns 应用结果
 */
export function applyLayoutTemplate(serverId: number, templateId: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/apply-layout-template", { data: { serverId, templateId } });
}

/**
 * 保存服务器布局配置
 * @param serverId 服务器ID
 * @param layout 布局配置
 * @returns 保存结果
 */
export function saveServerLayout(serverId: number, layout: any) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/layout", {
    data: { serverId, layout },
  });
}

/**
 * 获取服务器布局配置
 * @param serverId 服务器ID
 * @returns 布局配置
 */
export function getServerLayout(serverId: number) {
  return http.request<ReturnResult<any>>("get", `v1/gen/server/layout/${serverId}`);
}

/**
 * 验证组件配置（使用组件表达式验证接口）
 * @param config 组件配置
 * @returns 验证结果
 */
export function validateComponentConfig(config: any) {
  const { serverId, expressionType, expression } = config;
  return validateComponentExpression(serverId, expressionType, expression);
}

/**
 * 预览组件数据（使用组件表达式验证接口）
 * @param serverId 服务器ID
 * @param expression 数据表达式
 * @param expressionType 表达式类型
 * @returns 预览数据
 */
export function previewComponentData(serverId: number, expression: string, expressionType: string) {
  // 使用验证接口来预览数据
  return validateComponentExpression(serverId, expressionType, expression);
}

/**
 * 启用服务器监控
 * @param id 服务器ID
 * @returns 操作结果
 */
export function enableServerMonitoring(id: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/enable-monitoring", { params: { id } });
}

/**
 * 停用服务器监控
 * @param id 服务器ID
 * @returns 操作结果
 */
export function disableServerMonitoring(id: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/disable-monitoring", { params: { id } });
}

/**
 * 获取服务器监控状态
 * @param id 服务器ID
 * @returns 监控状态
 */
export function getServerMonitoringStatus(id: string) {
  return http.request<ReturnResult<any>>("get", "v1/gen/server/monitoring-status", { params: { id } });
}

/**
 * 手动收集服务器指标
 * @param id 服务器ID
 * @returns 收集结果
 */
export function collectServerMetrics(id: string) {
  return http.request<ReturnResult<ServerMetrics>>("post", "v1/gen/server/collect-metrics", { params: { id } });
}

/**
 * 获取服务器列表（按标签分组）
 * @returns 按标签分组的服务器列表
 */
export function getServersByTags() {
  return http.request<ReturnResult<Record<string, ServerInfo[]>>>("get", "v1/gen/server/by-tags");
}

/**
 * 批量操作服务器
 * @param params 批量操作参数
 * @returns 操作结果
 */
export function batchOperateServers(params: BatchOperationParams) {
  return http.request<ReturnResult<any>>("post", "v1/gen/server/batch-operation", { data: params });
}

/**
 * 克隆服务器配置
 * @param params 克隆参数
 * @returns 克隆结果
 */
export function cloneServer(params: CloneServerParams) {
  return http.request<ReturnResult<ServerInfo>>("post", "v1/gen/server/clone", {
    data: params,
  });
}

/**
 * 获取服务器统计信息
 * @returns 服务器统计数据
 */
export function getServerStatistics() {
  return http.request<ReturnResult<ServerStatistics>>("get", "v1/gen/server/statistics");
}

/**
 * 导出服务器配置
 * @param ids 服务器ID列表
 * @returns 配置文件
 */
export function exportServerConfig(ids: string[]) {
  return http.post("v1/gen/server/export", { ids }, {
    responseType: "blob",
  });
}

/**
 * 导入服务器配置
 * @param file 配置文件
 * @returns 导入结果
 */
export function importServerConfig(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return http.post("v1/gen/server/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// ==================== 常量和枚举 ====================

/**
 * 协议类型枚举
 */
export const PROTOCOL_TYPES = {
  SSH: "SSH",
  RDP: "RDP",
  VNC: "VNC",
} as const;

export type ProtocolType = (typeof PROTOCOL_TYPES)[keyof typeof PROTOCOL_TYPES];

/**
 * 服务器状态枚举
 */
export const SERVER_STATUS = {
  DISABLED: 0, // 已禁用
  ENABLED: 1, // 已启用
  MAINTENANCE: 2, // 维护中
  ERROR: 3, // 异常
  UNKNOWN: 4, // 未知
  NORMAL: 5, // 正常
} as const;

export type ServerStatus = (typeof SERVER_STATUS)[keyof typeof SERVER_STATUS];

/**
 * 连接状态枚举
 */
export const CONNECTION_STATUS = {
  DISCONNECTED: 0, // 未连接
  CONNECTED: 1, // 已连接
  CONNECTING: 2, // 连接中
  ERROR: 3, // 连接失败
} as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

/**
 * 在线状态枚举
 */
export const ONLINE_STATUS = {
  OFFLINE: 0, // 离线
  ONLINE: 1, // 在线
  UNKNOWN: 2, // 未知
} as const;

export type OnlineStatus = (typeof ONLINE_STATUS)[keyof typeof ONLINE_STATUS];

/**
 * 状态映射配置
 */
export interface StatusMapItem {
  color: "success" | "warning" | "danger" | "info";
  text: string;
}

/**
 * 服务器状态映射
 */
export const statusMap: Record<ServerStatus, StatusMapItem> = {
  [SERVER_STATUS.DISABLED]: { color: "info", text: "已禁用" },
  [SERVER_STATUS.ENABLED]: { color: "success", text: "已启用" },
  [SERVER_STATUS.MAINTENANCE]: { color: "warning", text: "维护中" },
  [SERVER_STATUS.ERROR]: { color: "danger", text: "异常" },
  [SERVER_STATUS.UNKNOWN]: { color: "info", text: "未知" },
  [SERVER_STATUS.NORMAL]: { color: "success", text: "正常" },
};

/**
 * 连接状态映射
 */
export const connectionStatusMap: Record<ConnectionStatus, StatusMapItem> = {
  [CONNECTION_STATUS.DISCONNECTED]: { color: "info", text: "未连接" },
  [CONNECTION_STATUS.CONNECTED]: { color: "success", text: "已连接" },
  [CONNECTION_STATUS.CONNECTING]: { color: "warning", text: "连接中" },
  [CONNECTION_STATUS.ERROR]: { color: "danger", text: "连接失败" },
};

/**
 * 在线状态映射
 */
export const onlineStatusMap: Record<OnlineStatus, StatusMapItem> = {
  [ONLINE_STATUS.OFFLINE]: { color: "danger", text: "离线" },
  [ONLINE_STATUS.ONLINE]: { color: "success", text: "在线" },
  [ONLINE_STATUS.UNKNOWN]: { color: "warning", text: "未知" },
};

/**
 * 协议图标映射
 */
export const protocolIconMap: Record<ProtocolType, string> = {
  SSH: "ri:terminal-line",
  RDP: "ri:computer-line",
  VNC: "ri:remote-control-line",
};

// ==================== WebSocket 相关 ====================

/**
 * WebSocket消息类型枚举
 */
export const WS_MESSAGE_TYPE = {
  SERVER_STATUS: "server_status",
  SERVER_METRICS: "server_metrics",
  SERVER_ONLINE: "server_online",
  SERVER_OFFLINE: "server_offline",
  SERVER_UPDATE: "server_update",
  SERVER_DELETE: "server_delete",
  SERVER_ADD: "server_add",
} as const;

export type WSMessageType = (typeof WS_MESSAGE_TYPE)[keyof typeof WS_MESSAGE_TYPE];

/**
 * 前端显示用的服务器数据接口（简化字段名）
 */
export interface ServerDisplayData {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: ProtocolType;
  status: ServerStatus;
  onlineStatus: OnlineStatus;
  connectionStatus: ConnectionStatus;
  metricsSupport: boolean;
  username?: string;
  group?: string;
  description?: string;
  tags?: string;
  lastOnlineTime?: string;
  lastOfflineTime?: string;
  createTime: string;
  updateTime: string;
  metrics?: ServerMetricsDisplay;
  // 延迟相关字段
  latency?: number;
  latencyStatus?: LatencyStatus;
  latencyText?: string;
  // 保留的字段
  monitorSysGenServerProxyId?: number;
  // 多IP和Docker相关字段
  monitorSysGenServerIpAddresses?: string;
  isLocal?: boolean; // 是否本地服务器（简化字段名）
  monitorSysGenServerIsLocal?: number; // 原始字段名
  monitorSysGenServerDockerEnabled?: number;
  monitorSysGenServerDockerConnectionType?: string;
  monitorSysGenServerDockerHost?: string;
  monitorSysGenServerDockerPort?: number;
  // 操作系统信息
  monitorSysGenServerOsType?: string;
  monitorSysGenServerOsVersion?: string;
  monitorSysGenServerOsArch?: string;
}

/**
 * 服务器实时数据接口
 */
export interface ServerRealtimeData {
  id: string;
  monitorSysGenServerName: string;
  monitorSysGenServerHost: string;
  monitorSysGenServerPort: number;
  monitorSysGenServerProtocol: ProtocolType;
  monitorSysGenServerStatus: ServerStatus;
  monitorSysGenServerOnlineStatus: OnlineStatus;
  monitorSysGenServerMetricsSupport: boolean;
  monitorSysGenServerLastOnlineTime?: string;
  monitorSysGenServerLastOfflineTime?: string;
  monitorSysGenServerUpdateTime: string;
  metrics?: ServerMetrics;
}

/**
 * 磁盘分区信息
 */
export interface DiskPartition {
  name: string;
  mount: string;
  type: string;
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  usagePercent: number;
}

/**
 * 前端显示用的服务器指标数据接口（简化字段名）
 */
export interface ServerMetricsDisplay {
  /** CPU使用率 (%) */
  cpuUsage: number;
  /** 内存使用率 (%) */
  memoryUsage: number;
  /** 磁盘使用率 (%) */
  diskUsage: number;
  /** 磁盘分区信息 */
  diskPartitions?: DiskPartition[];
  /** 网络入流量 (KB/s) */
  networkIn: number;
  /** 网络出流量 (KB/s) */
  networkOut: number;
  /** 网络入流量速度 (KB/s) */
  networkInSpeed?: number;
  /** 网络出流量速度 (KB/s) */
  networkOutSpeed?: number;
  /** 系统负载平均值 */
  loadAverage: string;
  /** 系统运行时间 (秒) */
  uptime: number;
  /** 数据收集时间 */
  collectTime: string;
  /** CPU核心数 */
  cpuCores?: number;
  /** 进程数量 */
  processCount?: number;
  /** 响应时间 (毫秒) */
  responseTime?: number;
  /** 操作系统信息 */
  osInfo?: string;
}

/**
 * 服务器WebSocket消息接口（对应后台 ServerWebSocketMessage）
 */
export interface ServerWebSocketMessage {
  /** 消息类型 */
  messageType: string;
  /** 服务器ID */
  serverId?: number;
  /** 服务器名称 */
  serverName?: string;
  /** 服务器主机地址 */
  serverHost?: string;
  /** 服务器端口 */
  serverPort?: number;
  /** 连接协议 */
  serverProtocol?: string;
  /** 连接状态 */
  connectionStatus?: number;
  /** 状态描述 */
  statusDesc?: string;
  /** 错误消息 */
  errorMessage?: string;
  /** 响应时间(毫秒) */
  responseTime?: number;
  /** 连接时间 */
  connectTime?: string;
  /** 消息时间戳 */
  timestamp: number;
  /** 扩展数据 */
  data?: any;
}

/**
 * WebSocket消息类型常量
 */
export const WebSocketMessageType = {
  // 服务器相关
  CONNECTION_STATUS_CHANGE: "connection_status_change",
  SERVER_ONLINE: "server_online",
  SERVER_OFFLINE: "server_offline",
  SERVER_UPDATE: "server_update",
  SERVER_DELETE: "server_delete",
  SERVER_ADD: "server_add",
  SERVER_CREATED: "server_created",
  SERVER_UPDATED: "server_updated",
  SERVER_HEALTH: "server_health",
  SERVER_LATENCY: "server_latency",
  BATCH_SERVER_LATENCY: "batch_server_latency",
  SERVER_METRICS: "server_metrics",
  CONNECTION_TEST_RESULT: "connection_test_result",

  // SSH相关
  SSH_DATA: "ssh_data",
  SSH_INPUT: "ssh_input",
  SSH_CONNECT: "ssh_connect",
  SSH_DISCONNECT: "ssh_disconnect",
  SSH_RESIZE: "ssh_resize",
  SSH_ERROR: "ssh_error",
  SHELL_OUTPUT: "shell_output",

  // VNC相关
  VNC_DATA: "vnc_data",
  VNC_INPUT: "vnc_input",
  VNC_CONNECT: "vnc_connect",
  VNC_DISCONNECT: "vnc_disconnect",
  VNC_ERROR: "vnc_error",

  // RDP相关
  RDP_DATA: "rdp_data",
  RDP_INPUT: "rdp_input",
  RDP_CONNECT: "rdp_connect",
  RDP_DISCONNECT: "rdp_disconnect",
  RDP_ERROR: "rdp_error",
} as const;

/**
 * 组件实时数据消息接口
 */
export interface ComponentRealtimeMessage {
  /** 组件ID */
  componentId: number;
  /** 组件名称 */
  componentName?: string;
  /** 实时数据 */
  data: any;
  /** 数据类型 */
  type: "realtime" | "update";
  /** 时间戳 */
  timestamp: number;
}

/**
 * WebSocket消息类型常量（对应后台 MessageType）
 */
export const SERVER_WS_MESSAGE_TYPE = {
  CONNECTION_STATUS_CHANGE: "connection_status_change",
  SERVER_ONLINE: "server_online",
  SERVER_OFFLINE: "server_offline",
  SERVER_UPDATE: "server_update",
  SERVER_DELETE: "server_delete",
  SERVER_ADD: "server_add",
  SERVER_CREATED: "server_created",
  SERVER_UPDATED: "server_updated",
  SERVER_HEALTH: "server_health",
  SERVER_METRICS: "server_metrics",
  SERVER_LATENCY: "server_latency",
  BATCH_SERVER_LATENCY: "batch_server_latency",
  CONNECTION_TEST_RESULT: "connection_test_result",
  SSH_DATA: "ssh_data",
  SSH_INPUT: "ssh_input",
  SSH_CONNECT: "ssh_connect",
  SSH_DISCONNECT: "ssh_disconnect",
  SSH_RESIZE: "ssh_resize",
  SSH_ERROR: "ssh_error",
  SHELL_OUTPUT: "shell_output",
  VNC_DATA: "vnc_data",
  VNC_INPUT: "vnc_input",
  RDP_DATA: "rdp_data",
  RDP_INPUT: "rdp_input",
} as const;

/**
 * 延迟状态类型
 */
export interface LatencyStatus {
  status: "normal" | "high" | "abnormal";
  level: "success" | "warning" | "danger";
  text: string;
}

/**
 * 服务器延迟数据
 */
export interface ServerLatencyData {
  serverId: number;
  serverName: string;
  latency: number;
  timestamp: number;
  status: string;
}

/**
 * 延迟统计数据
 */
export interface LatencyStatistics {
  totalServers: number;
  normalCount: number;
  highCount: number;
  abnormalCount: number;
  timestamp: number;
}

/**
 * 获取服务器当前延迟
 */
export const getServerLatency = (serverId: number) => {
  return http.request<ReturnResult<number>>("get", `server/latency/${serverId}`);
};

/**
 * 批量获取服务器延迟
 */
export const getBatchServerLatency = (serverIds: number[]) => {
  //@ts-ignore
  return http.request<ReturnResult<any>>("post", "server/latency/batch", {
    data: serverIds,
  });
};

/**
 * 获取服务器延迟历史数据
 */
export const getServerLatencyHistory = (serverId: number, startTime: string, endTime: string) => {
  //@ts-ignore
  return http.get<Array<{ timestamp: number; latency: number; serverId: number }>>(`server/latency/${serverId}/history`, {
    params: { startTime, endTime },
  });
};

/**
 * 获取延迟统计信息
 */
export const getLatencyStatistics = () => {
  //@ts-ignore
  return http.request<ReturnResult<LatencyStatistics>>("get", "server/latency/statistics");
};

/**
 * 获取延迟状态分布
 */
export const getLatencyStatusDistribution = () => {
  return http.request<
    ReturnResult<{
      normal: number;
      high: number;
      abnormal: number;
      total: number;
      timestamp: number;
    }>
  >("get", "server/latency/status-distribution");
};

/**
 * 检查延迟告警
 */
export const checkLatencyAlerts = () => {
  //@ts-ignore
  return http.request<
    ReturnResult<
      Array<{
        serverId: number;
        serverName: string;
        latency: number;
        level: string;
        message: string;
        timestamp: number;
      }>
    >
  >("get", "server/latency/alerts");
};

/**
 * 手动保存延迟数据到数据库
 */
export const saveLatencyToDatabase = () => {
  return http.request<ReturnResult<number>>("post", "server/latency/save");
};

/**
 * 清理过期延迟数据
 */
export const cleanupExpiredLatencyData = (expireDays: number = 30) => {
  //@ts-ignore
  return http.delete<number>("server/latency/cleanup", {
    params: { expireDays },
  });
};

/**
 * 手动更新服务器延迟
 */
export const updateServerLatency = (serverId: number, latency: number) => {
  return http.request<ReturnResult<boolean>>("put", `server/latency/${serverId}`, null, {
    params: { latency },
  });
};

/**
 * 获取延迟状态信息
 */
export const getLatencyStatus = (latency: number): LatencyStatus => {
  if (latency < 100) {
    return {
      status: "normal",
      level: "success",
      text: "正常",
    };
  } else if (latency < 500) {
    return {
      status: "high",
      level: "warning",
      text: "较高",
    };
  } else {
    return {
      status: "abnormal",
      level: "danger",
      text: "异常",
    };
  }
};

/**
 * 格式化延迟显示文本
 */
export const formatLatencyText = (latency: number | null | undefined): string => {
  if (latency === null || latency === undefined) {
    return "未检测";
  }
  if (latency < 0) {
    return "检测失败";
  }
  return `${latency}ms`;
};

// ==================== 字段映射转换函数 ====================

/**
 * 将后台ServerMetrics转换为前端显示用的ServerMetricsDisplay
 * @param metrics 后台指标数据（支持嵌套格式和扁平格式）
 * @returns 前端显示用的指标数据
 */
export function mapServerMetricsToDisplay(metrics: any): ServerMetricsDisplay {
  // 兼容嵌套格式和扁平格式
  const cpuUsage = metrics.cpu?.usage ?? metrics.monitorSysGenServerMetricsCpuUsage ?? metrics.cpuUsage ?? 0;
  const memoryUsage = metrics.memory?.usage ?? metrics.monitorSysGenServerMetricsMemoryUsage ?? metrics.memoryUsage ?? 0;
  const diskUsage = metrics.disk?.usage ?? metrics.monitorSysGenServerMetricsDiskUsage ?? metrics.diskUsage ?? 0;
  const networkIn = metrics.network?.in ?? metrics.monitorSysGenServerMetricsNetworkIn ?? metrics.networkIn ?? 0;
  const networkOut = metrics.network?.out ?? metrics.monitorSysGenServerMetricsNetworkOut ?? metrics.networkOut ?? 0;

  // 处理负载平均值
  let loadAverage = metrics.loadAverage;
  if (!loadAverage && metrics.cpu) {
    const load1m = metrics.cpu.load1m ?? 0;
    const load5m = metrics.cpu.load5m ?? 0;
    const load15m = metrics.cpu.load15m ?? 0;
    loadAverage = `${load1m} ${load5m} ${load15m}`;
  }
  if (!loadAverage) {
    loadAverage = `${metrics.monitorSysGenServerMetricsCpuLoad1m || 0}`;
  }

  return {
    cpuUsage: Number(cpuUsage),
    memoryUsage: Number(memoryUsage),
    diskUsage: Number(diskUsage),
    diskPartitions: metrics.disk?.partitions ?? metrics.diskPartitions ?? [],
    networkIn: Number(networkIn),
    networkOut: Number(networkOut),
    networkInSpeed: metrics.network?.inSpeed ?? metrics.networkInSpeed ?? 0,
    networkOutSpeed: metrics.network?.outSpeed ?? metrics.networkOutSpeed ?? 0,
    loadAverage: String(loadAverage),
    uptime: Number(metrics.uptime ?? metrics.monitorSysGenServerMetricsUptime ?? 0),
    collectTime: metrics.collectTime ?? metrics.monitorSysGenServerMetricsCollectTime ?? new Date().toISOString(),
    cpuCores: metrics.cpu?.cores ?? metrics.monitorSysGenServerMetricsCpuCores ?? metrics.cpuCores ?? 1,
    processCount: metrics.processCount ?? metrics.monitorSysGenServerMetricsProcessCount ?? 0,
    responseTime: metrics.responseTime ?? metrics.monitorSysGenServerMetricsResponseTime ?? 0,
    osInfo: metrics.osInfo ?? metrics.monitorSysGenServerMetricsOsInfo ?? "",
  };
}

/**
 * 将后台返回的ServerInfo转换为前端显示用的ServerDisplayData
 * @param serverInfo 后台返回的服务器信息
 * @returns 前端显示用的服务器数据
 */
export function mapServerInfoToDisplayData(serverInfo: ServerInfo): ServerDisplayData {
  return {
    id: String(serverInfo.monitorSysGenServerId),
    name: serverInfo.monitorSysGenServerName,
    host: serverInfo.monitorSysGenServerHost,
    port: serverInfo.monitorSysGenServerPort,
    protocol: serverInfo.monitorSysGenServerProtocol as ProtocolType,
    status: serverInfo.monitorSysGenServerStatus as ServerStatus,
    onlineStatus: serverInfo.monitorSysGenServerConnectionStatus === 1 ? ONLINE_STATUS.ONLINE : ONLINE_STATUS.OFFLINE,
    connectionStatus: serverInfo.monitorSysGenServerConnectionStatus as ConnectionStatus,
    metricsSupport: true, // 默认支持指标收集
    username: serverInfo.monitorSysGenServerUsername,
    group: "", // 后台实体类中没有group字段，使用空字符串
    description: serverInfo.monitorSysGenServerDesc,
    tags: serverInfo.monitorSysGenServerTags,
    lastOnlineTime: serverInfo.monitorSysGenServerLastConnectTime,
    lastOfflineTime: "", // 后台实体类中没有lastOfflineTime字段，使用空字符串
    createTime: serverInfo.createTime || "",
    updateTime: serverInfo.updateTime || "",
    // 保留的字段映射
    monitorSysGenServerProxyId: serverInfo.monitorSysGenServerProxyId,
    // 多IP和Docker相关字段
    monitorSysGenServerIpAddresses: serverInfo.monitorSysGenServerIpAddresses,
    isLocal: serverInfo.monitorSysGenServerIsLocal === 1, // 转换为布尔值
    monitorSysGenServerIsLocal: serverInfo.monitorSysGenServerIsLocal,
    monitorSysGenServerDockerEnabled: serverInfo.monitorSysGenServerDockerEnabled,
    monitorSysGenServerDockerConnectionType: serverInfo.monitorSysGenServerDockerConnectionType,
    monitorSysGenServerDockerHost: serverInfo.monitorSysGenServerDockerHost,
    monitorSysGenServerDockerPort: serverInfo.monitorSysGenServerDockerPort,
    // 操作系统信息
    monitorSysGenServerOsType: serverInfo.monitorSysGenServerOsType,
    monitorSysGenServerOsVersion: serverInfo.monitorSysGenServerOsVersion,
    monitorSysGenServerOsArch: serverInfo.monitorSysGenServerOsArch,
    ...serverInfo,
  };
}

/**
 * 将ServerRealtimeData转换为前端显示用的ServerDisplayData
 * @param realtimeData 实时数据
 * @returns 前端显示用的服务器数据
 */
export function mapRealtimeDataToDisplayData(realtimeData: ServerRealtimeData): ServerDisplayData {
  return {
    id: realtimeData.id,
    name: realtimeData.monitorSysGenServerName,
    host: realtimeData.monitorSysGenServerHost,
    port: realtimeData.monitorSysGenServerPort,
    protocol: realtimeData.monitorSysGenServerProtocol,
    status: realtimeData.monitorSysGenServerStatus,
    onlineStatus: realtimeData.monitorSysGenServerOnlineStatus,
    connectionStatus: 0, // 实时数据中没有连接状态，默认为0
    metricsSupport: realtimeData.monitorSysGenServerMetricsSupport,
    lastOnlineTime: realtimeData.monitorSysGenServerLastOnlineTime,
    lastOfflineTime: realtimeData.monitorSysGenServerLastOfflineTime,
    createTime: "",
    updateTime: realtimeData.monitorSysGenServerUpdateTime,
    metrics: realtimeData.metrics ? mapServerMetricsToDisplay(realtimeData.metrics) : undefined,
  };
}

/**
 * 批量转换服务器列表
 * @param serverList 后台返回的服务器列表
 * @returns 前端显示用的服务器列表
 */
export function mapServerListToDisplayData(serverList: ServerInfo[]): ServerDisplayData[] {
  return serverList.map(mapServerInfoToDisplayData);
}

/**
 * 将前端显示数据转换为保存参数
 * @param displayData 前端显示数据
 * @returns 保存参数
 */
export function mapDisplayDataToSaveParams(displayData: Partial<ServerDisplayData>): ServerSaveParams {
  return {
    id: displayData.id,
    monitorSysGenServerName: displayData.name || "",
    monitorSysGenServerHost: displayData.host || "",
    monitorSysGenServerPort: displayData.port || 22,
    monitorSysGenServerProtocol: displayData.protocol || "SSH",
    monitorSysGenServerUsername: displayData.username,
    monitorSysGenServerDesc: displayData.description,
    monitorSysGenServerTags: displayData.tags,
    // 保留的字段映射
    monitorSysGenServerProxyId: displayData.monitorSysGenServerProxyId,
    // 多IP和Docker相关字段
    monitorSysGenServerIpAddresses: displayData.monitorSysGenServerIpAddresses,
    monitorSysGenServerIsLocal: displayData.monitorSysGenServerIsLocal, // 注意：这个字段由后端自动检测设置
    monitorSysGenServerDockerEnabled: displayData.monitorSysGenServerDockerEnabled,
    monitorSysGenServerDockerConnectionType: displayData.monitorSysGenServerDockerConnectionType,
    monitorSysGenServerDockerHost: displayData.monitorSysGenServerDockerHost,
    monitorSysGenServerDockerPort: displayData.monitorSysGenServerDockerPort,
    // 操作系统信息（注意：这些字段由后端自动检测设置）
    monitorSysGenServerOsType: displayData.monitorSysGenServerOsType,
    monitorSysGenServerOsVersion: displayData.monitorSysGenServerOsVersion,
    monitorSysGenServerOsArch: displayData.monitorSysGenServerOsArch,
  };
}

// ==================== 新增API函数 ====================

/**
 * 获取Guacamole代理连接URL
 * @param id 服务器ID
 * @returns 代理连接URL
 */
export function getGuacamoleProxyUrl(id: string) {
  return http.request<ReturnResult<string>>("get", "v1/gen/server/proxy/guacamole", { params: { id } });
}

/**
 * 测试代理连接
 * @param id 服务器ID
 * @returns 测试结果
 */
export function testProxyConnection(id: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/proxy/test", { params: { id } });
}

/**
 * 获取服务器支持的数据上报方式（固定数据）
 * @returns 支持的上报方式列表
 */
export function getSupportedReportMethods() {
  // 固定的数据上报方式，不从服务器获取
  const reportMethods = [
    { value: "none", label: "不上报", description: "不进行数据上报" },
    { value: "api", label: "API上报", description: "通过API接口上报数据" },
    {
      value: "prometheus",
      label: "Prometheus",
      description: "通过Prometheus进行数据采集",
    },
    { value: "url", label: "URL请求上报", description: "上报URL请求访问数据" },
  ];

  return Promise.resolve({
    code: "00000",
    msg: "获取成功",
    data: reportMethods,
  });
}

/**
 * URL请求数据上报
 * @param data URL请求数据
 * @returns 上报结果
 */
export function reportUrlRequest(data: { method: string; url: string; clientIp: string; serverIp: string; serverPort: number; timestamp: number; responseTime?: number; statusCode?: number; userAgent?: string; referer?: string }) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/report/url", { data });
}

/**
 * 根据配置查询数据
 * @param id 服务器ID
 * @param queryType 查询类型
 * @param expression 查询表达式
 * @param timeRange 时间范围参数
 * @returns 查询结果
 */
export function queryDataByConfig(id: string, queryType: string, expression: string, timeRange: any) {
  return http.request<ReturnResult<any>>("post", "v1/gen/server/query/data", {
    params: { id, queryType, expression },
    data: timeRange,
  });
}

/**
 * 更新服务器数据上报配置
 * @param id 服务器ID
 * @param config 上报配置
 * @returns 操作结果
 */
export function updateReportConfig(id: string, config: ReportConfigParams) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/report/config", {
    params: { id },
    data: config,
  });
}

// ==================== 服务器组件管理 API ====================

/**
 * 根据服务器ID获取组件列表
 * @param serverId 服务器ID
 * @returns 组件列表
 */
export function getComponentsByServerId(serverId: number) {
  return http.request<ReturnResult<any[]>>("get", `v1/gen/server/component/list/${serverId}`);
}

/**
 * 根据组件ID获取组件信息
 * @param componentId 组件ID
 * @returns 组件信息
 */
export function getComponentById(componentId: number) {
  return http.request<ReturnResult<any>>("get", `v1/gen/server/component/${componentId}`);
}

/**
 * 创建服务器组件
 * @param component 组件信息
 * @returns 创建结果
 */
export function createServerComponent(component: any) {
  return http.request<ReturnResult<ServerComponent>>("post", "v1/gen/server/component/create", { data: component });
}

/**
 * 更新服务器组件
 * @param componentId 组件ID
 * @param component 组件信息
 * @returns 更新结果
 */
export function updateServerComponent(componentId: number, component: any) {
  return http.request<ReturnResult<boolean>>("put", `v1/gen/server/component/${componentId}`, { data: component });
}

/**
 * 删除服务器组件
 * @param componentId 组件ID
 * @returns 删除结果
 */
export function deleteServerComponent(componentId: number) {
  return http.request<ReturnResult<boolean>>("delete", `v1/gen/server/component/${componentId}`);
}

/**
 * 初始化服务器默认组件
 * @param serverId 服务器ID
 * @returns 初始化结果
 */
export function initDefaultComponentsForServer(serverId: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/gen/server/component/init/${serverId}`);
}

/**
 * 切换组件启用状态（通过更新组件实现）
 * @param componentId 组件ID
 * @param enabled 是否启用
 * @returns 操作结果
 */
export async function toggleComponentEnabled(componentId: number, enabled: boolean) {
  // 先获取组件信息
  const componentRes = await getComponentById(componentId);
  if (componentRes.code !== "00000") {
    return componentRes;
  }

  // 更新组件状态
  const component = componentRes.data;
  component.monitorSysGenServerComponentStatus = enabled ? 1 : 0;

  return updateServerComponent(componentId, component);
}

/**
 * 执行组件查询（使用组件数据接口）
 * @param componentId 组件ID
 * @param timeRange 时间范围参数
 * @returns 查询结果
 */
export function executeComponentQuery(componentId: number, timeRange: any) {
  const { startTime, endTime, step } = timeRange;
  return getComponentData(componentId, startTime, endTime, step);
}

/**
 * 查询组件数据（支持时间范围）
 * @param componentId 组件ID
 * @param startTime 开始时间（时间戳，秒）
 * @param endTime 结束时间（时间戳，秒）
 * @param step 步长（秒）
 * @returns 组件数据
 */
export function getComponentData(componentId: number, startTime?: number, endTime?: number, step?: number) {
  return http.request<ReturnResult<any>>("get", `v1/gen/server/component/${componentId}/data`, {
    params: {
      startTime,
      endTime,
      step: step || 60,
    },
  });
}

/**
 * 获取组件实时数据
 * @param componentId 组件ID
 * @returns 实时数据
 */
export function getComponentRealtimeData(componentId: number) {
  return http.request<ReturnResult<any>>("get", `v1/gen/server/component/${componentId}/data/realtime`);
}

/**
 * 验证组件表达式
 * @param serverId 服务器ID
 * @param expressionType 表达式类型
 * @param expression 表达式内容
 * @returns 验证结果
 */
export function validateComponentExpression(serverId: number, expressionType: string, expression: string) {
  return http.request<ReturnResult<boolean>>("post", `v1/gen/server/component/validate/${serverId}`, { params: { expressionType, expression } });
}

/**
 * 克隆组件
 * @param sourceComponentId 源组件ID
 * @param targetServerId 目标服务器ID
 * @returns 克隆结果
 */
export function cloneComponent(sourceComponentId: number, targetServerId: number) {
  return http.request<ReturnResult<any>>("post", `v1/gen/server/component/clone/${sourceComponentId}/to/${targetServerId}`);
}

/**
 * 批量更新组件启用状态（前端实现）
 * @param componentIds 组件ID列表
 * @param enabled 是否启用
 * @returns 操作结果
 */
export async function batchUpdateComponentsEnabled(componentIds: number[], enabled: boolean) {
  const results = await Promise.all(componentIds.map((id) => toggleComponentEnabled(id, enabled)));

  const success = results.every((result) => result.code === "00000");
  return {
    code: success ? "00000" : "50000",
    msg: success ? "批量更新成功" : "部分更新失败",
    data: success,
  };
}

/**
 * 批量删除组件（前端实现）
 * @param componentIds 组件ID列表
 * @returns 操作结果
 */
export async function batchDeleteComponents(componentIds: number[]) {
  const results = await Promise.all(componentIds.map((id) => deleteServerComponent(id)));

  const success = results.every((result) => result.code === "00000");
  return {
    code: success ? "00000" : "50000",
    msg: success ? "批量删除成功" : "部分删除失败",
    data: success,
  };
}

/**
 * 批量获取组件数据
 * @param componentIds 组件ID列表
 * @param timeRange 时间范围参数
 * @returns 批量组件数据
 */
export async function getBatchComponentData(componentIds: number[], timeRange?: any) {
  const results = await Promise.all(
    componentIds.map(async (id) => {
      try {
        const result = await getComponentData(id, timeRange?.startTime, timeRange?.endTime, timeRange?.step);
        return {
          componentId: id,
          success: result.code === "00000",
          data: result.data,
          error: result.code !== "00000" ? result.msg : null,
        };
      } catch (error) {
        return {
          componentId: id,
          success: false,
          data: null,
          error: error instanceof Error ? error.message : "获取数据失败",
        };
      }
    })
  );

  return {
    code: "00000",
    msg: "批量获取成功",
    data: results,
  };
}

/**
 * 获取共享组件列表
 * @returns 共享组件列表
 */
export function getSharedComponents() {
  return http.request<ReturnResult<ServerComponent[]>>("get", "v1/gen/server/component/shared");
}

/**
 * 设置组件为共享
 * @param componentId 组件ID
 * @returns 操作结果
 */
export function shareComponent(componentId: number) {
  return http.request<ReturnResult<boolean>>("put", `v1/gen/server/component/share/${componentId}`);
}

/**
 * 复制共享组件到服务器
 * @param serverId 目标服务器ID
 * @param sourceComponentId 源组件ID
 * @returns 操作结果
 */
export function copySharedComponent(serverId: number, sourceComponentId: number) {
  return http.request<ReturnResult<ServerComponent>>("post", `v1/gen/server/component/copy/${serverId}/${sourceComponentId}`);
}

/**
 * 根据组件类型获取组件列表
 * @param componentType 组件类型
 * @returns 组件列表
 */
export function getComponentsByType(componentType: string) {
  return http.request<ReturnResult<ServerComponent[]>>("get", `v1/gen/server/component/type/${componentType}`);
}

/**
 * 检查组件是否可以删除
 * @param componentId 组件ID
 * @returns 检查结果
 */
export function canDeleteComponent(componentId: number) {
  return http.request<ReturnResult<boolean>>("get", `v1/gen/server/component/can-delete/${componentId}`);
}

/**
 * 获取服务器数据上报配置
 * @param id 服务器ID
 * @returns 上报配置
 */
export function getReportConfig(id: string) {
  return http.request<ReturnResult<ReportConfigParams>>("get", "v1/gen/server/report/config", { params: { id } });
}

/**
 * 获取服务器指标历史数据
 * @param serverId 服务器ID
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @param interval 数据间隔（分钟，默认5分钟）
 * @returns 历史指标数据
 */
export function getServerMetricsHistory(serverId: number, startTime: string, endTime: string, interval: number = 5) {
  return http.request<ReturnResult<any[]>>("get", "v1/gen/server/metrics/history", { params: { serverId, startTime, endTime, interval } });
}

/**
 * 测试Prometheus连接
 * @param serverId 服务器ID
 * @returns 测试结果
 */
export function testPrometheusConnection(serverId: number) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/prometheus/test", { params: { serverId } });
}

/**
 * 手动检测服务器信息
 * @param id 服务器ID
 * @returns 检测结果
 */
export function detectServerInfo(id: string) {
  return http.request<ReturnResult<any>>("post", "v1/gen/server/detect-info", {
    params: { id },
  });
}

/**
 * 批量检测服务器信息
 * @returns 检测结果
 */
export function batchDetectServerInfo() {
  return http.request<ReturnResult<any>>("post", "v1/gen/server/batch-detect-info");
}

/**
 * 测试本地IP检测功能
 * @param host 主机地址
 * @returns 检测结果
 */
export function testLocalIpDetection(host: string) {
  return http.request<ReturnResult<any>>("get", "v1/gen/server/test-local-ip", {
    params: { host },
  });
}

// ==================== 服务器详情页组件API ====================

/**
 * 获取服务器组件列表（详情页使用通用接口）
 * @param serverId 服务器ID
 * @returns 组件列表
 */
export function getServerDetailComponents(serverId: number) {
  return getComponentsByServerId(serverId);
}

// ==================== 服务器组件布局配置API ====================

/**
 * 服务器组件布局配置接口
 */
export interface ServerComponentLayout {
  monitorSysGenServerComponentLayoutId?: number;
  monitorSysGenServerId: number;
  monitorSysGenServerComponentId: number;
  monitorSysGenServerComponentLayoutX?: number;
  monitorSysGenServerComponentLayoutY?: number;
  monitorSysGenServerComponentLayoutW?: number;
  monitorSysGenServerComponentLayoutH?: number;
  monitorSysGenServerComponentLayoutZIndex?: number;
  monitorSysGenServerComponentLayoutMovable?: boolean;
  monitorSysGenServerComponentLayoutResizable?: boolean;
  monitorSysGenServerComponentLayoutStatus?: number;
  monitorSysGenServerComponentLayoutSortOrder?: number;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
}

/**
 * 获取启用的组件布局列表
 * @param serverId 服务器ID
 * @returns 启用的组件布局列表
 */
export function getEnabledServerComponentLayouts(serverId: number) {
  return http.request<ReturnResult<ServerComponentLayout[]>>("get", `monitor/server/component/layout/server/${serverId}/enabled`);
}

/**
 * 删除组件布局配置
 * @param layoutId 布局ID
 * @returns 操作结果
 */
export function deleteServerComponentLayout(layoutId: number) {
  return http.request<ReturnResult<boolean>>("delete", `monitor/server/component/layout/${layoutId}`);
}

/**
 * 批量更新组件布局位置信息
 * @param layouts 布局列表
 * @returns 操作结果
 */
export function batchUpdateLayoutPositions(layouts: ServerComponentLayout[]) {
  return http.request<ReturnResult<boolean>>("post", "monitor/server/component/layout/batch/position", { data: layouts });
}

/**
 * 创建组件布局配置
 * @param serverId 服务器ID
 * @param componentId 组件ID
 * @param x X坐标
 * @param y Y坐标
 * @param w 宽度
 * @param h 高度
 * @returns 操作结果
 */
export function createServerComponentLayout(serverId: number, componentId: number, x?: number, y?: number, w?: number, h?: number) {
  return http.request<ReturnResult<ServerComponentLayout>>("post", "monitor/server/component/layout/create", {
    params: { serverId, componentId, x, y, w, h },
  });
}

/**
 * 获取所有可用的组件定义（用于组件选择器）
 * @param serverId 服务器ID
 * @returns 组件定义列表
 */
export function getAvailableComponentDefinitions(serverId: number) {
  return http.request<ReturnResult<ServerComponent[]>>("get", `v1/gen/server/component/list/${serverId}`);
}

/**
 * 创建服务器详情组件
 * @param data 组件数据
 * @returns 创建结果
 */
export function createServerDetailComponent(data: ServerComponent) {
  return createServerComponent(data);
}

/**
 * 保存服务器详情组件（创建或更新）
 * @author CH
 * @param data 组件数据
 * @returns 保存结果
 */
export function saveServerDetailComponent(data: ServerComponent) {
  if (data.monitorSysGenServerComponentId) {
    // 更新现有组件
    return updateServerComponent(data.monitorSysGenServerComponentId, data);
  } else {
    // 创建新组件
    return createServerComponent(data);
  }
}

/**
 * 更新服务器详情组件
 * @param componentId 组件ID
 * @param data 组件数据
 * @returns 更新结果
 */
export function updateServerDetailComponent(data: ServerComponent) {
  return updateServerComponent(data.monitorSysGenServerComponentId, data);
}

/**
 * 批量更新组件位置
 * @param serverId 服务器ID
 * @param components 组件列表
 * @returns 操作结果
 */
export function batchUpdateComponentPosition(serverId: number, components: ServerComponent[]) {
  return http.request<ReturnResult<boolean>>("put", `v1/gen/server/component/positions/${serverId}`, { data: components });
}

/**
 * 删除组件（使用通用接口）
 * @param componentId 组件ID
 * @returns 操作结果
 */
export function deleteServerDetailComponent(componentId: number) {
  return deleteServerComponent(componentId);
}

/**
 * 获取服务器详情页面组件模板列表（使用共享组件接口）
 * @returns 模板列表
 */
export function getServerDetailComponentTemplates() {
  return getSharedComponents();
}

/**
 * 为服务器初始化默认组件（详情页面，使用通用接口）
 * @param serverId 服务器ID
 * @returns 操作结果
 */
export function initDefaultComponentsForServerDetail(serverId: number) {
  return initDefaultComponentsForServer(serverId);
}

/**
 * 执行组件查询（详情页面，使用通用接口）
 * @param componentId 组件ID
 * @param timeRange 时间范围参数
 * @returns 查询结果
 */
export function executeComponentQueryDetail(componentId: number, timeRange: any) {
  return executeComponentQuery(componentId, timeRange);
}

/**
 * 验证组件表达式（详情页面，使用通用接口）
 * @param expressionType 表达式类型
 * @param expression 表达式内容
 * @param serverId 服务器ID
 * @returns 验证结果
 */
export function validateComponentExpressionDetail(expressionType: string, expression: string, serverId: number) {
  return validateComponentExpression(serverId, expressionType, expression);
}

/**
 * 启用/禁用组件（详情页面，使用通用接口）
 * @param componentId 组件ID
 * @param enabled 是否启用
 * @returns 操作结果
 */
export function toggleComponentEnabledDetail(componentId: number, enabled: boolean) {
  return toggleComponentEnabled(componentId, enabled);
}
/**
 * 获取启用的服务器组件列表
 * @param serverId 服务器ID
 * @returns 启用的组件列表
 */
export function getEnabledServerDetailComponents(serverId: number) {
  return http.request<ReturnResult<ServerComponent[]>>("get", `v1/gen/server/component/list/${serverId}`);
}
