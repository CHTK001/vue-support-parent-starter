<!--
  数据管理页：选数据源 → 选库 → 选表 → 看实际数据行，附「清空表」与「SQL 执行」两个工具。

  定位与数据源中心的隐藏控制台 /db-manager 不同：这里只做「看得见 + 写得进 + 清得掉」三件事，
  是正式菜单入口；API 全部复用数据源中心（/ms/datasource/** 与 /ms/monitor/db/**），
  本页不自建任何后端能力。SQL 执行成功后自动刷新当前表 —— 「写入即所见」。
-->
<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { onActivated, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import ReTable from "@repo/ui/re-table";
import RePagination from "@repo/ui/re-pagination";
import ReButton from "@repo/ui/re-button";
import type { ReTableColumn } from "@repo/ui/re-table";
import { fetchDataSources } from "@pages/datasource";
import type { DataSourceInfo } from "@pages/datasource";
import {
  executeDbSql,
  fetchDbDatabases,
  fetchDbTables,
  fetchTableData,
} from "@pages/datasource/src/api/manageConsoles";
import type { DbQueryResult, DbTableInfo } from "@pages/datasource/src/api/manageConsoles";
import { truncateDbTable } from "@pages/datasource/src/api/dbManageApi";

const router = useRouter();

/* ---------------------------- 数据源 / 库 / 表联动 ---------------------------- */

/** 可浏览的数据源：只列启用的 JDBC 类型（InfluxDB/Redis 等走各自控制台） */
const datasources = ref<DataSourceInfo[]>([]);
const datasourceId = ref<number | undefined>(undefined);
const datasourceLoading = ref(false);
const databases = ref<string[]>([]);
const database = ref("");
const tables = ref<DbTableInfo[]>([]);
const tablesLoading = ref(false);
const table = ref("");
const tableFilter = ref("");

/** 台账里一张 JDBC 数据源都没有时的引导态 */
const noDatasource = computed(() => !datasourceLoading.value && datasources.value.length === 0);

/** 表名过滤：只影响左侧候选，不重新拉数 */
const filteredTables = computed(() => {
  const keyword = tableFilter.value.trim().toLowerCase();
  const list = tables.value;
  return keyword ? list.filter(item => item.name.toLowerCase().includes(keyword)) : list;
});

async function loadDatasources(): Promise<void> {
  datasourceLoading.value = true;
  try {
    const rows = (await fetchDataSources()) ?? [];
    datasources.value = rows.filter(
      row => (row.type || "jdbc") === "jdbc" && (row.status === null || row.status !== 0),
    );
    const current = datasources.value.find(row => row.id === datasourceId.value);
    if (!current) {
      datasourceId.value = datasources.value[0]?.id;
      database.value = "";
      table.value = "";
    }
    if (datasourceId.value !== undefined) {
      await loadDatabases();
    }
  } catch (error) {
    ElMessage.error(`读取数据源失败：${msg(error)}`);
  } finally {
    datasourceLoading.value = false;
  }
}

async function loadDatabases(): Promise<void> {
  try {
    databases.value = (await fetchDbDatabases(datasourceId.value)) ?? [];
    if (!databases.value.includes(database.value)) {
      database.value = databases.value[0] ?? "";
    }
    await loadTables();
  } catch (error) {
    ElMessage.error(`读取数据库列表失败：${msg(error)}`);
  }
}

async function loadTables(): Promise<void> {
  tablesLoading.value = true;
  try {
    tables.value = (await fetchDbTables(datasourceId.value, database.value)) ?? [];
    const current = tables.value.find(item => item.name === table.value);
    if (!current) {
      table.value = "";
      clearRows();
    }
  } catch (error) {
    ElMessage.error(`读取表清单失败：${msg(error)}`);
  } finally {
    tablesLoading.value = false;
  }
}

/* ---------------------------- 表数据：分页 / 排序 ---------------------------- */

const rows = ref<Record<string, unknown>[]>([]);
const columns = ref<string[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(50);
const dataLoading = ref(false);
const sortState = reactive<{ prop: string; order: "ASC" | "DESC" | "" }>({ prop: "", order: "" });

/** 已选表：所有取数动作都以它为准 */
const activeTable = computed(() => table.value);

function clearRows(): void {
  rows.value = [];
  columns.value = [];
  total.value = 0;
  page.value = 1;
}

async function loadRows(targetPage = page.value): Promise<void> {
  if (!activeTable.value || datasourceId.value === undefined) {
    clearRows();
    return;
  }
  dataLoading.value = true;
  try {
    const result = await fetchTableData(
      activeTable.value,
      targetPage,
      pageSize.value,
      sortState.prop || undefined,
      sortState.order || undefined,
      datasourceId.value,
      database.value,
    );
    columns.value = result.columns ?? [];
    rows.value = result.rows ?? [];
    total.value = result.total ?? 0;
    page.value = result.page ?? targetPage;
  } catch (error) {
    clearRows();
    ElMessage.error(`读取表数据失败：${msg(error)}`);
  } finally {
    dataLoading.value = false;
  }
}

function selectTable(name: string): void {
  if (table.value === name) {
    return;
  }
  table.value = name;
  sortState.prop = "";
  sortState.order = "";
  clearRows();
  void loadRows(1);
}

function onSortChange(payload: { prop: string; order: string | null }): void {
  if (!payload?.order) {
    sortState.prop = "";
    sortState.order = "";
  } else {
    sortState.prop = payload.prop;
    sortState.order = payload.order === "descending" ? "DESC" : "ASC";
  }
  void loadRows(1);
}

function onPageChange(next: number): void {
  void loadRows(next);
}

function onPageSizeChange(size: number): void {
  pageSize.value = size;
  void loadRows(1);
}

/** 网格列：服务端给什么列就展示什么列，值做统一文本化（对象/数组转 JSON） */
const tableColumns = computed<ReTableColumn[]>(() =>
  columns.value.map(name => ({
    prop: name,
    label: name,
    minWidth: 140,
    showOverflowTooltip: true,
    sortable: "custom",
    formatter: row => formatCellValue(row[name]),
  })),
);

/** 表格行键：表未必有 id，取第一列兜底（与数据源中心控制台同口径） */
const gridRowKey = computed(() => (columns.value.length > 0 ? columns.value[0] : "id"));

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/* ---------------------------- 清空表（先清理） ---------------------------- */

async function confirmTruncate(): Promise<void> {
  if (!activeTable.value || datasourceId.value === undefined) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定清空表 ${activeTable.value} 吗？表结构保留，全部数据行会被删除，此操作不可恢复！`,
      "清空表确认",
      { type: "warning", confirmButtonText: "清空", cancelButtonText: "取消" },
    );
  } catch {
    return; // 用户取消：只验证到确认弹窗，不执行
  }
  try {
    await truncateDbTable(activeTable.value, datasourceId.value, database.value);
    ElMessage.success(`表 ${activeTable.value} 已清空`);
    sortState.prop = "";
    sortState.order = "";
    await loadRows(1);
  } catch (error) {
    ElMessage.error(`清空表失败：${msg(error)}`);
  }
}

/* ---------------------------- SQL 执行（写入即所见） ---------------------------- */

const sqlOpen = ref(false);
const sqlText = ref("");
const sqlBusy = ref(false);
const sqlError = ref("");
const sqlResult = ref<DbQueryResult | null>(null);

async function runSql(): Promise<void> {
  const sql = sqlText.value.trim();
  if (!sql) {
    ElMessage.warning("请先输入 SQL");
    return;
  }
  if (datasourceId.value === undefined) {
    ElMessage.warning("请先选择数据源");
    return;
  }
  sqlBusy.value = true;
  sqlError.value = "";
  sqlResult.value = null;
  try {
    const result = await executeDbSql(sql, datasourceId.value, database.value);
    sqlResult.value = result;
    const isQuery = Boolean(result.columns?.length || result.rows?.length);
    if (isQuery) {
      ElMessage.success(`查询返回 ${result.rows?.length ?? 0} 行${result.truncated ? "（已截断）" : ""}`);
    } else {
      const affected = result.affectedRows ?? result.rowCount ?? 0;
      ElMessage.success(`执行成功，影响 ${affected} 行`);
      // 写入即所见：DML/DDL 成功后刷新当前表，让「写进去的数据」立刻变成实际可见的行
      if (activeTable.value) {
        await loadRows(page.value);
      }
      // CREATE/ALTER/DROP 后同步表清单：刚建的表要立刻出现在左侧，删掉的要消失
      await loadTables();
    }
  } catch (error) {
    sqlError.value = msg(error);
  } finally {
    sqlBusy.value = false;
  }
}

function clearSql(): void {
  sqlText.value = "";
  sqlResult.value = null;
  sqlError.value = "";
}

/** SQL 结果网格（SELECT 用，列来自查询结果） */
const sqlColumns = computed<ReTableColumn[]>(() =>
  (sqlResult.value?.columns ?? []).map(name => ({
    prop: name,
    label: name,
    minWidth: 130,
    showOverflowTooltip: true,
    formatter: row => formatCellValue(row[name]),
  })),
);

function gotoDatasource(): void {
  void router.push("/collect/datasource/list");
}

function msg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/* ---------------------------- 生命周期 ---------------------------- */

onMounted(() => {
  void loadDatasources();
});

// keepAlive 路由：回到本页时让台账与当前表数据保持在最新
onActivated(() => {
  void loadDatasources();
  if (activeTable.value) {
    void loadRows(page.value);
  }
});
</script>

<template>
  <div class="data-manage">
    <!-- 顶部工具行：数据源 → 库 → 表 过滤 + 动作 -->
    <div class="dm-toolbar">
      <el-select
        v-model="datasourceId"
        class="dm-pick dm-pick-ds"
        filterable
        placeholder="选择数据源"
        :loading="datasourceLoading"
        @change="loadDatabases"
      >
        <el-option
          v-for="item in datasources"
          :key="item.id"
          :label="`${item.name}（${item.host || ''}${item.port ? ':' + item.port : ''}）`"
          :value="item.id as number"
        />
      </el-select>

      <el-select v-model="database" class="dm-pick" placeholder="数据库" @change="loadTables">
        <el-option v-for="db in databases" :key="db || '(默认)'" :label="db || '(默认库)'" :value="db" />
      </el-select>

      <el-input
        v-model="tableFilter"
        class="dm-pick dm-filter"
        clearable
        placeholder="过滤表名"
      />

      <div class="dm-actions">
        <ReButton :loading="dataLoading" tip="重新读取当前表" @click="loadRows(page)">刷新</ReButton>
        <ReButton :disabled="!activeTable" tip="清空当前表的数据行（保留结构）" @click="confirmTruncate">
          清空表
        </ReButton>
        <ReButton type="primary" :disabled="datasourceId === undefined" @click="sqlOpen = !sqlOpen">
          {{ sqlOpen ? "收起 SQL" : "SQL 执行" }}
        </ReButton>
      </div>
    </div>

    <!-- SQL 执行区：直接写入，执行成功后当前表刷新（写入即所见） -->
    <div v-if="sqlOpen" class="dm-sql">
      <div class="dm-sql-head">
        <span class="dm-sql-title">SQL 执行</span>
        <span class="dm-sql-hint">支持 SELECT / INSERT / UPDATE / DELETE / CREATE / ALTER / DROP；Ctrl+Enter 执行；写完执行即变成实际数据</span>
      </div>
      <el-input
        v-model="sqlText"
        type="textarea"
        :rows="5"
        class="dm-sql-input"
        placeholder="例：INSERT INTO your_table (name) VALUES ('示例');"
        @keydown.ctrl.enter.prevent="runSql"
      />
      <div class="dm-sql-actions">
        <ReButton type="primary" :loading="sqlBusy" @click="runSql">执行</ReButton>
        <ReButton @click="clearSql">清空</ReButton>
      </div>
      <div v-if="sqlError" class="dm-sql-error">{{ sqlError }}</div>
      <template v-if="sqlResult">
        <div v-if="sqlResult.message || sqlResult.affectedRows !== undefined" class="dm-sql-msg">
          {{ sqlResult.message || `影响 ${sqlResult.affectedRows ?? sqlResult.rowCount ?? 0} 行` }}
        </div>
        <ReTable
          v-if="sqlColumns.length"
          class="dm-sql-grid"
          :data="(sqlResult.rows ?? []) as Record<string, unknown>[]"
          :columns="sqlColumns"
          :pagination="false"
          stripe
        />
      </template>
    </div>

    <!-- 主体：表清单 + 数据网格 -->
    <div class="dm-main">
      <aside class="dm-tables" v-loading="tablesLoading">
        <div class="dm-tables-head">表（{{ filteredTables.length }}）</div>
        <div
          v-for="item in filteredTables"
          :key="item.name"
          class="dm-table-item"
          :class="{ active: table === item.name }"
          :title="item.remark || item.name"
          @click="selectTable(item.name)"
        >
          {{ item.name }}
        </div>
        <div v-if="!filteredTables.length" class="dm-empty-sm">
          {{ tables.length ? "没有匹配的表" : "当前库没有表" }}
        </div>
      </aside>

      <section class="dm-grid">
        <div v-if="noDatasource" class="dm-guide">
          <p>还没有可浏览的 JDBC 数据源。</p>
          <p>先到「数据源」页添加并启用一个 MySQL / PostgreSQL 等数据源，再回来查看实际数据。</p>
          <ReButton type="primary" @click="gotoDatasource">去数据源页</ReButton>
        </div>
        <template v-else>
          <div class="dm-grid-head">
            <span class="dm-grid-title">{{ activeTable || "未选择表" }}</span>
            <span class="dm-grid-meta">
              {{ activeTable ? `共 ${total} 行 · 第 ${page} 页` : "从左侧选择一张表查看实际数据" }}
            </span>
          </div>
          <ReTable
            :data="rows"
            :columns="tableColumns"
            :row-key="gridRowKey"
            :loading="dataLoading"
            :pagination="false"
            :border="true"
            stripe
            @sort-change="onSortChange"
          />
          <RePagination
            v-model:current-page="page"
            :total="total"
            :page-size="pageSize"
            :page-sizes="[20, 50, 100, 200, 500]"
            pagination-layout="total, sizes, prev, pager, next"
            @current-change="onPageChange"
            @update:page-size="onPageSizeChange"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.data-manage {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

/* 顶部工具行 */
.dm-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.dm-pick {
  width: 160px;
}

.dm-pick-ds {
  width: 260px;
}

.dm-filter {
  width: 160px;
}

.dm-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* SQL 执行区 */
.dm-sql {
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.dm-sql-head {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
  margin-bottom: 6px;
}

.dm-sql-title {
  font-size: 13px;
  font-weight: 600;
}

.dm-sql-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dm-sql-input :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.dm-sql-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.dm-sql-error {
  margin-top: 6px;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: var(--el-radius-md, 8px);
}

.dm-sql-msg {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dm-sql-grid {
  margin-top: 6px;
  max-height: 300px;
  overflow: auto;
}

/* 主体：表清单 + 网格 */
.dm-main {
  display: flex;
  flex: 1;
  gap: 10px;
  min-height: 0;
}

.dm-tables {
  display: flex;
  flex-direction: column;
  width: 220px;
  min-width: 220px;
  max-height: 62vh;
  overflow: auto;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.dm-tables-head {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dm-table-item {
  padding: 7px 10px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.dm-table-item:hover {
  background: var(--el-fill-color);
}

.dm-table-item.active {
  color: var(--el-color-primary);
  font-weight: 600;
  background: var(--el-color-primary-light-9);
}

.dm-empty-sm {
  padding: 14px 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.dm-grid {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.dm-grid-head {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.dm-grid-title {
  font-size: 14px;
  font-weight: 600;
}

.dm-grid-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 空台账引导 */
.dm-guide {
  padding: 40px 20px;
  text-align: center;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
}

.dm-guide p {
  margin: 4px 0 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
