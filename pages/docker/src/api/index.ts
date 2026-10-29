/**
 * Docker 模块 API（@pages/docker）
 *
 * <p>统一前缀 {@code /ms/server/docker}：主机维度接口带 {@code {hostId}}，
 * 镜像库 / 模板为全局配置（无 hostId）。契约见仓库根 {@code docker-module-spec.md}。</p>
 *
 * <p>所有长耗时动作（安装容器、卸载容器/镜像、下载镜像、实时日志、交互终端）
 * 都由后端以 SSE 回显，本文件把「URL 拼装」与「SSE 客户端」收在一处，
 * 页面组件不再各写一份路径。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { http, unwrapResult } from "@repo/utils";
import type { SseClient } from "@repo/utils";

/** 统一前缀 */
const B = "/ms/server/docker";

/** 主机精简信息（来自 /ms/server/host，避免依赖 @pages/server 包） */
export interface DockerHost {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostOsType?: string;
}

/** 能力探测结果 */
export interface DockerCapability {
  installed: boolean;
  version?: string;
  compose?: boolean;
  runtime?: string;
}

/** 容器清单条目 */
export interface DockerContainer {
  id: string;
  shortId?: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports?: string;
  network?: string;
  runningFor?: string;
  createdAt?: string;
}

/** 容器端口映射 */
export interface DockerContainerPort {
  hostIp?: string;
  host?: string | number;
  container?: string | number;
  protocol?: string;
}

/** 容器网络接入点 */
export interface DockerContainerNetwork {
  name?: string;
  ipAddress?: string;
}

/** 容器挂载 */
export interface DockerContainerMount {
  type?: string;
  source?: string;
  destination?: string;
  rw?: boolean;
}

/** 容器详情 */
export interface DockerContainerDetail {
  id?: string;
  name?: string;
  image?: string;
  created?: string;
  state?: {
    status?: string;
    pid?: number | string;
    health?: string;
    startedAt?: string;
    exitCode?: number | string;
    error?: string;
  };
  restartCount?: number;
  entrypoint?: string[];
  cmd?: string[];
  workingDir?: string;
  logPath?: string;
  networkMode?: string;
  restartPolicy?: string;
  autoRemove?: boolean;
  ports?: DockerContainerPort[];
  networks?: DockerContainerNetwork[];
  env?: string[];
  mounts?: DockerContainerMount[];
  labels?: Record<string, string>;
}

/** 镜像 */
export interface DockerImage {
  id: string;
  repository?: string;
  name?: string;
  tag?: string;
  size?: string | number;
  created?: string;
  digest?: string;
}

/** 网络 */
export interface DockerNetwork {
  id?: string;
  name?: string;
  driver?: string;
  scope?: string;
}

/** 卷 */
export interface DockerVolume {
  name: string;
  driver?: string;
  mountpoint?: string;
}

/** 镜像库配置（密码只由后端返回 hasPassword） */
export interface DockerRegistry {
  id?: string;
  name: string;
  type: string;
  url?: string;
  username?: string;
  /** 仅提交时携带；读取时后端只回 hasPassword */
  password?: string;
  namespace?: string;
  enabled?: boolean;
  builtin?: boolean;
  hasPassword?: boolean;
}

/** 镜像库类型（SPI 可扩展；后端 /registries/types 不可用时的内置清单） */
export interface DockerRegistryType {
  type: string;
  label: string;
}

/** 在线镜像检索结果 */
export interface DockerImageSearchItem {
  registryId: string;
  registryName: string;
  name: string;
  description?: string;
  stars?: number;
  official?: boolean;
  pullRef: string;
}

/** 容器模板（保存的 docker run 配置） */
export interface DockerTemplate {
  id?: string;
  /** 模板名称（列表展示用） */
  name: string;
  /** 镜像引用 */
  image: string;
  /** 容器名称 */
  containerName?: string;
  ports?: string[];
  env?: string[];
  volumes?: string[];
  network?: string;
  restartPolicy?: string;
  command?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 安装容器请求体 */
export interface DockerRunRequest {
  image: string;
  name?: string;
  command?: string;
  ports?: string[];
  env?: string[];
  volumes?: string[];
  network?: string;
  restartPolicy?: string;
  pull?: boolean;
  /** 镜像库 id：后端据此解析 pullRef 并在会话内 docker login */
  registryId?: string;
  /** 模板 id：未传的字段由后端按模板补齐 */
  templateId?: string;
}

/** SSE 事件回调 */
export interface DockerSseHandlers {
  /** 事件名（step / log / error / done / session / output / closed / message）+ 原始文本 */
  onEvent?: (event: string, data: string) => void;
  onError?: (err: unknown) => void;
  onClose?: () => void;
}

/**
 * 打开 Docker 模块的 SSE 通道。
 *
 * <p>统一 {@code parseData: raw => raw}：后端事件体是纯文本（docker CLI 输出），
 * 不做 JSON 解析；{@code reconnect:false} 由页面自己决定是否重连，
 * 避免日志 / 终端在断开后被静默重放。</p>
 *
 * @param url      完整路径（含前缀）
 * @param init     请求方法 / 请求体
 * @param handlers 事件回调
 * @returns SSE 客户端（调用 close 终止）
 */
export function openDockerSse(
  url: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
  handlers: DockerSseHandlers = {},
): SseClient {
  return http().createSse(url, {
    method: init.method ?? "POST",
    body: init.body,
    reconnect: false,
    parseData: (raw) => raw,
    onMessage: (e) => handlers.onEvent?.(String(e.event || "message"), String(e.data ?? "")),
    onError: (err) => handlers.onError?.(err),
    onClose: () => handlers.onClose?.(),
  });
}

/* ==================== 主机 ==================== */

/** 主机台账（页面顶部主机选择） */
export const listHosts = () =>
  http().get("/ms/server/host").query({}).then((r) => unwrapResult<DockerHost[]>(r));

/* ==================== 容器 ==================== */

/** 能力探测 */
export const dockerCapability = (hostId: number) =>
  http().get(`${B}/${hostId}/capability`).then((r) => unwrapResult<DockerCapability>(r));

/** 容器清单 */
export const listContainers = (hostId: number, all = true) =>
  http().get(`${B}/${hostId}/containers`).query({ all }).then((r) => unwrapResult<DockerContainer[]>(r));

/** 容器详情 */
export const getContainer = (hostId: number, containerId: string) =>
  http().get(`${B}/${hostId}/containers/${encodeURIComponent(containerId)}`).then((r) => unwrapResult<DockerContainerDetail>(r));

/** 容器启停（start / stop / restart / pause / unpause / kill） */
export const containerAction = (hostId: number, containerId: string, action: string) =>
  http()
    .post(`${B}/${hostId}/containers/${encodeURIComponent(containerId)}/${action}`)
    .then((r) => unwrapResult<boolean>(r));

/** 删除容器（同步版，程序调用保留；页面用 SSE 版） */
export const removeContainer = (hostId: number, containerId: string, force = false) =>
  http()
    .delete(`${B}/${hostId}/containers/${encodeURIComponent(containerId)}`)
    .query({ force })
    .then((r) => unwrapResult<boolean>(r));

/** 卸载容器 SSE 地址（事件 step|log|error|done） */
export const removeContainerStreamUrl = (hostId: number, containerId: string, force = true) =>
  `${B}/${hostId}/containers/${encodeURIComponent(containerId)}/remove-stream?force=${force}`;

/** 安装容器 SSE 地址（事件 step|log|error|done） */
export const runContainerUrl = (hostId: number) => `${B}/${hostId}/containers/run`;

/** 容器静态日志（非流式，调试/导出兜底） */
export const containerLogs = (hostId: number, containerId: string, tail = 200) =>
  http()
    .get(`${B}/${hostId}/containers/${encodeURIComponent(containerId)}/logs`)
    .query({ tail })
    .then((r) => unwrapResult<string>(r));

/** 实时日志 SSE 地址（事件 log|error） */
export const containerLogsStreamUrl = (hostId: number, containerId: string, tail = 300) =>
  `${B}/${hostId}/containers/${encodeURIComponent(containerId)}/logs/stream?tail=${tail}`;

/** 交互终端 SSE 地址（事件 session|output|closed|error） */
export const containerExecUrl = (hostId: number, containerId: string) =>
  `${B}/${hostId}/containers/${encodeURIComponent(containerId)}/exec`;

/** 终端输入 */
export const containerExecInput = (hostId: number, containerId: string, sessionId: string, input: string) =>
  http()
    .post(`${B}/${hostId}/containers/${encodeURIComponent(containerId)}/exec/input`)
    .data({ sessionId, input })
    .then((r) => unwrapResult<void>(r));

/** 关闭终端会话 */
export const containerExecClose = (hostId: number, containerId: string, sessionId: string) =>
  http()
    .post(`${B}/${hostId}/containers/${encodeURIComponent(containerId)}/exec/close`)
    .data({ sessionId })
    .then((r) => unwrapResult<void>(r));

/* ==================== 镜像 / 网络 / 卷 ==================== */

/** 镜像清单 */
export const listImages = (hostId: number) =>
  http().get(`${B}/${hostId}/images`).then((r) => unwrapResult<DockerImage[]>(r));

/** 下载镜像 SSE 地址（事件 step|log|error|done） */
export const pullImageUrl = (hostId: number, image: string, registryId?: string) => {
  const qs = new URLSearchParams({ image });
  if (registryId) qs.set("registryId", registryId);
  return `${B}/${hostId}/images/pull?${qs.toString()}`;
};

/** 删除镜像（同步版，程序调用保留；页面用 SSE 版） */
export const removeImage = (hostId: number, imageId: string, force = false) =>
  http()
    .delete(`${B}/${hostId}/images/${encodeURIComponent(imageId)}`)
    .query({ force })
    .then((r) => unwrapResult<boolean>(r));

/** 卸载镜像 SSE 地址（事件 step|log|error|done） */
export const removeImageStreamUrl = (hostId: number, imageId: string, force = false) =>
  `${B}/${hostId}/images/${encodeURIComponent(imageId)}/remove-stream?force=${force}`;

/** 网络清单 */
export const listNetworks = (hostId: number) =>
  http().get(`${B}/${hostId}/networks`).then((r) => unwrapResult<DockerNetwork[]>(r));

/** 网络创建请求 */
export interface DockerNetworkRequest {
  /** 网络名称 */
  name?: string;
  /** 驱动，默认 bridge */
  driver?: string;
  /** 参数，如 {@code com.docker.network.bridge.name=br-x} */
  options?: string[];
}

/** 创建网络（SSE 实时回显） */
export const createNetwork = (hostId: number, request: DockerNetworkRequest) =>
  http()
    .post(`${B}/${hostId}/networks`)
    .data(request as unknown as Record<string, unknown>)
    .then((r) => unwrapResult<DockerNetwork>(r));

/** 卷清单 */
export const listVolumes = (hostId: number) =>
  http().get(`${B}/${hostId}/volumes`).then((r) => unwrapResult<DockerVolume[]>(r));

/** 清理（悬空镜像 / 停止容器 / 未使用网络与卷） */
export const dockerPrune = (hostId: number) =>
  http().post(`${B}/${hostId}/prune`).then((r) => unwrapResult<Record<string, unknown>>(r));

/* ==================== 镜像库（全局） ==================== */

/** 内置镜像库类型（后端 SPI 未暴露 types 时回落） */
export const BUILTIN_REGISTRY_TYPES: DockerRegistryType[] = [
  { type: "dockerhub", label: "Docker Hub" },
  { type: "generic-v2", label: "Generic V2 Registry" },
];

/** 镜像库类型列表：优先取后端 SPI 暴露的 types，失败回落内置 */
export async function listRegistryTypes(): Promise<DockerRegistryType[]> {
  try {
    const list = await http().get(`${B}/registries/types`).then((r) => unwrapResult<Array<Record<string, unknown>>>(r));
    const types = (Array.isArray(list) ? list : [])
      .map((it) => ({
        type: String(it.type ?? it.value ?? ""),
        label: String(it.label ?? it.displayName ?? it.type ?? it.value ?? ""),
      }))
      .filter((it) => it.type);
    return types.length ? types : BUILTIN_REGISTRY_TYPES;
  } catch {
    return BUILTIN_REGISTRY_TYPES;
  }
}

/** 镜像库列表 */
export const listRegistries = () =>
  http().get(`${B}/registries`).then((r) => unwrapResult<DockerRegistry[]>(r));

/** 新增 / 更新镜像库（id 为空表示新增） */
export const saveRegistry = (registry: DockerRegistry) =>
  http()
    .post(`${B}/registries`)
    .data(registry as unknown as Record<string, unknown>)
    .then((r) => unwrapResult<DockerRegistry>(r));

/** 删除镜像库（内置库后端拒绝） */
export const deleteRegistry = (id: string) =>
  http().delete(`${B}/registries/${encodeURIComponent(id)}`).then((r) => unwrapResult<boolean>(r));

/** 测试镜像库连接 */
export const testRegistry = (id: string) =>
  http()
    .post(`${B}/registries/${encodeURIComponent(id)}/test`)
    .then((r) => unwrapResult<{ ok: boolean; message: string }>(r));

/** 在线镜像检索（registryId 为空时后端并发检索全部启用库） */
export const searchImages = (keyword: string, registryId?: string) => {
  const qs = new URLSearchParams({ keyword });
  if (registryId) qs.set("registryId", registryId);
  return http()
    .get(`${B}/images/search?${qs.toString()}`)
    .timeout(30000)
    .then((r) => unwrapResult<DockerImageSearchItem[]>(r));
};

/** 镜像标签列表 */
export const listRegistryTags = (registryId: string, image: string) =>
  http()
    .get(`${B}/registries/${encodeURIComponent(registryId)}/tags`)
    .query({ image })
    .then((r) => unwrapResult<string[]>(r));

/* ==================== 模板（全局） ==================== */

/** 模板列表 */
export const listTemplates = () =>
  http().get(`${B}/templates`).then((r) => unwrapResult<DockerTemplate[]>(r));

/** 新增 / 更新模板（id 为空表示新增） */
export const saveTemplate = (template: DockerTemplate) =>
  http()
    .post(`${B}/templates`)
    .data(template as unknown as Record<string, unknown>)
    .then((r) => unwrapResult<DockerTemplate>(r));

/** 删除模板 */
export const deleteTemplate = (id: string) =>
  http().delete(`${B}/templates/${encodeURIComponent(id)}`).then((r) => unwrapResult<boolean>(r));
