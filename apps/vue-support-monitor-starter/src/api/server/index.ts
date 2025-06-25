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
import axios from "../config";

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
  /** 指标存储时间(天) */
  monitorSysGenServerMetricsRetentionDays?: number;
  /** 监控间隔(秒) */
  monitorSysGenServerMonitorInterval?: number;
  /** 连接超时时间(毫秒) */
  monitorSysGenServerTimeout?: number;
  /** 服务器描述 */
  monitorSysGenServerDesc?: string;
  /** 服务器状态 0:停用 1:启用 */
  monitorSysGenServerStatus: number;
  /** 是否启用监控 0:否 1:是 */
  monitorSysGenServerMonitorEnabled?: number;
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
  /** 是否需要上报 0:否 1:是 (默认上报) */
  monitorSysGenServerReportEnabled?: number;
  /** 代理配置ID (关联代理配置表) */
  monitorSysGenServerProxyId?: number;
  /** 数据上报方式 (NONE:不支持上报, API:接口上报, PROMETHEUS:prometheus) */
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
  action: 'connect' | 'disconnect' | 'delete' | 'enable-monitoring' | 'disable-monitoring';
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
 * 服务器详情页组件配置
 */
export interface ServerDetailComponent {
  monitorSysGenServerDetailComponentId?: number;
  monitorSysGenServerId: number;
  monitorSysGenServerDetailComponentName: string;
  monitorSysGenServerDetailComponentTitle: string;
  monitorSysGenServerDetailComponentType: string;
  monitorSysGenServerDetailComponentExpressionType: string;
  monitorSysGenServerDetailComponentExpression: string;
  monitorSysGenServerDetailComponentPosition?: string;
  monitorSysGenServerDetailComponentChartConfig?: string;
  monitorSysGenServerDetailComponentRefreshInterval?: number;
  monitorSysGenServerDetailComponentEnabled?: number;
  monitorSysGenServerDetailComponentSortOrder?: number;
  monitorSysGenServerDetailComponentDesc?: string;
  monitorSysGenServerDetailComponentCreateTime?: string;
  monitorSysGenServerDetailComponentUpdateTime?: string;
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
  return http.request<ReturnResult<{ records: ServerInfo[]; total: number }>>(
    "get",
    "v1/gen/server/page",
    { params }
  );
}

/**
 * 获取服务器列表（简化版本，用于兼容）
 * @param params 查询参数
 * @returns 服务器分页数据
 */
export function getServerList(params: ServerPageParams) {
  return getServerPageList(params);
}

/**
 * 获取服务器详情
 * @param id 服务器ID
 * @returns 服务器详细信息
 */
export function getServerDetail(id: string) {
  return http.request<ReturnResult<ServerInfo>>(
    "get",
    "v1/gen/server/page",
    { params: { monitorSysGenServerId: id } }
  );
}

/**
 * 保存服务器配置
 * @param data 服务器配置数据
 * @returns 保存结果
 */
export function saveServer(data: ServerSaveParams) {
  return http.request<ReturnResult<ServerInfo>>(
    "post",
    "v1/gen/server/save",
    { data }
  );
}

export const updateServer = (data: ServerSaveParams) => {
  return http.request<ReturnResult<ServerInfo>>(
    "put",
    "v1/gen/server/update",
    { data }
  );
}

/**
 * 删除服务器
 * @param id 服务器ID
 * @returns 删除结果
 */
export function deleteServer(id: string) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/delete",
    { params: { id } }
  );
}

/**
 * 测试服务器连接
 * @param id 服务器ID
 * @returns 连接测试结果
 */
export function testServerConnection(id: string) {
  return http.request<ReturnResult<ServerConnectionTestResult>>(
    "get",
    "v1/gen/server/test",
    { params: { id } }
  );
}

/**
 * 连接服务器
 * @param id 服务器ID
 * @returns 连接结果
 */
export function connectServer(id: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/connect",
    { params: { id } }
  );
}

/**
 * 断开服务器连接
 * @param id 服务器ID
 * @returns 断开连接结果
 */
export function disconnectServer(id: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/disconnect",
    { params: { id } }
  );
}

/**
 * 获取服务器连接状态
 * @param id 服务器ID
 * @returns 服务器状态信息
 */
export function getServerStatus(id: string) {
  return http.request<ReturnResult<{ status: number; message: string }>>(
    "get",
    "v1/gen/server/status",
    { params: { id } }
  );
}

/**
 * 执行服务器命令
 * @param id 服务器ID
 * @param command 要执行的命令
 * @returns 命令执行结果
 */
export function executeServerCommand(id: string, command: string) {
  return axios({
    url: "v1/gen/server/execute",
    method: "post",
    data: command,
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
  return http.request<ReturnResult<ServerInfo>>(
    "get",
    "v1/gen/server/info",
    { params: { id } }
  );
}

/**
 * 发送数据到服务器
 * @param id 服务器ID
 * @param data 要发送的数据
 * @returns 发送结果
 */
export function sendServerData(id: string, data: string) {
  return axios({
    url: "v1/gen/server/send",
    method: "post",
    data,
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
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/resize",
    { params: { id, width, height } }
  );
}

/**
 * 获取文件列表
 * @param id 服务器ID
 * @param path 文件路径
 * @returns 文件列表
 */
export function getServerFiles(id: string, path: string) {
  return http.request<ReturnResult<any[]>>(
    "get",
    "v1/gen/server/files",
    { params: { id, path } }
  );
}

/**
 * 上传文件
 * @param id 服务器ID
 * @param path 上传路径
 * @param file 文件对象
 * @returns 上传结果
 */
export function uploadServerFile(id: string, path: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return axios({
    url: "v1/gen/server/upload",
    method: "post",
    data: formData,
    params: { id, path },
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/**
 * 下载文件
 * @param id 服务器ID
 * @param path 文件路径
 * @returns 文件数据
 */
export function downloadServerFile(id: string, path: string) {
  return axios({
    url: "v1/gen/server/download",
    method: "get",
    params: { id, path },
    responseType: "blob",
  });
}

/**
 * 删除文件
 * @param id 服务器ID
 * @param path 文件路径
 * @returns 删除结果
 */
export function deleteServerFile(id: string, path: string) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/delete-file",
    { params: { id, path } }
  );
}

/**
 * 创建目录
 * @param id 服务器ID
 * @param path 目录路径
 * @returns 创建结果
 */
export function createServerDirectory(id: string, path: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/mkdir",
    { params: { id, path } }
  );
}

/**
 * 读取文件内容
 * @param id 服务器ID
 * @param path 文件路径
 * @returns 文件内容
 */
export function readServerFileContent(id: string, path: string) {
  return http.request<ReturnResult<string>>(
    "get",
    "v1/gen/server/read-file",
    { params: { id, path } }
  );
}

/**
 * 保存文件内容
 * @param id 服务器ID
 * @param path 文件路径
 * @param content 文件内容
 * @returns 保存结果
 */
export function saveServerFileContent(id: string, path: string, content: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/save-file",
    {
      data: content,
      params: { id, path },
      headers: {
        "Content-Type": "text/plain",
      }
    }
  );
}

/**
 * 重命名文件或文件夹
 * @param id 服务器ID
 * @param oldPath 原路径
 * @param newPath 新路径
 * @returns 重命名结果
 */
export function renameServerFile(id: string, oldPath: string, newPath: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/rename",
    { params: { id, oldPath, newPath } }
  );
}

/**
 * 获取组件模板列表
 * @param category 模板分类
 * @returns 模板列表
 */
export function getComponentTemplates(category?: string) {
  return http.request<ReturnResult<any[]>>(
    "get",
    "v1/gen/server/component-templates",
    { params: { category } }
  );
}

/**
 * 保存组件模板
 * @param template 模板数据
 * @returns 保存结果
 */
export function saveComponentTemplate(template: any) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server/component-template",
    { data: template }
  );
}

/**
 * 删除组件模板
 * @param templateId 模板ID
 * @returns 删除结果
 */
export function deleteComponentTemplate(templateId: string) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/gen/server/component-template/${templateId}`
  );
}

/**
 * 获取布局模板列表
 * @param category 模板分类
 * @returns 模板列表
 */
export function getLayoutTemplates(category?: string) {
  return http.request<ReturnResult<any[]>>(
    "get",
    "v1/gen/server/layout-templates",
    { params: { category } }
  );
}

/**
 * 保存布局模板
 * @param template 模板数据
 * @returns 保存结果
 */
export function saveLayoutTemplate(template: any) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server/layout-template",
    { data: template }
  );
}

/**
 * 删除布局模板
 * @param templateId 模板ID
 * @returns 删除结果
 */
export function deleteLayoutTemplate(templateId: string) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/gen/server/layout-template/${templateId}`
  );
}

/**
 * 应用布局模板
 * @param serverId 服务器ID
 * @param templateId 模板ID
 * @returns 应用结果
 */
export function applyLayoutTemplate(serverId: number, templateId: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/apply-layout-template",
    { data: { serverId, templateId } }
  );
}

/**
 * 保存服务器布局配置
 * @param serverId 服务器ID
 * @param layout 布局配置
 * @returns 保存结果
 */
export function saveServerLayout(serverId: number, layout: any) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/layout",
    { data: { serverId, layout } }
  );
}

/**
 * 获取服务器布局配置
 * @param serverId 服务器ID
 * @returns 布局配置
 */
export function getServerLayout(serverId: number) {
  return http.request<ReturnResult<any>>(
    "get",
    `v1/gen/server/layout/${serverId}`
  );
}

/**
 * 验证组件配置
 * @param config 组件配置
 * @returns 验证结果
 */
export function validateComponentConfig(config: any) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server/validate-component",
    { data: config }
  );
}

/**
 * 预览组件数据
 * @param serverId 服务器ID
 * @param expression 数据表达式
 * @param expressionType 表达式类型
 * @returns 预览数据
 */
export function previewComponentData(serverId: number, expression: string, expressionType: string) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server/preview-component-data",
    { data: { serverId, expression, expressionType } }
  );
}

/**
 * 启用服务器监控
 * @param id 服务器ID
 * @returns 操作结果
 */
export function enableServerMonitoring(id: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/enable-monitoring",
    { params: { id } }
  );
}

/**
 * 停用服务器监控
 * @param id 服务器ID
 * @returns 操作结果
 */
export function disableServerMonitoring(id: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/disable-monitoring",
    { params: { id } }
  );
}

/**
 * 获取服务器监控状态
 * @param id 服务器ID
 * @returns 监控状态
 */
export function getServerMonitoringStatus(id: string) {
  return http.request<ReturnResult<any>>(
    "get",
    "v1/gen/server/monitoring-status",
    { params: { id } }
  );
}

/**
 * 手动收集服务器指标
 * @param id 服务器ID
 * @returns 收集结果
 */
export function collectServerMetrics(id: string) {
  return http.request<ReturnResult<ServerMetrics>>(
    "post",
    "v1/gen/server/collect-metrics",
    { params: { id } }
  );
}

/**
 * 获取服务器列表（按标签分组）
 * @returns 按标签分组的服务器列表
 */
export function getServersByTags() {
  return http.request<ReturnResult<Record<string, ServerInfo[]>>>(
    "get",
    "v1/gen/server/by-tags"
  );
}

/**
 * 批量操作服务器
 * @param params 批量操作参数
 * @returns 操作结果
 */
export function batchOperateServers(params: BatchOperationParams) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server/batch-operation",
    { data: params }
  );
}

/**
 * 克隆服务器配置
 * @param params 克隆参数
 * @returns 克隆结果
 */
export function cloneServer(params: CloneServerParams) {
  return http.request<ReturnResult<ServerInfo>>(
    "post",
    "v1/gen/server/clone",
    { data: params }
  );
}

/**
 * 获取服务器统计信息
 * @returns 服务器统计数据
 */
export function getServerStatistics() {
  return http.request<ReturnResult<ServerStatistics>>(
    "get",
    "v1/gen/server/statistics"
  );
}

/**
 * 导出服务器配置
 * @param ids 服务器ID列表
 * @returns 配置文件
 */
export function exportServerConfig(ids: string[]) {
  return axios({
    url: "v1/gen/server/export",
    method: "post",
    data: { ids },
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
  return axios({
    url: "v1/gen/server/import",
    method: "post",
    data: formData,
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

export type ProtocolType = typeof PROTOCOL_TYPES[keyof typeof PROTOCOL_TYPES];

/**
 * 服务器状态枚举
 */
export const SERVER_STATUS = {
  DISABLED: 0,    // 已禁用
  ENABLED: 1,     // 已启用
  MAINTENANCE: 2, // 维护中
  ERROR: 3,       // 异常
  UNKNOWN: 4,     // 未知
  NORMAL: 5,      // 正常
} as const;

export type ServerStatus = typeof SERVER_STATUS[keyof typeof SERVER_STATUS];

/**
 * 连接状态枚举
 */
export const CONNECTION_STATUS = {
  DISCONNECTED: 0, // 未连接
  CONNECTED: 1,    // 已连接
  CONNECTING: 2,   // 连接中
  ERROR: 3,        // 连接失败
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

/**
 * 在线状态枚举
 */
export const ONLINE_STATUS = {
  OFFLINE: 0,  // 离线
  ONLINE: 1,   // 在线
  UNKNOWN: 2,  // 未知
} as const;

export type OnlineStatus = typeof ONLINE_STATUS[keyof typeof ONLINE_STATUS];

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
  [SERVER_STATUS.NORMAL]: { color: "success", text: "正常" }
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

export type WSMessageType = typeof WS_MESSAGE_TYPE[keyof typeof WS_MESSAGE_TYPE];

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
  // 新增字段
  monitorSysGenServerReportEnabled?: number;
  monitorSysGenServerProxyId?: number;
  monitorSysGenServerDataReportMethod?: string;
  monitorSysGenServerPrometheusHost?: string;
  monitorSysGenServerPrometheusPort?: number;
  monitorSysGenServerProxyHost?: string;
  monitorSysGenServerProxyPort?: number;
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
 * 前端显示用的服务器指标数据接口（简化字段名）
 */
export interface ServerMetricsDisplay {
  /** CPU使用率 (%) */
  cpuUsage: number;
  /** 内存使用率 (%) */
  memoryUsage: number;
  /** 磁盘使用率 (%) */
  diskUsage: number;
  /** 网络入流量 (KB/s) */
  networkIn: number;
  /** 网络出流量 (KB/s) */
  networkOut: number;
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
 * WebSocket消息类型常量（对应后台 MessageType）
 */
export const SERVER_WS_MESSAGE_TYPE = {
  CONNECTION_STATUS_CHANGE: 'connection_status_change',
  SERVER_ONLINE: 'server_online',
  SERVER_OFFLINE: 'server_offline',
  SERVER_UPDATE: 'server_update',
  SERVER_DELETE: 'server_delete',
  SERVER_ADD: 'server_add',
  SERVER_METRICS: 'server_metrics',
  CONNECTION_TEST_RESULT: 'connection_test_result',
  SSH_DATA: 'ssh_data',
  SSH_INPUT: 'ssh_input',
  SSH_CONNECT: 'ssh_connect',
  SSH_DISCONNECT: 'ssh_disconnect',
  SSH_RESIZE: 'ssh_resize',
  SSH_ERROR: 'ssh_error',
  VNC_DATA: 'vnc_data',
  VNC_INPUT: 'vnc_input',
  RDP_DATA: 'rdp_data',
  RDP_INPUT: 'rdp_input'
} as const;



// ==================== 字段映射转换函数 ====================

/**
 * 将后台ServerMetrics转换为前端显示用的ServerMetricsDisplay
 * @param metrics 后台指标数据
 * @returns 前端显示用的指标数据
 */
export function mapServerMetricsToDisplay(metrics: ServerMetrics): ServerMetricsDisplay {
  return {
    cpuUsage: Number(metrics.monitorSysGenServerMetricsCpuUsage),
    memoryUsage: Number(metrics.monitorSysGenServerMetricsMemoryUsage),
    diskUsage: Number(metrics.monitorSysGenServerMetricsDiskUsage),
    networkIn: Number(metrics.monitorSysGenServerMetricsNetworkIn),
    networkOut: Number(metrics.monitorSysGenServerMetricsNetworkOut),
    loadAverage: `${metrics.monitorSysGenServerMetricsCpuLoad1m || 0}`,
    uptime: Number(metrics.monitorSysGenServerMetricsUptime),
    collectTime: metrics.monitorSysGenServerMetricsCollectTime,
    cpuCores: metrics.monitorSysGenServerMetricsCpuCores,
    processCount: metrics.monitorSysGenServerMetricsProcessCount,
    responseTime: metrics.monitorSysGenServerMetricsResponseTime,
    osInfo: metrics.monitorSysGenServerMetricsOsInfo,
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
    metricsSupport: serverInfo.monitorSysGenServerMonitorEnabled === 1,
    username: serverInfo.monitorSysGenServerUsername,
    group: '', // 后台实体类中没有group字段，使用空字符串
    description: serverInfo.monitorSysGenServerDesc,
    tags: serverInfo.monitorSysGenServerTags,
    lastOnlineTime: serverInfo.monitorSysGenServerLastConnectTime,
    lastOfflineTime: '', // 后台实体类中没有lastOfflineTime字段，使用空字符串
    createTime: serverInfo.createTime || '',
    updateTime: serverInfo.updateTime || '',
    // 新增字段映射
    monitorSysGenServerReportEnabled: serverInfo.monitorSysGenServerReportEnabled,
    monitorSysGenServerProxyId: serverInfo.monitorSysGenServerProxyId,
    monitorSysGenServerDataReportMethod: serverInfo.monitorSysGenServerDataReportMethod,
    monitorSysGenServerPrometheusHost: serverInfo.monitorSysGenServerPrometheusHost,
    monitorSysGenServerPrometheusPort: serverInfo.monitorSysGenServerPrometheusPort,
    monitorSysGenServerProxyHost: serverInfo.monitorSysGenServerProxyHost,
    monitorSysGenServerProxyPort: serverInfo.monitorSysGenServerProxyPort,
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
    createTime: '',
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
    monitorSysGenServerName: displayData.name || '',
    monitorSysGenServerHost: displayData.host || '',
    monitorSysGenServerPort: displayData.port || 22,
    monitorSysGenServerProtocol: displayData.protocol || 'SSH',
    monitorSysGenServerUsername: displayData.username,
    monitorSysGenServerDesc: displayData.description,
    monitorSysGenServerMonitorEnabled: displayData.metricsSupport ? 1 : 0,
    monitorSysGenServerTags: displayData.tags,
    // 新增字段映射
    monitorSysGenServerReportEnabled: displayData.monitorSysGenServerReportEnabled,
    monitorSysGenServerProxyId: displayData.monitorSysGenServerProxyId,
    monitorSysGenServerDataReportMethod: displayData.monitorSysGenServerDataReportMethod,
    monitorSysGenServerPrometheusHost: displayData.monitorSysGenServerPrometheusHost,
    monitorSysGenServerPrometheusPort: displayData.monitorSysGenServerPrometheusPort,
    monitorSysGenServerProxyHost: displayData.monitorSysGenServerProxyHost,
    monitorSysGenServerProxyPort: displayData.monitorSysGenServerProxyPort,
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
  return http.request<ReturnResult<string>>(
    "get",
    "v1/gen/server/proxy/guacamole",
    { params: { id } }
  );
}

/**
 * 测试代理连接
 * @param id 服务器ID
 * @returns 测试结果
 */
export function testProxyConnection(id: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/proxy/test",
    { params: { id } }
  );
}

/**
 * 获取服务器支持的数据上报方式
 * @param id 服务器ID
 * @returns 支持的上报方式列表
 */
export function getSupportedReportMethods(id: string) {
  return http.request<ReturnResult<string[]>>(
    "get",
    "v1/gen/server/report/methods",
    { params: { id } }
  );
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
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server/query/data",
    {
      params: { id, queryType, expression },
      data: timeRange
    }
  );
}

/**
 * 更新服务器数据上报配置
 * @param id 服务器ID
 * @param config 上报配置
 * @returns 操作结果
 */
export function updateReportConfig(id: string, config: ReportConfigParams) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/report/config",
    {
      params: { id },
      data: config
    }
  );
}

/**
 * 获取服务器数据上报配置
 * @param id 服务器ID
 * @returns 上报配置
 */
export function getReportConfig(id: string) {
  return http.request<ReturnResult<ReportConfigParams>>(
    "get",
    "v1/gen/server/report/config",
    { params: { id } }
  );
}

// ==================== 服务器详情页组件API ====================

/**
 * 获取服务器组件列表
 * @param serverId 服务器ID
 * @returns 组件列表
 */
export function getServerDetailComponents(serverId: number) {
  return http.request<ReturnResult<ServerDetailComponent[]>>(
    "get",
    "v1/gen/server/detail/component/list",
    { params: { serverId } }
  );
}

/**
 * 获取启用的服务器组件列表
 * @param serverId 服务器ID
 * @returns 启用的组件列表
 */
export function getEnabledServerDetailComponents(serverId: number) {
  return http.request<ReturnResult<ServerDetailComponent[]>>(
    "get",
    "v1/gen/server/detail/component/list/enabled",
    { params: { serverId } }
  );
}

/**
 * 保存或更新组件
 * @param component 组件信息
 * @returns 操作结果
 */
export function saveServerDetailComponent(component: ServerDetailComponent) {
  return http.request<ReturnResult<ServerDetailComponent>>(
    "post",
    "v1/gen/server/detail/component/save",
    { data: component }
  );
}

/**
 * 批量更新组件位置
 * @param components 组件列表
 * @returns 操作结果
 */
export function batchUpdateComponentPosition(components: ServerDetailComponent[]) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/detail/component/batch/position",
    { data: components }
  );
}

/**
 * 删除组件
 * @param componentId 组件ID
 * @returns 操作结果
 */
export function deleteServerDetailComponent(componentId: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/detail/component/delete",
    { params: { componentId } }
  );
}

/**
 * 获取服务器详情页面组件模板列表
 * @returns 模板列表
 */
export function getServerDetailComponentTemplates() {
  return http.request<ReturnResult<ServerDetailComponent[]>>(
    "get",
    "v1/gen/server/detail/component/templates"
  );
}

/**
 * 为服务器初始化默认组件
 * @param serverId 服务器ID
 * @returns 操作结果
 */
export function initDefaultComponentsForServer(serverId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/detail/component/init",
    { params: { serverId } }
  );
}

/**
 * 执行组件查询
 * @param componentId 组件ID
 * @param timeRange 时间范围参数
 * @returns 查询结果
 */
export function executeComponentQuery(componentId: number, timeRange: any) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server/detail/component/query",
    {
      params: { componentId },
      data: timeRange
    }
  );
}

/**
 * 验证组件表达式
 * @param expressionType 表达式类型
 * @param expression 表达式内容
 * @param serverId 服务器ID
 * @returns 验证结果
 */
export function validateComponentExpression(expressionType: string, expression: string, serverId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/detail/component/validate",
    { params: { expressionType, expression, serverId } }
  );
}

/**
 * 启用/禁用组件
 * @param componentId 组件ID
 * @param enabled 是否启用
 * @returns 操作结果
 */
export function toggleComponentEnabled(componentId: number, enabled: boolean) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/detail/component/toggle",
    { params: { componentId, enabled } }
  );
}

/**
 * 测试本地IP检测功能
 * @param host 要测试的主机地址
 * @returns 检测结果
 */
export function testLocalIpDetection(host?: string) {
  return http.request<ReturnResult<any>>(
    "get",
    "v1/gen/server/test-local-ip",
    { params: { host } }
  );
}
