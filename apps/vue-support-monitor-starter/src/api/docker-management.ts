import { http, type ReturnResult } from "@repo/utils";

// ========= 数据类型定义 =========

// 软件仓库管理
export interface SystemSoftRegistry {
  id?: number;
  name?: string;
  type?: 'docker_hub' | 'aliyun' | 'harbor' | 'custom';
  url?: string;
  username?: string;
  password?: string;
  email?: string;
  namespace?: string;
  status?: 'active' | 'offline' | 'error';
  description?: string;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'failed';
  softwareCount?: number;
  createTime?: string;
  updateTime?: string;
}

// 软件实体(SystemSoft)
export interface SystemSoft {
  systemSoftId?: number;
  systemSoftName?: string;
  systemSoftCode?: string;
  systemSoftCategory?: string;
  systemSoftIcon?: string;
  systemSoftTags?: string;
  systemSoftDesc?: string;
  systemSoftRegistryId?: number;
  systemSoftDockerImage?: string;
  systemSoftDefaultInstallMethod?: string;
  systemSoftDefaultInstallParams?: string;
  systemSoftStatus?: number;
  systemSoftIsOfficial?: number;
  versionCount?: number;
  containerCount?: number;
  createTime?: string;
  updateTime?: string;
}

// 软件镜像(SystemSoftImage)
export interface SystemSoftImage {
  systemSoftImageId?: number;
  systemSoftId?: number;
  systemSoftImageServerId?: number;
  systemSoftImageServerName?: string;
  systemSoftImageImageId?: string;
  systemSoftImageName?: string;
  systemSoftImageTag?: string;
  systemSoftImageFullName?: string;
  systemSoftImageRepository?: string;
  systemSoftImageSize?: number;
  systemSoftImageCreated?: string;
  systemSoftImageArchitecture?: string;
  systemSoftImageOsType?: string;
  systemSoftImageStatus?: string;
  systemSoftImageDescription?: string;
  createTime?: string;
  updateTime?: string;
}

// 软件容器(SystemSoftContainer)
export interface SystemSoftContainer {
  systemSoftContainerId?: number;
  systemSoftId?: number;
  systemServerId?: number;
  systemSoftContainerDockerId?: string;
  systemSoftContainerName?: string;
  systemSoftContainerImage?: string;
  systemSoftContainerImageName?: string;
  systemSoftContainerImageTag?: string;
  systemSoftContainerStatus?: string;
  systemSoftContainerHealthStatus?: string;
  systemSoftContainerPorts?: string;
  systemSoftContainerEnvironment?: string;
  systemSoftContainerVolumes?: string;
  systemSoftContainerNetworks?: string;
  systemSoftContainerCommand?: string;
  systemSoftContainerArgs?: string;
  systemSoftContainerWorkingDir?: string;
  systemSoftContainerUser?: string;
  systemSoftContainerRestartPolicy?: string;
  systemSoftContainerCpuLimit?: string;
  systemSoftContainerMemoryLimit?: string;
  systemSoftContainerCpuPercent?: number;
  systemSoftContainerMemoryPercent?: number;
  systemSoftContainerCpuUsage?: number;
  systemSoftContainerMemoryUsage?: number;
  systemSoftContainerCreatedTime?: string;
  systemSoftContainerStartedTime?: string;
  systemSoftContainerFinishedTime?: string;
  systemSoftContainerExitCode?: number;
  systemSoftContainerError?: string;
  systemSoftContainerLogPath?: string;
  systemSoftContainerConfigHash?: string;
  systemSoftContainerRemark?: string;
  systemSoftContainerServerName?: string;
  createTime?: string;
  updateTime?: string;
}

// 仓库同步进度信息
export interface RegistrySyncProgress {
  registryId: number;
  totalSoftware: number;
  syncedSoftware: number;
  progress: number;
  currentSoftware?: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  message?: string;
  startTime: string;
  endTime?: string;
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
  
  // 新增字段以匹配后端SystemSoftContainerStats实体类
  cpuPercent?: number;
  memoryPercent?: number;
  networkRxBytes?: number;
  networkTxBytes?: number;
  containerId?: number;
  imageId?: number;
}

// 容器统计信息历史数据
export interface ContainerStatsHistory {
  timestamps: string[];
  cpuUsage: number[];
  memoryUsage: number[];
  diskRead: number[];
  diskWrite: number[];
  networkRx: number[];
  networkTx: number[];
}

// 容器状态统计（修复命名冲突）
export interface ContainerStatusStatistics {
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

// 分页参数
export interface PageParams<T = any> {
  page?: number;
  size?: number;
  current?: number;
  [k: string]: any;
}

// ========= 1. 软件仓库管理API =========

// 分页查询仓库列表
export function pageRegistry(params: PageParams<SystemSoftRegistry>) {
  return http.request<ReturnResult<{ records: SystemSoftRegistry[]; total: number }>>("get", "v1/system/soft/registry/page", { params });
}

// 获取所有仓库列表（不分页）
export function getAllRegistries() {
  return http.request<ReturnResult<SystemSoftRegistry[]>>("get", "v1/system/soft/registry/list");
}

// 根据ID获取仓库详情
export function getRegistryById(id: number) {
  return http.request<ReturnResult<SystemSoftRegistry>>("get", `v1/system/soft/registry/${id}`);
}

// 创建软件仓库
export function createRegistry(data: Omit<SystemSoftRegistry, 'id' | 'createTime' | 'updateTime'>) {
  return http.request<ReturnResult<boolean>>("post", "v1/system/soft/registry", { data });
}

// 更新软件仓库
export function updateRegistry(id: number, data: Partial<SystemSoftRegistry>) {
  return http.request<ReturnResult<boolean>>("put", `v1/system/soft/registry/${id}`, { data });
}

// 删除软件仓库
export function deleteRegistry(id: number) {
  return http.request<ReturnResult<boolean>>("delete", `v1/system/soft/registry/${id}`);
}

// 批量删除仓库
export function batchDeleteRegistries(ids: number[]) {
  return http.request<ReturnResult<boolean>>("delete", "v1/system/soft/registry/batch", { data: { ids } });
}

// 测试仓库连接
export function testRegistryConnection(data: { url: string; username?: string; password?: string }) {
  return http.request<ReturnResult<{ success: boolean; message: string }>>("post", "v1/system/soft/registry/test", { data });
}

// 同步单个仓库
export function syncRegistry(id: number) {
  return http.request<ReturnResult<{ operationId: string }>>("post", `v1/system/soft/registry/${id}/sync`);
}

// 同步所有仓库
export function syncAllRegistries() {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/registry/sync-all");
}

// 批量同步仓库
export function batchSyncRegistries(ids: number[]) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/registry/batch-sync", { data: { ids } });
}

// 获取仓库同步进度
export function getRegistrySyncProgress(operationId: string) {
  return http.request<ReturnResult<RegistrySyncProgress>>("get", `v1/system/soft/registry/sync-progress/${operationId}`);
}

// 获取仓库统计信息
export function getRegistryStats() {
  return http.request<ReturnResult<{
    totalRegistries: number;
    activeRegistries: number;
    offlineRegistries: number;
    errorRegistries: number;
    totalSoftware: number;
    lastSyncTime?: string;
  }>>("get", "v1/system/soft/registry/stats");
}

// ========= 2. 软件管理API =========

// 分页查询软件列表
export function getSoftPageList(params: PageParams<SystemSoft>) {
  return http.request<ReturnResult<{ records: SystemSoft[]; total: number }>>("get", "v1/system/soft/page", { params });
}

// 获取软件详情
export function getSoftById(id: number) {
  return http.request<ReturnResult<SystemSoft>>("get", `v1/system/soft/${id}`);
}

// 创建软件
export function createSoft(data: Omit<SystemSoft, 'systemSoftId' | 'createTime' | 'updateTime'>) {
  return http.request<ReturnResult<boolean>>("post", "v1/system/soft", { data });
}

// 更新软件
export function updateSoft(id: number, data: Partial<SystemSoft>) {
  return http.request<ReturnResult<boolean>>("put", `v1/system/soft/${id}`, { data });
}

// 删除软件
export function deleteSoft(id: number) {
  return http.request<ReturnResult<boolean>>("delete", `v1/system/soft/${id}`);
}

// 从仓库同步软件信息
export function syncSoftware(registryId?: number) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/sync", { data: { registryId } });
}

// 安装软件（拉取镜像到指定服务器）
export function installSoftware(data: {
  softId: number;
  serverIds: number[];
  imageTag?: string;
  installMethod?: string;
  installParams?: string;
}) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/install", { data });
}

// 获取软件统计信息
export function getSoftwareStats() {
  return http.request<ReturnResult<{
    totalSoftware: number;
    enabledSoftware: number;
    disabledSoftware: number;
    officialSoftware: number;
    categoryCounts: Record<string, number>;
  }>>("get", "v1/system/soft/stats");
}

// ========= 3. 软件镜像管理API =========

// 分页查询镜像列表
export function getImagePageList(params: PageParams<SystemSoftImage>) {
  return http.request<ReturnResult<{ records: SystemSoftImage[]; total: number }>>("get", "v1/system/soft/image/page", { params });
}

// 根据服务器ID查询镜像列表
export function getImagesByServerId(serverId: number) {
  return http.request<ReturnResult<SystemSoftImage[]>>("get", `v1/system/soft/image/server/${serverId}`);
}

// 根据软件ID查询镜像列表
export function getImagesBySoftId(softId: number) {
  return http.request<ReturnResult<SystemSoftImage[]>>("get", `v1/system/soft/image/soft/${softId}`);
}

// 根据ID获取镜像详情
export function getImageById(id: number) {
  return http.request<ReturnResult<SystemSoftImage>>("get", `v1/system/soft/image/${id}`);
}

// 拉取镜像
export function pullImage(data: {
  softId: number;
  serverId: number;
  imageTag: string;
  repository?: string;
}) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/image/pull", { data });
}

// 删除镜像
export function deleteImage(id: number, force?: boolean) {
  return http.request<ReturnResult<boolean>>("delete", `v1/system/soft/image/${id}`, { params: { force } });
}

// 批量删除镜像
export function batchDeleteImages(ids: number[], force?: boolean) {
  return http.request<ReturnResult<BatchOperationResult>>("delete", "v1/system/soft/image/batch", { data: { ids, force } });
}

// 启动镜像（创建并启动容器）
export function startImageAsContainer(data: {
  imageId: number;
  containerName: string;
  ports?: string;
  envVars?: string;
  volumes?: string;
  command?: string;
  args?: string;
  autoRestart?: boolean;
  cpuLimit?: string;
  memoryLimit?: string;
}) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/image/start", { data });
}

// 同步镜像状态
export function syncImageStatus(serverId?: number) {
  return http.request<ReturnResult<number>>("post", "v1/system/soft/image/sync", { data: { serverId } });
}

// 获取镜像统计信息
export function getImageStats(serverId?: number) {
  return http.request<ReturnResult<{
    totalImages: number;
    availableImages: number;
    pendingImages: number;
    errorImages: number;
    totalSize: number;
  }>>("get", "v1/system/soft/image/stats", { params: { serverId } });
}

// ========= 4. 软件容器管理API =========

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
  workingDir?: string;
  user?: string;
  restartPolicy?: string;
  cpuLimit?: string;
  memoryLimit?: string;
}) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/container", { data });
}

// 启动容器
export function startContainer(id: number) {
  return http.request<ReturnResult<{ operationId: string }>>("post", `v1/system/soft/container/${id}/start`);
}

// 停止容器
export function stopContainer(id: number, timeout?: number) {
  return http.request<ReturnResult<{ operationId: string }>>("post", `v1/system/soft/container/${id}/stop`, { data: { timeout } });
}

// 重启容器
export function restartContainer(id: number) {
  return http.request<ReturnResult<{ operationId: string }>>("post", `v1/system/soft/container/${id}/restart`);
}

// 暂停容器
export function pauseContainer(id: number) {
  return http.request<ReturnResult<{ operationId: string }>>("post", `v1/system/soft/container/${id}/pause`);
}

// 恢复容器
export function unpauseContainer(id: number) {
  return http.request<ReturnResult<{ operationId: string }>>("post", `v1/system/soft/container/${id}/unpause`);
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
  autoRestart?: boolean;
  cpuLimit?: string;
  memoryLimit?: string;
}) {
  return http.request<ReturnResult<boolean>>("put", `v1/system/soft/container/${id}`, { data });
}

// 获取容器日志
export function getContainerLogs(id: number, lines?: number, since?: string) {
  return http.request<ReturnResult<string>>("get", `v1/system/soft/container/${id}/logs`, { params: { lines, since } });
}

// 获取容器统计信息
export function getContainerStats(id: number) {
  return http.request<ReturnResult<ContainerStats>>("get", `v1/system/soft/container/${id}/stats`);
}

// 获取容器统计信息历史数据
export function getContainerStatsHistory(containerId: number, hours: number = 1) {
  return http.request<ReturnResult<ContainerStatsHistory>>("get", `v1/system/soft/container/${containerId}/stats/history`, { params: { hours } });
}

// 获取容器状态统计（修复命名冲突）
export function getContainerStatusStatistics() {
  return http.request<ReturnResult<ContainerStatusStatistics>>("get", "v1/system/soft/container/stats");
}

// 获取运行中的容器列表
export function getRunningContainers(serverId?: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>("get", "v1/system/soft/container/running", { params: { serverId } });
}

// 获取异常容器列表
export function getAbnormalContainers(serverId?: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>("get", "v1/system/soft/container/abnormal", { params: { serverId } });
}

// 批量操作容器
export function batchOperateContainers(data: {
  containerIds: number[];
  operation: 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'remove';
  options?: {
    timeout?: number;
    force?: boolean;
  };
}) {
  return http.request<ReturnResult<BatchOperationResult>>("post", "v1/system/soft/container/batch", { data });
}

// 同步容器状态
export function syncContainerStatus(serverId?: number) {
  return http.request<ReturnResult<number>>("post", "v1/system/soft/container/sync", { data: { serverId } });
}

// ========= 5. WebSocket相关API（已废弃，改用Socket.IO） =========
// 注：WebSocket手动推送接口已被新的Socket.IO实时通信替代，这些接口不再使用

// ========= 6. 服务器相关API =========

// 获取服务器列表（用于下拉选择）
export function getServerList() {
  return http.request<ReturnResult<Array<{
    id: number;
    name: string;
    host: string;
    port: number;
    status: string;
  }>>>("get", "v1/system/server/list");
}

// 获取WebSocket主题信息
export function getWebSocketTopics() {
  return http.request<ReturnResult<{
    containerStatus: string;
    containerLogs: string;
    containerStatistics: string;
    containerEvents: string;
  }>>("get", "v1/system/soft/websocket/topics");
}

// ========= API对象导出 =========

// 软件仓库管理API对象
export const registryApi = {
  pageRegistry,
  getAllRegistries,
  getRegistryById,
  createRegistry,
  updateRegistry,
  deleteRegistry,
  batchDeleteRegistries,
  testRegistryConnection,
  syncRegistry,
  syncAllRegistries,
  batchSyncRegistries,
  getRegistrySyncProgress,
  getRegistryStats
};

// 软件管理API对象
export const softwareApi = {
  getSoftPageList,
  getSoftById,
  createSoft,
  updateSoft,
  deleteSoft,
  syncSoftware,
  installSoftware,
  getSoftwareStats
};

// 镜像管理API对象
export const imageApi = {
  getImagePageList,
  getImagesByServerId,
  getImagesBySoftId,
  getImageById,
  pullImage,
  deleteImage,
  batchDeleteImages,
  startImageAsContainer,
  syncImageStatus,
  getImageStats
};

// 容器管理API对象
export const containerApi = {
  getContainerPageList,
  getContainersBySoftId,
  getContainersByServerId,
  getContainerById,
  createContainer,
  startContainer,
  stopContainer,
  restartContainer,
  pauseContainer,
  unpauseContainer,
  deleteContainer,
  updateContainer,
  getContainerLogs,
  getContainerStats,
  getContainerStatsHistory,
  getContainerStatusStats: getContainerStatusStatistics, // 重命名以避免冲突
  getRunningContainers,
  getAbnormalContainers,
  batchOperateContainers,
  syncContainerStatus
};

// 统一导出
export const dockerManagementApi = {
  registry: registryApi,
  software: softwareApi,
  image: imageApi,
  container: containerApi,
  getServerList
};

export default dockerManagementApi;