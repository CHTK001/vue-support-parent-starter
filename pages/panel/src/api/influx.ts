import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/influx/${id}`;

export interface InfluxHealthInfo {
  status: string;
  message?: string;
  name?: string;
  version?: string;
  commit?: string;
}

export interface InfluxQueryRow {
  _time?: string;
  _measurement?: string;
  _field?: string;
  _value?: unknown;
  [key: string]: unknown;
}

export const openInfluxConnection = (
  host: string,
  port: number,
  password: string,
  org: string,
  bucket: string
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/influx/open", {
    data: { host, port, password, org, bucket },
  });

export const closeInfluxConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

export const listInfluxBuckets = (connectionId: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/buckets`);

export const listInfluxMeasurements = (connectionId: string, bucket: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/measurements`, {
    params: { bucket },
  });

export const queryInflux = (connectionId: string, query: string) =>
  http.request<ReturnResult<InfluxQueryRow[]>>("post", `${BASE(connectionId)}/query`, {
    data: { query },
  });

export const writeInflux = (connectionId: string, bucket: string, lineProtocol: string) =>
  http.request<ReturnResult<void>>("post", `${BASE(connectionId)}/write`, {
    data: { bucket, lineProtocol },
  });

export const fetchInfluxHealth = (connectionId: string) =>
  http.request<ReturnResult<InfluxHealthInfo>>("get", `${BASE(connectionId)}/health`);
