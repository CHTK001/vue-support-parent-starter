import { http, type ReturnResult } from "@repo/utils";

// ========= 数据类型定义 =========

// 软件仓库管理（对齐后端字段命名）
export interface SystemSoftRegistry {
  systemSoftRegistryId?: number;
  systemSoftRegistryName?: string;
  systemSoftRegistryType?: 'docker_hub' | 'aliyun' | 'harbor' | 'custom' | string;
  systemSoftRegistryUrl?: string;
  systemSoftRegistryUsername?: string;
  systemSoftRegistryPassword?: string;
  systemSoftRegistryEmail?: string;
  systemSoftRegistryIsDefault?: number;
  systemSoftRegistrySslEnabled?: number;
  systemSoftRegistrySupportSync?: number;
  systemSoftRegistryTimeout?: number;
  systemSoftRegistryDescription?: string;
  systemSoftRegistryConfig?: string;
  systemSoftRegistryLastConnectTime?: string;
  systemSoftRegistryConnectStatus?: number;
  systemSoftRegistryErrorMessage?: string;
  systemSoftRegistrySort?: number;
  systemSoftRegistryStatus?: number;
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

// 软件镜像(SystemSoftImage)（对齐后端字段命名）
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
  systemSoftImageDigest?: string;
  systemSoftImageStatus?: string;
  systemSoftImageDescription?: string;
  createTime?: string;
  updateTime?: string;
}

// 软件容器(SystemSoftContainer)（对齐后端字段命名）
export interface SystemSoftContainer {
  systemSoftContainerId?: number;
  systemSoftId?: number;
  systemServerId?: number;
  systemSoftImageId?: number;
  systemSoftContainerDockerId?: string;
  systemSoftContainerName?: string;
  systemSoftContainerImage?: string;
  systemSoftContainerImageTag?: string;
  systemSoftContainerStatus?: string;
  systemSoftContainerPorts?: string;
  systemSoftContainerEnv?: string;
  systemSoftContainerVolumes?: string;
  systemSoftContainerNetworks?: string;
  systemSoftContainerCommand?: string;
  systemSoftContainerArgs?: string;
  systemSoftContainerCreatedTime?: string;
  systemSoftContainerStartedTime?: string;
  systemSoftContainerFinishedTime?: string;
  systemSoftContainerRestartCount?: number;
  systemSoftContainerConfig?: string;
  systemSoftContainerHealthStatus?: string;
  systemSoftContainerAutoRestart?: number;
  systemSoftContainerCpuLimit?: number;
  systemSoftContainerMemoryLimit?: number;
  systemSoftContainerRemark?: string;
  createTime?: string;
  updateTime?: string;
}

// 仓库同步进度信息（保留）
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

// 容器统计信息（对齐后端 SystemSoftContainerStats 字段命名）
export interface ContainerStats {
  systemSoftContainerStatsCpuPercent?: number;
  systemSoftContainerStatsMemoryUsage?: number;
  systemSoftContainerStatsMemoryLimit?: number;
  systemSoftContainerStatsMemoryPercent?: number;
  systemSoftContainerStatsNetworkRxBytes?: number;
  systemSoftContainerStatsNetworkTxBytes?: number;
  systemSoftContainerStatsDiskRead?: number;
  systemSoftContainerStatsDiskWrite?: number;
  systemSoftContainerStatsRecordTime?: string;
  systemSoftContainerId?: number;
  systemSoftImageId?: number;
}

// 容器统计信息历史数据（保留旧结构，若后端提供再对齐）
export interface ContainerStatsHistory {
  timestamps: string[];
  cpuUsage: number[];
  memoryUsage: number[];
  diskRead: number[];
  diskWrite: number[];
  networkRx: number[];
  networkTx: number[];
}

// 容器状态统计（保留）
export interface ContainerStatusStatistics {
  total?: number;
  running?: number;
  stopped?: number;
  paused?: number;
  exited?: number;
  dead?: number;
}

// 批量操作结果（保留）
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

// 分页查询仓库列表（路径已对齐后端）
export function pageRegistry(params: PageParams<SystemSoftRegistry>) {
  return http.request<ReturnResult<{ records: SystemSoftRegistry[]; total: number }>>("get", "v1/system/soft/registry/page", { params });
}

// 获取所有仓库列表（不分页）——后端为 GET /v1/system/soft/registry
export function getAllRegistries() {
  return http.request<ReturnResult<SystemSoftRegistry[]>>("get", "v1/system/soft/registry");
}

// 根据ID获取仓库详情
export function getRegistryById(id: number) {
  return http.request<ReturnResult<SystemSoftRegistry>>("get", `v1/system/soft/registry/${id}`);
}

// 创建软件仓库（后端返回实体）
export function createRegistry(data: Omit<SystemSoftRegistry, 'createTime' | 'updateTime' | 'systemSoftRegistryId'>) {
  return http.request<ReturnResult<SystemSoftRegistry>>("post", "v1/system/soft/registry", { data });
}

// 更新软件仓库（后端返回实体）
export function updateRegistry(id: number, data: Partial<SystemSoftRegistry>) {
  return http.request<ReturnResult<SystemSoftRegistry>>("put", `v1/system/soft/registry/${id}`, { data });
}

// 删除软件仓库
export function deleteRegistry(id: number) {
  return http.request<ReturnResult<boolean>>("delete", `v1/system/soft/registry/${id}`);
}

// 批量删除仓库（后端接收原始数组）
export function batchDeleteRegistries(ids: number[]) {
  return http.request<ReturnResult<boolean>>("delete", "v1/system/soft/registry/batch", { data: ids });
}

// 测试仓库连接（后端为 POST /{id}/test）
export function testRegistryConnection(id: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/system/soft/registry/${id}/test`);
}

// 同步单个仓库
export function syncRegistry(id: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/system/soft/registry/${id}/sync`);
}

// 设置默认仓库（后端为 POST /{id}/default）
export function setDefaultRegistry(id: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/system/soft/registry/${id}/default`);
}

// 取消默认仓库（后端建议为 POST /{id}/default/cancel）
export function cancelDefaultRegistry(id: number) {
  return http.request<ReturnResult<boolean>>("post", `v1/system/soft/registry/${id}/default/cancel`);
}

// ========= 2. 软件管理API =========

// 分页查询软件列表（已存在 v1 兼容控制器）
export function getSoftPageList(params: PageParams<SystemSoft>) {
  return http.request<ReturnResult<{ records: SystemSoft[]; total: number }>>("get", "v1/system/soft/page", { params });
}

// 其余软件 API 维持不变（待核对后端对应控制器）
export function getSoftById(id: number) {
  return http.request<ReturnResult<SystemSoft>>("get", `v1/system/soft/${id}`);
}
export function createSoft(data: Omit<SystemSoft, 'systemSoftId' | 'createTime' | 'updateTime'>) {
  return http.request<ReturnResult<boolean>>("post", "v1/system/soft", { data });
}
export function updateSoft(id: number, data: Partial<SystemSoft>) {
  return http.request<ReturnResult<boolean>>("put", `v1/system/soft/${id}`, { data });
}
export function deleteSoft(id: number) {
  return http.request<ReturnResult<boolean>>("delete", `v1/system/soft/${id}`);
}
export function syncSoftware(registryId?: number) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/sync", { data: { registryId } });
}
export type InstallPort = { host: string; container: string; protocol?: string };
export type InstallEnv = { key: string; value: string };
export type InstallVolume = { host: string; container: string; ro?: boolean };

export function installSoftware(data: {
  softId: number;
  serverIds: number[];
  imageTag?: string;
  command?: string;
  ports?: InstallPort[];
  env?: InstallEnv[];
  volumes?: InstallVolume[];
  networkMode?: string;
  restartPolicy?: string;
  memoryLimit?: number;
  cpuLimit?: number;
  workingDir?: string;
  user?: string;
  autoStart?: boolean;
  autoRemove?: boolean;
  privileged?: boolean;
  healthcheck?: string;
  maxRetries?: number;
}) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "v1/system/soft/install", { data });
}
export function getSoftwareStats() {
  return http.request<ReturnResult<{ totalSoftware: number; enabledSoftware: number; disabledSoftware: number; officialSoftware: number; categoryCounts: Record<string, number>; }>>("get", "v1/system/soft/stats");
}

// ========= 3. 软件镜像管理API（路径对齐后端 /api/monitor/system-soft-image） =========

export function getImagePageList(params: PageParams<SystemSoftImage>) {
  return http.request<ReturnResult<{ records: SystemSoftImage[]; total: number }>>("get", "/api/monitor/system-soft-image/page", { params });
}

// 使用统一 list 接口按条件查询（serverId/softId）
export function getImagesByServerId(serverId: number) {
  return http.request<ReturnResult<SystemSoftImage[]>>("get", "/api/monitor/system-soft-image/list", { params: { serverId } });
}
export function getImagesBySoftId(softId: number) {
  return http.request<ReturnResult<SystemSoftImage[]>>("get", "/api/monitor/system-soft-image/list", { params: { softId } });
}

export function getImageById(id: number) {
  return http.request<ReturnResult<SystemSoftImage>>("get", `/api/monitor/system-soft-image/${id}`);
}

// 拉取镜像（后端 softId/serverId/imageTag 为请求参数，config 为 body）
export function pullImage(data: { softId: number; serverId: number; imageTag: string; config?: any; }) {
  const { softId, serverId, imageTag, config } = data;
  return http.request<ReturnResult<SystemSoftImage>>("post", "/api/monitor/system-soft-image/pull", {
    params: { softId, serverId, imageTag },
    data: config,
  });
}

export function deleteImage(id: number, force?: boolean) {
  return http.request<ReturnResult<boolean>>("delete", `/api/monitor/system-soft-image/${id}/image`, { params: { force } });
}

// 基于镜像创建容器（后端为 POST /{id}/start 返回 Boolean）
export function startImageAsContainer(payload: { imageId: number; config?: any; }) {
  const { imageId, config } = payload;
  return http.request<ReturnResult<boolean>>("post", `/api/monitor/system-soft-image/${imageId}/start`, { data: config });
}

// 同步镜像状态（后端暂未提供，保留占位或改为 list 触发刷新）
export function syncImageStatus(serverId?: number) {
  return http.request<ReturnResult<number>>("get", "/api/monitor/system-soft-image/page", { params: { serverId } });
}

// 导出镜像
export function exportImage(data: { imageId: number; serverId: number; }) {
  return http.request<ReturnResult<{ operationId: string; filePath: string }>>("post", "/api/monitor/system-soft-image/export", { data });
}

// 导入镜像
export function importImage(formData: FormData) {
  return http.request<ReturnResult<{ operationId: string }>>("post", "/api/monitor/system-soft-image/import", { 
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 同步镜像：从服务器同步Docker镜像到SystemSoftImage表
export function syncImages(data: { serverIds: number[] }) {
  return http.request<ReturnResult<{ operationId: string; syncCount: number }>>("post", "/api/monitor/system-soft-image/sync", { data });
}

// ========= 4. 软件容器管理API（路径对齐后端 /api/monitor/system-soft-container） =========

export function getContainerPageList(params: PageParams<SystemSoftContainer>) {
  return http.request<ReturnResult<{ records: SystemSoftContainer[]; total: number }>>("get", "/api/monitor/system-soft-container/page", { params });
}

// 统一使用 list 接口按条件查询
export function getContainersBySoftId(softId: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>("get", "/api/monitor/system-soft-container/list", { params: { softId } });
}
export function getContainersByServerId(serverId: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>("get", "/api/monitor/system-soft-container/list", { params: { serverId } });
}

export function getContainerById(id: number) {
  return http.request<ReturnResult<SystemSoftContainer>>("get", `/api/monitor/system-soft-container/${id}`);
}

// 按后端定义：新增/更新均走实体对象（此处保留占位，调用方应传递完整实体）
export function createContainer(data: SystemSoftContainer) {
  return http.request<ReturnResult<boolean>>("post", "/api/monitor/system-soft-container", { data });
}

export function startContainer(id: number) {
  return http.request<ReturnResult<boolean>>("post", `/api/monitor/system-soft-container/${id}/start`);
}
export function stopContainer(id: number) {
  return http.request<ReturnResult<boolean>>("post", `/api/monitor/system-soft-container/${id}/stop`);
}
export function restartContainer(id: number) {
  return http.request<ReturnResult<boolean>>("post", `/api/monitor/system-soft-container/${id}/restart`);
}

export function deleteContainer(id: number, force?: boolean) {
  return http.request<ReturnResult<boolean>>("delete", `/api/monitor/system-soft-container/${id}/container`, { params: { force } });
}

export function updateContainer(data: SystemSoftContainer) {
  return http.request<ReturnResult<boolean>>("put", "/api/monitor/system-soft-container", { data });
}

export function getContainerLogs(id: number, lines?: number) {
  return http.request<ReturnResult<string>>("get", `/api/monitor/system-soft-container/${id}/logs`, { params: { lines } });
}

// 批量操作容器
export function batchOperateContainers(data: { containerIds: number[]; operation: 'start' | 'stop' | 'restart' | 'remove' }) {
  return http.request<ReturnResult<{ total: number; success: number; failed: number }>>("post", "/api/monitor/system-soft-container/batch", { data });
}

export function getContainerStats(id: number) {
  return http.request<ReturnResult<ContainerStats>>("get", `/api/monitor/system-soft-container/${id}/stats`);
}

// 同步容器状态（后端为 GET /sync?serverId=）
export function syncContainerStatus(serverId?: number) {
  return http.request<ReturnResult<number>>("get", "/api/monitor/system-soft-container/sync", { params: { serverId } });
}

// ========= 6. 服务器相关API =========

export function getServerList() {
  return http.request<ReturnResult<Array<{ id: number; name: string; host: string; port: number; status: string; }>>>("get", "v1/gen/server/list");
}

export function getWebSocketTopics() {
  return http.request<ReturnResult<{ containerStatus: string; containerLogs: string; containerStatistics: string; containerEvents: string; }>>("get", "v1/system/soft/websocket/topics");
}

// ========= API对象导出 =========

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
  setDefaultRegistry,
  cancelDefaultRegistry,
};

// ========= 2.1 在线搜索（仅检索默认仓库，后端SPI实现，接口占位） =========
export function searchOnlineSoftware(params: { keyword: string; page?: number; size?: number }) {
  const kw = (params?.keyword || '').trim();
  if (!kw) {
    // 前端直接返回空结果，避免不必要的网络请求
    return Promise.resolve({ code: "00000", data: { records: [], total: 0 }, msg: "" } as unknown as ReturnResult<{ records: SystemSoft[]; total: number }>);
  }
  return http.request<ReturnResult<{ records: SystemSoft[]; total: number }>>("get", "v1/system/soft/online/search", { params: { ...params, keyword: kw } })
    .catch(() => ({ code: "00000", data: { records: [], total: 0 }, msg: "" } as unknown as ReturnResult<{ records: SystemSoft[]; total: number }>));
}

// 将在线检索结果导入到软件库（异步保存，接口占位）
export function importOnlineSoftware(data: { items: Array<Partial<SystemSoft> & { systemSoftDockerImage?: string }> }) {
  return http.request<ReturnResult<{ queued: number }>>("post", "v1/system/soft/online/import", { data });
}

export const softwareApi = {
  getSoftPageList,
  getSoftById,
  createSoft,
  updateSoft,
  deleteSoft,
  syncSoftware,
  installSoftware,
  getSoftwareStats,
  searchOnlineSoftware,
  importOnlineSoftware,
};

export const imageApi = {
  getImagePageList,
  getImagesByServerId,
  getImagesBySoftId,
  getImageById,
  pullImage,
  deleteImage,
  startImageAsContainer,
  exportImage,
  importImage,
  syncImages,
};

export const containerApi = {
  getContainerPageList,
  getContainersBySoftId,
  getContainersByServerId,
  getContainerById,
  createContainer,
  startContainer,
  stopContainer,
  restartContainer,
  deleteContainer,
  updateContainer,
  getContainerLogs,
  getContainerStats,
  syncContainerStatus,
  batchOperateContainers,
};

export const dockerManagementApi = {
  registry: registryApi,
  software: softwareApi,
  image: imageApi,
  container: containerApi,
  getServerList,
};

export default dockerManagementApi;
