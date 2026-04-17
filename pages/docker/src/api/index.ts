import { getConfig } from "@repo/config";
import type { DockerResult, DockerInstallGuideView, DockerServerOption, DockerSyncScheduleUpdateRequest, DockerSyncScheduleView } from "../types";

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
 * 获取首次安装引导说明（用于安装弹框详细说明）。
 */
export const getDockerInstallGuide = () =>
  request<DockerInstallGuideView>("GET", `${dockerBase}/install/guide/first-use`);

