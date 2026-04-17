import { http, type ReturnResult } from "@repo/utils";

export interface PanelRedisKeyView {
  key: string;
  type: string;
  ttl: number;
  size?: number;
}

export interface PanelRedisValueView {
  key: string;
  type: string;
  ttl: number;
  stringValue?: string;
  hashValue?: Record<string, string>;
  listValue?: string[];
  setValue?: string[];
  zsetValue?: Record<string, number>;
}

export interface PanelRedisInfoView {
  version: string;
  mode: string;
  usedMemory: number;
  connectedClients: number;
  totalCommandsProcessed: number;
  uptimeInSeconds: number;
  totalDatabases: number;
  dbKeyCounts: Record<string, number>;
  rawInfo: Record<string, string>;
}

export interface PanelRedisSetRequest {
  key: string;
  value: string;
  ttl?: number;
}

const BASE = (id: string) => `/v1/panel/redis/${id}`;

export const openRedisConnection = (host: string, port: number, password: string, db: number) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/redis/open", {
    data: { host, port, password, db },
  });

export const closeRedisConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

export const fetchRedisInfo = (connectionId: string) =>
  http.request<ReturnResult<PanelRedisInfoView>>("get", `${BASE(connectionId)}/info`);

export const selectRedisDb = (connectionId: string, db: number) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/select/${db}`);

export const scanRedisKeys = (connectionId: string, pattern = "*", count = 200) =>
  http.request<ReturnResult<PanelRedisKeyView[]>>("get", `${BASE(connectionId)}/scan`, {
    params: { pattern, count },
  });

export const getRedisValue = (connectionId: string, key: string) =>
  http.request<ReturnResult<PanelRedisValueView>>("get", `${BASE(connectionId)}/key`, {
    params: { key },
  });

export const setRedisValue = (connectionId: string, request: PanelRedisSetRequest) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/set`, { data: request });

export const delRedisKey = (connectionId: string, key: string) =>
  http.request<ReturnResult<number>>("delete", `${BASE(connectionId)}/key`, {
    params: { key },
  });

export const expireRedisKey = (connectionId: string, key: string, seconds: number) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/expire`, {
    params: { key, seconds },
  });

export const executeRedisCommand = (connectionId: string, command: string) =>
  http.request<ReturnResult<unknown>>("post", `${BASE(connectionId)}/execute`, {
    data: command,
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    transformRequest: [(d: string) => d],
  });
