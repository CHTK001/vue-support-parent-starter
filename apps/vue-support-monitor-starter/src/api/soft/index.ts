import { http, type ReturnResult } from "@repo/utils";

// ========= 类型 =========
export interface SystemSoft {
  systemSoftId?: number;
  systemSoftName?: string;
  systemSoftCode?: string;
  systemSoftCategory?: string;
  systemSoftIcon?: string;
  systemSoftTags?: string;
  systemSoftDesc?: string;
  systemSoftImage?: string;
  systemSoftStatus?: string;
  systemSoftCreateTime?: string;
  systemSoftUpdateTime?: string;
}

export interface SystemSoftVersion {
  systemSoftVersionId?: number;
  systemSoftId?: number;
  version?: string;
  downloadUrl?: string;
  imageTag?: string;
  installTemplate?: string;
  systemSoftVersionCreateTime?: string;
  systemSoftVersionUpdateTime?: string;
}

// 容器实体
export interface SystemSoftContainer {
  systemSoftContainerId?: number;
  systemSoftId?: number;
  systemSoftVersionId?: number;
  systemServerId?: number;
  systemSoftContainerName?: string;
  systemSoftContainerDockerId?: string;
  systemSoftContainerStatus?: string;
  systemSoftContainerHealthStatus?: string;
  systemSoftContainerImageName?: string;
  systemSoftContainerImageTag?: string;
  systemSoftContainerPorts?: string;
  systemSoftContainerVolumes?: string;
  systemSoftContainerEnvironment?: string;
  systemSoftContainerNetworks?: string;
  systemSoftContainerLabels?: string;
  systemSoftContainerCommand?: string;
  systemSoftContainerArgs?: string;
  systemSoftContainerWorkingDir?: string;
  systemSoftContainerUser?: string;
  systemSoftContainerRestartPolicy?: string;
  systemSoftContainerCpuLimit?: string;
  systemSoftContainerMemoryLimit?: string;
  systemSoftContainerCreatedTime?: string;
  systemSoftContainerStartedTime?: string;
  systemSoftContainerFinishedTime?: string;
  systemSoftContainerExitCode?: number;
  systemSoftContainerError?: string;
  systemSoftContainerLogPath?: string;
  systemSoftContainerConfigHash?: string;
  systemSoftContainerRemark?: string;
}

// 安装记录
export interface SystemSoftRecord {
  systemSoftRecordId?: number;
  systemSoftRecordSoftId?: number;
  systemSoftRecordServerId?: number;
  systemSoftRecordStatus?: string;
  systemSoftRecordStartTime?: string;
  systemSoftRecordEndTime?: string;
  systemSoftRecordRemark?: string;
}

// 容器统计信息
export interface ContainerStats {
  cpuUsage?: number;
  memoryUsage?: number;
  memoryLimit?: number;
  networkRx?: number;
  networkTx?: number;
  diskRead?: number;
  diskWrite?: number;
  timestamp?: string;
}

// 容器状态统计
export interface ContainerStatusStats {
  total?: number;
  running?: number;
  stopped?: number;
  paused?: number;
  exited?: number;
  dead?: number;
}

// 批量操作结果
export interface BatchOperationResult {
  total?: number;
  success?: number;
  failed?: number;
  results?: Array<{
    containerId?: number;
    success?: boolean;
    message?: string;
  }>;
}

export interface PageParams<T = any> {
  page?: number;
  pageSize?: number;
  current?: number;
  size?: number;
  [k: string]: any;
}

// ========= 软件 =========
export function getSoftPageList(params: PageParams<SystemSoft>) {
  return http.request<ReturnResult<{ records: SystemSoft[]; total: number }>>("get", "v1/soft/page", { params });
}

export function saveSoft(data: SystemSoft) {
  return http.request<ReturnResult<SystemSoft>>("post", "v1/soft/save", { data });
}

export function updateSoft(data: SystemSoft) {
  return http.request<ReturnResult<boolean>>("put", "v1/soft/update", { data });
}

export function syncSoft() {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/sync", {});
}

// ========= 版本 =========
export function getSoftVersionPageList(params: PageParams<SystemSoftVersion>) {
  return http.request<ReturnResult<{ records: SystemSoftVersion[]; total: number }>>("get", "v1/soft/version/page", { params });
}

export function saveSoftVersion(data: SystemSoftVersion) {
  return http.request<ReturnResult<SystemSoftVersion>>("post", "v1/soft/version/save", { data });
}

export function updateSoftVersion(data: SystemSoftVersion) {
  return http.request<ReturnResult<boolean>>("put", "v1/soft/version/update", { data });
}

// ========= 安装/卸载 =========
export function installSoft(params: { systemSoftId: number; systemSoftVersionId: number; serverIds: number[]; method?: string; params?: string }) {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/record/install", { data: params });
}

export function uninstallSoft(params: { systemSoftId: number; systemSoftVersionId: number; serverIds: number[] }) {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/record/uninstall", { data: params });
}

// ========= 安装记录 =========
export function getSoftRecordPageList(params: PageParams<SystemSoftRecord>) {
  return http.request<ReturnResult<{ records: SystemSoftRecord[]; total: number }>>("get", "v1/soft/record/page", { params });
}

// ========= 容器管理 =========
// 分页查询容器列表
export function getContainerPageList(params: PageParams<SystemSoftContainer>) {
  return http.request<ReturnResult<{ records: SystemSoftContainer[]; total: number }>>("get", "v1/system/soft/container/page", { params });
}

// 根据软件ID查询容器列表
export function getContainersBySoftId(softId: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>("get", `v1/system/soft/container/soft/${softId}`);
}

// 根据服务器ID查询容器列表
export function getContainersByServerId(serverId: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>("get", `v1/system/soft/container/server/${serverId}`);
}

// 根据ID查询容器详情
export function getContainerById(id: number) {
  return http.request<ReturnResult<SystemSoftContainer>>("get", `v1/system/soft/container/${id}`);
}

// 获取容器日志
export function getContainerLogs(id: number, lines?: number) {
  return http.request<ReturnResult<string>>("get", `v1/system/soft/container/${id}/logs`, { params: { lines } });
}

// 获取容器统计信息
export function getContainerStats(id: number) {
  return http.request<ReturnResult<ContainerStats>>("get", `v1/system/soft/container/${id}/stats`);
}

// 获取容器状态统计
export function getContainerStatusStats(serverId?: number) {
  return http.request<ReturnResult<ContainerStatusStats>>("get", "v1/system/soft/container/stats", { params: { serverId } });
}

// 获取运行中的容器列表
export function getRunningContainers() {
  return http.request<ReturnResult<SystemSoftContainer[]>>("get", "v1/system/soft/container/running");
}

// 获取异常容器列表
export function getAbnormalContainers() {
  return http.request<ReturnResult<SystemSoftContainer[]>>("get", "v1/system/soft/container/abnormal");
}

// 创建容器
export function createContainer(data: {
  softId: number;
  serverId: number;
  containerName: string;
  imageTag: string;
  ports?: string;
  envVars?: string;
  volumes?: string;
  command?: string;
  args?: string;
}) {
  return http.request<ReturnResult<boolean>>("post", "v1/system/soft/container/create", { data });
}

// 启动容器
export function startContainer(id: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/system/soft/container/${id}/start`);
}

// 停止容器
export function stopContainer(id: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/system/soft/container/${id}/stop`);
}

// 重启容器
export function restartContainer(id: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/system/soft/container/${id}/restart`);
}

// 删除容器
export function deleteContainer(id: number, force?: boolean) {
  return http.request<ReturnResult<boolean>>("delete", `v1/system/soft/container/${id}`, { params: { force } });
}

// 更新容器配置
export function updateContainer(id: number, data: {
  containerName?: string;
  imageTag?: string;
  ports?: string;
  envVars?: string;
  volumes?: string;
  command?: string;
  args?: string;
  autoRestart?: number;
}) {
  return http.request<ReturnResult<boolean>>("put", `v1/system/soft/container/${id}`, { data });
}

// 同步容器状态
export function syncContainerStatus(serverId?: number) {
  return http.request<ReturnResult<number>>("post", "v1/system/soft/container/sync", { data: { serverId } });
}

// 批量操作容器
export function batchOperateContainers(data: {
  containerIds: number[];
  operation: 'start' | 'stop' | 'restart' | 'remove';
}) {
  return http.request<ReturnResult<BatchOperationResult>>("post", "v1/system/soft/container/batch", { data });
}

// ========= WebSocket相关 =========
// 获取WebSocket主题信息
export function getWebSocketTopics() {
  return http.request<ReturnResult<{
    containerStatus: string;
    containerLogs: string;
    containerStatistics: string;
    containerEvents: string;
  }>>("get", "v1/system/soft/container/websocket/topics");
}

// 获取WebSocket连接状态
export function getWebSocketStatus() {
  return http.request<ReturnResult<{
    enabled: boolean;
    activeConnections: number;
    totalSessions: number;
    uptime: string;
  }>>("get", "v1/system/soft/container/websocket/status");
}

// 手动推送容器统计信息
export function pushContainerStatistics(serverId: number) {
  return http.request<ReturnResult<string>>("post", "v1/system/soft/container/websocket/push-statistics", { data: { serverId } });
}

// 手动推送批量容器状态
export function pushContainerStatus(serverId: number) {
  return http.request<ReturnResult<string>>("post", "v1/system/soft/container/websocket/push-status", { data: { serverId } });
}

