import { http, type ReturnResult } from "@repo/utils";

export interface PanelConnectionDefinition {
  connectionId?: string;
  connectionName: string;
  connectionType: "JDBC";
  protocol?: string;
  host: string;
  port: number;
  databaseName?: string;
  username: string;
  password: string;
  enabled?: boolean;
  attributes?: Record<string, any>;
}

export interface PanelConnectionHandle {
  connectionId: string;
  createdTime?: string;
  expireTime?: string;
  definition?: PanelConnectionDefinition;
}

export interface PanelConnectionDescriptor {
  connectionId: string;
  connectionName?: string;
  connectionType?: string;
  cached: boolean;
  enabled: boolean;
  lastAccessTime?: string;
}

export interface JdbcCatalogNode {
  attributes?: Record<string, any>;
  columnName?: string | null;
  nodeId: string;
  parentId?: string | null;
  nodeType: string;
  nodeName: string;
  description?: string;
  catalogName?: string | null;
  schemaName?: string | null;
  tableName?: string | null;
  children?: JdbcCatalogNode[];
}

export interface JdbcTableStructure {
  catalogName?: string;
  schemaName?: string;
  tableName: string;
  tableComment?: string;
  columns: Record<string, any>[];
  indexes: Record<string, any>[];
  primaryKeys: string[];
}

export interface JdbcQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  affectedRows: number;
  query: boolean;
}

export interface PanelCapabilitySummary {
  aiEnabled: boolean;
  aiStarterEnabled: boolean;
  documentEnabled: boolean;
  jdbcEnabled: boolean;
  message?: string;
}

export interface JdbcConnectionMetadata {
  attributes?: Record<string, any>;
  catalog?: string;
  connectionId: string;
  databaseProductName?: string;
  databaseProductVersion?: string;
  defaultSchema?: string;
  driverName?: string;
  driverVersion?: string;
  host?: string;
  port?: number;
}

export interface PanelAiSqlRequest {
  prompt: string;
  tableNames?: string[];
}

export interface PanelRemarkRequest {
  panelConnectionId?: string;
  panelNodeType: string;
  panelCatalogName?: string | null;
  panelSchemaName?: string | null;
  panelTableName?: string | null;
  panelColumnName?: string | null;
  panelRemarkContent: string;
}

export interface PanelRemarkView {
  panelRemarkKey: string;
  panelConnectionId: string;
  panelNodeType: string;
  panelCatalogName?: string | null;
  panelSchemaName?: string | null;
  panelTableName?: string | null;
  panelColumnName?: string | null;
  panelRemarkContent: string;
}

export interface PanelSqlTemplateRequest {
  panelConnectionId?: string;
  panelCatalogName?: string | null;
  panelSchemaName?: string | null;
  panelTableName?: string | null;
  panelActionType: string;
  panelPreviewLimit?: number;
  panelBackupTableName?: string;
}

export const openJdbcConnection = (data: PanelConnectionDefinition) =>
  http.request<ReturnResult<PanelConnectionHandle>>(
    "post",
    "/v1/panel/jdbc/connection/open",
    { data },
  );

export const listJdbcCachedConnections = () =>
  http.request<ReturnResult<PanelConnectionDescriptor[]>>(
    "get",
    "/v1/panel/jdbc/connection/cache",
  );

export const closeJdbcConnection = (connectionId: string) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `/v1/panel/jdbc/connection/${connectionId}`,
  );

export const listJdbcCatalogTree = (connectionId: string) =>
  http.request<ReturnResult<JdbcCatalogNode[]>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/catalog`,
  );

export const searchJdbcCatalogTree = (
  connectionId: string,
  keyword: string,
) =>
  http.request<ReturnResult<JdbcCatalogNode[]>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/search`,
    { params: { keyword } },
  );

export const fetchJdbcTableStructure = (
  connectionId: string,
  tableName: string,
  catalog?: string,
  schema?: string,
) =>
  http.request<ReturnResult<JdbcTableStructure>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/structure`,
    { params: { tableName, catalog, schema } },
  );

export const executeJdbcSql = (connectionId: string, sql: string) =>
  http.request<ReturnResult<JdbcQueryResult>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/execute`,
    { data: sql },
  );

export const fetchJdbcTableDocument = (
  connectionId: string,
  tableName: string,
  catalog?: string,
  schema?: string,
) =>
  http.request<ReturnResult<string>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/document`,
    { params: { tableName, catalog, schema } },
  );

export const explainJdbcStructure = (
  connectionId: string,
  tableName: string,
  catalog?: string,
  schema?: string,
) =>
  http.request<ReturnResult<string>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/ai/structure`,
    { params: { tableName, catalog, schema } },
  );

export const explainJdbcSql = (connectionId: string, sql: string) =>
  http.request<ReturnResult<string>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/ai/sql`,
    { data: sql },
  );

export const generateJdbcSql = (
  connectionId: string,
  data: PanelAiSqlRequest,
) =>
  http.request<ReturnResult<string>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/ai/sql/generate`,
    { data },
  );

export const fetchJdbcCapabilities = (connectionId: string) =>
  http.request<ReturnResult<PanelCapabilitySummary>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/capabilities`,
  );

export const fetchJdbcConnectionMetadata = (connectionId: string) =>
  http.request<ReturnResult<JdbcConnectionMetadata>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/metadata`,
  );

export const listPanelRemarks = (connectionId: string) =>
  http.request<ReturnResult<PanelRemarkView[]>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/remark`,
  );

export const savePanelRemark = (
  connectionId: string,
  data: PanelRemarkRequest,
) =>
  http.request<ReturnResult<PanelRemarkView>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/remark`,
    { data },
  );

export const fetchPanelSqlTemplate = (
  connectionId: string,
  data: PanelSqlTemplateRequest,
) =>
  http.request<ReturnResult<string>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/sql/template`,
    { data },
  );
