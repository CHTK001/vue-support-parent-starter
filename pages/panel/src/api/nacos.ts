import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/nacos/${id}`;

export interface NacosNamespaceItem {
  namespace?: string;
  namespaceShowName?: string;
  namespaceDesc?: string;
  configCount?: number;
  type?: number;
}

export interface NacosConfigItem {
  id?: string;
  dataId: string;
  group: string;
  tenant?: string;
  appName?: string;
  type?: string;
  createTime?: string;
  modifyTime?: string;
}

export interface NacosConfigListResponse {
  totalCount?: number;
  pageNumber?: number;
  pagesAvailable?: number;
  pageItems?: NacosConfigItem[];
}

export interface NacosConfigHistoryItem {
  id?: string | number;
  dataId?: string;
  group?: string;
  tenant?: string;
  appName?: string;
  type?: string;
  opType?: string;
  srcIp?: string;
  modifiedTime?: string | number;
}

export const openNacosConnection = (
  host: string,
  port: number,
  username?: string,
  password?: string,
  protocol?: string
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/nacos/open", {
    data: { host, port, username, password, protocol },
  });

export const closeNacosConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

export const listNacosNamespaces = (connectionId: string) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/namespaces`
  );

export const createNacosNamespace = (
  connectionId: string,
  data: { namespaceId: string; namespaceName: string; namespaceDesc?: string }
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/namespace`, {
    data,
  });

export const deleteNacosNamespace = (
  connectionId: string,
  params: { namespaceId: string }
) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `${BASE(connectionId)}/namespace`,
    { params }
  );

export const listNacosConfigs = (
  connectionId: string,
  params: {
    tenant?: string;
    dataId?: string;
    group?: string;
    pageNo?: number;
    pageSize?: number;
  }
) =>
  http.request<ReturnResult<NacosConfigListResponse>>(
    "get",
    `${BASE(connectionId)}/configs`,
    { params }
  );

export const getNacosConfig = (
  connectionId: string,
  params: { tenant?: string; dataId: string; group?: string }
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/config`,
    { params }
  );

export const publishNacosConfig = (
  connectionId: string,
  data: {
    tenant?: string;
    dataId: string;
    group?: string;
    content: string;
    type?: string;
  }
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/config`, {
    data,
  });

export const deleteNacosConfig = (
  connectionId: string,
  params: { tenant?: string; dataId: string; group?: string }
) =>
  http.request<ReturnResult<boolean>>("delete", `${BASE(connectionId)}/config`, {
    params,
  });

export const cloneNacosConfig = (
  connectionId: string,
  data: {
    sourceTenant?: string;
    sourceDataId: string;
    sourceGroup?: string;
    targetTenant?: string;
    targetDataId: string;
    targetGroup?: string;
    type?: string;
  }
) =>
  http.request<ReturnResult<boolean>>(
    "post",
    `${BASE(connectionId)}/config/clone`,
    { data }
  );

export const listNacosConfigHistory = (
  connectionId: string,
  params: {
    tenant?: string;
    dataId: string;
    group?: string;
    pageNo?: number;
    pageSize?: number;
  }
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/config/history`,
    { params }
  );

export const getNacosConfigHistoryDetail = (
  connectionId: string,
  params: {
    tenant?: string;
    dataId: string;
    group?: string;
    historyId: string;
  }
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/config/history/detail`,
    { params }
  );

export const rollbackNacosConfig = (
  connectionId: string,
  data: {
    tenant?: string;
    dataId: string;
    group?: string;
    historyId: string;
    type?: string;
  }
) =>
  http.request<ReturnResult<boolean>>(
    "post",
    `${BASE(connectionId)}/config/rollback`,
    { data }
  );
