import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/docker/${id}`;

// ─── 连接管理 ────────────────────────────────────────────────────────────

export const openDockerConnection = (host: string, port: number, protocol: string, socketPath?: string) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/docker/open", {
    data: { host, port, protocol, socketPath },
  });

export const closeDockerConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

// ─── 系统管理 ────────────────────────────────────────────────────────────

export const pingDocker = (connectionId: string) =>
  http.request<ReturnResult<string>>("get", `${BASE(connectionId)}/ping`);

export const fetchDockerInfo = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/info`);

export const fetchDockerVersion = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/version`);

export const fetchDockerDiskUsage = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/disk-usage`);

export const fetchDockerEvents = (connectionId: string, since = 0, until = 0, type = "") =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/events`, {
    params: { since, until, type },
  });

export const dockerAuth = (connectionId: string, username: string, password: string, serverAddress?: string) =>
  http.request<ReturnResult<Record<string, any>>>("post", `${BASE(connectionId)}/auth`, {
    data: { username, password, serverAddress },
  });

// ─── 容器管理 ────────────────────────────────────────────────────────────

export const listDockerContainers = (connectionId: string, showAll = false) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/containers`, {
    params: { showAll },
  });

export const inspectDockerContainer = (connectionId: string, containerId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/containers/${containerId}`);

export const createDockerContainer = (connectionId: string, data: {
  imageName: string;
  containerName?: string;
  env?: Record<string, string>;
  ports?: Record<string, string>;
  volumes?: Record<string, string>;
}) =>
  http.request<ReturnResult<string>>("post", `${BASE(connectionId)}/containers`, { data });

export const startDockerContainer = (connectionId: string, containerId: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/containers/${containerId}/start`);

export const stopDockerContainer = (connectionId: string, containerId: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/containers/${containerId}/stop`);

export const restartDockerContainer = (connectionId: string, containerId: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/containers/${containerId}/restart`);

export const killDockerContainer = (connectionId: string, containerId: string, signal?: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/containers/${containerId}/kill`, {
    params: { signal: signal || "" },
  });

export const pauseDockerContainer = (connectionId: string, containerId: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/containers/${containerId}/pause`);

export const unpauseDockerContainer = (connectionId: string, containerId: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/containers/${containerId}/unpause`);

export const renameDockerContainer = (connectionId: string, containerId: string, name: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/containers/${containerId}/rename`, {
    data: { name },
  });

export const removeDockerContainer = (connectionId: string, containerId: string, force = false) =>
  http.request<ReturnResult<void>>("delete", `${BASE(connectionId)}/containers/${containerId}`, {
    params: { force },
  });

export const fetchDockerContainerLogs = (connectionId: string, containerId: string, tail = 100) =>
  http.request<ReturnResult<string>>("get", `${BASE(connectionId)}/containers/${containerId}/logs`, {
    params: { tail },
  });

export const fetchDockerContainerStats = (connectionId: string, containerId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/containers/${containerId}/stats`);

export const fetchDockerContainerProcesses = (connectionId: string, containerId: string, psArgs?: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/containers/${containerId}/top`, {
    params: { psArgs: psArgs || "" },
  });

export const execDockerContainer = (connectionId: string, containerId: string, command: string[]) =>
  http.request<ReturnResult<string>>("post", `${BASE(connectionId)}/containers/${containerId}/exec`, {
    data: { command },
  });

export const fetchDockerContainerDiff = (connectionId: string, containerId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/containers/${containerId}/diff`);

export const commitDockerContainer = (connectionId: string, containerId: string, repository?: string, tag?: string) =>
  http.request<ReturnResult<string>>("post", `${BASE(connectionId)}/containers/${containerId}/commit`, {
    data: { repository, tag },
  });

export const pruneDockerContainers = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("post", `${BASE(connectionId)}/containers/prune`);

// ─── 镜像管理 ────────────────────────────────────────────────────────────

export const listDockerImages = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/images`);

export const inspectDockerImage = (connectionId: string, imageId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/images/${imageId}`);

export const pullDockerImage = (connectionId: string, imageName: string, registryAuth?: Record<string, string>) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/images/pull`, {
    data: { imageName, registryAuth },
  });

export const pushDockerImage = (connectionId: string, imageId: string, registryAuth?: Record<string, string>) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/images/${imageId}/push`, {
    data: { registryAuth },
  });

export const tagDockerImage = (connectionId: string, imageId: string, repository: string, tag?: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/images/${imageId}/tag`, {
    data: { repository, tag },
  });

export const removeDockerImage = (connectionId: string, imageId: string, force = false) =>
  http.request<ReturnResult<void>>("delete", `${BASE(connectionId)}/images/${imageId}`, {
    params: { force },
  });

export const searchDockerImages = (connectionId: string, term: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/images/search`, {
    params: { term },
  });

export const buildDockerImage = (connectionId: string, dockerfile: string, tags?: string[]) =>
  http.request<ReturnResult<Record<string, any>>>("post", `${BASE(connectionId)}/images/build`, {
    data: { dockerfile, tags },
  });

export const pruneDockerImages = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("post", `${BASE(connectionId)}/images/prune`);

// ─── 网络管理 ────────────────────────────────────────────────────────────

export const listDockerNetworks = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/networks`);

export const createDockerNetwork = (connectionId: string, name: string, driver?: string) =>
  http.request<ReturnResult<string>>("post", `${BASE(connectionId)}/networks`, {
    data: { name, driver },
  });

export const removeDockerNetwork = (connectionId: string, networkId: string) =>
  http.request<ReturnResult<void>>("delete", `${BASE(connectionId)}/networks/${networkId}`);

export const inspectDockerNetwork = (connectionId: string, networkId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/networks/${networkId}`);

export const connectContainerToDockerNetwork = (connectionId: string, networkId: string, containerId: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/networks/${networkId}/connect`, {
    data: { containerId },
  });

export const disconnectContainerFromDockerNetwork = (connectionId: string, networkId: string, containerId: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/networks/${networkId}/disconnect`, {
    data: { containerId },
  });

export const pruneDockerNetworks = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("post", `${BASE(connectionId)}/networks/prune`);

// ─── 卷管理 ──────────────────────────────────────────────────────────────

export const listDockerVolumes = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/volumes`);

export const createDockerVolume = (connectionId: string, name?: string, driver?: string, driverOpts?: Record<string, string>) =>
  http.request<ReturnResult<Record<string, any>>>("post", `${BASE(connectionId)}/volumes`, {
    data: { name, driver, driverOpts },
  });

export const removeDockerVolume = (connectionId: string, volumeName: string, force = false) =>
  http.request<ReturnResult<void>>("delete", `${BASE(connectionId)}/volumes/${volumeName}`, {
    params: { force },
  });

export const inspectDockerVolume = (connectionId: string, volumeName: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/volumes/${volumeName}`);

export const pruneDockerVolumes = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("post", `${BASE(connectionId)}/volumes/prune`);
