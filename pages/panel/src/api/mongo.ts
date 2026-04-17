import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/mongo/${id}`;

export const openMongoConnection = (
  host: string,
  port: number,
  username?: string,
  password?: string,
  authDatabase?: string
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/mongo/open", {
    data: { host, port, username, password, authDatabase },
  });

export const closeMongoConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

export const listMongoDatabases = (connectionId: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/databases`);

export const listMongoCollections = (connectionId: string, database: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/collections`, {
    params: { database },
  });

export const findMongoDocuments = (
  connectionId: string,
  database: string,
  collection: string,
  filter = "{}",
  sort = "{}",
  limit = 20,
  skip = 0
) =>
  http.request<ReturnResult<Record<string, unknown>[]>>("get", `${BASE(connectionId)}/find`, {
    params: { database, collection, filter, sort, limit, skip },
  });

export const insertMongoDocument = (
  connectionId: string,
  database: string,
  collection: string,
  documentJson: string
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "post",
    `${BASE(connectionId)}/insert`,
    {
      data: documentJson,
      params: { database, collection },
      headers: { "Content-Type": "application/json" },
      transformRequest: [(d: string) => d],
    }
  );

export const updateMongoDocument = (
  connectionId: string,
  database: string,
  collection: string,
  filter: string,
  updateJson: string
) =>
  http.request<ReturnResult<number>>("put", `${BASE(connectionId)}/update`, {
    data: updateJson,
    params: { database, collection, filter },
    headers: { "Content-Type": "application/json" },
    transformRequest: [(d: string) => d],
  });

export const deleteMongoDocument = (
  connectionId: string,
  database: string,
  collection: string,
  filter: string
) =>
  http.request<ReturnResult<number>>("delete", `${BASE(connectionId)}/delete`, {
    params: { database, collection, filter },
  });

export const aggregateMongo = (
  connectionId: string,
  database: string,
  collection: string,
  pipelineJson: string
) =>
  http.request<ReturnResult<Record<string, unknown>[]>>(
    "post",
    `${BASE(connectionId)}/aggregate`,
    {
      data: pipelineJson,
      params: { database, collection },
      headers: { "Content-Type": "application/json" },
      transformRequest: [(d: string) => d],
    }
  );

export const createMongoIndex = (
  connectionId: string,
  database: string,
  collection: string,
  keysJson: string,
  unique = false
) =>
  http.request<ReturnResult<string>>("post", `${BASE(connectionId)}/index`, {
    data: keysJson,
    params: { database, collection, unique },
    headers: { "Content-Type": "application/json" },
    transformRequest: [(d: string) => d],
  });

export const dropMongoCollection = (
  connectionId: string,
  database: string,
  collection: string
) =>
  http.request<ReturnResult<void>>("delete", `${BASE(connectionId)}/collection`, {
    params: { database, collection },
  });

export const fetchMongoStats = (
  connectionId: string,
  database: string,
  collection: string
) =>
  http.request<ReturnResult<Record<string, unknown>>>("get", `${BASE(connectionId)}/stats`, {
    params: { database, collection },
  });

export const fetchMongoDbStats = (connectionId: string, database: string) =>
  http.request<ReturnResult<Record<string, unknown>>>("get", `${BASE(connectionId)}/dbstats`, {
    params: { database },
  });

export const executeMongoCommand = (
  connectionId: string,
  database: string,
  commandJson: string
) =>
  http.request<ReturnResult<unknown>>("post", `${BASE(connectionId)}/command`, {
    data: commandJson,
    params: { database },
    headers: { "Content-Type": "application/json" },
    transformRequest: [(d: string) => d],
  });
