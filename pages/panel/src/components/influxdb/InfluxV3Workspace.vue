<template>
  <section class="influxv3-workspace">
    <ScLayout
      v-model="railTabValue"
      class="influxv3-layout"
      left-enabled
      :left-width="260"
      :left-min-width="180"
      :left-max-width="360"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <!-- ─── 左侧面板 ─────────────────────────────────────────────────────── -->
      <template #left>
        <div class="left-panel">
          <div class="left-header">
            <span class="left-header__title">
              <ElIcon class="left-header__icon"><DataLine /></ElIcon>
              Databases
            </span>
            <ElTooltip content="刷新">
              <ElButton
                :icon="RefreshRight"
                circle
                size="small"
                :loading="databasesLoading"
                @click="loadDatabases"
              />
            </ElTooltip>
          </div>

          <ElScrollbar class="left-scroll">
            <div v-if="databasesLoading && !databases.length" class="left-empty">
              <ElIcon class="is-loading"><Loading /></ElIcon>
              <span>加载中…</span>
            </div>
            <div v-else-if="!databases.length" class="left-empty">
              <ElEmpty description="暂无 Database" :image-size="40" />
            </div>
            <div v-else class="db-tree">
              <div v-for="db in databases" :key="db" class="db-node">
                <div
                  class="db-node__header"
                  :class="{ 'is-active': activeDatabase === db }"
                  @click="toggleDatabase(db)"
                >
                  <ElIcon class="db-node__arrow" :class="{ 'is-expanded': expandedDatabases.has(db) }">
                    <ArrowRight />
                  </ElIcon>
                  <ElIcon class="db-node__icon"><Coin /></ElIcon>
                  <span class="db-node__name">{{ db }}</span>
                  <ElIcon v-if="tablesLoading.has(db)" class="is-loading db-node__spin">
                    <Loading />
                  </ElIcon>
                </div>

                <div v-if="expandedDatabases.has(db)" class="table-list">
                  <div v-if="!tableMap[db]?.length" class="table-empty">
                    <span>暂无表</span>
                  </div>
                  <div
                    v-for="t in tableMap[db]"
                    :key="t"
                    class="table-item"
                    :class="{ 'is-active': activeTable === t && activeDatabase === db }"
                    @click="selectTable(db, t)"
                  >
                    <ElIcon class="table-item__icon"><Grid /></ElIcon>
                    <span class="table-item__name">{{ t }}</span>
                  </div>
                </div>
              </div>
            </div>
          </ElScrollbar>
        </div>
      </template>

      <!-- ─── 右侧主内容 ──────────────────────────────────────────────────── -->
      <template #default>
        <div class="main-content">

          <!-- 工作区 tab：SQL 查询 -->
          <template v-if="railTabValue === 'workspace'">
            <div class="query-panel">
              <div class="query-header">
                <span class="query-title">
                  <ElIcon><DataAnalysis /></ElIcon>
                  SQL 查询
                </span>
                <div class="query-header__right">
                  <ElSelect
                    v-model="queryDatabase"
                    placeholder="选择数据库"
                    size="small"
                    style="width: 160px"
                    clearable
                  >
                    <ElOption v-for="db in databases" :key="db" :label="db" :value="db" />
                  </ElSelect>
                  <ElButton
                    type="primary"
                    size="small"
                    :loading="queryLoading"
                    @click="executeQuery"
                  >
                    <ElIcon><CaretRight /></ElIcon>
                    执行
                  </ElButton>
                  <ElButton size="small" :icon="Delete" circle @click="clearQuery" />
                </div>
              </div>

              <div class="query-editor-wrap">
                <div class="query-editor-label">SQL</div>
                <ElInput
                  v-model="sqlQuery"
                  type="textarea"
                  :rows="6"
                  placeholder="输入 SQL 查询，例如：&#10;SELECT * FROM cpu WHERE time > now() - interval '1 hour' LIMIT 100"
                  class="sql-editor"
                  resize="none"
                  @keydown.ctrl.enter="executeQuery"
                />
                <div class="query-editor-hint">Ctrl+Enter 执行</div>
              </div>

              <!-- 结果区 -->
              <div class="result-area">
                <div v-if="queryLoading" class="result-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                  <span>查询中…</span>
                </div>
                <div v-else-if="queryError" class="result-error">
                  <ElIcon><Warning /></ElIcon>
                  <span>{{ queryError }}</span>
                </div>
                <div v-else-if="queryRows.length" class="result-content">
                  <div class="result-meta">
                    <ElTag type="success" effect="plain" size="small">
                      {{ queryRows.length }} 行
                    </ElTag>
                    <ElTag type="info" effect="plain" size="small">
                      {{ queryColumns.length }} 列
                    </ElTag>
                  </div>
                  <ElScrollbar class="result-scroll">
                    <table class="result-table">
                      <thead>
                        <tr>
                          <th v-for="col in queryColumns" :key="col">{{ col }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, idx) in queryRows" :key="idx">
                          <td v-for="col in queryColumns" :key="col" :class="getCellClass(col, row[col])">
                            {{ formatCell(row[col]) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </ElScrollbar>
                </div>
                <div v-else class="result-placeholder">
                  <ElEmpty description="输入 SQL 查询并点击执行" :image-size="64" />
                </div>
              </div>
            </div>
          </template>

          <!-- 写入 tab -->
          <template v-else-if="railTabValue === 'write'">
            <div class="write-panel">
              <div class="panel-header">
                <span class="panel-title">
                  <ElIcon><EditPen /></ElIcon>
                  写入 Line Protocol
                </span>
              </div>

              <div class="write-form">
                <div class="write-field">
                  <span class="write-field__label">目标 Database</span>
                  <ElSelect
                    v-model="writeDatabase"
                    placeholder="选择 Database"
                    size="small"
                    style="width: 220px"
                  >
                    <ElOption v-for="db in databases" :key="db" :label="db" :value="db" />
                  </ElSelect>
                </div>

                <div class="write-editor-wrap">
                  <div class="query-editor-label">Line Protocol</div>
                  <ElInput
                    v-model="lineProtocol"
                    type="textarea"
                    :rows="10"
                    placeholder="输入 Line Protocol 数据，例如：&#10;cpu,host=server01 usage_idle=72.0,usage_user=28.0 1609459200000000000"
                    class="sql-editor"
                    resize="none"
                  />
                  <div class="query-editor-hint">格式：measurement[,tag_key=tag_val]... field_key=field_val[,...] [timestamp]</div>
                </div>

                <div class="write-actions">
                  <ElButton
                    type="primary"
                    :loading="writeLoading"
                    :disabled="!writeDatabase || !lineProtocol.trim()"
                    @click="executeWrite"
                  >
                    <ElIcon><Upload /></ElIcon>
                    写入数据
                  </ElButton>
                  <ElButton @click="lineProtocol = ''">清空</ElButton>
                </div>

                <div v-if="writeSuccess" class="write-success">
                  <ElIcon><CircleCheck /></ElIcon>
                  写入成功
                </div>
                <div v-if="writeError" class="write-error">
                  <ElIcon><Warning /></ElIcon>
                  {{ writeError }}
                </div>
              </div>
            </div>
          </template>

          <!-- 信息 tab -->
          <template v-else-if="railTabValue === 'info'">
            <div class="info-panel">
              <div class="panel-header">
                <span class="panel-title">
                  <ElIcon><InfoFilled /></ElIcon>
                  InfluxDB 3.x 信息
                </span>
                <ElButton :icon="RefreshRight" circle size="small" :loading="healthLoading" @click="loadHealth" />
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="healthLoading" class="panel-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
                <div v-else-if="healthInfo" class="info-content">
                  <div class="health-banner" :class="`is-${healthInfo.status}`">
                    <div class="health-banner__icon">
                      <ElIcon v-if="healthInfo.status === 'pass'"><CircleCheck /></ElIcon>
                      <ElIcon v-else><Warning /></ElIcon>
                    </div>
                    <div class="health-banner__body">
                      <span class="health-banner__status">{{ healthInfo.status === 'pass' ? '健康' : '异常' }}</span>
                      <span class="health-banner__msg">{{ healthInfo.message || 'InfluxDB 3.x 运行正常' }}</span>
                    </div>
                  </div>

                  <div class="info-cards">
                    <div class="info-card">
                      <div class="info-card__icon"><ElIcon><Cpu /></ElIcon></div>
                      <div class="info-card__body">
                        <span class="info-card__label">版本</span>
                        <span class="info-card__value">{{ healthInfo.version || '-' }}</span>
                      </div>
                    </div>
                    <div class="info-card">
                      <div class="info-card__icon"><ElIcon><Connection /></ElIcon></div>
                      <div class="info-card__body">
                        <span class="info-card__label">服务名称</span>
                        <span class="info-card__value">{{ healthInfo.name || 'influxdb' }}</span>
                      </div>
                    </div>
                    <div class="info-card">
                      <div class="info-card__icon"><ElIcon><Coin /></ElIcon></div>
                      <div class="info-card__body">
                        <span class="info-card__label">Database 数量</span>
                        <span class="info-card__value">{{ databases.length }}</span>
                      </div>
                    </div>
                    <div class="info-card">
                      <div class="info-card__icon"><ElIcon><Document /></ElIcon></div>
                      <div class="info-card__body">
                        <span class="info-card__label">Commit</span>
                        <span class="info-card__value info-card__value--mono">{{ healthInfo.commit || '-' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="info-section">
                    <div class="info-section__title">Database 列表</div>
                    <div class="db-chips">
                      <span
                        v-for="db in databases"
                        :key="db"
                        class="db-chip"
                        @click="activeDatabase = db; railTabValue = 'workspace'"
                      >
                        <ElIcon><Coin /></ElIcon>
                        {{ db }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="panel-empty">
                  <ElEmpty description="点击刷新获取信息" :image-size="56" />
                </div>
              </ElScrollbar>
            </div>
          </template>

        </div>
      </template>
    </ScLayout>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  CaretRight,
  CircleCheck,
  Coin,
  Connection,
  Cpu,
  DataAnalysis,
  DataLine,
  Delete,
  Document,
  EditPen,
  Grid,
  InfoFilled,
  Loading,
  RefreshRight,
  Upload,
  Warning,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElEmpty,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElScrollbar,
  ElSelect,
  ElTag,
  ElTooltip,
} from "element-plus";
import { computed, markRaw, onMounted, reactive, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import {
  fetchInfluxV3Health,
  listInfluxV3Databases,
  listInfluxV3Tables,
  queryInfluxV3,
  writeInfluxV3,
  type InfluxV3HealthInfo,
  type InfluxV3QueryRow,
} from "../../api/influxv3";

const props = defineProps<{ connectionId: string }>();
const emit = defineEmits<{ (e: "close"): void }>();

// ─── Rail tabs ────────────────────────────────────────────────────────────────
const railTabs = [
  { name: "workspace", title: "查询", icon: markRaw(DataAnalysis) },
  { name: "write", title: "写入", icon: markRaw(EditPen) },
  { name: "info", title: "信息", icon: markRaw(InfoFilled) },
];
const railTabValue = ref("workspace");

// ─── Databases & Tables ───────────────────────────────────────────────────────
const databases = ref<string[]>([]);
const databasesLoading = ref(false);
const expandedDatabases = ref(new Set<string>());
const tableMap = reactive<Record<string, string[]>>({});
const tablesLoading = ref(new Set<string>());
const activeDatabase = ref("");
const activeTable = ref("");

const loadDatabases = async () => {
  databasesLoading.value = true;
  try {
    const res = await listInfluxV3Databases(props.connectionId);
    databases.value = res?.data ?? [];
  } catch {
    ElMessage.error("加载 Database 失败");
  } finally {
    databasesLoading.value = false;
  }
};

const loadTables = async (database: string) => {
  if (tableMap[database]) return;
  tablesLoading.value.add(database);
  try {
    const res = await listInfluxV3Tables(props.connectionId, database);
    tableMap[database] = res?.data ?? [];
  } catch {
    tableMap[database] = [];
  } finally {
    tablesLoading.value.delete(database);
  }
};

const toggleDatabase = (database: string) => {
  activeDatabase.value = database;
  if (expandedDatabases.value.has(database)) {
    expandedDatabases.value.delete(database);
  } else {
    expandedDatabases.value.add(database);
    loadTables(database);
  }
};

const selectTable = (database: string, table: string) => {
  activeDatabase.value = database;
  activeTable.value = table;
  queryDatabase.value = database;
  sqlQuery.value = `SELECT * FROM "${table}" WHERE time > now() - interval '1 hour' LIMIT 100`;
  railTabValue.value = "workspace";
};

// ─── SQL 查询 ─────────────────────────────────────────────────────────────────
const sqlQuery = ref("");
const queryDatabase = ref("");
const queryLoading = ref(false);
const queryError = ref("");
const queryRows = ref<InfluxV3QueryRow[]>([]);

const queryColumns = computed(() => {
  if (!queryRows.value.length) return [];
  const priorityCols = ["time", "measurement"];
  const allKeys = new Set<string>();
  queryRows.value.forEach((r) => Object.keys(r).forEach((k) => allKeys.add(k)));
  const extra = [...allKeys].filter((k) => !priorityCols.includes(k)).sort();
  return [...priorityCols.filter((c) => allKeys.has(c)), ...extra];
});

const clearQuery = () => {
  sqlQuery.value = "";
  queryRows.value = [];
  queryError.value = "";
};

const executeQuery = async () => {
  if (!sqlQuery.value.trim()) {
    ElMessage.warning("请输入 SQL 查询");
    return;
  }
  queryLoading.value = true;
  queryError.value = "";
  queryRows.value = [];
  try {
    const res = await queryInfluxV3(props.connectionId, queryDatabase.value, sqlQuery.value);
    queryRows.value = res?.data ?? [];
  } catch (e: any) {
    queryError.value = e?.message ?? "查询失败";
  } finally {
    queryLoading.value = false;
  }
};

const formatCell = (val: unknown): string => {
  if (val === null || val === undefined) return "-";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

const getCellClass = (col: string, val: unknown) => ({
  "cell--time": col === "time",
  "cell--value": typeof val === "number",
  "cell--null": val === null || val === undefined,
});

// ─── 写入 ─────────────────────────────────────────────────────────────────────
const writeDatabase = ref("");
const lineProtocol = ref("");
const writeLoading = ref(false);
const writeSuccess = ref(false);
const writeError = ref("");

const executeWrite = async () => {
  if (!writeDatabase.value || !lineProtocol.value.trim()) return;
  writeLoading.value = true;
  writeSuccess.value = false;
  writeError.value = "";
  try {
    await writeInfluxV3(props.connectionId, writeDatabase.value, lineProtocol.value);
    writeSuccess.value = true;
    setTimeout(() => (writeSuccess.value = false), 3000);
  } catch (e: any) {
    writeError.value = e?.message ?? "写入失败";
  } finally {
    writeLoading.value = false;
  }
};

// ─── 健康信息 ─────────────────────────────────────────────────────────────────
const healthInfo = ref<InfluxV3HealthInfo | null>(null);
const healthLoading = ref(false);

const loadHealth = async () => {
  healthLoading.value = true;
  try {
    const res = await fetchInfluxV3Health(props.connectionId);
    healthInfo.value = res?.data ?? null;
  } catch {
    ElMessage.error("获取健康状态失败");
  } finally {
    healthLoading.value = false;
  }
};

// ─── 初始化 ───────────────────────────────────────────────────────────────────
onMounted(() => {
  loadDatabases();
  loadHealth();
});
</script>

<style scoped lang="scss">
.influxv3-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.influxv3-layout {
  height: 100%;
}

// ─── 左侧面板 ──────────────────────────────────────────────────────────────────
.left-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  position: relative;
  background: linear-gradient(180deg, #f0f2f9, #e8ecf5);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #f97316);
    z-index: 10;
    pointer-events: none;
  }
}

.left-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
}

.left-header__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.04em;
}

.left-header__icon {
  color: #f97316;
  font-size: 14px;
}

.left-scroll {
  flex: 1;
  min-height: 0;
}

.left-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: #94a3b8;
  font-size: 12px;
}

// ─── Database 树 ───────────────────────────────────────────────────────────────
.db-tree {
  padding: 4px 0;
}

.db-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: rgba(249, 115, 22, 0.06);
  }

  &.is-active {
    background: rgba(249, 115, 22, 0.1);
    color: #c2410c;
  }
}

.db-node__arrow {
  font-size: 11px;
  color: #94a3b8;
  transition: transform 0.18s;
  flex-shrink: 0;

  &.is-expanded {
    transform: rotate(90deg);
  }
}

.db-node__icon {
  color: #f97316;
  font-size: 13px;
  flex-shrink: 0;
}

.db-node__name {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.db-node__spin {
  color: #f97316;
  font-size: 12px;
}

.table-list {
  padding-left: 24px;
  border-left: 2px solid rgba(99, 102, 241, 0.2);
  margin-left: 18px;
}

.table-empty {
  padding: 6px 10px;
  font-size: 11px;
  color: #94a3b8;
}

.table-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.12s;

  &:hover {
    background: rgba(99, 102, 241, 0.06);
  }

  &.is-active {
    background: rgba(99, 102, 241, 0.12);
    color: #6366f1;
  }
}

.table-item__icon {
  color: #6366f1;
  font-size: 12px;
  flex-shrink: 0;
}

.table-item__name {
  font-size: 12px;
  color: #334155;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ─── 主内容区 ──────────────────────────────────────────────────────────────────
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

// ─── 查询面板 ──────────────────────────────────────────────────────────────────
.query-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

.query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.query-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.query-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-editor-wrap {
  position: relative;
  flex-shrink: 0;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b, #1e293b);
}

.query-editor-label {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  z-index: 1;
}

.query-editor-hint {
  padding: 4px 12px 6px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  background: transparent;
}

.sql-editor {
  :deep(.el-textarea__inner) {
    font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
    font-size: 13px;
    line-height: 1.7;
    color: #e2e8f0;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 12px 14px 8px;
    resize: none;
    box-shadow: none;

    &::placeholder {
      color: rgba(255, 255, 255, 0.2);
    }
  }
}

// ─── 结果区 ────────────────────────────────────────────────────────────────────
.result-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
}

.result-loading,
.result-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 1;
  color: #94a3b8;
  font-size: 13px;

  .el-icon {
    font-size: 28px;
    color: #94a3b8;
  }
}

.result-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  color: #dc2626;
  font-size: 13px;
  background: rgba(220, 38, 38, 0.04);
  border-radius: 8px;
  margin: 12px;

  .el-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
}

.result-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  flex-shrink: 0;
}

.result-scroll {
  flex: 1;
  min-height: 0;
}

.result-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;

  th {
    position: sticky;
    top: 0;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    color: #64748b;
    background: rgba(99, 102, 241, 0.04);
    backdrop-filter: blur(4px);
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    white-space: nowrap;
    z-index: 1;
  }

  td {
    padding: 6px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
    color: #334155;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  tr:hover td {
    background: rgba(99, 102, 241, 0.04);
  }
}

.cell--time {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: #94a3b8;
}

.cell--value {
  font-family: "JetBrains Mono", monospace;
  font-weight: 600;
  color: #6366f1;
}

.cell--null {
  color: #94a3b8;
  font-style: italic;
}

// ─── 写入面板 ──────────────────────────────────────────────────────────────────
.write-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.write-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.write-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.write-field__label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.write-editor-wrap {
  position: relative;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b, #1e293b);
}

.write-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.write-success {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  font-size: 13px;
  font-weight: 500;
}

.write-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.06);
  color: #dc2626;
  font-size: 13px;
}

// ─── 信息面板 ──────────────────────────────────────────────────────────────────
.info-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

.panel-scroll {
  flex: 1;
  min-height: 0;
}

.panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #94a3b8;
  font-size: 24px;
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.health-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid transparent;
  backdrop-filter: blur(8px);

  &.is-pass {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
    border-color: rgba(16, 185, 129, 0.2);
    color: #059669;
  }

  &:not(.is-pass) {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05));
    border-color: rgba(220, 38, 38, 0.2);
    color: #dc2626;
  }
}

.health-banner__icon {
  font-size: 28px;
  flex-shrink: 0;
}

.health-banner__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.health-banner__status {
  font-size: 16px;
  font-weight: 700;
}

.health-banner__msg {
  font-size: 12px;
  opacity: 0.75;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.1);
    transform: translateY(-1px);
  }
}

.info-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08));
  color: #f97316;
  font-size: 16px;
  flex-shrink: 0;
}

.info-card__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.info-card__label {
  font-size: 11px;
  color: #64748b;
}

.info-card__value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--mono {
    font-family: "JetBrains Mono", monospace;
    font-size: 11px;
  }
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-section__title {
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.04em;
}

.db-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.db-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 20px;
  background: rgba(99, 102, 241, 0.06);
  color: #6366f1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;

  &:hover {
    background: rgba(99, 102, 241, 0.12);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
  }
}

// ── Dark Mode ──
:global(html.dark) {
  .left-panel {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(20, 30, 48, 0.84));
    border-right: 1px solid rgba(99, 102, 241, 0.1);

    &::after {
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #f97316);
      opacity: 0.6;
    }
  }
  .left-header {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(8px);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }
  .left-header__title {
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .left-empty { color: #64748b; }

  .db-node__header {
    &:hover { background: rgba(249, 115, 22, 0.1); }
    &.is-active { background: rgba(249, 115, 22, 0.18); color: #fb923c; }
  }
  .db-node__name { color: #e2e8f0; }
  .db-node__arrow { color: #64748b; }
  .table-list { border-left-color: rgba(99, 102, 241, 0.25); }
  .table-empty { color: #64748b; }

  .table-item {
    &:hover { background: rgba(148, 163, 184, 0.06); }
    &.is-active { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; }
  }
  .table-item__name { color: #cbd5e1; }

  .query-title {
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .result-area {
    background: rgba(15, 23, 42, 0.5);
    border-color: rgba(99, 102, 241, 0.15);
    backdrop-filter: blur(8px);
  }
  .result-loading,
  .result-placeholder {
    color: #64748b;
    .el-icon { color: #475569; }
  }
  .result-error { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
  .result-meta {
    background: rgba(99, 102, 241, 0.04);
    border-bottom-color: rgba(99, 102, 241, 0.12);
  }
  .result-table {
    th {
      color: #94a3b8;
      background: rgba(99, 102, 241, 0.08);
      border-bottom-color: rgba(99, 102, 241, 0.15);
    }
    td {
      color: #cbd5e1;
      border-bottom-color: rgba(148, 163, 184, 0.06);
    }
    tr:hover td { background: rgba(99, 102, 241, 0.06); }
  }
  .cell--time { color: #64748b; }
  .cell--value { color: #a5b4fc; }
  .cell--null { color: #475569; }

  .panel-title {
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .write-field__label { color: #94a3b8; }
  .write-editor-wrap { border-color: rgba(99, 102, 241, 0.2); }
  .query-editor-wrap { border-color: rgba(99, 102, 241, 0.2); }
  .write-success { background: rgba(16, 185, 129, 0.12); color: #34d399; }
  .write-error { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
  .panel-loading { color: #64748b; }

  .health-banner {
    &.is-pass {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06));
      border-color: rgba(16, 185, 129, 0.25);
      color: #34d399;
    }
    &:not(.is-pass) {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06));
      border-color: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }
  }

  .info-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(99, 102, 241, 0.15);
    backdrop-filter: blur(8px);

    &:hover {
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
    }
  }
  .info-card__label { color: #64748b; }
  .info-card__value { color: #e2e8f0; }
  .info-section__title {
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .db-chip {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
    &:hover {
      background: rgba(99, 102, 241, 0.2);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
    }
  }
}
</style>

