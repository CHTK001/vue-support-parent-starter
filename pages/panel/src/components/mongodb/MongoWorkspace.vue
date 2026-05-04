<template>
  <section class="mongo-workspace">
    <ScLayout
      v-model="railTabValue"
      class="mongo-layout"
      left-enabled
      :left-width="260"
      :left-min-width="180"
      :left-max-width="360"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <!-- 左侧：数据库 → Collection 树 -->
      <template #left>
        <div class="tree-panel">
          <div class="tree-toolbar">
            <ElInput
              v-model="treeSearch"
              placeholder="搜索数据库 / 集合"
              clearable
              size="small"
            >
              <template #prefix><ElIcon><Search /></ElIcon></template>
            </ElInput>
            <ElTooltip content="刷新">
              <ElButton :icon="RefreshRight" circle size="small" :loading="treeLoading" @click="loadDatabases" />
            </ElTooltip>
          </div>

          <ElScrollbar class="tree-scroll">
            <div v-if="treeLoading && !filteredDatabases.length" class="tree-empty">
              <ElIcon class="is-loading"><Loading /></ElIcon>
              <span>加载中…</span>
            </div>
            <div v-else-if="!filteredDatabases.length" class="tree-empty">
              <ElEmpty description="暂无数据库" :image-size="48" />
            </div>
            <div v-else class="db-list">
              <div
                v-for="db in filteredDatabases"
                :key="db.name"
                class="db-item"
              >
                <!-- 数据库行 -->
                <div
                  class="db-row"
                  :class="{ 'is-expanded': db.expanded, 'is-active': activeDb === db.name }"
                  @click="toggleDb(db)"
                  @mouseenter="hoveredDb = db.name"
                  @mouseleave="hoveredDb = ''"
                >
                  <ElIcon class="db-row__arrow" :class="{ 'is-expanded': db.expanded }">
                    <ArrowRight />
                  </ElIcon>
                  <ElIcon class="db-row__icon"><Coin /></ElIcon>
                  <span class="db-row__name">{{ db.name }}</span>
                  <div v-if="hoveredDb === db.name" class="db-row__actions" @click.stop>
                    <ElTooltip content="数据库统计">
                      <ElButton :icon="DataAnalysis" circle plain size="small" @click="showDbStats(db.name)" />
                    </ElTooltip>
                  </div>
                </div>

                <!-- Collection 列表 -->
                <div v-if="db.expanded" class="col-list">
                  <div v-if="db.loading" class="col-loading">
                    <ElIcon class="is-loading"><Loading /></ElIcon>
                  </div>
                  <div
                    v-for="col in db.collections"
                    v-else
                    :key="col"
                    class="col-row"
                    :class="{ 'is-active': activeDb === db.name && activeCollection === col }"
                    @click="selectCollection(db.name, col)"
                    @mouseenter="hoveredCol = `${db.name}::${col}`"
                    @mouseleave="hoveredCol = ''"
                  >
                    <ElIcon class="col-row__icon"><Grid /></ElIcon>
                    <span class="col-row__name">{{ col }}</span>
                    <div
                      v-if="hoveredCol === `${db.name}::${col}`"
                      class="col-row__actions"
                      @click.stop
                    >
                      <ElTooltip content="统计">
                        <ElButton :icon="DataAnalysis" circle plain size="small" @click="showCollStats(db.name, col)" />
                      </ElTooltip>
                      <ElTooltip content="删除集合">
                        <ElButton :icon="Delete" circle plain size="small" type="danger" @click="confirmDropCollection(db.name, col)" />
                      </ElTooltip>
                    </div>
                  </div>
                  <div v-if="!db.loading && !db.collections.length" class="col-empty">
                    暂无集合
                  </div>
                </div>
              </div>
            </div>
          </ElScrollbar>
        </div>
      </template>

      <!-- 右侧主内容 -->
      <template #default>
        <div class="main-content">

          <!-- 工作区 tab -->
          <template v-if="railTabValue === 'workspace'">
            <div v-if="!activeCollection" class="empty-workspace">
              <div class="empty-workspace__inner">
                <ElIcon class="empty-workspace__icon"><Grid /></ElIcon>
                <p>从左侧选择一个集合</p>
              </div>
            </div>
            <div v-else class="docs-panel">
              <!-- 工具栏 -->
              <div class="docs-toolbar">
                <div class="docs-toolbar__left">
                  <span class="docs-breadcrumb">
                    <span class="docs-breadcrumb__db">{{ activeDb }}</span>
                    <span class="docs-breadcrumb__sep">.</span>
                    <span class="docs-breadcrumb__col">{{ activeCollection }}</span>
                  </span>
                  <ElTag type="info" effect="plain" size="small">{{ totalDocs }} 文档</ElTag>
                </div>
                <div class="docs-toolbar__right">
                  <ElTooltip content="插入文档">
                    <ElButton :icon="Plus" type="primary" circle size="small" @click="openInsertDialog" />
                  </ElTooltip>
                  <ElTooltip content="创建索引">
                    <ElButton :icon="SetUp" circle size="small" @click="openIndexDialog" />
                  </ElTooltip>
                  <ElTooltip content="刷新">
                    <ElButton :icon="RefreshRight" circle size="small" :loading="docsLoading" @click="loadDocuments" />
                  </ElTooltip>
                </div>
              </div>

              <!-- 过滤器 -->
              <div class="filter-bar">
                <div class="filter-bar__inputs">
                  <div class="filter-field">
                    <span class="filter-field__label">Filter</span>
                    <ElInput
                      v-model="filterJson"
                      placeholder='{ "field": "value" }'
                      class="filter-field__input"
                      @keyup.enter="loadDocuments"
                    />
                  </div>
                  <div class="filter-field">
                    <span class="filter-field__label">Sort</span>
                    <ElInput
                      v-model="sortJson"
                      placeholder='{ "_id": -1 }'
                      class="filter-field__input"
                      @keyup.enter="loadDocuments"
                    />
                  </div>
                  <div class="filter-field filter-field--narrow">
                    <span class="filter-field__label">Limit</span>
                    <ElInputNumber
                      v-model="pageSize"
                      :min="1"
                      :max="500"
                      :controls="false"
                      class="filter-field__input"
                    />
                  </div>
                </div>
                <ElButton type="primary" size="small" @click="loadDocuments">
                  <ElIcon><Search /></ElIcon>
                  查询
                </ElButton>
              </div>

              <!-- 文档列表 -->
              <ElScrollbar class="docs-scroll">
                <div v-if="docsLoading" class="docs-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
                <div v-else-if="!documents.length" class="docs-empty">
                  <ElEmpty description="暂无文档" :image-size="56" />
                </div>
                <div v-else class="doc-cards">
                  <div
                    v-for="(doc, idx) in documents"
                    :key="idx"
                    class="doc-card"
                    @mouseenter="hoveredDocIdx = idx"
                    @mouseleave="hoveredDocIdx = -1"
                  >
                    <div class="doc-card__header">
                      <span class="doc-card__id">{{ getDocId(doc) }}</span>
                      <div v-if="hoveredDocIdx === idx" class="doc-card__actions">
                        <ElTooltip content="编辑">
                          <ElButton :icon="EditPen" circle plain size="small" @click="openEditDialog(doc)" />
                        </ElTooltip>
                        <ElTooltip content="删除">
                          <ElButton :icon="Delete" circle plain size="small" type="danger" @click="confirmDeleteDoc(doc)" />
                        </ElTooltip>
                      </div>
                    </div>
                    <pre class="doc-card__body" v-html="highlightJson(JSON.stringify(doc, null, 2))" />
                  </div>
                </div>
              </ElScrollbar>

              <!-- 分页 -->
              <div v-if="documents.length" class="docs-pagination">
                <ElButton
                  :disabled="currentPage <= 1"
                  size="small"
                  @click="prevPage"
                >
                  <ElIcon><ArrowLeft /></ElIcon>
                  上一页
                </ElButton>
                <span class="page-info">第 {{ currentPage }} 页</span>
                <ElButton
                  :disabled="documents.length < pageSize"
                  size="small"
                  @click="nextPage"
                >
                  下一页
                  <ElIcon><ArrowRight /></ElIcon>
                </ElButton>
              </div>
            </div>
          </template>

          <!-- Shell tab -->
          <template v-else-if="railTabValue === 'shell'">
            <div class="shell-panel">
              <div class="shell-header">
                <span class="shell-title">MongoDB Shell</span>
                <div class="shell-header__right">
                  <span class="shell-db-label">db:</span>
                  <ElSelect
                    v-model="shellDb"
                    size="small"
                    style="width: 140px"
                    placeholder="选择数据库"
                  >
                    <ElOption
                      v-for="db in databases"
                      :key="db.name"
                      :label="db.name"
                      :value="db.name"
                    />
                  </ElSelect>
                  <ElButton :icon="Delete" circle plain size="small" @click="shellHistory = []" />
                </div>
              </div>
              <ElScrollbar ref="shellScrollRef" class="shell-output">
                <div class="shell-lines">
                  <div
                    v-for="(line, idx) in shellHistory"
                    :key="idx"
                    class="shell-line"
                    :class="`is-${line.type}`"
                  >
                    <span v-if="line.type === 'cmd'" class="shell-prompt">mongo&gt;</span>
                    <pre class="shell-text">{{ line.text }}</pre>
                  </div>
                  <div v-if="!shellHistory.length" class="shell-hint">
                    输入 JSON 命令，如 {"ping":1} 或 {"listCollections":1}
                  </div>
                </div>
              </ElScrollbar>
              <div class="shell-input-row">
                <span class="shell-prompt-inline">mongo&gt;</span>
                <ElInput
                  v-model="shellInput"
                  placeholder='{"ping": 1}'
                  class="shell-input"
                  @keyup.enter="executeShell"
                  @keyup.up="navigateShellHistory(-1)"
                  @keyup.down="navigateShellHistory(1)"
                />
                <ElTooltip content="执行">
                  <ElButton type="primary" :icon="CaretRight" circle size="small" @click="executeShell" />
                </ElTooltip>
              </div>
            </div>
          </template>

          <!-- 信息 tab -->
          <template v-else-if="railTabValue === 'info'">
            <div class="info-panel">
              <div class="info-header">
                <span class="info-title">
                  {{ statsTarget ? `${statsTarget.db}${statsTarget.col ? '.' + statsTarget.col : ''} 统计` : '数据库统计' }}
                </span>
                <ElButton :icon="RefreshRight" circle size="small" @click="refreshStats" />
              </div>
              <ElScrollbar class="info-scroll">
                <div v-if="statsLoading" class="stats-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
                <div v-else-if="statsData" class="stats-content">
                  <div class="stats-cards">
                    <div
                      v-for="(val, key) in statsHighlights"
                      :key="key"
                      class="stats-card"
                    >
                      <span class="stats-card__label">{{ key }}</span>
                      <span class="stats-card__value">{{ val }}</span>
                    </div>
                  </div>
                  <div class="stats-raw">
                    <div class="stats-raw__title">原始数据</div>
                    <pre class="stats-pre" v-html="highlightJson(JSON.stringify(statsData, null, 2))" />
                  </div>
                </div>
                <ElEmpty v-else description="从左侧选择数据库或集合查看统计" :image-size="56" />
              </ElScrollbar>
            </div>
          </template>

        </div>
      </template>
    </ScLayout>

    <!-- 插入文档对话框 -->
    <ElDialog
      v-model="insertDialogVisible"
      title="插入文档"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="json-editor-wrap">
        <ElInput
          v-model="insertJson"
          type="textarea"
          :rows="14"
          placeholder='{"field": "value"}'
          class="json-editor"
          resize="none"
        />
        <div v-if="insertJsonError" class="json-error">{{ insertJsonError }}</div>
      </div>
      <template #footer>
        <ElButton @click="insertDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="insertLoading" @click="submitInsert">插入</ElButton>
      </template>
    </ElDialog>

    <!-- 编辑文档对话框 -->
    <ElDialog
      v-model="editDialogVisible"
      title="编辑文档"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="json-editor-wrap">
        <ElInput
          v-model="editJson"
          type="textarea"
          :rows="14"
          class="json-editor"
          resize="none"
        />
        <div v-if="editJsonError" class="json-error">{{ editJsonError }}</div>
      </div>
      <template #footer>
        <ElButton @click="editDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="editLoading" @click="submitEdit">保存</ElButton>
      </template>
    </ElDialog>

    <!-- 创建索引对话框 -->
    <ElDialog
      v-model="indexDialogVisible"
      title="创建索引"
      width="440px"
      :close-on-click-modal="false"
    >
      <ElForm :model="indexForm" label-width="80px">
        <ElFormItem label="字段 Keys">
          <ElInput v-model="indexForm.keys" placeholder='{"field": 1}' />
        </ElFormItem>
        <ElFormItem label="唯一索引">
          <ElSwitch v-model="indexForm.unique" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="indexDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="indexLoading" @click="submitIndex">创建</ElButton>
      </template>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  Coin,
  DataAnalysis,
  Delete,
  EditPen,
  Grid,
  Loading,
  Plus,
  RefreshRight,
  Search,
  SetUp,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElScrollbar,
  ElSelect,
  ElSwitch,
  ElTag,
  ElTooltip,
} from "element-plus";
import { computed, markRaw, nextTick, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import {
  aggregateMongo,
  closeMongoConnection,
  createMongoIndex,
  deleteMongoDocument,
  dropMongoCollection,
  executeMongoCommand,
  fetchMongoDbStats,
  fetchMongoStats,
  findMongoDocuments,
  insertMongoDocument,
  listMongoCollections,
  listMongoDatabases,
  updateMongoDocument,
} from "../../api/mongo";

const props = defineProps<{ connectionId: string }>();
const emit = defineEmits<{ (e: "close"): void }>();

// ─── Rail tabs ────────────────────────────────────────────────────────────────
const railTabs = [
  { name: "workspace", title: "工作区", icon: markRaw(Grid) },
  { name: "shell", title: "Shell", icon: markRaw(CaretRight) },
  { name: "info", title: "统计信息", icon: markRaw(DataAnalysis) },
];
const railTabValue = ref("workspace");

// ─── 数据库树 ─────────────────────────────────────────────────────────────────
interface DbNode {
  name: string;
  expanded: boolean;
  loading: boolean;
  collections: string[];
}

const databases = ref<DbNode[]>([]);
const treeLoading = ref(false);
const treeSearch = ref("");
const hoveredDb = ref("");
const hoveredCol = ref("");

const filteredDatabases = computed(() => {
  const term = treeSearch.value.trim().toLowerCase();
  if (!term) return databases.value;
  return databases.value
    .map((db) => ({
      ...db,
      collections: db.collections.filter((c) => c.toLowerCase().includes(term)),
    }))
    .filter((db) => db.name.toLowerCase().includes(term) || db.collections.length > 0);
});

const loadDatabases = async () => {
  treeLoading.value = true;
  try {
    const res = await listMongoDatabases(props.connectionId);
    const names: string[] = res?.data ?? [];
    databases.value = names.map((name) => ({
      name,
      expanded: false,
      loading: false,
      collections: [],
    }));
  } catch {
    ElMessage.error("加载数据库列表失败");
  } finally {
    treeLoading.value = false;
  }
};

const toggleDb = async (db: DbNode) => {
  db.expanded = !db.expanded;
  if (db.expanded && !db.collections.length) {
    db.loading = true;
    try {
      const res = await listMongoCollections(props.connectionId, db.name);
      db.collections = res?.data ?? [];
    } catch {
      ElMessage.error(`加载 ${db.name} 集合失败`);
    } finally {
      db.loading = false;
    }
  }
};

// ─── 选中集合 ─────────────────────────────────────────────────────────────────
const activeDb = ref("");
const activeCollection = ref("");
const documents = ref<Record<string, unknown>[]>([]);
const totalDocs = ref(0);
const docsLoading = ref(false);
const filterJson = ref("{}");
const sortJson = ref("{}");
const pageSize = ref(20);
const currentPage = ref(1);
const hoveredDocIdx = ref(-1);

const selectCollection = (db: string, col: string) => {
  activeDb.value = db;
  activeCollection.value = col;
  currentPage.value = 1;
  railTabValue.value = "workspace";
  loadDocuments();
};

const loadDocuments = async () => {
  if (!activeDb.value || !activeCollection.value) return;
  docsLoading.value = true;
  try {
    const skip = (currentPage.value - 1) * pageSize.value;
    const res = await findMongoDocuments(
      props.connectionId,
      activeDb.value,
      activeCollection.value,
      filterJson.value || "{}",
      sortJson.value || "{}",
      pageSize.value,
      skip
    );
    documents.value = res?.data ?? [];
    totalDocs.value = documents.value.length + skip;
  } catch {
    ElMessage.error("查询文档失败");
  } finally {
    docsLoading.value = false;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadDocuments();
  }
};

const nextPage = () => {
  currentPage.value++;
  loadDocuments();
};

const getDocId = (doc: Record<string, unknown>) => {
  const id = doc["_id"];
  if (!id) return "(no _id)";
  if (typeof id === "object" && id !== null) return JSON.stringify(id);
  return String(id);
};

// ─── 插入文档 ─────────────────────────────────────────────────────────────────
const insertDialogVisible = ref(false);
const insertJson = ref("{\n  \n}");
const insertJsonError = ref("");
const insertLoading = ref(false);

const openInsertDialog = () => {
  insertJson.value = "{\n  \n}";
  insertJsonError.value = "";
  insertDialogVisible.value = true;
};

const submitInsert = async () => {
  insertJsonError.value = "";
  try {
    JSON.parse(insertJson.value);
  } catch (e: any) {
    insertJsonError.value = "JSON 格式错误: " + e.message;
    return;
  }
  insertLoading.value = true;
  try {
    await insertMongoDocument(props.connectionId, activeDb.value, activeCollection.value, insertJson.value);
    ElMessage.success("插入成功");
    insertDialogVisible.value = false;
    await loadDocuments();
  } catch (e: any) {
    ElMessage.error("插入失败: " + (e?.message ?? ""));
  } finally {
    insertLoading.value = false;
  }
};

// ─── 编辑文档 ─────────────────────────────────────────────────────────────────
const editDialogVisible = ref(false);
const editJson = ref("");
const editJsonError = ref("");
const editLoading = ref(false);
const editingDoc = ref<Record<string, unknown> | null>(null);

const openEditDialog = (doc: Record<string, unknown>) => {
  editingDoc.value = doc;
  editJson.value = JSON.stringify(doc, null, 2);
  editJsonError.value = "";
  editDialogVisible.value = true;
};

const submitEdit = async () => {
  editJsonError.value = "";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(editJson.value);
  } catch (e: any) {
    editJsonError.value = "JSON 格式错误: " + e.message;
    return;
  }
  const id = editingDoc.value?.["_id"];
  if (!id) {
    ElMessage.error("文档缺少 _id，无法更新");
    return;
  }
  const filter = JSON.stringify({ _id: id });
  // 移除 _id 避免更新时报错
  const { _id, ...updateFields } = parsed;
  editLoading.value = true;
  try {
    await updateMongoDocument(
      props.connectionId,
      activeDb.value,
      activeCollection.value,
      filter,
      JSON.stringify(updateFields)
    );
    ElMessage.success("更新成功");
    editDialogVisible.value = false;
    await loadDocuments();
  } catch (e: any) {
    ElMessage.error("更新失败: " + (e?.message ?? ""));
  } finally {
    editLoading.value = false;
  }
};

// ─── 删除文档 ─────────────────────────────────────────────────────────────────
const confirmDeleteDoc = async (doc: Record<string, unknown>) => {
  const id = doc["_id"];
  if (!id) return;
  try {
    await ElMessageBox.confirm("确认删除该文档？此操作不可恢复。", "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    const filter = JSON.stringify({ _id: id });
    await deleteMongoDocument(props.connectionId, activeDb.value, activeCollection.value, filter);
    ElMessage.success("删除成功");
    await loadDocuments();
  } catch {
    // 取消
  }
};

// ─── 删除集合 ─────────────────────────────────────────────────────────────────
const confirmDropCollection = async (db: string, col: string) => {
  try {
    await ElMessageBox.confirm(
      `确认删除集合 "${db}.${col}"？此操作不可恢复！`,
      "删除集合",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
    await dropMongoCollection(props.connectionId, db, col);
    ElMessage.success("集合已删除");
    const dbNode = databases.value.find((d) => d.name === db);
    if (dbNode) {
      dbNode.collections = dbNode.collections.filter((c) => c !== col);
    }
    if (activeDb.value === db && activeCollection.value === col) {
      activeCollection.value = "";
      documents.value = [];
    }
  } catch {
    // 取消
  }
};

// ─── 创建索引 ─────────────────────────────────────────────────────────────────
const indexDialogVisible = ref(false);
const indexLoading = ref(false);
const indexForm = ref({ keys: '{"_id": 1}', unique: false });

const openIndexDialog = () => {
  indexForm.value = { keys: '{"_id": 1}', unique: false };
  indexDialogVisible.value = true;
};

const submitIndex = async () => {
  try {
    JSON.parse(indexForm.value.keys);
  } catch {
    ElMessage.error("Keys JSON 格式错误");
    return;
  }
  indexLoading.value = true;
  try {
    const name = await createMongoIndex(
      props.connectionId,
      activeDb.value,
      activeCollection.value,
      indexForm.value.keys,
      indexForm.value.unique
    );
    ElMessage.success(`索引创建成功: ${name?.data}`);
    indexDialogVisible.value = false;
  } catch (e: any) {
    ElMessage.error("创建索引失败: " + (e?.message ?? ""));
  } finally {
    indexLoading.value = false;
  }
};

// ─── 统计信息 ─────────────────────────────────────────────────────────────────
const statsData = ref<Record<string, unknown> | null>(null);
const statsLoading = ref(false);
const statsTarget = ref<{ db: string; col?: string } | null>(null);

const statsHighlights = computed(() => {
  if (!statsData.value) return {};
  const d = statsData.value;
  const result: Record<string, string> = {};
  const pick = (key: string, label: string, fmt?: (v: unknown) => string) => {
    if (key in d) result[label] = fmt ? fmt(d[key]) : String(d[key]);
  };
  pick("ns", "命名空间");
  pick("count", "文档数");
  pick("size", "数据大小", (v) => formatBytes(Number(v)));
  pick("storageSize", "存储大小", (v) => formatBytes(Number(v)));
  pick("nindexes", "索引数");
  pick("totalIndexSize", "索引大小", (v) => formatBytes(Number(v)));
  pick("db", "数据库");
  pick("collections", "集合数");
  pick("objects", "对象数");
  pick("dataSize", "数据大小", (v) => formatBytes(Number(v)));
  return result;
});

const showDbStats = async (db: string) => {
  statsTarget.value = { db };
  railTabValue.value = "info";
  await loadDbStats(db);
};

const showCollStats = async (db: string, col: string) => {
  statsTarget.value = { db, col };
  railTabValue.value = "info";
  await loadCollStats(db, col);
};

const loadDbStats = async (db: string) => {
  statsLoading.value = true;
  try {
    const res = await fetchMongoDbStats(props.connectionId, db);
    statsData.value = res?.data ?? null;
  } catch {
    ElMessage.error("加载数据库统计失败");
  } finally {
    statsLoading.value = false;
  }
};

const loadCollStats = async (db: string, col: string) => {
  statsLoading.value = true;
  try {
    const res = await fetchMongoStats(props.connectionId, db, col);
    statsData.value = res?.data ?? null;
  } catch {
    ElMessage.error("加载集合统计失败");
  } finally {
    statsLoading.value = false;
  }
};

const refreshStats = async () => {
  if (!statsTarget.value) return;
  if (statsTarget.value.col) {
    await loadCollStats(statsTarget.value.db, statsTarget.value.col);
  } else {
    await loadDbStats(statsTarget.value.db);
  }
};

// ─── Shell ────────────────────────────────────────────────────────────────────
interface ShellLine {
  type: "cmd" | "result" | "error";
  text: string;
}

const shellInput = ref("");
const shellHistory = ref<ShellLine[]>([]);
const shellCmdHistory = ref<string[]>([]);
const shellHistoryIdx = ref(-1);
const shellScrollRef = ref();
const shellDb = ref("");

const executeShell = async () => {
  const cmd = shellInput.value.trim();
  if (!cmd) return;
  const db = shellDb.value || activeDb.value || "admin";
  shellHistory.value.push({ type: "cmd", text: cmd });
  shellCmdHistory.value.unshift(cmd);
  shellHistoryIdx.value = -1;
  shellInput.value = "";
  try {
    JSON.parse(cmd); // 验证 JSON
    const res = await executeMongoCommand(props.connectionId, db, cmd);
    const result = res?.data;
    shellHistory.value.push({
      type: "result",
      text: typeof result === "object" ? JSON.stringify(result, null, 2) : String(result ?? "(null)"),
    });
  } catch (e: any) {
    shellHistory.value.push({ type: "error", text: e?.message ?? "执行失败" });
  }
  await nextTick();
  shellScrollRef.value?.setScrollTop(99999);
};

const navigateShellHistory = (dir: -1 | 1) => {
  const len = shellCmdHistory.value.length;
  if (!len) return;
  shellHistoryIdx.value = Math.max(-1, Math.min(len - 1, shellHistoryIdx.value + dir));
  shellInput.value = shellHistoryIdx.value >= 0 ? shellCmdHistory.value[shellHistoryIdx.value] : "";
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────
const highlightJson = (json: string) =>
  json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (/^"/.test(match)) cls = /:$/.test(match) ? "json-key" : "json-string";
        else if (/true|false/.test(match)) cls = "json-bool";
        else if (/null/.test(match)) cls = "json-null";
        return `<span class="${cls}">${match}</span>`;
      }
    );

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// 初始化
loadDatabases();
</script>

<style scoped lang="scss">
.mongo-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.mongo-layout {
  height: 100%;
  min-height: 0;
}

/* ── 左侧树面板 ── */
.tree-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 10px 8px;
  background: linear-gradient(180deg, #f9fbfd, #f2f6f9);
  border-right: 1px solid rgba(135, 151, 163, 0.14);
}

.tree-toolbar {
  display: flex;
  gap: 6px;
  align-items: center;
}

.tree-toolbar :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(118, 137, 150, 0.16) inset;
}

.tree-scroll {
  min-height: 0;
  height: 100%;
}

.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  color: #8fa3b0;
  font-size: 13px;
}

/* 数据库列表 */
.db-list {
  display: flex;
  flex-direction: column;
}

.db-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  user-select: none;

  &:hover { background: rgba(37, 99, 235, 0.06); }
  &.is-active { background: rgba(37, 99, 235, 0.1); }
}

.db-row__arrow {
  flex-shrink: 0;
  font-size: 11px;
  color: #8fa3b0;
  transition: transform 0.18s;

  &.is-expanded { transform: rotate(90deg); }
}

.db-row__icon {
  flex-shrink: 0;
  font-size: 14px;
  color: #f59e0b;
}

.db-row__name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #102431;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.db-row__actions {
  flex-shrink: 0;
  display: flex;
  gap: 2px;
}

/* Collection 列表 */
.col-list {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
}

.col-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  color: #8fa3b0;
  font-size: 12px;
}

.col-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover { background: rgba(16, 185, 129, 0.06); }
  &.is-active { background: rgba(16, 185, 129, 0.12); }
}

.col-row__icon {
  flex-shrink: 0;
  font-size: 13px;
  color: #10b981;
}

.col-row__name {
  flex: 1;
  font-size: 12px;
  color: #1e3a4a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "JetBrains Mono", monospace;
}

.col-row__actions {
  flex-shrink: 0;
  display: flex;
  gap: 2px;
}

.col-empty {
  padding: 6px 8px;
  font-size: 11px;
  color: #a0b0bc;
}

/* ── 主内容区 ── */
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.empty-workspace {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8fa3b0;
}

.empty-workspace__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-workspace__icon {
  font-size: 52px;
  opacity: 0.25;
}

/* ── 文档面板 ── */
.docs-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
}

.docs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(135, 151, 163, 0.12);
  background: rgba(249, 251, 253, 0.95);
  gap: 10px;
}

.docs-toolbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.docs-toolbar__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.docs-breadcrumb {
  font-size: 13px;
  font-weight: 600;
  color: #102431;
  font-family: "JetBrains Mono", monospace;
}

.docs-breadcrumb__db { color: #2563eb; }
.docs-breadcrumb__sep { color: #8fa3b0; margin: 0 1px; }
.docs-breadcrumb__col { color: #10b981; }

/* 过滤器 */
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(135, 151, 163, 0.1);
  background: rgba(244, 248, 251, 0.8);
  flex-wrap: wrap;
}

.filter-bar__inputs {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 140px;
}

.filter-field--narrow {
  flex: 0 0 90px;
  min-width: 90px;
}

.filter-field__label {
  font-size: 10px;
  font-weight: 600;
  color: #8fa3b0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-field__input {
  width: 100%;
}

.filter-field :deep(.el-input__wrapper),
.filter-field :deep(.el-input-number) {
  border-radius: 8px;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
}

/* 文档列表 */
.docs-scroll {
  min-height: 0;
  height: 100%;
}

.docs-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #8fa3b0;
  font-size: 24px;
}

.docs-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.doc-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
}

.doc-card {
  border: 1px solid rgba(135, 151, 163, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;

  &:hover {
    border-color: rgba(37, 99, 235, 0.2);
    box-shadow: 0 4px 16px rgba(15, 37, 52, 0.08);
  }
}

.doc-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(135, 151, 163, 0.1);
  background: rgba(249, 251, 253, 0.9);
}

.doc-card__id {
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  font-family: "JetBrains Mono", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-card__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.doc-card__body {
  margin: 0;
  padding: 10px 12px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 11.5px;
  line-height: 1.65;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 280px;
  overflow: auto;
  background: #fafcfe;
}

/* 分页 */
.docs-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 14px;
  border-top: 1px solid rgba(135, 151, 163, 0.1);
  background: rgba(249, 251, 253, 0.9);
}

.page-info {
  font-size: 12px;
  color: #6b7f8e;
  min-width: 60px;
  text-align: center;
}

/* ── Shell 面板 ── */
.shell-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
  background: #0f1923;
}

.shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.shell-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.shell-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shell-db-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  font-family: monospace;
}

.shell-output {
  min-height: 0;
  height: 100%;
}

.shell-lines {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.shell-hint {
  color: rgba(255, 255, 255, 0.22);
  font-size: 12px;
  font-family: monospace;
  padding: 8px 0;
}

.shell-line {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  line-height: 1.6;

  &.is-cmd .shell-text { color: #e2e8f0; }
  &.is-result .shell-text { color: #4ade80; }
  &.is-error .shell-text { color: #f87171; }
}

.shell-prompt {
  color: #f59e0b;
  font-weight: 600;
  flex-shrink: 0;
}

.shell-text {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.shell-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

.shell-prompt-inline {
  color: #f59e0b;
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
  flex-shrink: 0;
}

.shell-input {
  flex: 1;
}

.shell-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: none;
  border-radius: 8px;
}

.shell-input :deep(.el-input__inner) {
  color: #e2e8f0;
  font-family: monospace;
  font-size: 12px;
}

/* ── 统计信息面板 ── */
.info-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(135, 151, 163, 0.12);
}

.info-title {
  font-size: 13px;
  font-weight: 600;
  color: #102431;
  font-family: "JetBrains Mono", monospace;
}

.info-scroll {
  min-height: 0;
  height: 100%;
}

.stats-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #8fa3b0;
  font-size: 24px;
}

.stats-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.stats-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(249, 251, 253, 0.9);
  border: 1px solid rgba(135, 151, 163, 0.14);
}

.stats-card__label {
  font-size: 11px;
  color: #8fa3b0;
  font-weight: 500;
}

.stats-card__value {
  font-size: 15px;
  font-weight: 700;
  color: #102431;
}

.stats-raw {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-raw__title {
  font-size: 11px;
  font-weight: 600;
  color: #6b7f8e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stats-pre {
  margin: 0;
  padding: 14px;
  border-radius: 10px;
  background: #f4f7fa;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 11.5px;
  line-height: 1.7;
  color: #2d3748;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid rgba(135, 151, 163, 0.14);
}

/* JSON 高亮 */
:deep(.json-key) { color: #2563eb; font-weight: 600; }
:deep(.json-string) { color: #16a34a; }
:deep(.json-number) { color: #d97706; }
:deep(.json-bool) { color: #7c3aed; }
:deep(.json-null) { color: #9ca3af; }

/* JSON 编辑器 */
.json-editor-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.json-editor :deep(.el-textarea__inner) {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.65;
  border-radius: 10px;
}

.json-error {
  font-size: 12px;
  color: #dc2626;
  padding: 4px 2px;
}

/* ── Dark Mode ── */
:global(html.dark) {
  .tree-panel {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(20, 30, 48, 0.84));
    border-right-color: rgba(148, 163, 184, 0.08);
  }

  .tree-toolbar :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.12) inset;
    background: rgba(15, 23, 42, 0.6);
  }

  .db-row {
    &:hover { background: rgba(99, 102, 241, 0.08); }
    &.is-active { background: rgba(99, 102, 241, 0.14); }
  }

  .db-row__arrow { color: #64748b; }
  .db-row__name { color: #e2e8f0; }

  .col-row {
    &:hover { background: rgba(16, 185, 129, 0.08); }
    &.is-active { background: rgba(16, 185, 129, 0.14); }
  }

  .col-row__name { color: #cbd5e1; }

  .docs-toolbar {
    background: rgba(15, 23, 42, 0.7);
    border-bottom-color: rgba(148, 163, 184, 0.1);
  }

  .docs-breadcrumb { color: #e2e8f0; }
  .docs-breadcrumb__db { color: #a5b4fc; }
  .docs-breadcrumb__sep { color: #64748b; }
  .docs-breadcrumb__col { color: #34d399; }

  .filter-bar {
    background: rgba(15, 23, 42, 0.5);
    border-bottom-color: rgba(148, 163, 184, 0.1);
  }

  .filter-field__label { color: #64748b; }

  .filter-field :deep(.el-input__wrapper),
  .filter-field :deep(.el-input-number) {
    background: rgba(15, 23, 42, 0.6);
  }

  .doc-card {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(148, 163, 184, 0.1);

    &:hover {
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
  }

  .doc-card__header {
    background: rgba(15, 23, 42, 0.5);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }

  .doc-card__id { color: #a5b4fc; }

  .doc-card__body {
    background: rgba(15, 23, 42, 0.4);
    color: #e2e8f0;
  }

  .docs-pagination {
    background: rgba(15, 23, 42, 0.7);
    border-top-color: rgba(148, 163, 184, 0.1);
  }

  .page-info { color: #94a3b8; }

  .info-header { border-bottom-color: rgba(148, 163, 184, 0.1); }
  .info-title { color: #e2e8f0; }

  .stats-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.1);
  }

  .stats-card__label { color: #64748b; }
  .stats-card__value { color: #e2e8f0; }

  .stats-raw__title { color: #64748b; }

  .stats-pre {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(148, 163, 184, 0.1);
    color: #e2e8f0;
  }

  .json-editor :deep(.el-textarea__inner) {
    background: rgba(15, 23, 42, 0.7);
    color: #e2e8f0;
    border-color: rgba(148, 163, 184, 0.2);
  }

  .empty-workspace { color: #64748b; }
  .docs-loading { color: #64748b; }
}
</style>

