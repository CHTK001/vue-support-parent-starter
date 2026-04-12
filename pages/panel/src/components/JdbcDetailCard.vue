<template>
  <section class="detail-shell">
    <div class="detail-main">
      <section v-if="activeWorkbenchTab" ref="documentPaperRef" class="workbench-shell">
        <header class="workbench-head">
          <div class="workbench-head__title">
            <small>{{ activeWorkbenchTab.tabType === "table-edit" ? "TABLE DESIGN" : "TABLE WORKBENCH" }}</small>
            <strong>{{ activeWorkbenchTab.tabName }}</strong>
            <span>{{ tablePath }}</span>
          </div>

          <ElSelect
            v-if="activeWorkbenchTab.tabType === 'table-edit'"
            v-model="editSection"
            class="workbench-head__select"
            size="small"
          >
            <ElOption
              v-for="item in editSectionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
          <ElTabs
            v-else
            v-model="tableView"
            class="workbench-tabs"
            tab-position="top"
          >
            <ElTabPane label="数据" name="data" />
            <ElTabPane label="结构" name="structure" />
            <ElTabPane label="DDL" name="ddl" />
            <ElTabPane label="文档" name="document" />
            <ElTabPane label="AI" name="ai" />
            <ElTabPane label="索引" name="indexes" />
          </ElTabs>
        </header>

        <div class="workbench-body">
          <template v-if="activeWorkbenchTab.tabType === 'table-edit'">
            <div v-if="editSection === 'columns'" class="workbench-panel">
              <ElTable :data="activeColumns" border height="100%">
                <ElTableColumn label="#" type="index" width="54" />
                <ElTableColumn label="字段名" min-width="180">
                  <template #default="{ row }">
                    <div class="field-name-cell">
                      <strong>{{ row.name || "-" }}</strong>
                      <ElTag v-if="isPrimary(row.name)" effect="plain" size="small" type="warning">
                        PK
                      </ElTag>
                    </div>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="类型" min-width="140" prop="type" />
                <ElTableColumn label="长度" min-width="82">
                  <template #default="{ row }">{{ row.size ?? "-" }}</template>
                </ElTableColumn>
                <ElTableColumn label="小数位" min-width="92">
                  <template #default="{ row }">{{ row.scale ?? "-" }}</template>
                </ElTableColumn>
                <ElTableColumn label="允许空" min-width="90">
                  <template #default="{ row }">{{ row.nullable ? "YES" : "NO" }}</template>
                </ElTableColumn>
                <ElTableColumn label="默认值" min-width="140">
                  <template #default="{ row }">{{ row.defaultValue ?? "-" }}</template>
                </ElTableColumn>
                <ElTableColumn label="备注" min-width="220">
                  <template #default="{ row }">{{ row.comment || "-" }}</template>
                </ElTableColumn>
              </ElTable>
            </div>

            <div v-else-if="editSection === 'indexes'" class="workbench-panel">
              <ElTable :data="activeIndexes" border height="100%">
                <ElTableColumn label="索引名" min-width="220" prop="name" />
                <ElTableColumn label="列" min-width="180" prop="column" />
                <ElTableColumn label="唯一" min-width="80">
                  <template #default="{ row }">{{ row.nonUnique ? "NO" : "YES" }}</template>
                </ElTableColumn>
                <ElTableColumn label="类型" min-width="100" prop="type" />
              </ElTable>
            </div>

            <div v-else class="workbench-panel workbench-panel--placeholder">
              <ElEmpty :description="`${editSectionLabel} 暂按当前数据库能力预留。`" />
            </div>
          </template>

          <template v-else>
            <div v-if="tableView === 'data'" class="workbench-panel">
              <div class="data-preview-head">
                <span>预设查询</span>
                <code>select * from {{ activeWorkbenchTab.tabName }} limit {{ previewLimit }}</code>
              </div>
              <ElTable
                v-if="queryResult?.query && queryResult.columns?.length"
                :data="queryResult.rows"
                border
                height="100%"
              >
                <ElTableColumn
                  v-for="column in queryResult.columns"
                  :key="column"
                  :label="column"
                  :min-width="140"
                >
                  <template #default="{ row }">{{ row[column] ?? "-" }}</template>
                </ElTableColumn>
              </ElTable>
              <ElEmpty v-else description="当前还没有查询结果，右键“打开数据”或在工作区执行 SQL。" />
            </div>

            <div v-else-if="tableView === 'structure'" class="workbench-panel">
              <ElTable :data="activeColumns" border height="100%">
                <ElTableColumn label="字段" min-width="180" prop="name" />
                <ElTableColumn label="类型" min-width="160" prop="type" />
                <ElTableColumn label="长度" min-width="90">
                  <template #default="{ row }">{{ row.size ?? "-" }}</template>
                </ElTableColumn>
                <ElTableColumn label="允许空" min-width="90">
                  <template #default="{ row }">{{ row.nullable ? "YES" : "NO" }}</template>
                </ElTableColumn>
                <ElTableColumn label="默认值" min-width="140">
                  <template #default="{ row }">{{ row.defaultValue ?? "-" }}</template>
                </ElTableColumn>
                <ElTableColumn label="备注" min-width="220">
                  <template #default="{ row }">{{ row.comment || "-" }}</template>
                </ElTableColumn>
              </ElTable>
            </div>

            <div v-else-if="tableView === 'ddl'" class="workbench-panel workbench-panel--code">
              <pre>{{ activeWorkbenchTab.ddlText || "-- 暂无 DDL" }}</pre>
            </div>

            <div v-else-if="tableView === 'document'" class="workbench-panel workbench-panel--doc">
              <article class="document-paper">
                <h2>{{ activeWorkbenchTab.tabName }} 数据字典</h2>
                <p>{{ tablePath }}</p>
                <p>{{ activeWorkbenchTab.documentContent || "暂无文档内容。" }}</p>
              </article>
            </div>

            <div v-else-if="tableView === 'ai'" class="workbench-panel workbench-panel--code">
              <pre>{{ activeWorkbenchTab.aiContent || "暂无 AI 结构说明。" }}</pre>
            </div>

            <div v-else class="workbench-panel">
              <ElTable :data="activeIndexes" border height="100%">
                <ElTableColumn label="索引名" min-width="220" prop="name" />
                <ElTableColumn label="列" min-width="180" prop="column" />
                <ElTableColumn label="唯一" min-width="80">
                  <template #default="{ row }">{{ row.nonUnique ? "NO" : "YES" }}</template>
                </ElTableColumn>
                <ElTableColumn label="类型" min-width="100" prop="type" />
              </ElTable>
            </div>
          </template>
        </div>
      </section>

      <section v-else-if="activeTabId === 'metadata'" class="metadata-shell">
        <header class="sql-toolbar sql-toolbar--plain">
          <div class="sql-toolbar__title">
            <small>DATASOURCE PROFILE</small>
            <strong>{{ datasourceMetadata?.databaseProductName || "数据库元信息" }}</strong>
          </div>
        </header>
        <div class="metadata-body">
          <JdbcDatasourceProfile
            :capabilities="capabilities"
            :metadata="datasourceMetadata"
          />
        </div>
      </section>

      <section v-else class="sql-shell">
        <header class="sql-toolbar">
          <div class="sql-toolbar__title">
            <small>SQL WORKSPACE</small>
            <strong>{{ activePath || "未选中对象" }}</strong>
          </div>

          <div class="sql-toolbar__actions">
            <ElTooltip content="执行全部 SQL (Ctrl/Cmd + Enter)">
              <ElButton circle :icon="VideoPlay" size="small" type="primary" @click="$emit('execute')" />
            </ElTooltip>
            <ElTooltip content="执行选中部分 (Ctrl/Cmd + Shift + Enter)">
              <ElButton circle :icon="CaretRight" size="small" @click="handleExecuteSelection" />
            </ElTooltip>
            <ElTooltip content="SQL 美化">
              <ElButton circle :icon="MagicStick" size="small" @click="handleFormatSql" />
            </ElTooltip>
            <ElTooltip content="解释 SQL">
              <ElButton circle :icon="QuestionFilled" size="small" @click="$emit('explain')" />
            </ElTooltip>
            <ElTooltip content="AI 生成 SQL">
              <ElButton circle :icon="Promotion" size="small" @click="aiDialogVisible = true" />
            </ElTooltip>
            <ElTooltip content="复制 SQL 代码块">
              <ElButton circle :icon="DocumentCopy" size="small" @click="handleCopyCodeBlock" />
            </ElTooltip>
            <ElTooltip content="保存 SQL">
              <ElButton circle :icon="FolderChecked" size="small" @click="handleSaveSql" />
            </ElTooltip>
          </div>
        </header>

        <div class="sql-editor-wrap">
          <MonacoEditor
            ref="sqlEditorRef"
            :height="'100%'"
            :model-value="sqlText"
            :options="editorOptions"
            language="sql"
            theme="vs"
            @editor-mounted="handleEditorMounted"
            @update:model-value="$emit('update:sqlText', $event)"
          />
        </div>

        <section class="sql-footer">
          <div class="sql-footer__tabs">
            <button
              type="button"
              class="footer-tab"
              :class="{ 'is-active': bottomPanel === 'result' }"
              @click="bottomPanel = 'result'"
            >
              结果
            </button>
            <button
              type="button"
              class="footer-tab"
              :class="{ 'is-active': bottomPanel === 'message' }"
              @click="bottomPanel = 'message'"
            >
              消息
            </button>
          </div>

          <div class="sql-footer__body">
            <div v-if="bottomPanel === 'result'" class="footer-panel">
              <ElTable
                v-if="queryResult?.query && queryResult.columns?.length"
                :data="queryResult.rows"
                border
                height="100%"
              >
                <ElTableColumn
                  v-for="column in queryResult.columns"
                  :key="column"
                  :label="column"
                  :min-width="140"
                >
                  <template #default="{ row }">{{ row[column] ?? "-" }}</template>
                </ElTableColumn>
              </ElTable>

              <div v-else class="footer-placeholder">
                <strong>{{ queryResult?.query ? "查询完成" : "等待执行 SQL" }}</strong>
                <span>
                  {{
                    queryResult
                      ? `影响行数 ${queryResult.affectedRows}`
                      : "执行结果会固定展示在这里，不再随点击抖动。"
                  }}
                </span>
              </div>
            </div>

            <div v-else class="footer-panel footer-panel--message">
              <div class="message-head">
                <ElTag effect="plain" size="small" type="success">
                  JDBC {{ capabilities?.jdbcEnabled ? "ON" : "OFF" }}
                </ElTag>
                <ElTag effect="plain" size="small" :type="capabilities?.aiEnabled ? 'primary' : 'info'">
                  AI {{ capabilities?.aiEnabled ? "ON" : "OFF" }}
                </ElTag>
                <ElTag effect="plain" size="small" :type="capabilities?.aiStarterEnabled ? 'warning' : 'info'">
                  Starter {{ capabilities?.aiStarterEnabled ? "ON" : "OFF" }}
                </ElTag>
              </div>

              <article v-if="errorMessage" class="message-card message-card--error">
                <strong>执行异常</strong>
                <p>{{ errorMessage }}</p>
              </article>

              <article v-if="capabilities?.message" class="message-card">
                <strong>能力结果</strong>
                <p>{{ capabilities.message }}</p>
              </article>

              <article class="message-card message-card--code">
                <strong>SQL 解释</strong>
                <pre>{{ sqlExplainContent || "点击工具栏解释按钮后，这里显示分析结果。" }}</pre>
              </article>
            </div>
          </div>
        </section>
      </section>
    </div>

    <aside class="rail-shell">
      <button
        type="button"
        class="rail-tab"
        :class="{ 'is-active': activeTabId === 'workspace' || !activeWorkbenchTab }"
        title="工作区"
        @click="$emit('activate-tab', 'workspace')"
      >
        <ElIcon><Monitor /></ElIcon>
      </button>
      <button
        type="button"
        class="rail-tab"
        :class="{ 'is-active': activeTabId === 'metadata' }"
        title="数据源信息"
        @click="$emit('activate-tab', 'metadata')"
      >
        <ElIcon><DataAnalysis /></ElIcon>
      </button>

      <button
        v-for="tab in tableTabs"
        :key="tab.tabId"
        type="button"
        class="rail-tab rail-tab--closable"
        :class="{ 'is-active': activeTabId === tab.tabId }"
        :title="tab.tabName"
        @click="$emit('activate-tab', tab.tabId)"
      >
        <ElIcon>
          <component :is="tab.tabType === 'table-edit' ? EditPen : Tickets" />
        </ElIcon>
        <span class="rail-close" @click.stop="$emit('close-tab', tab.tabId)">×</span>
      </button>
    </aside>

    <ElDialog v-model="aiDialogVisible" title="AI 生成 SQL" width="480px">
      <ElInput
        v-model="aiPrompt"
        :autosize="{ minRows: 4, maxRows: 8 }"
        placeholder="输入中文需求，例如：查询最近 7 天新增订单，并按天统计。"
        type="textarea"
      />
      <template #footer>
        <ElButton @click="aiDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleGenerateSql">生成</ElButton>
      </template>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import {
  CaretRight,
  DataAnalysis,
  DocumentCopy,
  EditPen,
  FolderChecked,
  MagicStick,
  Monitor,
  Promotion,
  QuestionFilled,
  Tickets,
  VideoPlay,
} from "@element-plus/icons-vue";
import MonacoEditor from "@repo/components/MonacoEditor/index.vue";
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTooltip,
} from "element-plus";
import * as monaco from "monaco-editor";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type {
  JdbcConnectionMetadata,
  JdbcQueryResult,
  JdbcTableStructure,
  PanelCapabilitySummary,
} from "../api";
import { exportDocumentToPdf, exportStructureToWord } from "../utils/documentExport";
import JdbcDatasourceProfile from "./JdbcDatasourceProfile.vue";

type InspectorTabType = "table" | "table-edit";
type InspectorViewMode = "data" | "structure" | "ddl" | "document" | "ai" | "indexes" | "columns";
type EditSection = "columns" | "indexes" | "foreign-keys" | "triggers" | "options";

interface InspectorTableTab {
  aiContent: string;
  ddlText: string;
  documentContent: string;
  node: Record<string, any>;
  structure: JdbcTableStructure | null;
  tabId: string;
  tabName: string;
  tabType: InspectorTabType;
  viewMode: InspectorViewMode;
}

const SQL_DRAFT_STORAGE_KEY = "panel:sql-draft:v1";

const props = defineProps<{
  activePath: string;
  activeTabId: string;
  capabilities: PanelCapabilitySummary | null;
  datasourceMetadata: JdbcConnectionMetadata | null;
  errorMessage: string;
  previewLimit: number;
  queryResult: JdbcQueryResult | null;
  sqlExplainContent: string;
  sqlSuggestions: string[];
  sqlText: string;
  submitting: boolean;
  tableTabs: InspectorTableTab[];
}>();

const emit = defineEmits<{
  (e: "activate-tab", value: string): void;
  (e: "close-tab", value: string): void;
  (e: "execute"): void;
  (e: "execute-selected", value: string): void;
  (e: "explain"): void;
  (e: "generate-sql", prompt: string): void;
  (e: "quick-run", sql: string): void;
  (e: "update:sqlText", value: string): void;
}>();

const sqlEditorRef = ref<any>(null);
const documentPaperRef = ref<HTMLElement | null>(null);
const aiDialogVisible = ref(false);
const aiPrompt = ref("");
const bottomPanel = ref<"message" | "result">("result");
const tableViewState = reactive<Record<string, InspectorViewMode>>({});
const editSection = ref<EditSection>("columns");
const editorInstance = ref<monaco.editor.IStandaloneCodeEditor | null>(null);
let completionDisposable: monaco.IDisposable | null = null;

const editSectionOptions = [
  { label: "字段", value: "columns" },
  { label: "索引", value: "indexes" },
  { label: "外键", value: "foreign-keys" },
  { label: "触发器", value: "triggers" },
  { label: "选项", value: "options" },
] satisfies Array<{ label: string; value: EditSection }>;

const activeWorkbenchTab = computed(
  () => props.tableTabs.find(item => item.tabId === props.activeTabId) || null,
);

const activeColumns = computed(() => activeWorkbenchTab.value?.structure?.columns || []);
const activeIndexes = computed(() => activeWorkbenchTab.value?.structure?.indexes || []);
const tablePath = computed(() =>
  [
    activeWorkbenchTab.value?.structure?.catalogName || activeWorkbenchTab.value?.node?.catalogName,
    activeWorkbenchTab.value?.structure?.schemaName || activeWorkbenchTab.value?.node?.schemaName,
    activeWorkbenchTab.value?.structure?.tableName || activeWorkbenchTab.value?.tabName,
  ]
    .filter(Boolean)
    .join("."),
);

const tableView = computed<InspectorViewMode>({
  get() {
    const tab = activeWorkbenchTab.value;
    if (!tab) {
      return "structure";
    }
    return tableViewState[tab.tabId] || tab.viewMode || "structure";
  },
  set(value) {
    const tab = activeWorkbenchTab.value;
    if (!tab) {
      return;
    }
    tableViewState[tab.tabId] = value;
  },
});

const editSectionLabel = computed(
  () => editSectionOptions.find(item => item.value === editSection.value)?.label || "当前页",
);

const editorOptions = computed(() => ({
  automaticLayout: true,
  fontSize: 13,
  lineNumbers: "on",
  minimap: { enabled: false },
  quickSuggestions: true,
  roundedSelection: true,
  scrollBeyondLastLine: false,
  suggestOnTriggerCharacters: true,
  tabSize: 2,
  wordWrap: "on",
}));

watch(
  () => props.tableTabs,
  tabs => {
    tabs.forEach(tab => {
      tableViewState[tab.tabId] = tableViewState[tab.tabId] || tab.viewMode || "structure";
    });
  },
  { deep: true, immediate: true },
);

watch(
  activeWorkbenchTab,
  tab => {
    if (!tab) {
      return;
    }
    if (tab.tabType === "table-edit") {
      editSection.value = (tab.viewMode === "indexes" ? "indexes" : "columns") as EditSection;
    }
  },
  { immediate: true },
);

const isPrimary = (columnName: string) =>
  (activeWorkbenchTab.value?.structure?.primaryKeys || []).includes(columnName);

const getSelectedSql = () =>
  String(
    editorInstance.value
      ?.getModel()
      ?.getValueInRange(editorInstance.value.getSelection() || new monaco.Selection(1, 1, 1, 1)) || "",
  ).trim();

const handleExecuteSelection = () => {
  emit("execute-selected", getSelectedSql());
};

const handleEditorMounted = (editor: monaco.editor.IStandaloneCodeEditor) => {
  editorInstance.value = editor;
  completionDisposable?.dispose();
  completionDisposable = monaco.languages.registerCompletionItemProvider("sql", {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startColumn: word.startColumn,
        endColumn: word.endColumn,
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
      };
      const keywords = [
        "SELECT",
        "FROM",
        "WHERE",
        "GROUP BY",
        "ORDER BY",
        "LIMIT",
        "INSERT INTO",
        "UPDATE",
        "DELETE FROM",
        "CREATE TABLE",
        "ALTER TABLE",
        "DROP TABLE",
        "TRUNCATE TABLE",
        "LEFT JOIN",
        "RIGHT JOIN",
        "INNER JOIN",
      ];
      const suggestions = [
        ...keywords.map(label => ({
          insertText: label,
          kind: monaco.languages.CompletionItemKind.Keyword,
          label,
          range,
        })),
        ...props.sqlSuggestions.map(label => ({
          insertText: label,
          kind: monaco.languages.CompletionItemKind.Field,
          label,
          range,
        })),
      ];
      return { suggestions };
    },
    triggerCharacters: [" ", ".", "_"],
  });
};

const formatSql = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/\b(select|from|where|group by|order by|left join|right join|inner join|limit|insert into|update|delete from|values|set|create table|alter table|drop table)\b/gi, "\n$1")
    .replace(/\n{2,}/g, "\n")
    .trim()
    .replace(/^\w/g, char => char.toUpperCase());

const handleFormatSql = () => {
  emit("update:sqlText", formatSql(props.sqlText));
};

const handleCopyCodeBlock = async () => {
  await navigator.clipboard.writeText(["```sql", props.sqlText.trim(), "```"].join("\n"));
  ElMessage.success("已复制 SQL 代码块");
};

const handleSaveSql = () => {
  localStorage.setItem(SQL_DRAFT_STORAGE_KEY, props.sqlText);
  ElMessage.success("SQL 已保存到本地草稿");
};

const handleGenerateSql = () => {
  const prompt = aiPrompt.value.trim();
  if (!prompt) {
    ElMessage.warning("请输入中文需求");
    return;
  }
  emit("generate-sql", prompt);
  aiDialogVisible.value = false;
  aiPrompt.value = "";
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  if (event.shiftKey) {
    handleExecuteSelection();
    return;
  }
  emit("execute");
};

const exportWord = async () => {
  const tab = activeWorkbenchTab.value;
  if (!tab?.structure) {
    ElMessage.warning("当前没有可导出的表结构");
    return;
  }
  await exportStructureToWord(tab.structure, tab.documentContent || "", tab.aiContent || "");
};

const exportPdf = async () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || !documentPaperRef.value) {
    ElMessage.warning("当前没有可导出的视图");
    return;
  }
  await exportDocumentToPdf(documentPaperRef.value, `${tab.tabName}-document`);
};

defineExpose({
  exportPdf,
  exportWord,
});

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  completionDisposable?.dispose();
});
</script>

<style scoped lang="scss">
.detail-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px;
  gap: 10px;
  min-height: calc(100vh - 172px);
}

.detail-main {
  min-width: 0;
  min-height: 0;
}

.sql-shell,
.metadata-shell,
.workbench-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: calc(100vh - 172px);
  border: 1px solid rgba(117, 135, 146, 0.2);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 250, 0.98));
  overflow: hidden;
}

.sql-shell {
  grid-template-rows: auto minmax(260px, 1fr) 300px;
}

.sql-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(123, 138, 149, 0.16);
  background: linear-gradient(180deg, rgba(247, 250, 252, 0.96), rgba(240, 245, 248, 0.92));
}

.sql-toolbar--plain {
  border-bottom: 1px solid rgba(123, 138, 149, 0.16);
}

.sql-toolbar__title,
.workbench-head__title {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.sql-toolbar__title small,
.workbench-head__title small {
  color: #678092;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.sql-toolbar__title strong,
.workbench-head__title strong {
  color: #102534;
  font-size: 14px;
}

.sql-toolbar__title span,
.workbench-head__title span {
  color: #6c8393;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sql-toolbar__actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.sql-editor-wrap {
  min-height: 0;
  padding: 10px;
  background: linear-gradient(180deg, rgba(234, 241, 247, 0.78), rgba(242, 246, 250, 0.92));
}

.sql-editor-wrap :deep(.monaco-editor-container) {
  height: 100%;
  border: 1px solid rgba(120, 136, 148, 0.18);
  border-radius: 14px;
  overflow: hidden;
}

.sql-footer {
  display: grid;
  grid-template-rows: 44px minmax(0, 1fr);
  min-height: 0;
  border-top: 1px solid rgba(123, 138, 149, 0.16);
  background: rgba(249, 251, 253, 0.95);
}

.sql-footer__tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
}

.footer-tab {
  min-width: 92px;
  padding: 7px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #5f7686;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.footer-tab.is-active {
  border-color: rgba(59, 130, 246, 0.18);
  background: rgba(59, 130, 246, 0.08);
  color: #1454a8;
}

.sql-footer__body,
.footer-panel,
.workbench-body,
.workbench-panel,
.metadata-body {
  min-height: 0;
  height: 100%;
}

.sql-footer__body,
.metadata-body {
  padding: 0 10px 10px;
}

.footer-panel {
  overflow: hidden;
}

.footer-panel :deep(.el-table),
.workbench-panel :deep(.el-table) {
  height: 100%;
}

.footer-placeholder,
.message-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
}

.footer-placeholder {
  place-items: center;
  height: 100%;
  text-align: center;
  color: #6a7f8f;
}

.footer-panel--message {
  display: grid;
  align-content: start;
  gap: 10px;
  overflow: auto;
}

.message-head {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.message-card--error {
  border-color: rgba(239, 68, 68, 0.18);
  background: rgba(254, 242, 242, 0.96);
}

.message-card--code pre,
.workbench-panel--code pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #213a4b;
  font-size: 12px;
  line-height: 1.65;
}

.metadata-body {
  overflow: auto;
}

.workbench-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(123, 138, 149, 0.16);
  background: linear-gradient(180deg, rgba(247, 250, 252, 0.96), rgba(240, 245, 248, 0.92));
}

.workbench-head__select {
  width: 150px;
}

.workbench-tabs {
  min-width: 520px;
}

.workbench-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.workbench-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.workbench-body {
  padding: 10px;
  overflow: hidden;
}

.workbench-panel {
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  overflow: hidden;
}

.workbench-panel--placeholder {
  display: grid;
  place-items: center;
}

.workbench-panel--doc {
  overflow: auto;
  padding: 20px;
  background: linear-gradient(180deg, #f7f2ea, #f2ece1);
}

.document-paper {
  width: min(900px, 100%);
  margin: 0 auto;
  padding: 28px;
  border: 1px solid rgba(139, 122, 98, 0.18);
  border-radius: 10px;
  background: #fffdf8;
  box-shadow: 0 18px 34px rgba(126, 104, 79, 0.08);
}

.document-paper h2 {
  margin: 0 0 10px;
  color: #4b3726;
}

.document-paper p {
  margin: 0 0 12px;
  color: #5f5142;
  line-height: 1.7;
  white-space: pre-wrap;
}

.data-preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(123, 138, 149, 0.14);
  color: #5e7686;
  font-size: 12px;
}

.data-preview-head code {
  color: #174b8c;
}

.field-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rail-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rail-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(123, 138, 149, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  color: #607788;
  cursor: pointer;
  transition: all 0.18s ease;
}

.rail-tab.is-active {
  border-color: rgba(37, 99, 235, 0.18);
  background: linear-gradient(180deg, rgba(230, 241, 255, 0.98), rgba(220, 235, 252, 0.94));
  color: #1250a2;
}

.rail-tab--closable {
  overflow: visible;
}

.rail-close {
  position: absolute;
  top: -4px;
  right: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #fef2f2;
  color: #b42318;
  font-size: 11px;
  line-height: 1;
}

@media (max-width: 1200px) {
  .detail-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .rail-shell {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .sql-shell,
  .metadata-shell,
  .workbench-shell {
    min-height: auto;
  }
}
</style>
