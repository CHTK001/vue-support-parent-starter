import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/influxv3/${id}`;

export interface InfluxV3HealthInfo {
  status: string;
  message?: string;
  name?: string;
  version?: string;
  commit?: string;
}

export interface InfluxV3QueryRow {
  [key: string]: unknown;
}

export const openInfluxV3Connection = (
  host: string,
  port: number,
  password: string,
  database: string
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/influxv3/open", {
    data: { host, port, password, database },
  });

export const closeInfluxV3Connection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

export const listInfluxV3Databases = (connectionId: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/databases`);

export const listInfluxV3Tables = (connectionId: string, database: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/tables`, {
    params: { database },
  });

export const queryInfluxV3 = (connectionId: string, database: string, query: string) =>
  http.request<ReturnResult<InfluxV3QueryRow[]>>("post", `${BASE(connectionId)}/query`, {
    data: { database, query },
  });

export const writeInfluxV3 = (connectionId: string, database: string, lineProtocol: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/write`, {
    data: { database, lineProtocol },
  });

export const fetchInfluxV3Health = (connectionId: string) =>
  http.request<ReturnResult<InfluxV3HealthInfo>>("get", `${BASE(connectionId)}/health`);
