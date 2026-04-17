import { http, type ReturnResult } from "@repo/utils";

export interface ZkStatView {
  czxid: number;
  mzxid: number;
  ctime: number;
  mtime: number;
  version: number;
  cversion: number;
  aversion: number;
  dataLength: number;
  numChildren: number;
  ephemeralOwner: number;
  pzxid: number;
}

export type ZkCreateMode = "PERSISTENT" | "EPHEMERAL" | "PERSISTENT_SEQUENTIAL" | "EPHEMERAL_SEQUENTIAL";

const BASE = (id: string) => `/v1/panel/zookeeper/${id}`;

export const openZookeeperConnection = (host: string, port: number, sessionTimeout = 30000) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/zookeeper/open", {
    data: { host, port, sessionTimeout },
  });

export const closeZookeeperConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

export const lsZookeeperNode = (connectionId: string, path = "/") =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/ls`, {
    params: { path },
  });

export const getZookeeperNode = (connectionId: string, path: string) =>
  http.request<ReturnResult<string>>("get", `${BASE(connectionId)}/get`, {
    params: { path },
  });

export const setZookeeperNode = (connectionId: string, path: string, data: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/set`, {
    data: { path, data },
  });

export const deleteZookeeperNode = (connectionId: string, path: string, recursive = false) =>
  http.request<ReturnResult<void>>("delete", `${BASE(connectionId)}/delete`, {
    params: { path, recursive },
  });

export const statZookeeperNode = (connectionId: string, path: string) =>
  http.request<ReturnResult<ZkStatView>>("get", `${BASE(connectionId)}/stat`, {
    params: { path },
  });

export const existsZookeeperNode = (connectionId: string, path: string) =>
  http.request<ReturnResult<boolean>>("get", `${BASE(connectionId)}/exists`, {
    params: { path },
  });

export const createZookeeperNode = (
  connectionId: string,
  path: string,
  data: string,
  mode: ZkCreateMode = "PERSISTENT"
) =>
  http.request<ReturnResult<string>>("post", `${BASE(connectionId)}/create`, {
    data: { path, data, mode },
  });
