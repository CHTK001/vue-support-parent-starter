<template>
  <div class="panel-root">
    <PanelDataSourceHub
      v-if="viewMode === 'hub'"
      :model-value="jdbcForm"
      :cached-count="cachedConnections.length"
      :sources="savedSources"
      :submitting="submitting"
      @delete-source="handleDeleteSource"
      @edit-source="handleEditSource"
      @open-source="handleOpenSource"
      @reset-form="resetForm"
      @save-source="handleSaveSource"
      @toggle-favorite="handleToggleFavorite"
      @update:model-value="handleFormUpdate"
    />

    <section v-else class="workspace-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElButton plain size="small" @click="toggleAside">
            {{ asideCollapsed ? "展开对象树" : "收起对象树" }}
          </ElButton>
          <ElButton plain size="small" @click="handleBackHome">返回数据源</ElButton>
          <ElButton plain size="small" @click="handleLoadCatalog">刷新对象</ElButton>

          <ElPopover placement="bottom" trigger="click" width="220">
            <template #reference>
              <ElButton plain size="small">配置</ElButton>
            </template>
            <div class="config-panel">
              <span>默认预览条数</span>
              <ElInputNumber
                :controls="false"
                :min="100"
                :model-value="previewLimit"
                :step="100"
                @update:model-value="handlePreviewLimitChange"
              />
              <div class="config-panel__switch">
                <span>允许多项展开</span>
                <ElSwitch
                  :model-value="treeMultiExpand"
                  @update:model-value="handleTreeMultiExpandChange"
                />
              </div>
            </div>
          </ElPopover>
        </div>

        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "未命名数据源" }}</strong>
          <span>
            {{ workspaceSource?.host || "-" }}:{{ workspaceSource?.port || "-" }}
            / {{ workspaceSource?.databaseName || "-" }}
          </span>
        </div>
      </header>

      <div ref="workspaceContainerRef" class="workspace-frame">
        <ElContainer class="workspace-container">
          <ElAside
            class="workspace-aside"
            :style="{ width: asideCollapsed ? '56px' : `${asideWidth}px` }"
          >
            <JdbcCatalogTree
              :active-node-id="activeNode?.nodeId || ''"
              :catalog-tree="explorerTree"
              :collapsed="asideCollapsed"
              :expanded-keys="treeExpandedKeys"
              :multiple-expand="treeMultiExpand"
              :search-keyword="searchKeyword"
              :source-name="workspaceSource?.connectionName || ''"
              @collapse-table="handleCollapseTable"
              @collapse-node="handleCollapseNode"
              @context-action="handleContextAction"
              @expand-node="handleExpandNode"
              @expand-table="handleExpandTable"
              @open-table="handleOpenTable"
              @refresh="handleLoadCatalog"
              @search="handleSearch"
              @toggle-collapse="toggleAside"
              @update:search-keyword="searchKeyword = $event"
            />
          </ElAside>

          <div
            v-if="!asideCollapsed"
            class="workspace-resizer"
            @mousedown.prevent="startAsideResize"
          />

          <ElMain class="workspace-main">
            <JdbcDetailCard
              ref="detailRef"
              v-model:sql-text="sqlText"
              :active-path="activePath"
              :active-tab-id="activeInspectorTabId"
              :capabilities="capabilities"
              :datasource-metadata="datasourceMetadata"
              :error-message="errorMessage"
              :preview-limit="previewLimit"
              :query-result="queryResult"
              :sql-explain-content="sqlExplainContent"
              :sql-explain-rows="sqlExplainRows"
              :sql-suggestions="sqlSuggestions"
              :submitting="submitting"
              :table-tabs="inspectorTabs"
              @change-tab-setting="handleTableTabSettingChange"
              @activate-tab="handleActivateInspectorTab"
              @close-tab="handleCloseInspectorTab"
              @create-account="handleCreateAccount"
              @delete-account="handleDeleteAccount"
              @execute="handleExecuteSql"
              @execute-selected="handleExecuteSelected"
              @explain="handleExplainSql"
              @generate-sample-data="handleGenerateSampleData"
              @grant-account="handleGrantAccount"
              @refresh-table-data="handleRefreshTableData"
              @revoke-account="handleRevokeAccount"
              @save-table-data="handleSaveTableData"
              @update-account="handleUpdateAccount"
              @generate-sql="handleGenerateSql"
              @quick-run="handleQuickRun"
            />
          </ElMain>
        </ElContainer>
      </div>
    </section>

    <teleport to="body">
      <div
        v-if="noteEditor.visible"
        class="note-popover"
        :style="{ left: `${noteEditor.x}px`, top: `${noteEditor.y}px` }"
      >
        <div class="note-popover__head">
          <strong>编辑备注</strong>
          <button type="button" @click="closeNoteEditor">×</button>
        </div>
        <ElInput
          v-model="noteEditor.value"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="输入备注内容"
          type="textarea"
        />
        <div class="note-popover__actions">
          <ElButton size="small" @click="closeNoteEditor">取消</ElButton>
          <ElButton size="small" type="primary" @click="submitNoteEditor">保存</ElButton>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import {
  ElAside,
  ElButton,
  ElContainer,
  ElInput,
  ElInputNumber,
  ElMain,
  ElMessage,
  ElMessageBox,
  ElPopover,
  ElSwitch,
} from "element-plus";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  JdbcCatalogTree,
  JdbcDetailCard,
  PanelDataSourceHub,
} from "./components";
import {
  DEFAULT_JDBC_CONNECTION,
  PANEL_SOURCE_STORAGE_KEY,
  type JdbcConnectionForm,
  type PanelSavedSource,
} from "./panel";
import {
  closeJdbcConnection,
  createJdbcAccount,
  deleteJdbcAccount,
  deletePanelDatasource,
  executeJdbcTableAction,
  explainJdbcExecution,
  executeJdbcSql,
  explainJdbcStructure,
  fetchJdbcAccounts,
  fetchJdbcCapabilities,
  fetchJdbcConnectionMetadata,
  fetchJdbcDatabaseDocument,
  fetchJdbcTableData,
  fetchJdbcTableStructure,
  generateJdbcMockData,
  generateJdbcSql,
  listJdbcCachedConnections,
  listPanelDatasources,
  listJdbcCatalogTree,
  listPanelRemarks,
  openJdbcConnection,
  grantJdbcAccount,
  revokeJdbcAccount,
  savePanelRemark,
  savePanelDatasource,
  saveJdbcTableData,
  searchJdbcCatalogTree,
  updateJdbcAccount,
  type JdbcCatalogNode,
  type JdbcConnectionMetadata,
  type JdbcQueryResult,
  type JdbcTableStructure,
  type PanelJdbcAccountSaveRequest,
  type PanelDatabaseDocumentView,
  type PanelJdbcAccountView,
  type PanelJdbcPrivilegeRequest,
  type PanelCapabilitySummary,
  type PanelConnectionDescriptor,
  type PanelDatasourcePayload,
  type PanelDatasourceView,
  type PanelRemarkView,
  type PanelTableRowUpdate,
  type PanelTableDataView,
} from "./api";
import { decryptWorkspaceTicket, encryptWorkspaceTicket } from "./utils/workspaceTicket";

type ViewMode = "hub" | "workspace";
type InspectorTabType = "account" | "database-document" | "table" | "table-edit";
type InspectorViewMode = "account" | "data" | "ddl" | "database-document" | "ai" | "indexes" | "columns";
type CommentMode = "comment" | "mixed" | "native";
type PaginationMode = "full" | "pagination";

interface InspectorTableTab {
  accounts: PanelJdbcAccountView[];
  aiContent: string;
  databaseDocument?: PanelDatabaseDocumentView | null;
  dataCommentMode: CommentMode;
  dataResult: PanelTableDataView | null;
  ddlText: string;
  documentContent: string;
  filterKeyword: string;
  frozenColumns: string[];
  loadTotal: boolean;
  node: JdbcCatalogNode;
  paginationMode: PaginationMode;
  pageNum: number;
  pageSize: number;
  railShape: "default" | "round";
  showSequence: boolean;
  structure: JdbcTableStructure | null;
  tabId: string;
  tabName: string;
  tableCommentMode: CommentMode;
  tabType: InspectorTabType;
  viewMode: InspectorViewMode;
}

type TableArtifacts = Pick<InspectorTableTab, "aiContent" | "ddlText" | "documentContent" | "structure">;

const PANEL_CONFIG_STORAGE_KEY = "panel:workspace-config:v1";
const INITIAL_WORKSPACE_TICKET = new URL(window.location.href).searchParams.get("ticket");

type NoteEditorState = {
  node: JdbcCatalogNode | null;
  targetType: "catalog" | "field" | "table";
  value: string;
  visible: boolean;
  x: number;
  y: number;
};

const jdbcForm = reactive<JdbcConnectionForm>({ ...DEFAULT_JDBC_CONNECTION });
const viewMode = ref<ViewMode>(INITIAL_WORKSPACE_TICKET ? "workspace" : "hub");
const savedSources = ref<PanelSavedSource[]>([]);
const cachedConnections = ref<PanelConnectionDescriptor[]>([]);
const workspaceSource = ref<PanelSavedSource | null>(null);
const activeConnectionId = ref("");
const searchKeyword = ref("");
const catalogTree = ref<JdbcCatalogNode[]>([]);
const activeNode = ref<JdbcCatalogNode | null>(null);
const tableStructureCache = ref<Record<string, JdbcTableStructure>>({});
const fieldNotes = ref<Record<string, string>>({});
const objectNotes = ref<Record<string, string>>({});
const inspectorTabs = ref<InspectorTableTab[]>([]);
const activeInspectorTabId = ref("workspace");
const expandedCatalogNodeId = ref("");
const expandedTableNodeId = ref("");
const capabilities = ref<PanelCapabilitySummary | null>(null);
const datasourceMetadata = ref<JdbcConnectionMetadata | null>(null);
const queryResult = ref<JdbcQueryResult | null>(null);
const sqlText = ref("select 1 as ping;");
const sqlExplainContent = ref("");
const sqlExplainRows = ref<Record<string, any>[]>([]);
const errorMessage = ref("");
const submitting = ref(false);
const previewLimit = ref(1000);
const treeMultiExpand = ref(false);
const asideWidth = ref(236);
const asideCollapsed = ref(false);
const workspaceContainerRef = ref<HTMLElement | null>(null);
const detailRef = ref<{
  exportPdf: () => Promise<void>;
  exportWord: () => Promise<void>;
} | null>(null);
const noteEditor = reactive<NoteEditorState>({
  node: null,
  targetType: "table",
  value: "",
  visible: false,
  x: 0,
  y: 0,
});
const tableArtifactRequests = new Map<string, Promise<TableArtifacts>>();

const currentInspectorTab = computed(() =>
  inspectorTabs.value.find(tab => tab.tabId === activeInspectorTabId.value) || null,
);

const activePath = computed(() => {
  const node = currentInspectorTab.value?.node || activeNode.value;
  if (!node) {
    return "";
  }

  if (node.nodeType === "field") {
    return [
      node.catalogName,
      node.tableName,
      node.columnName || node.nodeName,
    ]
      .filter(Boolean)
      .join(".");
  }

  return [node.catalogName, node.schemaName, node.tableName || node.nodeName]
    .filter(Boolean)
    .join(".");
});

const buildFieldNoteKey = (node: JdbcCatalogNode, columnName: string) =>
  [
    activeConnectionId.value || workspaceSource.value?.sourceId || workspaceSource.value?.connectionName || "workspace",
    node.catalogName || "catalog",
    node.tableName || node.nodeName,
    columnName,
  ].join("::");

const buildObjectNoteKey = (node: JdbcCatalogNode) =>
  [
    activeConnectionId.value || workspaceSource.value?.sourceId || workspaceSource.value?.connectionName || "workspace",
    node.nodeType,
    node.catalogName || "catalog",
    node.schemaName || "schema",
    node.tableName || node.nodeName,
  ].join("::");

const buildFieldNodes = (tableNode: JdbcCatalogNode) => {
  const structure = tableStructureCache.value[tableNode.nodeId];
  if (!structure) {
    return [];
  }

  return structure.columns.map((column, index) => {
    const fieldName = String(column.name || `field_${index + 1}`);
    const fieldNote = fieldNotes.value[buildFieldNoteKey(tableNode, fieldName)] || "";
    return {
      nodeId: `${tableNode.nodeId}::field::${fieldName}`,
      parentId: tableNode.nodeId,
      nodeType: "field",
      nodeName: fieldName,
      columnName: fieldName,
      tableName: tableNode.tableName || tableNode.nodeName,
      catalogName: tableNode.catalogName,
      schemaName: tableNode.schemaName,
      description: fieldNote || String(column.comment || column.type || "字段"),
      attributes: {
        fieldType: column.type,
        fieldComment: column.comment,
        fieldNote,
      },
      children: [],
    } satisfies JdbcCatalogNode;
  });
};

const explorerTree = computed<JdbcCatalogNode[]>(() =>
  catalogTree.value.map(catalog => ({
    ...catalog,
    nodeType: "catalog",
    nodeName: catalog.catalogName || catalog.nodeName,
    description: objectNotes.value[buildObjectNoteKey(catalog)] || catalog.description || "数据库",
    children: (catalog.children || []).flatMap(schema =>
      (schema.children || []).map(table => ({
        ...table,
        parentId: catalog.nodeId,
        nodeType: "table",
        nodeName: table.tableName || table.nodeName,
        description:
          objectNotes.value[buildObjectNoteKey(table)] ||
          schema.nodeName ||
          schema.schemaName ||
          "Table",
        children: buildFieldNodes(table),
      })),
    ),
  })),
);

const treeExpandedKeys = computed(() => {
  return [expandedCatalogNodeId.value, expandedTableNodeId.value]
    .filter(Boolean) as string[];
});

const sqlSuggestions = computed(() => {
  const tokens = new Set<string>();

  explorerTree.value.forEach(catalog => {
    (catalog.children || []).forEach(table => {
      tokens.add(String(table.tableName || table.nodeName));
      const fullName = [table.catalogName, table.schemaName, table.tableName || table.nodeName]
        .filter(Boolean)
        .join(".");
      if (fullName) {
        tokens.add(fullName);
      }
    });
  });

  Object.values(tableStructureCache.value).forEach(structure => {
    structure.columns.forEach(column => {
      if (column.name) {
        tokens.add(String(column.name));
      }
    });
  });

  return [...tokens];
});

const resetForm = () => {
  Object.assign(jdbcForm, { ...DEFAULT_JDBC_CONNECTION });
};

const handleFormUpdate = (value: JdbcConnectionForm) => {
  Object.assign(jdbcForm, value);
};

const normalizeTree = (nodes: JdbcCatalogNode[]) =>
  nodes.map(node => ({
    ...node,
    children: normalizeTree(node.children || []),
  }));

const mapDatasourceViewToSource = (item: PanelDatasourceView): PanelSavedSource => ({
  sourceId: item.panelSourceId,
  connectionId: item.panelConnectionId || "",
  sourceType: item.panelSourceType || "JDBC",
  connectionName: item.panelConnectionName || "",
  host: item.panelHost || "",
  port: Number(item.panelPort || 0),
  databaseName: item.panelDatabaseName || "",
  username: item.panelUsername || "",
  password: item.panelPassword || "",
  protocol: item.panelProtocol || "",
  note: item.panelNote || "",
  favorite: Boolean(item.panelFavorite),
  updatedAt: item.panelUpdatedAt,
});

const mapSourceToDatasourcePayload = (source: PanelSavedSource | JdbcConnectionForm): PanelDatasourcePayload => ({
  panelSourceId: source.sourceId || undefined,
  panelConnectionId: source.connectionId || undefined,
  panelSourceType: source.sourceType,
  panelConnectionName: source.connectionName,
  panelHost: source.host,
  panelPort: Number(source.port || 0),
  panelDatabaseName: source.databaseName || "",
  panelUsername: source.username,
  panelPassword: source.password,
  panelProtocol: source.protocol || "",
  panelNote: source.note || "",
  panelFavorite: Boolean(source.favorite),
  panelUpdatedAt: source.updatedAt || undefined,
});

const persistSources = () => {
  localStorage.setItem(PANEL_SOURCE_STORAGE_KEY, JSON.stringify(savedSources.value));
};

const persistConfig = () => {
  localStorage.setItem(
    PANEL_CONFIG_STORAGE_KEY,
    JSON.stringify({
      previewLimit: previewLimit.value,
      treeMultiExpand: treeMultiExpand.value,
    }),
  );
};

const loadSources = async () => {
  try {
    const response = await listPanelDatasources();
    const remoteSources = Array.isArray(response?.data)
      ? response.data.map(mapDatasourceViewToSource)
      : [];
    savedSources.value = remoteSources;
    persistSources();
  } catch {
    try {
      const raw = localStorage.getItem(PANEL_SOURCE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      savedSources.value = Array.isArray(parsed)
        ? parsed.map((item: any) => ({
            sourceType: "JDBC",
            ...item,
          }))
        : [];
    } catch {
      savedSources.value = [];
    }
  }
};

const loadConfig = () => {
  try {
    const raw = localStorage.getItem(PANEL_CONFIG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    previewLimit.value = Number(parsed.previewLimit) > 0 ? Number(parsed.previewLimit) : 1000;
    treeMultiExpand.value = Boolean(parsed.treeMultiExpand);
  } catch {
    previewLimit.value = 1000;
    treeMultiExpand.value = false;
  }
};

const loadCachedConnections = async () => {
  try {
    const response = await listJdbcCachedConnections();
    cachedConnections.value = response?.data || [];
  } catch (error: any) {
    errorMessage.value = error?.message || "读取缓存连接失败";
  }
};

const handleSaveSource = async () => {
  submitting.value = true;
  try {
    const response = await savePanelDatasource(mapSourceToDatasourcePayload({
      ...jdbcForm,
      sourceId: jdbcForm.sourceId || "",
      updatedAt: jdbcForm.updatedAt || "",
    }));
    const next = response?.data ? mapDatasourceViewToSource(response.data) : null;
    if (!next) {
      return;
    }
    const index = savedSources.value.findIndex(item => item.sourceId === next.sourceId);
    if (index >= 0) {
      savedSources.value[index] = next;
    } else {
      savedSources.value.unshift(next);
    }
    persistSources();
    resetForm();
  } catch (error: any) {
    errorMessage.value = error?.message || "保存数据源失败";
    ElMessage.error(errorMessage.value);
  } finally {
    submitting.value = false;
  }
};

const handleEditSource = (source: PanelSavedSource) => {
  Object.assign(jdbcForm, { ...source });
};

const handleDeleteSource = async (sourceId: string) => {
  submitting.value = true;
  try {
    await deletePanelDatasource(sourceId);
    savedSources.value = savedSources.value.filter(item => item.sourceId !== sourceId);
    persistSources();
    if (jdbcForm.sourceId === sourceId) {
      resetForm();
    }
  } catch (error: any) {
    errorMessage.value = error?.message || "删除数据源失败";
    ElMessage.error(errorMessage.value);
  } finally {
    submitting.value = false;
  }
};

const handleToggleFavorite = async (sourceId: string) => {
  const current = savedSources.value.find(source => source.sourceId === sourceId);
  if (!current) {
    return;
  }
  const next = {
    ...current,
    favorite: !current.favorite,
    updatedAt: new Date().toISOString(),
  };
  try {
    const response = await savePanelDatasource(mapSourceToDatasourcePayload(next));
    const saved = response?.data ? mapDatasourceViewToSource(response.data) : next;
    savedSources.value = savedSources.value.map(source =>
      source.sourceId === sourceId ? saved : source,
    );
    persistSources();
  } catch (error: any) {
    errorMessage.value = error?.message || "更新收藏失败";
    ElMessage.error(errorMessage.value);
  }
};

const openSourceInWorkspace = async (source: PanelSavedSource) => {
  const ticket = await encryptWorkspaceTicket({ source });
  const url = new URL(window.location.href);
  url.searchParams.set("ticket", ticket);
  const child = window.open(url.toString(), "_blank", "noopener,noreferrer");
  if (!child) {
    window.location.href = url.toString();
  }
};

const handleOpenSource = async (source: PanelSavedSource) => {
  await openSourceInWorkspace(source);
};

const resetWorkspaceState = () => {
  catalogTree.value = [];
  activeNode.value = null;
  tableStructureCache.value = {};
  fieldNotes.value = {};
  objectNotes.value = {};
  inspectorTabs.value = [];
  activeInspectorTabId.value = "workspace";
  expandedCatalogNodeId.value = "";
  expandedTableNodeId.value = "";
  queryResult.value = null;
  sqlExplainContent.value = "";
  sqlExplainRows.value = [];
  errorMessage.value = "";
  capabilities.value = null;
  datasourceMetadata.value = null;
};

const loadWorkspaceCapabilities = async () => {
  if (!activeConnectionId.value) {
    return;
  }

  try {
    const response = await fetchJdbcCapabilities(activeConnectionId.value);
    capabilities.value = response?.data || null;
  } catch {
    capabilities.value = {
      aiEnabled: true,
      aiStarterEnabled: false,
      documentEnabled: true,
      jdbcEnabled: true,
      message: "能力接口未返回，已使用前端默认值。",
    };
  }
};

const loadWorkspaceMetadata = async () => {
  if (!activeConnectionId.value) {
    return;
  }

  try {
    const response = await fetchJdbcConnectionMetadata(activeConnectionId.value);
    datasourceMetadata.value = response?.data || null;
  } catch {
    datasourceMetadata.value = {
      connectionId: activeConnectionId.value,
      host: workspaceSource.value?.host,
      port: workspaceSource.value?.port,
    };
  }
};

const applyPanelRemarks = (remarks: PanelRemarkView[]) => {
  const nextFieldNotes: Record<string, string> = {};
  const nextObjectNotes: Record<string, string> = {};

  remarks.forEach(item => {
    const nodeType = item.panelNodeType;
    if (nodeType === "field") {
      const key = [
        item.panelConnectionId || "workspace",
        item.panelCatalogName || "catalog",
        item.panelTableName || "table",
        item.panelColumnName || "column",
      ].join("::");
      nextFieldNotes[key] = item.panelRemarkContent || "";
      return;
    }

    const key = [
      item.panelConnectionId || "workspace",
      nodeType || "table",
      item.panelCatalogName || "catalog",
      item.panelSchemaName || "schema",
      item.panelTableName || item.panelCatalogName || "node",
    ].join("::");
    nextObjectNotes[key] = item.panelRemarkContent || "";
  });

  fieldNotes.value = nextFieldNotes;
  objectNotes.value = nextObjectNotes;
};

const loadWorkspaceRemarks = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  try {
    const response = await listPanelRemarks(activeConnectionId.value);
    applyPanelRemarks(response?.data || []);
  } catch (error: any) {
    errorMessage.value = error?.message || "读取备注失败";
  }
};

const bootstrapWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "workspace";
  resetWorkspaceState();
  submitting.value = true;
  try {
    const response = await openJdbcConnection({
      ...source,
      connectionType: "JDBC",
      enabled: true,
    });
    activeConnectionId.value = response?.data?.connectionId || "";
    await Promise.all([
      loadCachedConnections(),
      loadWorkspaceCapabilities(),
      loadWorkspaceMetadata(),
      loadWorkspaceRemarks(),
      handleLoadCatalog(),
    ]);
  } catch (error: any) {
    errorMessage.value = error?.message || "打开工作台失败";
  } finally {
    submitting.value = false;
  }
};

const handleBackHome = async () => {
  if (activeConnectionId.value) {
    try {
      await closeJdbcConnection(activeConnectionId.value);
    } catch {
      // ignore
    }
  }
  activeConnectionId.value = "";
  workspaceSource.value = null;
  viewMode.value = "hub";
  asideCollapsed.value = false;
  resetWorkspaceState();
  const url = new URL(window.location.href);
  url.searchParams.delete("ticket");
  window.history.replaceState({}, "", url.toString());
  await loadCachedConnections();
};

const handleLoadCatalog = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  const response = await listJdbcCatalogTree(activeConnectionId.value);
  catalogTree.value = normalizeTree(response?.data || []);
};

const handleSearch = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  if (!searchKeyword.value.trim()) {
    await handleLoadCatalog();
    return;
  }
  const response = await searchJdbcCatalogTree(activeConnectionId.value, searchKeyword.value);
  catalogTree.value = normalizeTree(response?.data || []);
};

const buildTableTabId = (node: JdbcCatalogNode, tabType: InspectorTabType) =>
  `${tabType}::${node.nodeId}`;

const createInspectorTabDefaults = () => ({
  accounts: [] as PanelJdbcAccountView[],
  databaseDocument: null as PanelDatabaseDocumentView | null,
  dataCommentMode: "native" as CommentMode,
  dataResult: null as PanelTableDataView | null,
  filterKeyword: "",
  frozenColumns: [] as string[],
  loadTotal: false,
  paginationMode: "pagination" as PaginationMode,
  pageNum: 1,
  pageSize: 100,
  railShape: "default" as "default" | "round",
  showSequence: true,
  tableCommentMode: "native" as CommentMode,
});

const buildTableDdl = (structure: JdbcTableStructure | null) => {
  if (!structure) {
    return "";
  }

  const tableName = [structure.catalogName, structure.schemaName, structure.tableName]
    .filter(Boolean)
    .join(".") || structure.tableName;
  const columns = structure.columns.map(column => {
    const parts = [`  ${column.name} ${column.type || "varchar(255)"}`];
    if (column.comment) {
      parts.push(`comment '${String(column.comment).replace(/'/g, "''")}'`);
    }
    return parts.join(" ");
  });
  const primaryKeys = structure.primaryKeys.length
    ? `,\n  primary key (${structure.primaryKeys.join(", ")})`
    : "";

  return `create table ${tableName} (\n${columns.join(",\n")}${primaryKeys}\n);`;
};

const fetchTableArtifacts = async (node: JdbcCatalogNode) => {
  const requestKey = `${activeConnectionId.value}::${node.nodeId}`;
  const pending = tableArtifactRequests.get(requestKey);
  if (pending) {
    return pending;
  }

  const tableName = node.tableName || node.nodeName;
  const catalogName = node.catalogName || undefined;
  const schemaName = node.schemaName || undefined;

  const request = (async () => {
    const [structureResponse, aiResponse] = await Promise.all([
      fetchJdbcTableStructure(activeConnectionId.value, tableName, catalogName, schemaName),
      explainJdbcStructure(activeConnectionId.value, tableName, catalogName, schemaName),
    ]);

    const structure = structureResponse?.data || null;
    if (structure) {
      tableStructureCache.value = {
        ...tableStructureCache.value,
        [node.nodeId]: structure,
      };
    }

    return {
      aiContent: aiResponse?.data || "",
      ddlText: buildTableDdl(structure),
      documentContent: "",
      structure,
    };
  })();

  tableArtifactRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    tableArtifactRequests.delete(requestKey);
  }
};

const buildPreviewSql = (node: JdbcCatalogNode) =>
  `select * from ${fullTableName(node)} limit ${previewLimit.value};`;

const fetchTableDataForTab = async (
  node: JdbcCatalogNode,
  pageNum = 1,
  pageSize = 100,
  loadTotal = false,
) => {
  if (!activeConnectionId.value) {
    return null;
  }
  const response = await fetchJdbcTableData(activeConnectionId.value, {
    panelCatalogName: node.catalogName,
    panelSchemaName: node.schemaName,
    panelTableName: node.tableName || node.nodeName,
    panelPageNum: pageNum,
    panelPageSize: pageSize,
    panelLoadTotal: loadTotal,
  });
  return response?.data || null;
};

const fetchJdbcAccountTab = async (node: JdbcCatalogNode) => {
  if (!activeConnectionId.value) {
    return [];
  }
  const response = await fetchJdbcAccounts(activeConnectionId.value);
  return response?.data || [];
};

const fetchJdbcDatabaseDocumentTab = async (node: JdbcCatalogNode) => {
  if (!activeConnectionId.value) {
    return null;
  }
  const response = await fetchJdbcDatabaseDocument(activeConnectionId.value, node.catalogName || undefined);
  return response?.data || null;
};

const upsertInspectorTab = (tab: InspectorTableTab) => {
  inspectorTabs.value = [
    ...inspectorTabs.value.filter(item => item.tabId !== tab.tabId),
    tab,
  ];
};

const updateInspectorTab = (
  tabId: string,
  updater: (tab: InspectorTableTab) => InspectorTableTab,
) => {
  inspectorTabs.value = inspectorTabs.value.map(tab =>
    tab.tabId === tabId ? updater(tab) : tab,
  );
};

const syncInspectorTabArtifacts = async (
  node: JdbcCatalogNode,
  tabType: InspectorTabType,
) => {
  const tabId = buildTableTabId(node, tabType);
  try {
    const artifacts = await fetchTableArtifacts(node);
    inspectorTabs.value = inspectorTabs.value.map(tab =>
      tab.tabId === tabId
        ? { ...tab, ...artifacts }
        : tab,
    );
  } catch (error: any) {
    if (activeNode.value?.nodeId === node.nodeId) {
      errorMessage.value = error?.message || "读取表信息失败";
    }
  }
};

const deferBackgroundTask = (task: () => void) => {
  window.setTimeout(task, 0);
};

const ensureInspectorTab = async (
  node: JdbcCatalogNode,
  tabType: InspectorTabType,
  viewMode: InspectorViewMode,
  activate = true,
  waitForArtifacts = false,
) => {
  const tabId = buildTableTabId(node, tabType);
  const existing = inspectorTabs.value.find(item => item.tabId === tabId);
  const cachedStructure = tableStructureCache.value[node.nodeId] || null;
  if (tabType === "account") {
    const nextTab: InspectorTableTab = {
      ...createInspectorTabDefaults(),
      aiContent: "",
      ddlText: "",
      documentContent: "",
      structure: null,
      accounts: existing?.accounts || [],
      node,
      tabId,
      tabName: `${node.nodeName} 账号`,
      tabType,
      viewMode,
      loadTotal: false,
      paginationMode: existing?.paginationMode || "pagination",
      pageNum: 1,
      pageSize: 100,
      railShape: existing?.railShape || "default",
      showSequence: existing?.showSequence ?? true,
      tableCommentMode: "native",
      dataCommentMode: "native",
      filterKeyword: existing?.filterKeyword || "",
      frozenColumns: existing?.frozenColumns || [],
      dataResult: null,
    };
    upsertInspectorTab(nextTab);
    if (activate) {
      activeInspectorTabId.value = tabId;
    }
    activeNode.value = node;
    return nextTab;
  }
  if (tabType === "database-document") {
    const nextTab: InspectorTableTab = {
      ...createInspectorTabDefaults(),
      aiContent: "",
      ddlText: "",
      documentContent: "",
      structure: null,
      accounts: [],
      databaseDocument: existing?.databaseDocument || null,
      node,
      tabId,
      tabName: `${node.nodeName} 文档`,
      tabType,
      viewMode,
      loadTotal: false,
      paginationMode: existing?.paginationMode || "pagination",
      pageNum: 1,
      pageSize: 100,
      railShape: existing?.railShape || "default",
      showSequence: existing?.showSequence ?? true,
      tableCommentMode: "native",
      dataCommentMode: "native",
      filterKeyword: existing?.filterKeyword || "",
      frozenColumns: existing?.frozenColumns || [],
      dataResult: null,
    };
    upsertInspectorTab(nextTab);
    if (activate) {
      activeInspectorTabId.value = tabId;
    }
    activeNode.value = node;
    return nextTab;
  }
  const needsHydration = !cachedStructure
    || !existing
    || !existing.aiContent;
  const baseArtifacts = {
    aiContent: existing?.aiContent || "",
    ddlText: existing?.ddlText || buildTableDdl(cachedStructure),
    documentContent: existing?.documentContent || "",
    structure: cachedStructure,
  };
  const artifacts = waitForArtifacts && needsHydration
    ? await fetchTableArtifacts(node)
    : baseArtifacts;

  const nextTab: InspectorTableTab = {
    ...createInspectorTabDefaults(),
    ...artifacts,
    accounts: existing?.accounts || [],
    dataCommentMode: existing?.dataCommentMode || "native",
    dataResult: existing?.dataResult || null,
    filterKeyword: existing?.filterKeyword || "",
    frozenColumns: existing?.frozenColumns || [],
    loadTotal: existing?.loadTotal || false,
    node,
    paginationMode: existing?.paginationMode || "pagination",
    pageNum: existing?.pageNum || 1,
    pageSize: existing?.pageSize || 100,
    railShape: existing?.railShape || "default",
    showSequence: existing?.showSequence ?? true,
    tabId,
    tabName: node.tableName || node.nodeName,
    tableCommentMode: existing?.tableCommentMode || "native",
    tabType,
    viewMode,
  };

  upsertInspectorTab(nextTab);

  if (activate) {
    activeInspectorTabId.value = tabId;
  }
  activeNode.value = node;
  if (!waitForArtifacts && needsHydration) {
    deferBackgroundTask(() => {
      void syncInspectorTabArtifacts(node, tabType);
    });
  }
  return nextTab;
};

const handleOpenTable = async (node: JdbcCatalogNode) => {
  activeNode.value = node;
  injectSql(buildPreviewSql(node));
  activeInspectorTabId.value = "workspace";
};

const handleExpandTable = async (node: JdbcCatalogNode) => {
  expandedCatalogNodeId.value = node.parentId || expandedCatalogNodeId.value;
  expandedTableNodeId.value = node.nodeId;
  activeNode.value = node;
  if (!tableStructureCache.value[node.nodeId]) {
    deferBackgroundTask(() => {
      void fetchTableArtifacts(node);
    });
  }
};

const handleExpandNode = (node: JdbcCatalogNode) => {
  if (treeMultiExpand.value) {
    return;
  }
  if (node.nodeType === "catalog") {
    expandedCatalogNodeId.value = node.nodeId;
    expandedTableNodeId.value = "";
    return;
  }
  if (node.nodeType === "table") {
    expandedCatalogNodeId.value = node.parentId || expandedCatalogNodeId.value;
  }
};

const handleCollapseTable = (node: JdbcCatalogNode) => {
  if (expandedTableNodeId.value === node.nodeId) {
    expandedTableNodeId.value = "";
  }
};

const handleCollapseNode = (node: JdbcCatalogNode) => {
  if (node.nodeType === "catalog" && expandedCatalogNodeId.value === node.nodeId) {
    expandedCatalogNodeId.value = "";
    expandedTableNodeId.value = "";
  }
};

const handleActivateInspectorTab = (tabId: string) => {
  activeInspectorTabId.value = tabId;
  const tab = inspectorTabs.value.find(item => item.tabId === tabId);
  if (tab?.node) {
    activeNode.value = tab.node;
  }
};

const handleTableTabSettingChange = async (
  tabId: string,
  patch: Partial<Pick<InspectorTableTab, "dataCommentMode" | "filterKeyword" | "frozenColumns" | "loadTotal" | "paginationMode" | "pageNum" | "pageSize" | "railShape" | "showSequence" | "tableCommentMode" | "viewMode">>,
) => {
  const currentTab = inspectorTabs.value.find(item => item.tabId === tabId);
  if (!currentTab) {
    return;
  }
  const nextPaginationMode = patch.paginationMode ?? currentTab.paginationMode;
  const nextPageNum = nextPaginationMode === "full"
    ? 1
    : (patch.pageNum ?? currentTab.pageNum);
  const nextPageSize = nextPaginationMode === "full"
    ? Math.max(previewLimit.value, patch.pageSize ?? currentTab.pageSize)
    : (patch.pageSize ?? currentTab.pageSize);
  const nextPatch = {
    ...patch,
    pageNum: nextPageNum,
    pageSize: nextPageSize,
  };
  updateInspectorTab(tabId, tab => ({ ...tab, ...nextPatch }));
  if (currentTab.tabType !== "table") {
    return;
  }
  const nextViewMode = nextPatch.viewMode ?? currentTab.viewMode;
  const shouldRefreshData = nextViewMode === "data"
    && ("loadTotal" in patch
      || "pageNum" in patch
      || "pageSize" in patch
      || "paginationMode" in patch);
  if (!shouldRefreshData) {
    return;
  }
  try {
    const nextLoadTotal = patch.loadTotal ?? currentTab.loadTotal;
    const dataResult = await fetchTableDataForTab(currentTab.node, nextPageNum, nextPageSize, nextLoadTotal);
    updateInspectorTab(tabId, tab => ({ ...tab, dataResult }));
  } catch (error: any) {
    errorMessage.value = error?.message || "读取表数据失败";
  }
};

const handleRefreshTableData = async (tabId: string) => {
  const currentTab = inspectorTabs.value.find(item => item.tabId === tabId);
  if (!currentTab || currentTab.tabType !== "table") {
    return;
  }
  try {
    const dataResult = await fetchTableDataForTab(
      currentTab.node,
      currentTab.pageNum,
      currentTab.pageSize,
      currentTab.loadTotal,
    );
    updateInspectorTab(tabId, tab => ({ ...tab, dataResult }));
  } catch (error: any) {
    errorMessage.value = error?.message || "刷新表数据失败";
  }
};

const handleSaveTableData = async (tabId: string, updates: PanelTableRowUpdate[]) => {
  const currentTab = inspectorTabs.value.find(item => item.tabId === tabId);
  if (!currentTab || currentTab.tabType !== "table" || !activeConnectionId.value) {
    return;
  }
  if (!updates.length) {
    ElMessage.info("当前没有需要保存的数据");
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await saveJdbcTableData(activeConnectionId.value, {
      panelCatalogName: currentTab.node.catalogName,
      panelSchemaName: currentTab.node.schemaName,
      panelTableName: currentTab.node.tableName || currentTab.node.nodeName,
      panelUpdates: updates,
    });
    const result = response?.data;
    ElMessage.success(result?.panelMessage || "表数据已保存");
    await handleRefreshTableData(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "保存表数据失败";
  } finally {
    submitting.value = false;
  }
};

const handleOpenAccountManager = async (node: JdbcCatalogNode) => {
  const accountTab = await ensureInspectorTab(node, "account", "account", true, false);
  try {
    const accounts = await fetchJdbcAccountTab(node);
    updateInspectorTab(accountTab.tabId, tab => ({ ...tab, accounts }));
  } catch (error: any) {
    errorMessage.value = error?.message || "读取账号管理失败";
  }
};

const reloadAccountTab = async (tabId: string) => {
  const currentTab = inspectorTabs.value.find(item => item.tabId === tabId);
  if (!currentTab || currentTab.tabType !== "account") {
    return;
  }
  const accounts = await fetchJdbcAccountTab(currentTab.node);
  updateInspectorTab(tabId, tab => ({ ...tab, accounts }));
};

const handleCreateAccount = async (tabId: string, request: PanelJdbcAccountSaveRequest) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await createJdbcAccount(activeConnectionId.value, request);
    ElMessage.success("账号已创建");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "创建账号失败";
  } finally {
    submitting.value = false;
  }
};

const handleUpdateAccount = async (tabId: string, request: PanelJdbcAccountSaveRequest) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await updateJdbcAccount(activeConnectionId.value, request);
    ElMessage.success("账号已更新");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "更新账号失败";
  } finally {
    submitting.value = false;
  }
};

const handleDeleteAccount = async (tabId: string, accountName: string, host?: string) => {
  if (!activeConnectionId.value) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `即将删除账号 ${accountName}@${host || "%"}`,
      "删除账号",
      {
        cancelButtonText: "取消",
        confirmButtonText: "删除",
        confirmButtonClass: "el-button--danger",
        type: "warning",
      },
    );
  } catch {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await deleteJdbcAccount(activeConnectionId.value, accountName, host);
    ElMessage.success("账号已删除");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "删除账号失败";
  } finally {
    submitting.value = false;
  }
};

const handleGrantAccount = async (tabId: string, request: PanelJdbcPrivilegeRequest) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await grantJdbcAccount(activeConnectionId.value, request);
    ElMessage.success("权限已授予");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "授予权限失败";
  } finally {
    submitting.value = false;
  }
};

const handleRevokeAccount = async (tabId: string, request: PanelJdbcPrivilegeRequest) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await revokeJdbcAccount(activeConnectionId.value, request);
    ElMessage.success("权限已回收");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "回收权限失败";
  } finally {
    submitting.value = false;
  }
};

const handleOpenDatabaseDocument = async (node: JdbcCatalogNode) => {
  const documentTab = await ensureInspectorTab(
    node,
    "database-document",
    "database-document",
    true,
    false,
  );
  try {
    const databaseDocument = await fetchJdbcDatabaseDocumentTab(node);
    updateInspectorTab(documentTab.tabId, tab => ({ ...tab, databaseDocument }));
  } catch (error: any) {
    errorMessage.value = error?.message || "读取数据库文档失败";
  }
};

const handleCloseInspectorTab = (tabId: string) => {
  inspectorTabs.value = inspectorTabs.value.filter(item => item.tabId !== tabId);
  if (activeInspectorTabId.value === tabId) {
    activeInspectorTabId.value = "workspace";
  }
};

const fullTableName = (node: JdbcCatalogNode) =>
  [node.catalogName, node.schemaName, node.tableName || node.nodeName]
    .filter(Boolean)
    .join(".");

const injectSql = (sql: string) => {
  sqlText.value = sql;
};

const handleExecuteSelected = async (selection: string) => {
  if (!activeConnectionId.value) {
    return;
  }
  const statement = selection.trim();
  if (!statement) {
    ElMessage.warning("请先选中要执行的 SQL 片段");
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await executeJdbcSql(activeConnectionId.value, statement);
    queryResult.value = response?.data || null;
    sqlExplainContent.value = "";
    sqlExplainRows.value = [];
    activeInspectorTabId.value = "workspace";
  } catch (error: any) {
    errorMessage.value = error?.message || "执行选中 SQL 失败";
  } finally {
    submitting.value = false;
  }
};

const handleQuickRun = async (sql: string) => {
  injectSql(sql);
  await handleExecuteSql(sql);
};

const handleExecuteSql = async (statement?: string) => {
  if (!activeConnectionId.value) {
    return;
  }
  const currentSql = (statement || sqlText.value).trim();
  if (!currentSql) {
    ElMessage.warning("请输入 SQL");
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await executeJdbcSql(activeConnectionId.value, currentSql);
    queryResult.value = response?.data || null;
    sqlExplainContent.value = "";
    sqlExplainRows.value = [];
  } catch (error: any) {
    errorMessage.value = error?.message || "执行 SQL 失败";
  } finally {
    submitting.value = false;
  }
};

const handleExplainSql = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  const currentSql = sqlText.value.trim();
  if (!currentSql) {
    ElMessage.warning("请输入 SQL");
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await explainJdbcExecution(activeConnectionId.value, currentSql);
    const explainResult = response?.data || null;
    queryResult.value = explainResult;
    sqlExplainRows.value = explainResult?.rows || [];
    sqlExplainContent.value = explainResult
      ? `EXPLAIN 返回 ${explainResult.rows?.length || 0} 行，耗时 ${explainResult.elapsedMillis ?? 0} ms`
      : "";
    activeInspectorTabId.value = "workspace";
  } catch (error: any) {
    errorMessage.value = error?.message || "执行 EXPLAIN 失败";
  } finally {
    submitting.value = false;
  }
};

const handleGenerateSql = async (prompt: string) => {
  if (!activeConnectionId.value) {
    return;
  }
  try {
    const response = await generateJdbcSql(activeConnectionId.value, {
      prompt,
      tableNames: explorerTree.value
        .flatMap(catalog => catalog.children || [])
        .map(table => String(table.tableName || table.nodeName))
        .slice(0, 50),
    });
    sqlText.value = response?.data || "";
  } catch (error: any) {
    errorMessage.value = error?.message || "AI 生成 SQL 失败";
  }
};

const handleGenerateSampleData = async (tabId: string) => {
  const currentTab = inspectorTabs.value.find(item => item.tabId === tabId);
  if (!currentTab || currentTab.tabType !== "table" || !activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await generateJdbcMockData(activeConnectionId.value, {
      panelCatalogName: currentTab.node.catalogName,
      panelSchemaName: currentTab.node.schemaName,
      panelTableName: currentTab.node.tableName || currentTab.node.nodeName,
      panelCount: 5,
    });
    const mockRows = (response?.data || []).map(row => ({
      ...row,
      __panelNewRow: true,
    }));
    const currentRows = currentTab.dataResult?.panelRows || [];
    const columnNames = currentTab.structure?.columns?.length
      ? currentTab.structure.columns.map(column => String(column.name || "")).filter(Boolean)
      : [...new Set(mockRows.flatMap(row => Object.keys(row).filter(key => key !== "__panelNewRow")))];
    updateInspectorTab(tabId, tab => ({
      ...tab,
      dataResult: {
        panelColumns: columnNames,
        panelRows: [...currentRows, ...mockRows],
        panelTotal: (tab.dataResult?.panelTotal || 0) + mockRows.length,
        panelPageNum: tab.pageNum,
        panelPageSize: tab.pageSize,
        panelElapsedMillis: 0,
      },
      viewMode: "data",
    }));
    ElMessage.success(`已生成 ${mockRows.length} 行示例数据`);
  } catch (error: any) {
    errorMessage.value = error?.message || "生成示例数据失败";
  } finally {
    submitting.value = false;
  }
};

const handleFieldNote = (node: JdbcCatalogNode) => {
  const key = buildFieldNoteKey(
    {
      ...node,
      tableName: node.tableName || node.nodeName,
    } as JdbcCatalogNode,
    node.columnName || node.nodeName,
  );
  return fieldNotes.value[key] || node.attributes?.fieldNote || "";
};

const handleObjectNote = (node: JdbcCatalogNode) => {
  const key = buildObjectNoteKey(node);
  return objectNotes.value[key] || node.description || "";
};

const closeNoteEditor = () => {
  noteEditor.visible = false;
  noteEditor.node = null;
  noteEditor.value = "";
};

const openNoteEditor = (
  node: JdbcCatalogNode,
  targetType: "catalog" | "field" | "table",
  position: { x: number; y: number },
) => {
  noteEditor.node = node;
  noteEditor.targetType = targetType;
  noteEditor.value = targetType === "field" ? handleFieldNote(node) : handleObjectNote(node);
  noteEditor.x = Math.max(16, Math.min(window.innerWidth - 320, position.x));
  noteEditor.y = Math.max(16, Math.min(window.innerHeight - 220, position.y));
  noteEditor.visible = true;
};

const submitNoteEditor = async () => {
  if (!activeConnectionId.value || !noteEditor.node) {
    return;
  }

  const panelNode = noteEditor.node;
  const response = await savePanelRemark(activeConnectionId.value, {
    panelNodeType: panelNode.nodeType,
    panelCatalogName: panelNode.catalogName,
    panelSchemaName: panelNode.schemaName,
    panelTableName: panelNode.tableName || panelNode.nodeName,
    panelColumnName: panelNode.columnName || null,
    panelRemarkContent: noteEditor.value.trim(),
  });

  const remark = response?.data;
  if (!remark) {
    closeNoteEditor();
    return;
  }

  if (panelNode.nodeType === "field" && panelNode.columnName) {
    const parentTable = explorerTree.value
      .flatMap(catalog => catalog.children || [])
      .find(table => table.nodeId === panelNode.parentId);

    if (parentTable) {
      const noteKey = buildFieldNoteKey(parentTable, panelNode.columnName);
      fieldNotes.value = {
        ...fieldNotes.value,
        [noteKey]: remark.panelRemarkContent || "",
      };

      const cache = tableStructureCache.value[parentTable.nodeId];
      if (cache) {
        const nextStructure = {
          ...cache,
          columns: cache.columns.map(column =>
            String(column.name) === panelNode.columnName
              ? { ...column, comment: remark.panelRemarkContent || column.comment }
              : column,
          ),
        };
        tableStructureCache.value = {
          ...tableStructureCache.value,
          [parentTable.nodeId]: nextStructure,
        };
        inspectorTabs.value = inspectorTabs.value.map(tab =>
          tab.node.nodeId === parentTable.nodeId
            ? { ...tab, ddlText: buildTableDdl(nextStructure), structure: nextStructure }
            : tab,
        );
      }
    }
  } else {
    const noteKey = buildObjectNoteKey(panelNode);
    objectNotes.value = {
      ...objectNotes.value,
      [noteKey]: remark.panelRemarkContent || "",
    };
  }

  closeNoteEditor();
};

const handleGlobalPointerDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!noteEditor.visible) {
    return;
  }
  if (target?.closest(".note-popover")) {
    return;
  }
  closeNoteEditor();
};

const requestSqlTemplate = async (
  node: JdbcCatalogNode,
  panelActionType: string,
  panelBackupTableName?: string,
) => {
  if (!activeConnectionId.value) {
    return "";
  }
  const response = await fetchPanelSqlTemplate(activeConnectionId.value, {
    panelCatalogName: node.catalogName,
    panelSchemaName: node.schemaName,
    panelTableName: node.tableName || node.nodeName,
    panelActionType,
    panelBackupTableName,
    panelPreviewLimit: previewLimit.value,
  });
  return response?.data || "";
};

const buildDefaultBackupTableName = (node: JdbcCatalogNode) =>
  `${node.tableName || node.nodeName}_panel_backup_${Date.now()}`;

const removeTableTabsByNode = (node: JdbcCatalogNode) => {
  const removedTabIds = inspectorTabs.value
    .filter(tab => tab.node.nodeId === node.nodeId)
    .map(tab => tab.tabId);
  inspectorTabs.value = inspectorTabs.value.filter(tab => tab.node.nodeId !== node.nodeId);
  if (removedTabIds.includes(activeInspectorTabId.value)) {
    activeInspectorTabId.value = "workspace";
  }
};

const executeTableNodeAction = async (
  node: JdbcCatalogNode,
  panelActionType: string,
  label: string,
  panelBackupTableName?: string,
) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await executeJdbcTableAction(activeConnectionId.value, {
      panelCatalogName: node.catalogName,
      panelSchemaName: node.schemaName,
      panelTableName: node.tableName || node.nodeName,
      panelActionType,
      panelBackupTableName,
    });
    const result = response?.data;
    ElMessage.success(result?.panelMessage || `${label}已完成`);

    if (panelActionType === "drop") {
      removeTableTabsByNode(node);
    }
    if (panelActionType === "clear" || panelActionType === "truncate") {
      const targetTab = inspectorTabs.value.find(tab => tab.node.nodeId === node.nodeId && tab.tabType === "table");
      if (targetTab) {
        await handleRefreshTableData(targetTab.tabId);
      }
    }
    await handleLoadCatalog();
  } catch (error: any) {
    errorMessage.value = error?.message || `${label}失败`;
  } finally {
    submitting.value = false;
  }
};

const confirmDangerousTableAction = async (
  node: JdbcCatalogNode,
  label: string,
  actionType: string,
) => {
  try {
    await ElMessageBox.confirm(
      `即将对表 ${fullTableName(node)} 执行“${label}”操作，是否继续？`,
      `${label}确认`,
      {
        cancelButtonText: "取消",
        confirmButtonText: "继续",
        confirmButtonClass: "el-button--danger",
        type: "warning",
      },
    );
  } catch {
    return;
  }
  await executeTableNodeAction(node, actionType, label);
};

const promptBackupTableAction = async (node: JdbcCatalogNode) => {
  let backupTableName = "";
  try {
    const result = await ElMessageBox.prompt(
      `请输入 ${fullTableName(node)} 的备份表名`,
      "备份表",
      {
        cancelButtonText: "取消",
        confirmButtonText: "生成并执行",
        inputPlaceholder: "输入备份表名",
        inputValue: buildDefaultBackupTableName(node),
      },
    );
    backupTableName = result.value.trim();
  } catch {
    return;
  }
  if (!backupTableName) {
    ElMessage.warning("请输入备份表名");
    return;
  }
  await executeTableNodeAction(node, "backup", "备份表", backupTableName);
};

const handleContextAction = async ({
  action,
  node,
  position,
  targetType,
}: {
  action: string;
  node: JdbcCatalogNode | null;
  position: { x: number; y: number };
  targetType: string;
}) => {
  if (action === "refresh") {
    await handleLoadCatalog();
    return;
  }

  if (action === "toggle-collapse") {
    toggleAside();
    return;
  }

  if (action === "close-connection") {
    await handleBackHome();
    return;
  }

  if (action === "edit-field-note" && node) {
    openNoteEditor(node, "field", position);
    return;
  }

  if (action === "edit-note" && node) {
    openNoteEditor(node, node.nodeType === "catalog" ? "catalog" : "table", position);
    return;
  }

  if (action === "copy-name" && node) {
    await navigator.clipboard.writeText(node.columnName || fullTableName(node) || node.nodeName);
    return;
  }

  if (action === "new-sql") {
    if (targetType === "datasource") {
      injectSql(`select 1 as ping;\n-- 默认预览 limit ${previewLimit.value}`);
      activeInspectorTabId.value = "workspace";
      return;
    }
    if (node) {
      injectSql(`select * from ${fullTableName(node)} limit ${previewLimit.value};`);
      activeInspectorTabId.value = "workspace";
    }
    return;
  }

  if (!node) {
    return;
  }

  if (action === "design-table") {
    await ensureInspectorTab(node, "table-edit", "columns", true, false);
    return;
  }

  if (action === "edit-table") {
    await ensureInspectorTab(node, "table-edit", "columns", true, false);
    return;
  }

  if (action === "open-data") {
    const tab = await ensureInspectorTab(node, "table", "data", true, false);
    deferBackgroundTask(() => {
      void handleRefreshTableData(tab.tabId);
    });
    return;
  }

  if (action === "account-manage" || action === "manage-account") {
    await handleOpenAccountManager(node);
    return;
  }

  if (action === "open-database-document") {
    await handleOpenDatabaseDocument(node);
    return;
  }

  if (action === "sql-select") {
    injectSql(await requestSqlTemplate(node, "select"));
    activeInspectorTabId.value = "workspace";
    return;
  }

  if (action === "sql-count") {
    injectSql(await requestSqlTemplate(node, "count"));
    activeInspectorTabId.value = "workspace";
    return;
  }

  if (action === "sql-clear") {
    await confirmDangerousTableAction(node, "清空表", "clear");
    return;
  }

  if (action === "sql-backup") {
    await promptBackupTableAction(node);
    return;
  }

  if (action === "sql-truncate") {
    await confirmDangerousTableAction(node, "截断表", "truncate");
    return;
  }

  if (action === "sql-drop") {
    await confirmDangerousTableAction(node, "删除表", "drop");
  }
};

const handlePreviewLimitChange = (value: number | undefined) => {
  previewLimit.value = value && value > 0 ? value : 1000;
  persistConfig();
};

const handleTreeMultiExpandChange = (value: boolean | string | number) => {
  treeMultiExpand.value = Boolean(value);
  if (!treeMultiExpand.value) {
    expandedCatalogNodeId.value = "";
    expandedTableNodeId.value = "";
  }
  persistConfig();
};

const toggleAside = () => {
  asideCollapsed.value = !asideCollapsed.value;
};

const resizeListeners = {
  move: null as ((event: MouseEvent) => void) | null,
  up: null as (() => void) | null,
};

const stopAsideResize = () => {
  if (resizeListeners.move) {
    window.removeEventListener("mousemove", resizeListeners.move);
    resizeListeners.move = null;
  }
  if (resizeListeners.up) {
    window.removeEventListener("mouseup", resizeListeners.up);
    resizeListeners.up = null;
  }
  document.body.style.userSelect = "";
};

const startAsideResize = (event: MouseEvent) => {
  if (!workspaceContainerRef.value) {
    return;
  }

  const containerRect = workspaceContainerRef.value.getBoundingClientRect();
  asideCollapsed.value = false;
  document.body.style.userSelect = "none";

  resizeListeners.move = (moveEvent: MouseEvent) => {
    const nextWidth = moveEvent.clientX - containerRect.left;
    asideWidth.value = Math.min(320, Math.max(180, nextWidth));
  };

  resizeListeners.up = () => {
    stopAsideResize();
  };

  window.addEventListener("mousemove", resizeListeners.move);
  window.addEventListener("mouseup", resizeListeners.up);
  event.preventDefault();
};

onMounted(async () => {
  await loadSources();
  loadConfig();
  document.addEventListener("mousedown", handleGlobalPointerDown);
  await loadCachedConnections();
  const ticket = INITIAL_WORKSPACE_TICKET;
  if (!ticket) {
    return;
  }
  try {
    const payload = await decryptWorkspaceTicket<{ source: PanelSavedSource }>(ticket);
    if (payload?.source) {
      await bootstrapWorkspace(payload.source);
    }
  } catch (error: any) {
    errorMessage.value = error?.message || "ticket 解密失败";
    viewMode.value = "hub";
  }
});

onBeforeUnmount(() => {
  stopAsideResize();
  document.removeEventListener("mousedown", handleGlobalPointerDown);
});
</script>

<style scoped lang="scss">
.panel-root {
  min-height: 100%;
  padding: 16px;
  background: linear-gradient(180deg, #eef4f8 0%, #e7edf3 100%);
}

.workspace-mode {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  height: calc(100vh - 32px);
  min-height: 0;
  overflow: hidden;
}

.workspace-bar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(123, 142, 154, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.86);
}

.workspace-bar__main,
.workspace-bar__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.workspace-bar__meta {
  color: #5d7687;
  font-size: 12px;
}

.workspace-bar__meta strong {
  color: #132737;
  font-size: 13px;
}

.config-panel {
  display: grid;
  gap: 8px;
}

.config-panel span {
  color: #60798a;
  font-size: 12px;
}

.config-panel__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.workspace-frame {
  min-height: 0;
  height: 100%;
}

.workspace-container {
  align-items: stretch;
  gap: 0;
  min-height: 0;
  height: 100%;
}

.workspace-aside {
  overflow: hidden;
  transition: width 0.24s ease;
  min-height: 0;
  height: 100%;
}

.workspace-resizer {
  position: relative;
  width: 8px;
  cursor: col-resize;
}

.workspace-resizer::before {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 50%;
  width: 2px;
  border-radius: 999px;
  background: rgba(102, 130, 148, 0.22);
  transform: translateX(-50%);
  content: "";
}

.workspace-main {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  padding: 0 0 0 10px;
}

.panel-root :deep(.el-button) {
  border-radius: 10px;
}

.note-popover {
  position: fixed;
  z-index: 60;
  display: grid;
  gap: 10px;
  width: 300px;
  padding: 10px;
  border: 1px solid rgba(116, 133, 146, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.note-popover__head,
.note-popover__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.note-popover__head strong {
  color: #133042;
  font-size: 13px;
}

.note-popover__head button {
  border: 0;
  background: transparent;
  color: #60798a;
  font-size: 16px;
  cursor: pointer;
}

.note-popover :deep(.el-textarea__inner) {
  border-radius: 10px;
}

@media (max-width: 1024px) {
  .workspace-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspace-container {
    display: grid;
    gap: 10px;
  }

  .workspace-resizer {
    display: none;
  }

  .workspace-main {
    padding-left: 0;
  }
}
</style>
