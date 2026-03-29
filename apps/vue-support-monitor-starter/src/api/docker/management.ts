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

// 软件仓库管理（对齐后端字段命名）
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

const isSuccessCode = (code: unknown) =>
  code === SUCCESS_CODE || code === 0 || code === "0";

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

const normalizeRecordStatus = (status: unknown) => {
  if (typeof status === "string" && status.trim()) {
    return status;
  }

  const numeric = Number(status);
  if (Number.isNaN(numeric)) {
    return status;
  }

  if (numeric > 0) {
    return "SUCCESS";
  }

  if (numeric === 0) {
    return "INSTALLING";
  }

  return "FAILED";
};

const normalizeRecord = (record: SystemSoftRecord) => ({
  ...record,
  recordId:
    (record as any)?.recordId ??
    ((record as any)?.systemSoftRecordId !== undefined &&
    (record as any)?.systemSoftRecordId !== null
      ? String((record as any).systemSoftRecordId)
      : undefined),
  serverId: (record as any)?.serverId ?? record?.systemServerId,
  installMethod:
    (record as any)?.installMethod ?? record?.systemSoftRecordMethod,
  installParams:
    (record as any)?.installParams ?? record?.systemSoftRecordParams,
  startTime:
    (record as any)?.startTime ?? record?.systemSoftRecordStartTime,
  endTime: (record as any)?.endTime ?? record?.systemSoftRecordEndTime,
  duration:
    (record as any)?.duration ?? record?.systemSoftRecordDuration,
  errorMessage:
    (record as any)?.errorMessage ?? record?.systemSoftRecordErrorMessage,
  result: (record as any)?.result ?? record?.systemSoftRecordResult,
  status: normalizeRecordStatus(
    (record as any)?.status ?? record?.systemSoftRecordStatus,
  ),
});

const DEFAULT_WEB_SOCKET_TOPICS = {
  containerStatus: "monitor:docker:container_status",
  containerLogs: "monitor:docker:container_log",
  containerStatistics: "monitor:docker:container_statistics",
  containerEvents: "monitor:docker:container_events",
} as const;

const createSuccessResult = <T>(data: T, msg = "") =>
  ({
    code: SUCCESS_CODE,
    data,
    msg,
    message: msg,
    success: true,
  }) as ReturnResult<T>;

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

// ========= 1. 软件仓库管理API =========

// 分页查询仓库列表（路径已对齐后端）
export function pageRegistry(params: PageParams<SystemSoftRegistry>) {
  return http.request<
    ReturnResult<{ records: SystemSoftRegistry[]; total: number }>
  >("get", "v1/system/soft/registry/page", { params });
}

// 获取所有仓库列表（不分页）——后端为 GET /v1/system/soft/registry
export function getAllRegistries() {
  return http.request<ReturnResult<SystemSoftRegistry[]>>(
    "get",
    "v1/system/soft/registry",
  ).then((result) => mapArrayResult(result, normalizeRegistry));
}

// 根据ID获取仓库详情
export function getRegistryById(id: number) {
  return http.request<ReturnResult<SystemSoftRegistry>>(
    "get",
    `v1/system/soft/registry/${id}`,
  ).then((result) => mapEntityResult(result, normalizeRegistry));
}

// 创建软件仓库（后端返回实体）
export function createRegistry(
  data: Omit<
    SystemSoftRegistry,
    "createTime" | "updateTime" | "systemSoftRegistryId"
  >,
) {
  return http.request<ReturnResult<SystemSoftRegistry>>(
    "post",
    "v1/system/soft/registry",
    { data },
  ).then((result) => mapEntityResult(result, normalizeRegistry));
}

// 更新软件仓库（后端返回实体）
export function updateRegistry(id: number, data: Partial<SystemSoftRegistry>) {
  return http.request<ReturnResult<SystemSoftRegistry>>(
    "put",
    `v1/system/soft/registry/${id}`,
    { data },
  ).then((result) => mapEntityResult(result, normalizeRegistry));
}

// 删除软件仓库
export function deleteRegistry(id: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/system/soft/registry/${id}`,
  );
}

// 批量删除仓库（后端接收原始数组）
export function batchDeleteRegistries(ids: number[]) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/system/soft/registry/batch",
    { data: ids },
  );
}

// 测试仓库连接（后端为 POST /{id}/test）
export function testRegistryConnection(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/system/soft/registry/${id}/test`,
  );
}

// 同步单个仓库
export function syncRegistry(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/system/soft/registry/${id}/sync`,
  );
}

// 激活仓库
export function activateRegistry(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/system/soft/registry/${id}/activate`,
  );
}

// 取消激活仓库
export function deactivateRegistry(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/system/soft/registry/${id}/deactivate`,
  );
}

// 获取激活的仓库列表
export function getActiveRegistries() {
  return http.request<ReturnResult<SystemSoftRegistry[]>>(
    "get",
    "v1/system/soft/registry/active",
  );
}

// ========= 2. 软件管理API =========

// 分页查询软件列表（已存在 v1 兼容控制器）
export function getSoftPageList(params: PageParams<SystemSoft>) {
  return http.request<ReturnResult<{ records: SystemSoft[]; total: number }>>(
    "get",
    "v1/system/soft/page",
    { params },
  );
}

// 其余软件 API 维持不变（待核对后端对应控制器）
export function getSoftById(id: number) {
  return http.request<ReturnResult<SystemSoft>>("get", `v1/system/soft/${id}`);
}
export function createSoft(
  data: Omit<SystemSoft, "systemSoftId" | "createTime" | "updateTime">,
) {
  return http.request<ReturnResult<boolean>>("post", "v1/system/soft", {
    data,
  });
}
export function updateSoft(id: number, data: Partial<SystemSoft>) {
  return http.request<ReturnResult<boolean>>("put", `v1/system/soft/${id}`, {
    data,
  });
}
export function deleteSoft(id: number) {
  return http.request<ReturnResult<boolean>>("delete", `v1/system/soft/${id}`);
}
export function syncSoftware(registryId?: number) {
  return http.request<ReturnResult<{ operationId: string }>>(
    "post",
    "v1/system/soft/sync",
    { data: { registryId } },
  );
}
export type InstallPort = {
  host: string;
  container: string;
  protocol?: string;
};
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
  return http.request<ReturnResult<{ operationId: string }>>(
    "post",
    "v1/system/soft/install",
    { data },
  );
}
export function getSoftwareStats() {
  return http.request<
    ReturnResult<{
      totalSoftware: number;
      enabledSoftware: number;
      disabledSoftware: number;
      officialSoftware: number;
      categoryCounts: Record<string, number>;
    }>
  >("get", "v1/system/soft/stats");
}

// ========= 3. 软件镜像管理API（路径对齐后端 /api/monitor/system-soft-image） =========

export function getImagePageList(params: PageParams<SystemSoftImage>) {
  return http.request<
    ReturnResult<{ records: SystemSoftImage[]; total: number }>
  >("get", "/api/monitor/system-soft-image/page", {
    params: normalizePageRequestParams(params, "imageName"),
  })
    .then((result) => mapPageResult(result, normalizeImage));
}

// 使用统一 list 接口按条件查询（serverId/softId）
export function getImagesByServerId(serverId: number) {
  return http.request<ReturnResult<SystemSoftImage[]>>(
    "get",
    "/api/monitor/system-soft-image/list",
    { params: { serverId } },
  ).then((result) => mapArrayResult(result, normalizeImage));
}
export function getImagesBySoftId(softId: number) {
  return http.request<ReturnResult<SystemSoftImage[]>>(
    "get",
    "/api/monitor/system-soft-image/list",
    { params: { softId } },
  ).then((result) => mapArrayResult(result, normalizeImage));
}

export function getImageById(id: number) {
  return http.request<ReturnResult<SystemSoftImage>>(
    "get",
    `/api/monitor/system-soft-image/${id}`,
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
    "/api/monitor/system-soft-image/pull",
    {
      params: { softId: softId ?? 0, serverId, imageTag: resolvedImageTag },
      data: requestData,
    },
  ).then((result) => mapEntityResult(result, normalizeImage));
}

export function deleteImage(id: number, force?: boolean) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/api/monitor/system-soft-image/${id}/image`,
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
    `/api/monitor/system-soft-image/${imageId}/start`,
    { data: normalizeImageContainerStartConfig(config || {}) },
  );
}

// 同步镜像状态（后端暂未提供，保留占位或改为 list 触发刷新）
export function syncImageStatus(serverId?: number) {
  return http.request<ReturnResult<number>>(
    "get",
    "/api/monitor/system-soft-image/page",
    { params: { serverId } },
  );
}

// 导出镜像
export function exportImage(data: { imageId: number; serverId: number }) {
  return http.request<ReturnResult<{ operationId: string; filePath: string }>>(
    "post",
    "/api/monitor/system-soft-image/export",
    { data },
  );
}

// 导入镜像
export function importImage(formData: FormData) {
  return http.request<ReturnResult<{ operationId: string }>>(
    "post",
    "/api/monitor/system-soft-image/import",
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
    "/api/monitor/system-soft-image/sync",
    { data },
  );
}

// ========= 4. 软件容器管理API（路径对齐后端 /api/monitor/system-soft-container） =========

export function getContainerPageList(params: PageParams<SystemSoftContainer>) {
  return http.request<
    ReturnResult<{ records: SystemSoftContainer[]; total: number }>
  >("get", "/api/monitor/system-soft-container/page", {
    params: normalizePageRequestParams(params, "containerName"),
  })
    .then((result) => mapPageResult(result, normalizeContainer));
}

// 统一使用 list 接口按条件查询
export function getContainersBySoftId(softId: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>(
    "get",
    "/api/monitor/system-soft-container/list",
    { params: { softId } },
  ).then((result) => mapArrayResult(result, normalizeContainer));
}
export function getContainersByServerId(serverId: number) {
  return http.request<ReturnResult<SystemSoftContainer[]>>(
    "get",
    "/api/monitor/system-soft-container/list",
    { params: { serverId } },
  ).then((result) => mapArrayResult(result, normalizeContainer));
}

export function getContainerById(id: number) {
  return http.request<ReturnResult<SystemSoftContainer>>(
    "get",
    `/api/monitor/system-soft-container/${id}`,
  ).then((result) => mapEntityResult(result, normalizeContainer));
}

// 按后端定义：新增/更新均走实体对象（此处保留占位，调用方应传递完整实体）
export function createContainer(data: SystemSoftContainer) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "/api/monitor/system-soft-container",
    { data },
  );
}

export function startContainer(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/system-soft-container/${id}/start`,
  );
}
export function stopContainer(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/system-soft-container/${id}/stop`,
  );
}
export function restartContainer(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/system-soft-container/${id}/restart`,
  );
}

export function deleteContainer(id: number, force?: boolean) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/api/monitor/system-soft-container/${id}/container`,
    { params: { force } },
  );
}

export function updateContainer(data: SystemSoftContainer) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "/api/monitor/system-soft-container",
    { data },
  );
}

export function getContainerLogs(id: number, lines?: number) {
  return http.request<ReturnResult<string>>(
    "get",
    `/api/monitor/system-soft-container/${id}/logs`,
    { params: { lines } },
  );
}

// 启动容器日志实时推送（通过全局 Socket 的 CONTAINER_LOG topic 接收）
export function startContainerLog(id: number, lines?: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/system-soft-container/${id}/logs/start`,
    { params: { lines } },
  );
}

// 停止容器日志实时推送
export function stopContainerLog(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/api/monitor/system-soft-container/${id}/logs/stop`,
  );
}

// 在容器中执行命令
export function execContainerCommand(id: number, command: string) {
  return http.request<ReturnResult<string>>(
    "post",
    `/api/monitor/system-soft-container/${id}/exec`,
    { params: { command } },
  );
}

// 批量操作容器
export function batchOperateContainers(data: any) {
  return http.request<
    ReturnResult<{ total: number; success: number; failed: number }>
  >("post", "/api/monitor/system-soft-container/batch", { data });
}

export function getContainerStats(id: number) {
  return http.request<ReturnResult<ContainerStats>>(
    "get",
    `/api/monitor/system-soft-container/${id}/stats`,
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
  >("get", "/api/monitor/system-soft-container/overview-stats");
}

// 获取容器状态统计（兼容旧用法）
export function getContainerStatusStats() {
  return http.request<ReturnResult<ContainerStatusStatistics>>(
    "get",
    "/api/monitor/system-soft-container/overview-stats",
  );
}

// 同步容器状态（后端为 GET /sync?serverId=）
export function syncContainerStatus(serverId?: number) {
  return http.request<ReturnResult<number>>(
    "get",
    "/api/monitor/system-soft-container/sync",
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

export function getWebSocketTopics() {
  return http.request<
    ReturnResult<{
      containerStatus: string;
      containerLogs: string;
      containerStatistics: string;
      containerEvents: string;
    }>
  >("get", "v1/system/soft/websocket/topics")
    .then((result) => {
      if (isSuccessCode(result?.code) && result?.data) {
        return withMessage({
          ...result,
          data: {
            ...DEFAULT_WEB_SOCKET_TOPICS,
            ...result.data,
          },
        } as ReturnResult<typeof DEFAULT_WEB_SOCKET_TOPICS>);
      }

      return createSuccessResult(DEFAULT_WEB_SOCKET_TOPICS);
    })
    .catch(() => createSuccessResult(DEFAULT_WEB_SOCKET_TOPICS));
}

// ========= API对象导出 =========

// 获取默认仓库
export function getDefaultRegistry(serverId?: number) {
  return http.request<ReturnResult<SystemSoftRegistry>>(
    "get",
    "v1/system/soft/registry/default",
    { params: { serverId } },
  ).then((result) => mapEntityResult(result, normalizeRegistry));
}

// 设置默认仓库
export function setDefaultRegistry(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/system/soft/registry/${id}/default`,
  );
}

// 获取启用的仓库列表
export function getEnabledRegistries() {
  return http.request<ReturnResult<SystemSoftRegistry[]>>(
    "get",
    "v1/system/soft/registry/enabled",
  ).then((result) => mapArrayResult(result, normalizeRegistry));
}

// 根据类型获取仓库列表
export function getRegistriesByType(type: string) {
  return http.request<ReturnResult<SystemSoftRegistry[]>>(
    "get",
    `v1/system/soft/registry/type/${type}`,
  ).then((result) => mapArrayResult(result, normalizeRegistry));
}

// 批量更新仓库状态
export function batchUpdateRegistryStatus(ids: number[], status: number) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "v1/system/soft/registry/batch/status",
    { params: { ids, status } },
  );
}

export const registryApi = {
  pageRegistry,
  getAllRegistries,
  getRegistryList: getAllRegistries,
  getRegistryById,
  createRegistry,
  updateRegistry,
  deleteRegistry,
  batchDeleteRegistries,
  testRegistryConnection,
  syncRegistry,
  activateRegistry,
  deactivateRegistry,
  getActiveRegistries,
  getDefaultRegistry,
  setDefaultRegistry,
  getEnabledRegistries,
  getRegistriesByType,
  batchUpdateRegistryStatus,
};

// ========= 2.1 在线搜索（检索激活的仓库，后端SPI实现） =========
export function searchOnlineSoftware(params: {
  keyword: string;
  page?: number;
  size?: number;
}) {
  const kw = (params?.keyword || "").trim();
  if (!kw) {
    // 前端直接返回空结果，避免不必要的网络请求
    return Promise.resolve({
      code: "00000",
      data: { records: [], total: 0 },
      msg: "",
    } as unknown as ReturnResult<{ records: SystemSoft[]; total: number }>);
  }
  return http
    .request<
      ReturnResult<{ records: SystemSoft[]; total: number }>
    >("get", "v1/system/soft/online/search", { params: { ...params, keyword: kw } })
    .catch(
      () =>
        ({
          code: "00000",
          data: { records: [], total: 0 },
          msg: "",
        }) as unknown as ReturnResult<{ records: SystemSoft[]; total: number }>,
    );
}

// 将在线检索结果导入到软件库（异步保存，接口占位）
export function importOnlineSoftware(data: {
  items: Array<Partial<SystemSoft> & { systemSoftDockerImage?: string }>;
}) {
  return http.request<ReturnResult<{ queued: number }>>(
    "post",
    "v1/system/soft/online/import",
    { data: data.items },
  );
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
  getSoftwareVersions: async (softId: number) => {
    const result = await getImagesBySoftId(softId);
    if (!isSuccessCode(result?.code)) {
      return result as ReturnResult<any[]>;
    }

    return createSuccessResult(
      (result.data || []).map((item) => ({
        imageId: item.systemSoftImageId,
        tag: item.systemSoftImageTag || "latest",
        size: item.systemSoftImageSize,
        created: item.systemSoftImageCreated,
        architecture: item.systemSoftImageArchitecture,
        fullImageName: item.systemSoftImageFullName,
      })),
    );
  },
  syncSoftwareFromRegistry: (params?: { registryIds?: number[] }) =>
    syncSoftware(params?.registryIds?.[0]),
  syncImages,
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
  startContainerLog,
  stopContainerLog,
  execContainerCommand,
  getContainerStats,
  getContainerOverviewStats,
  getContainerStatusStats,
  syncContainerStatus,
  batchOperateContainers,
};

// ========= 7. 软件操作记录 =========
export interface SystemSoftRecord {
  systemSoftRecordId: number;
  systemSoftId?: number;
  systemServerId?: number;
  systemSoftRecordOperationType?: string;
  systemSoftRecordMethod?: string;
  systemSoftRecordMessage?: string;
  systemSoftRecordParams?: string;
  systemSoftRecordTime?: string;
  systemSoftRecordStatus?: number;
  systemSoftRecordUser?: string;
  systemSoftRecordContainerId?: string;
  systemSoftRecordStartTime?: string;
  systemSoftRecordEndTime?: string;
  systemSoftRecordDuration?: number;
  systemSoftRecordErrorMessage?: string;
  systemSoftRecordResult?: string;
}

export function getSoftRecordPage(params: {
  current?: number;
  size?: number;
  softId?: number;
  serverId?: number;
  operationType?: string;
  operationStatus?: number;
  operationUser?: string;
}) {
  return http.request<
    ReturnResult<{ records: SystemSoftRecord[]; total: number }>
  >("get", "/api/system/soft/record/page", { params })
    .then((result) => mapPageResult(result, normalizeRecord));
}

export const softRecordApi = {
  getSoftRecordPage,
};

export const dockerManagementApi = {
  registry: registryApi,
  software: softwareApi,
  image: imageApi,
  container: containerApi,
  getServerList,
};

export default dockerManagementApi;
