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

export interface PanelDatasourcePayload {
  panelSourceId?: string;
  panelConnectionId?: string;
  panelSourceType: "JDBC" | "REDIS";
  panelConnectionName: string;
  panelHost: string;
  panelPort: number;
  panelDatabaseName?: string;
  panelUsername: string;
  panelPassword: string;
  panelProtocol?: string;
  panelNote?: string;
  panelFavorite?: boolean;
  panelUpdatedAt?: string;
}

export interface PanelDatasourceView extends PanelDatasourcePayload {
  panelSourceId: string;
  panelUpdatedAt: string;
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
  triggers?: Record<string, any>[];
  primaryKeys: string[];
}

export interface JdbcQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  affectedRows: number;
  elapsedMillis?: number;
  query: boolean;
}

export interface PanelTableDataRequest {
  panelCatalogName?: string | null;
  panelSchemaName?: string | null;
  panelTableName: string;
  panelPageNum: number;
  panelPageSize: number;
  panelLoadTotal: boolean;
  panelSortField?: string;
  panelSortOrder?: string;
}

export interface PanelTableDataView {
  panelColumns: string[];
  panelRows: Record<string, any>[];
  panelTotal: number;
  panelPageNum: number;
  panelPageSize: number;
  panelElapsedMillis: number;
}

export interface PanelTableMutationView {
  panelAffectedRows: number;
  panelElapsedMillis: number;
  panelMessage: string;
}

export interface PanelTableActionRequest {
  panelCatalogName?: string | null;
  panelSchemaName?: string | null;
  panelTableName: string;
  panelActionType: string;
  panelBackupTableName?: string;
}

export interface PanelTableRowUpdate {
  panelOriginalRow: Record<string, any>;
  panelCurrentRow: Record<string, any>;
}

export interface PanelTableSaveRequest {
  panelCatalogName?: string | null;
  panelSchemaName?: string | null;
  panelTableName: string;
  panelUpdates: PanelTableRowUpdate[];
}

export interface PanelJdbcAccountView {
  panelAccountName: string;
  panelHost: string;
  panelGrants: string[];
}

export interface PanelJdbcAccountSaveRequest {
  panelAccountName: string;
  panelHost?: string;
  panelPassword?: string;
}

export interface PanelJdbcPrivilegeRequest {
  panelAccountName: string;
  panelHost?: string;
  panelPrivileges: string[];
  panelCatalogName?: string;
  panelTableName?: string;
  panelGrantOption?: boolean;
}

export interface PanelDatabaseTableDocumentView {
  panelCatalogName?: string | null;
  panelSchemaName?: string | null;
  panelTableName: string;
  panelTableComment?: string;
  panelPrimaryKeys: string[];
  panelColumns: Record<string, any>[];
  panelIndexes: Record<string, any>[];
}

export interface PanelDatabaseDocumentView {
  panelCatalogName?: string | null;
  panelSchemaCount: number;
  panelTableCount: number;
  panelGeneratedAt: string;
  panelTables: PanelDatabaseTableDocumentView[];
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

const buildPlainTextRequest = (text: string) => ({
  data: String(text ?? ""),
  headers: {
    "Content-Type": "text/plain;charset=UTF-8",
  },
  transformRequest: [(data: string) => data],
});

export const openJdbcConnection = (data: PanelConnectionDefinition) =>
  http.request<ReturnResult<PanelConnectionHandle>>(
    "post",
    "/v1/panel/jdbc/connection/open",
    { data },
  );

export const listPanelDatasources = () =>
  http.request<ReturnResult<PanelDatasourceView[]>>(
    "get",
    "/v1/panel/source",
  );

export const savePanelDatasource = (data: PanelDatasourcePayload) =>
  http.request<ReturnResult<PanelDatasourceView>>(
    "post",
    "/v1/panel/source",
    { data },
  );

export const deletePanelDatasource = (panelSourceId: string) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `/v1/panel/source/${panelSourceId}`,
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

export const fetchJdbcTableData = (
  connectionId: string,
  data: PanelTableDataRequest,
) =>
  http.request<ReturnResult<PanelTableDataView>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/table/data`,
    { data },
  );

export const saveJdbcTableData = (
  connectionId: string,
  data: PanelTableSaveRequest,
) =>
  http.request<ReturnResult<PanelTableMutationView>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/table/save`,
    { data },
  );

export const executeJdbcTableAction = (
  connectionId: string,
  data: PanelTableActionRequest,
) =>
  http.request<ReturnResult<PanelTableMutationView>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/table/action`,
    { data },
  );

export const executeJdbcSql = (connectionId: string, sql: string) =>
  http.request<ReturnResult<JdbcQueryResult>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/execute`,
    buildPlainTextRequest(sql),
  );

export const explainJdbcExecution = (connectionId: string, sql: string) =>
  http.request<ReturnResult<JdbcQueryResult>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/explain`,
    buildPlainTextRequest(sql),
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

export const fetchJdbcDatabaseDocument = (
  connectionId: string,
  catalog?: string,
) =>
  http.request<ReturnResult<PanelDatabaseDocumentView>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/database/document`,
    { params: { catalog } },
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
    buildPlainTextRequest(sql),
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

export const fetchJdbcAccounts = (connectionId: string) =>
  http.request<ReturnResult<PanelJdbcAccountView[]>>(
    "get",
    `/v1/panel/jdbc/${connectionId}/account`,
  );

export const createJdbcAccount = (
  connectionId: string,
  data: PanelJdbcAccountSaveRequest,
) =>
  http.request<ReturnResult<PanelJdbcAccountView>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/account`,
    { data },
  );

export const updateJdbcAccount = (
  connectionId: string,
  data: PanelJdbcAccountSaveRequest,
) =>
  http.request<ReturnResult<PanelJdbcAccountView>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/account/update`,
    { data },
  );

export const deleteJdbcAccount = (
  connectionId: string,
  accountName: string,
  host?: string,
) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `/v1/panel/jdbc/${connectionId}/account`,
    { params: { accountName, host } },
  );

export const grantJdbcAccount = (
  connectionId: string,
  data: PanelJdbcPrivilegeRequest,
) =>
  http.request<ReturnResult<PanelJdbcAccountView>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/account/grant`,
    { data },
  );

export const revokeJdbcAccount = (
  connectionId: string,
  data: PanelJdbcPrivilegeRequest,
) =>
  http.request<ReturnResult<PanelJdbcAccountView>>(
    "post",
    `/v1/panel/jdbc/${connectionId}/account/revoke`,
    { data },
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
