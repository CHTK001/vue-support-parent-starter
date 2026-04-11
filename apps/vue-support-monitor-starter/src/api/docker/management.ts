import { http, type ReturnResult } from "@repo/utils";
import {
  normalizeContainer,
  normalizeImageContainerStartConfig,
  normalizeImageStatusValue,
} from "./normalizers";

export {
  normalizeContainer,
  normalizeImageContainerStartConfig,
} from "./normalizers";

// ========= 数据类型定义 =========

// Docker 仓库（暂沿用后端字段命名）
export interface SystemSoftRegistry {
  systemSoftRegistryId?: number;
  systemSoftRegistryName?: string;
  systemSoftRegistryType?:
    | "docker_hub"
    | "github"
    | "aliyun"
    | "harbor"
    | "custom"
    | string;
  systemSoftRegistryUrl?: string;
  systemSoftRegistryUsername?: string;
  systemSoftRegistryPassword?: string;
  systemSoftRegistryEmail?: string;
  // 是否激活（激活的仓库用于软件搜索）
  systemSoftRegistryActive?: number;
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

// Docker 镜像（暂沿用后端字段命名）
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

// Docker 容器（暂沿用后端字段命名）
export interface SystemSoftContainer {
  systemSoftContainerId?: number;
  systemSoftId?: number;
  systemServerId?: number;
  systemSoftContainerServerName?: string;
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
  status: "pending" | "syncing" | "completed" | "failed";
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

const SUCCESS_CODE = "00000";

const withMessage = <T>(result: ReturnResult<T>) => ({
  ...result,
  message: result?.message || result?.msg || "",
}) as ReturnResult<T>;

const mapArrayResult = <T, R>(
  result: ReturnResult<T[]>,
  mapper: (item: T) => R,
) => {
  if (!Array.isArray(result?.data)) {
    return withMessage(result as ReturnResult<any[]>) as ReturnResult<R[]>;
  }

  return withMessage({
    ...result,
    data: result.data.map(mapper),
  } as ReturnResult<R[]>);
};

const mapPageResult = <T, R>(
  result: ReturnResult<{ records: T[]; total: number }>,
  mapper: (item: T) => R,
) => {
  const records = Array.isArray(result?.data?.records)
    ? result.data.records.map(mapper)
    : [];

  return withMessage({
    ...result,
    data: {
      ...result.data,
      records,
    },
  } as ReturnResult<{ records: R[]; total: number }>);
};

const mapEntityResult = <T, R>(
  result: ReturnResult<T>,
  mapper: (item: T) => R,
) => {
  if (!result?.data) {
    return withMessage(result as ReturnResult<any>) as ReturnResult<R>;
  }

  return withMessage({
    ...result,
    data: mapper(result.data),
  } as ReturnResult<R>);
};

const normalizeRegistry = (registry: SystemSoftRegistry) => ({
  ...registry,
  id: (registry as any)?.id ?? registry?.systemSoftRegistryId,
  name: (registry as any)?.name ?? registry?.systemSoftRegistryName,
  url: (registry as any)?.url ?? registry?.systemSoftRegistryUrl,
  username:
    (registry as any)?.username ?? registry?.systemSoftRegistryUsername,
  type: (registry as any)?.type ?? registry?.systemSoftRegistryType,
});

const normalizeServer = (server: ServerInfo) => ({
  ...server,
  id: (server as any)?.id ?? server?.monitorSysGenServerId,
  name: (server as any)?.name ?? server?.monitorSysGenServerName,
  host: (server as any)?.host ?? server?.monitorSysGenServerHost,
  ip: (server as any)?.ip ?? server?.monitorSysGenServerHost,
  port: (server as any)?.port ?? server?.monitorSysGenServerPort,
});

const normalizeImage = (image: SystemSoftImage) => ({
  ...image,
  id: (image as any)?.id ?? image?.systemSoftImageId,
  name: (image as any)?.name ?? image?.systemSoftImageName,
  tag: (image as any)?.tag ?? image?.systemSoftImageTag,
  version: (image as any)?.version ?? image?.systemSoftImageTag,
  imageTag: (image as any)?.imageTag ?? image?.systemSoftImageTag,
  fullImageName:
    (image as any)?.fullImageName ?? image?.systemSoftImageFullName,
  size: (image as any)?.size ?? image?.systemSoftImageSize,
  created: (image as any)?.created ?? image?.systemSoftImageCreated,
  systemSoftImageStatus: normalizeImageStatusValue(
    (image as any)?.status ?? image?.systemSoftImageStatus,
  ),
  status: normalizeImageStatusValue(
    (image as any)?.status ?? image?.systemSoftImageStatus,
  ),
});

const normalizePageRequestParams = (
  params: Record<string, any> = {},
  keywordField: string,
) => {
  const {
    current,
    pageSize,
    keyword,
    ...rest
  } = params;

  const requestParams = {
    ...rest,
    ...(rest.page === undefined && current !== undefined ? { page: current } : {}),
    ...(rest.size === undefined && pageSize !== undefined ? { size: pageSize } : {}),
  };

  if (
    (requestParams[keywordField] === undefined ||
      requestParams[keywordField] === "") &&
    keyword !== undefined &&
    keyword !== null &&
    String(keyword).trim() !== ""
  ) {
    requestParams[keywordField] = String(keyword).trim();
  }

  Object.keys(requestParams).forEach((key) => {
    if (
      requestParams[key] === undefined ||
      requestParams[key] === null ||
      requestParams[key] === ""
    ) {
      delete requestParams[key];
    }
  });

  return requestParams;
};

const extractImageTag = (fullImageName?: string) => {
  if (!fullImageName) {
    return undefined;
  }

  const lastColonIndex = fullImageName.lastIndexOf(":");
  const lastSlashIndex = fullImageName.lastIndexOf("/");
  if (lastColonIndex <= lastSlashIndex) {
    return undefined;
  }

  return fullImageName.slice(lastColonIndex + 1);
};

// ========= 1. Docker 仓库管理 API =========

// docker 页面当前只保留仓库下拉，不再承载旧 soft 仓库管理能力。
export function getAllRegistries() {
  return http.request<ReturnResult<SystemSoftRegistry[]>>(
    "get",
    "v1/system/soft/registry",
  ).then((result) => mapArrayResult(result, normalizeRegistry));
}

// ========= 2. Docker 镜像管理 API =========

export function getImagePageList(params: PageParams<SystemSoftImage>) {
  return http.request<
    ReturnResult<{ records: SystemSoftImage[]; total: number }>
  >("get", "/api/monitor/docker/images/page", {
    params: normalizePageRequestParams(params, "imageName"),
  })
    .then((result) => mapPageResult(result, normalizeImage));
}

// 使用统一 list 接口按条件查询
export function getImagesByServerId(serverId: number) {
  return http.request<ReturnResult<SystemSoftImage[]>>(
    "get",
    "/api/monitor/docker/images/list",
    { params: { serverId } },
  ).then((result) => mapArrayResult(result, normalizeImage));
}

export function getImageById(id: number) {
  return http.request<ReturnResult<SystemSoftImage>>(
    "get",
    `/api/monitor/docker/images/${id}`,
  ).then((result) => mapEntityResult(result, normalizeImage));
}

// 拉取镜像（后端 softId/serverId/imageTag 为请求参数，config 为 body）
export function pullImage(data: {
  softId?: number;
  serverId: number;
  imageTag?: string;
  imageName?: string;
  fullImageName?: string;
  registryId?: number | string;
  config?: any;
}) {
  const {
    softId,
    serverId,
    imageTag,
    imageName,
    fullImageName,
    registryId,
    config,
  } = data;
  const resolvedImageTag =
    imageTag || extractImageTag(fullImageName) || "latest";
  const requestData = {
    ...(config || {}),
    ...(imageName ? { imageName } : {}),
    ...(fullImageName ? { fullImageName } : {}),
    ...(registryId !== undefined && registryId !== null && registryId !== ""
      ? { registryId }
      : {}),
  };
  return http.request<ReturnResult<SystemSoftImage>>(
    "post",
    "/api/monitor/docker/images/pull",
    {
      params: { softId: softId ?? 0, serverId, imageTag: resolvedImageTag },
      data: requestData,
    },
  ).then((result) => mapEntityResult(result, normalizeImage));
}

export function deleteImage(id: number, force?: boolean) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/api/monitor/docker/images/${id}/image`,
    { params: { force } },
  );
}

// 基于镜像创建容器（后端为 POST /{id}/start 返回 Boolean）
export function startImageAsContainer(payload: {
  imageId: number;
  config?: any;
}) {
  const { imageId, config } = payload;
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/docker/images/${imageId}/start`,
    { data: normalizeImageContainerStartConfig(config || {}) },
  );
}

// 导出镜像
export function exportImage(data: { imageId: number; serverId: number }) {
  return http.request<ReturnResult<{ operationId: string; filePath: string }>>(
    "post",
    "/api/monitor/docker/images/export",
    { data },
  );
}

// 导入镜像
export function importImage(formData: FormData) {
  return http.request<ReturnResult<{ operationId: string }>>(
    "post",
    "/api/monitor/docker/images/import",
    {
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
}

// 同步镜像：从服务器同步Docker镜像到SystemSoftImage表
export function syncImages(data: { serverIds: number[] }) {
  return http.request<ReturnResult<{ operationId: string; syncCount: number }>>(
    "post",
    "/api/monitor/docker/images/sync",
    { data },
  );
}

// ========= 3. Docker 容器管理 API =========

export function getContainerPageList(params: PageParams<SystemSoftContainer>) {
  return http.request<
    ReturnResult<{ records: SystemSoftContainer[]; total: number }>
  >("get", "/api/monitor/docker/containers/page", {
    params: normalizePageRequestParams(params, "containerName"),
  })
    .then((result) => mapPageResult(result, normalizeContainer));
}

// 统一使用 list 接口按条件查询
export function getContainersByServerId(serverId: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>(
    "get",
    "/api/monitor/docker/containers/list",
    { params: { serverId } },
  ).then((result) => mapArrayResult(result, normalizeContainer));
}

export function getContainerById(id: number) {
  return http.request<ReturnResult<SystemSoftContainer>>(
    "get",
    `/api/monitor/docker/containers/${id}`,
  ).then((result) => mapEntityResult(result, normalizeContainer));
}

// 按后端定义：新增/更新均走实体对象（此处保留占位，调用方应传递完整实体）
export function createContainer(data: SystemSoftContainer) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "/api/monitor/docker/containers",
    { data },
  );
}

export function startContainer(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/docker/containers/${id}/start`,
  );
}
export function stopContainer(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/docker/containers/${id}/stop`,
  );
}
export function restartContainer(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/docker/containers/${id}/restart`,
  );
}

export function deleteContainer(id: number, force?: boolean) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/api/monitor/docker/containers/${id}/container`,
    { params: { force } },
  );
}

export function updateContainer(data: SystemSoftContainer) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "/api/monitor/docker/containers",
    { data },
  );
}

export function getContainerLogs(id: number, lines?: number) {
  return http.request<ReturnResult<string>>(
    "get",
    `/api/monitor/docker/containers/${id}/logs`,
    { params: { lines } },
  );
}

// 启动容器日志实时推送（通过全局 Socket 的 CONTAINER_LOG topic 接收）
export function startContainerLog(id: number, lines?: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/docker/containers/${id}/logs/start`,
    { params: { lines } },
  );
}

// 停止容器日志实时推送
export function stopContainerLog(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/docker/containers/${id}/logs/stop`,
  );
}

// 在容器中执行命令
export function execContainerCommand(id: number, command: string) {
  return http.request<ReturnResult<string>>(
    "post",
    `/api/monitor/docker/containers/${id}/exec`,
    { params: { command } },
  );
}

// 批量操作容器
export function batchOperateContainers(data: any) {
  return http.request<
    ReturnResult<{ total: number; success: number; failed: number }>
  >("post", "/api/monitor/docker/containers/batch", { data });
}

export function getContainerStats(id: number) {
  return http.request<ReturnResult<ContainerStats>>(
    "get",
    `/api/monitor/docker/containers/${id}/stats`,
  );
}

// 获取容器总体统计
export function getContainerOverviewStats() {
  return http.request<
    ReturnResult<{
      total: number;
      running: number;
      stopped: number;
      error: number;
    }>
  >("get", "/api/monitor/docker/containers/overview-stats");
}

// 获取容器状态统计（兼容旧用法）
export function getContainerStatusStats() {
  return http.request<ReturnResult<ContainerStatusStatistics>>(
    "get",
    "/api/monitor/docker/containers/overview-stats",
  );
}

// 同步容器状态（后端为 GET /sync?serverId=）
export function syncContainerStatus(serverId?: number) {
  return http.request<ReturnResult<number>>(
    "get",
    "/api/monitor/docker/containers/sync",
    { params: { serverId } },
  );
}

// ========= 6. 服务器相关API =========

/**
 * 服务器信息接口（适配后端字段）
 */
export interface ServerInfo {
  monitorSysGenServerId: number;
  monitorSysGenServerName: string;
  monitorSysGenServerHost: string;
  monitorSysGenServerPort: number;
  monitorSysGenServerStatus?: number;
}

/**
 * 获取服务器列表
 *
 * @returns 服务器列表
 */
export function getServerList() {
  return http
    .request<ReturnResult<ServerInfo[]>>("get", "v1/gen/server/list")
    .then((result) => mapArrayResult(result, normalizeServer));
}

// ========= API对象导出 =========

export const registryApi = {
  getAllRegistries,
  getRegistryList: getAllRegistries,
};

export const imageApi = {
  getImagePageList,
  getImagesByServerId,
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
  getContainersByServerId,
  getContainerById,
  createContainer,
  startContainer,
  stopContainer,
  restartContainer,
  deleteContainer,
  updateContainer,
  getContainerLogs,
  startContainerLog,
  stopContainerLog,
  execContainerCommand,
  getContainerStats,
  getContainerOverviewStats,
  getContainerStatusStats,
  syncContainerStatus,
  batchOperateContainers,
};

export const dockerManagementApi = {
  registry: registryApi,
  image: imageApi,
  container: containerApi,
  getServerList,
};

export default dockerManagementApi;
