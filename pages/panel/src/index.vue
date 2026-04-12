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
              :search-keyword="searchKeyword"
              :source-name="workspaceSource?.connectionName || ''"
              @collapse-table="handleCollapseTable"
              @context-action="handleContextAction"
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
              :sql-suggestions="sqlSuggestions"
              :submitting="submitting"
              :table-tabs="inspectorTabs"
              @activate-tab="handleActivateInspectorTab"
              @close-tab="handleCloseInspectorTab"
              @execute="handleExecuteSql"
              @execute-selected="handleExecuteSelected"
              @explain="handleExplainSql"
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
  ElPopover,
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
  executeJdbcSql,
  explainJdbcSql,
  explainJdbcStructure,
  fetchJdbcCapabilities,
  fetchJdbcConnectionMetadata,
  fetchPanelSqlTemplate,
  fetchJdbcTableDocument,
  fetchJdbcTableStructure,
  generateJdbcSql,
  listJdbcCachedConnections,
  listJdbcCatalogTree,
  listPanelRemarks,
  openJdbcConnection,
  savePanelRemark,
  searchJdbcCatalogTree,
  type JdbcCatalogNode,
  type JdbcConnectionMetadata,
  type JdbcQueryResult,
  type JdbcTableStructure,
  type PanelCapabilitySummary,
  type PanelConnectionDescriptor,
  type PanelRemarkView,
} from "./api";
import { decryptWorkspaceTicket, encryptWorkspaceTicket } from "./utils/workspaceTicket";

type ViewMode = "hub" | "workspace";
type InspectorTabType = "table" | "table-edit";
type InspectorViewMode = "data" | "structure" | "ddl" | "document" | "ai" | "indexes" | "columns";

interface InspectorTableTab {
  aiContent: string;
  ddlText: string;
  documentContent: string;
  node: JdbcCatalogNode;
  structure: JdbcTableStructure | null;
  tabId: string;
  tabName: string;
  tabType: InspectorTabType;
  viewMode: InspectorViewMode;
}

const PANEL_CONFIG_STORAGE_KEY = "panel:workspace-config:v1";

type NoteEditorState = {
  node: JdbcCatalogNode | null;
  targetType: "catalog" | "field" | "table";
  value: string;
  visible: boolean;
  x: number;
  y: number;
};

const jdbcForm = reactive<JdbcConnectionForm>({ ...DEFAULT_JDBC_CONNECTION });
const viewMode = ref<ViewMode>("hub");
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
const expandedTableNodeId = ref("");
const capabilities = ref<PanelCapabilitySummary | null>(null);
const datasourceMetadata = ref<JdbcConnectionMetadata | null>(null);
const queryResult = ref<JdbcQueryResult | null>(null);
const sqlText = ref("select 1 as ping;");
const sqlExplainContent = ref("");
const errorMessage = ref("");
const submitting = ref(false);
const previewLimit = ref(1000);
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
    workspaceSource.value?.sourceId || workspaceSource.value?.connectionName || "workspace",
    node.catalogName || "catalog",
    node.tableName || node.nodeName,
    columnName,
  ].join("::");

const buildObjectNoteKey = (node: JdbcCatalogNode) =>
  [
    workspaceSource.value?.sourceId || workspaceSource.value?.connectionName || "workspace",
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
  const keys = explorerTree.value.map(item => item.nodeId);
  if (expandedTableNodeId.value) {
    keys.push(expandedTableNodeId.value);
  }
  return keys;
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

const persistSources = () => {
  localStorage.setItem(PANEL_SOURCE_STORAGE_KEY, JSON.stringify(savedSources.value));
};

const persistConfig = () => {
  localStorage.setItem(
    PANEL_CONFIG_STORAGE_KEY,
    JSON.stringify({ previewLimit: previewLimit.value }),
  );
};

const loadSources = () => {
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
};

const loadConfig = () => {
  try {
    const raw = localStorage.getItem(PANEL_CONFIG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    previewLimit.value = Number(parsed.previewLimit) > 0 ? Number(parsed.previewLimit) : 1000;
  } catch {
    previewLimit.value = 1000;
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

const handleSaveSource = () => {
  const sourceId = jdbcForm.sourceId || `source-${Date.now()}`;
  const next: PanelSavedSource = {
    ...jdbcForm,
    sourceId,
    updatedAt: new Date().toISOString(),
  };
  const index = savedSources.value.findIndex(item => item.sourceId === sourceId);
  if (index >= 0) {
    savedSources.value[index] = next;
  } else {
    savedSources.value.unshift(next);
  }
  persistSources();
  resetForm();
};

const handleEditSource = (source: PanelSavedSource) => {
  Object.assign(jdbcForm, { ...source });
};

const handleDeleteSource = (sourceId: string) => {
  savedSources.value = savedSources.value.filter(item => item.sourceId !== sourceId);
  persistSources();
  if (jdbcForm.sourceId === sourceId) {
    resetForm();
  }
};

const handleToggleFavorite = (sourceId: string) => {
  savedSources.value = savedSources.value.map(source =>
    source.sourceId === sourceId
      ? { ...source, favorite: !source.favorite, updatedAt: new Date().toISOString() }
      : source,
  );
  persistSources();
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
  expandedTableNodeId.value = "";
  queryResult.value = null;
  sqlExplainContent.value = "";
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
  const tableName = node.tableName || node.nodeName;
  const catalogName = node.catalogName || undefined;
  const schemaName = node.schemaName || undefined;

  const [structureResponse, documentResponse, aiResponse] = await Promise.all([
    fetchJdbcTableStructure(activeConnectionId.value, tableName, catalogName, schemaName),
    fetchJdbcTableDocument(activeConnectionId.value, tableName, catalogName, schemaName),
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
    documentContent: documentResponse?.data || "",
    structure,
  };
};

const ensureInspectorTab = async (
  node: JdbcCatalogNode,
  tabType: InspectorTabType,
  viewMode: InspectorViewMode,
  activate = true,
) => {
  const tabId = buildTableTabId(node, tabType);
  const existing = inspectorTabs.value.find(item => item.tabId === tabId);
  const cachedStructure = tableStructureCache.value[node.nodeId] || null;

  const artifacts = existing || !cachedStructure
    ? await fetchTableArtifacts(node)
    : {
        aiContent: existing?.aiContent || "",
        ddlText: existing?.ddlText || buildTableDdl(cachedStructure),
        documentContent: existing?.documentContent || "",
        structure: cachedStructure,
      };

  const nextTab: InspectorTableTab = {
    ...artifacts,
    node,
    tabId,
    tabName: node.tableName || node.nodeName,
    tabType,
    viewMode,
  };

  inspectorTabs.value = [
    ...inspectorTabs.value.filter(item => item.tabId !== tabId),
    nextTab,
  ];

  if (activate) {
    activeInspectorTabId.value = tabId;
  }
  activeNode.value = node;
  return nextTab;
};

const handleOpenTable = async (node: JdbcCatalogNode) => {
  activeNode.value = node;
  injectSql((await requestSqlTemplate(node, "select")) || `select * from ${fullTableName(node)} limit ${previewLimit.value};`);
  if (!tableStructureCache.value[node.nodeId]) {
    await fetchTableArtifacts(node);
  }
  activeInspectorTabId.value = "workspace";
};

const handleExpandTable = async (node: JdbcCatalogNode) => {
  expandedTableNodeId.value = node.nodeId;
  activeNode.value = node;
  if (!tableStructureCache.value[node.nodeId]) {
    await fetchTableArtifacts(node);
  }
};

const handleCollapseTable = (node: JdbcCatalogNode) => {
  if (expandedTableNodeId.value === node.nodeId) {
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
    activeInspectorTabId.value = "workspace";
  } catch (error: any) {
    errorMessage.value = error?.message || "执行选中 SQL 失败";
  } finally {
    submitting.value = false;
  }
};

const handleQuickRun = async (sql: string) => {
  injectSql(sql);
  await nextTick();
  await handleExecuteSql();
};

const handleExecuteSql = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await executeJdbcSql(activeConnectionId.value, sqlText.value);
    queryResult.value = response?.data || null;
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
  try {
    const response = await explainJdbcSql(activeConnectionId.value, sqlText.value);
    sqlExplainContent.value = response?.data || "";
  } catch (error: any) {
    errorMessage.value = error?.message || "AI 解释失败";
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

const requestSqlTemplate = async (node: JdbcCatalogNode, panelActionType: string) => {
  if (!activeConnectionId.value) {
    return "";
  }
  const response = await fetchPanelSqlTemplate(activeConnectionId.value, {
    panelCatalogName: node.catalogName,
    panelSchemaName: node.schemaName,
    panelTableName: node.tableName || node.nodeName,
    panelActionType,
    panelPreviewLimit: previewLimit.value,
  });
  return response?.data || "";
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

  if (action === "design-table" || action === "generate-doc") {
    await ensureInspectorTab(
      node,
      "table",
      action === "generate-doc" ? "document" : "structure",
      true,
    );
    return;
  }

  if (action === "edit-table") {
    await ensureInspectorTab(node, "table-edit", "columns", true);
    return;
  }

  if (action === "open-data") {
    await ensureInspectorTab(node, "table", "data", true);
    injectSql(await requestSqlTemplate(node, "select"));
    await handleExecuteSql();
    return;
  }

  if (action === "export-word") {
    await ensureInspectorTab(node, "table", "document", true);
    await nextTick();
    await detailRef.value?.exportWord();
    return;
  }

  if (action === "export-pdf") {
    await ensureInspectorTab(node, "table", "document", true);
    await nextTick();
    await detailRef.value?.exportPdf();
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
    injectSql(await requestSqlTemplate(node, "clear"));
    activeInspectorTabId.value = "workspace";
    return;
  }

  if (action === "sql-backup") {
    injectSql(await requestSqlTemplate(node, "backup"));
    activeInspectorTabId.value = "workspace";
    return;
  }

  if (action === "sql-truncate") {
    injectSql(await requestSqlTemplate(node, "truncate"));
    activeInspectorTabId.value = "workspace";
    return;
  }

  if (action === "sql-drop") {
    injectSql(await requestSqlTemplate(node, "drop"));
    activeInspectorTabId.value = "workspace";
  }
};

const handlePreviewLimitChange = (value: number | undefined) => {
  previewLimit.value = value && value > 0 ? value : 1000;
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
  loadSources();
  loadConfig();
  document.addEventListener("mousedown", handleGlobalPointerDown);
  await loadCachedConnections();
  const ticket = new URL(window.location.href).searchParams.get("ticket");
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
  gap: 12px;
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

.workspace-frame {
  min-height: calc(100vh - 160px);
}

.workspace-container {
  align-items: stretch;
  gap: 0;
}

.workspace-aside {
  overflow: hidden;
  transition: width 0.24s ease;
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
