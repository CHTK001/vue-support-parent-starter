import { getConfig } from "@repo/config";
import type {
  DockerContainerConfigUpdateRequest,
  DockerContainerConfigUpdateResult,
  DockerContainerExecRequest,
  DockerContainerView,
  DockerImageExportRequest,
  DockerImageImportRequest,
  DockerImagePullRequest,
  DockerImageView,
  DockerResult,
  DockerInstallGuideView,
  DockerInstallRequest,
  DockerInstallTaskDetail,
  DockerInstallTaskTicket,
  DockerMount,
  DockerNetwork,
  DockerOperationTicket,
  DockerRegistry,
  DockerServerOption,
  DockerSyncScheduleUpdateRequest,
  DockerSyncResult,
  DockerSyncRunRequest,
  DockerSyncScheduleView,
} from "../types";

/**
 * Docker API 基础路径。
 */
const dockerBase = "/docker";

const appendQuery = (path: string, query?: Record<string, unknown>) => {
  const search = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.set(key, String(value));
  });
  const version = getConfig("apiVersion");
  if (version) {
    search.set("version", String(version));
  }
  const text = search.toString();
  return text ? `${path}?${text}` : path;
};

const resolveBaseUrl = () =>
  String(getConfig("ApiAddress") || getConfig("BaseUrl") || "");

const buildUrl = (path: string, query?: Record<string, unknown>) => {
  const target = appendQuery(path, query);
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    return target;
  }
  return `${baseUrl.replace(/\/$/, "")}${target}`;
};

const request = async <T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options?: {
    query?: Record<string, unknown>;
    data?: unknown;
  },
): Promise<DockerResult<T>> => {
  const response = await fetch(buildUrl(path, options?.query), {
    method,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: options?.data === undefined ? undefined : JSON.stringify(options.data),
  });
  const payload = await response.json().catch(() => ({}));
  const envelope = payload as Record<string, unknown>;
  const result: DockerResult<T> = {
    code: (envelope.code as string | number) ?? "00000",
    msg: String(envelope.msg ?? envelope.message ?? response.statusText ?? ""),
    message: String(envelope.message ?? envelope.msg ?? response.statusText ?? ""),
    success: envelope.success === undefined ? response.ok : Boolean(envelope.success),
    data: (envelope.data as T) ?? ({} as T),
  };
  if (!response.ok || result.success === false) {
    throw result;
  }
  return result;
};

/**
 * 查询 Docker 服务器选择项（来源：server-starter 后端聚合接口）。
 */
export const listDockerServerOptions = (params?: {
  keyword?: string;
  enabled?: boolean;
}) =>
  request<DockerServerOption[]>("GET", `${dockerBase}/servers/options`, {
    query: params,
  });

/**
 * 查询 Docker 同步任务调度配置。
 */
export const getDockerSyncSchedule = (scope: "images" | "containers" | string) =>
  request<DockerSyncScheduleView>("GET", `${dockerBase}/sync/schedules/${scope}`);

/**
 * 更新 Docker 同步任务调度配置（基于 job-starter）。
 */
export const updateDockerSyncSchedule = (
  scope: "images" | "containers" | string,
  data: DockerSyncScheduleUpdateRequest,
) =>
  request<DockerSyncScheduleView>("PUT", `${dockerBase}/sync/schedules/${scope}`, {
    data,
  });

/**
 * 手动触发镜像/容器同步。
 */
export const runDockerSync = (
  scope: "images" | "containers" | string,
  data?: DockerSyncRunRequest,
) =>
  request<DockerSyncResult>("POST", `${dockerBase}/sync/run/${scope}`, { data });

/**
 * 获取首次安装引导说明（用于安装弹框详细说明）。
 */
export const getDockerInstallGuide = () =>
  request<DockerInstallGuideView>("GET", `${dockerBase}/install/guide/first-use`);

/**
 * 查询仓库列表。
 */
export const listDockerRegistries = (params?: {
  keyword?: string;
  enabled?: boolean;
}) =>
  request<DockerRegistry[]>("GET", `${dockerBase}/registries`, {
    query: params,
  });

/**
 * 新增仓库。
 */
export const createDockerRegistry = (data: DockerRegistry) =>
  request<DockerRegistry>("POST", `${dockerBase}/registries`, { data });

/**
 * 更新仓库。
 */
export const updateDockerRegistry = (id: number, data: DockerRegistry) =>
  request<DockerRegistry>("PUT", `${dockerBase}/registries/${id}`, { data });

/**
 * 删除仓库。
 */
export const deleteDockerRegistry = (id: number) =>
  request<boolean>("DELETE", `${dockerBase}/registries/${id}`);

/**
 * 查询挂载列表。
 */
export const listDockerMounts = (params?: {
  serverId?: number;
  keyword?: string;
  enabled?: boolean;
}) =>
  request<DockerMount[]>("GET", `${dockerBase}/mounts`, {
    query: params,
  });

/**
 * 新增挂载。
 */
export const createDockerMount = (data: DockerMount) =>
  request<DockerMount>("POST", `${dockerBase}/mounts`, { data });

/**
 * 更新挂载。
 */
export const updateDockerMount = (id: number, data: DockerMount) =>
  request<DockerMount>("PUT", `${dockerBase}/mounts/${id}`, { data });

/**
 * 删除挂载。
 */
export const deleteDockerMount = (id: number) =>
  request<boolean>("DELETE", `${dockerBase}/mounts/${id}`);

/**
 * 查询网络列表。
 */
export const listDockerNetworks = (params?: {
  serverId?: number;
  keyword?: string;
  enabled?: boolean;
}) =>
  request<DockerNetwork[]>("GET", `${dockerBase}/networks`, {
    query: params,
  });

/**
 * 新增网络。
 */
export const createDockerNetwork = (data: DockerNetwork) =>
  request<DockerNetwork>("POST", `${dockerBase}/networks`, { data });

/**
 * 更新网络。
 */
export const updateDockerNetwork = (id: number, data: DockerNetwork) =>
  request<DockerNetwork>("PUT", `${dockerBase}/networks/${id}`, { data });

/**
 * 删除网络。
 */
export const deleteDockerNetwork = (id: number) =>
  request<boolean>("DELETE", `${dockerBase}/networks/${id}`);

/**
 * 创建安装任务（支持 Dockerfile）。
 */
export const createDockerInstallation = (data: DockerInstallRequest) =>
  request<DockerInstallTaskTicket>("POST", `${dockerBase}/installations`, { data });

/**
 * 查询安装任务详情。
 */
export const getDockerInstallation = (taskId: string) =>
  request<DockerInstallTaskDetail>("GET", `${dockerBase}/installations/${taskId}`);

/**
 * 查询容器列表。
 */
export const listDockerContainers = (params?: {
  serverId?: number;
  registryId?: number;
  keyword?: string;
}) =>
  request<DockerContainerView[]>("GET", `${dockerBase}/containers`, {
    query: params,
  });

/**
 * 进入容器执行命令。
 */
export const execDockerContainer = (
  containerId: string,
  data: DockerContainerExecRequest,
) =>
  request<DockerOperationTicket>("POST", `${dockerBase}/containers/${containerId}/exec`, { data });

/**
 * 更新容器配置。
 */
export const updateDockerContainerConfig = (
  containerId: string,
  data: DockerContainerConfigUpdateRequest,
) =>
  request<DockerContainerConfigUpdateResult>(
    "PUT",
    `${dockerBase}/containers/${containerId}/config`,
    { data },
  );

/**
 * 查询镜像列表。
 */
export const listDockerImages = (params?: {
  serverId?: number;
  registryId?: number;
  keyword?: string;
}) =>
  request<DockerImageView[]>("GET", `${dockerBase}/images`, {
    query: params,
  });

/**
 * 拉取镜像。
 */
export const pullDockerImage = (data: DockerImagePullRequest) =>
  request<DockerOperationTicket>("POST", `${dockerBase}/images/pull`, { data });

/**
 * 导入镜像。
 */
export const importDockerImage = (data: DockerImageImportRequest) =>
  request<DockerOperationTicket>("POST", `${dockerBase}/images/import`, { data });

/**
 * 导出镜像。
 */
export const exportDockerImage = (data: DockerImageExportRequest) =>
  request<DockerOperationTicket>("POST", `${dockerBase}/images/export`, { data });
