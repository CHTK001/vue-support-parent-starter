<template>
  <div class="dbm tel-page">
    <!-- 顶部工具栏 -->
    <div class="dbm-toolbar">
      <div class="dbm-toolbar-left">
        <ReButton size="small" @click="openNewQuery">
          <template #icon><ReIcon name="Edit" /></template>新建查询
        </ReButton>
        <ReButton size="small" @click="openCreateTable">
          <template #icon><ReIcon name="Plus" /></template>新建表
        </ReButton>
        <ReButton size="small" @click="refreshTree">
          <template #icon><ReIcon name="Refresh" /></template>刷新
        </ReButton>
      </div>
      <div class="dbm-toolbar-right">
        <ReSelect v-model="currentDatasourceId" placeholder="选择数据源" size="small" style="width: 200px" @change="onDatasourceChange">
          <ReOption v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
        </ReSelect>
      </div>
    </div>

    <div class="dbm-body">
      <!-- 左侧连接树 -->
      <div class="dbm-sidebar" @contextmenu.prevent="onSidebarContextMenu">
        <div class="dbm-tree">
          <!-- 数据源节点 -->
          <div class="dbm-tree-node dbm-tree-root" @click="toggleNode('root')">
            <ReIcon :name="expandedNodes.has('root') ? 'ArrowDown' : 'ArrowRight'" size="12" />
            <ReIcon name="Coin" size="14" class="dbm-tree-icon" />
            <span class="dbm-tree-label">{{ currentDatasourceName }}</span>
          </div>

          <!-- 数据库列表 -->
          <div v-if="expandedNodes.has('root')" class="dbm-tree-children">
            <div v-for="db in databases" :key="db" class="dbm-tree-node" @click="toggleNode('db:' + db)">
              <ReIcon :name="expandedNodes.has('db:' + db) ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="FolderOpened" size="14" class="dbm-tree-icon dbm-db-icon" />
              <span class="dbm-tree-label">{{ db }}</span>
            </div>

            <!-- 表列表 -->
            <div v-for="db in databases" :key="'tables-' + db" v-if="expandedNodes.has('db:' + db)" class="dbm-tree-children">
              <div
                v-for="table in getTablesForDb(db)"
                :key="table.name"
                class="dbm-tree-node dbm-table-node"
                :class="{ active: activeTable === table.name }"
                @click="selectTable(table.name)"
                @contextmenu.prevent="onTableContextMenu($event, table.name)"
              >
                <ReIcon name="Grid" size="14" class="dbm-tree-icon dbm-table-icon" />
                <span class="dbm-tree-label">{{ table.name }}</span>
                <span v-if="table.remark" class="dbm-tree-remark">{{ table.remark }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="dbm-content">
        <!-- 标签页 -->
        <div class="dbm-tabs" v-if="tabs.length > 0">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="dbm-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <ReIcon :name="tab.type === 'query' ? 'Edit' : 'Grid'" size="12" />
            <span class="dbm-tab-title">{{ tab.title }}</span>
            <ReIcon name="Close" size="12" class="dbm-tab-close" @click.stop="closeTab(tab.id)" />
          </div>
        </div>

        <!-- 表数据视图 -->
        <div v-if="activeTabObj && activeTabObj.type === 'table'" class="dbm-table-view">
          <div class="dbm-table-toolbar">
            <span class="dbm-table-name">{{ activeTabObj.tableName }}</span>
            <ReButton size="small" type="primary" @click="openAddRowDialog">
              <template #icon><ReIcon name="Plus" /></template>新增行
            </ReButton>
            <ReButton size="small" @click="exportTableCsv">
              <template #icon><ReIcon name="Download" /></template>导出CSV
            </ReButton>
            <ReButton size="small" @click="refreshTableData">
              <template #icon><ReIcon name="Refresh" /></template>刷新
            </ReButton>
            <RePagination
              :total="tableData.total"
              :page="tableData.page"
              :page-size="tableData.pageSize"
              layout="prev, pager, next, total"
              @current-change="onPageChange"
            />
          </div>
          <ReTable
            :data="tableData.rows"
            :columns="tableColumns"
            :loading="tableLoading"
            stripe
            border
            height="calc(100% - 60px)"
          >
            <template #col-actions="{ row }">
              <ReButton size="small" text type="primary" @click="openEditRowDialog(row)">编辑</ReButton>
              <ReButton size="small" text type="danger" @click="deleteRow(row)">删除</ReButton>
            </template>
          </ReTable>
        </div>

        <!-- 表设计视图 -->
        <div v-if="activeTabObj && activeTabObj.type === 'design'" class="dbm-design-view">
          <div class="dbm-design-toolbar">
            <span class="dbm-table-name">{{ activeTabObj.tableName }} - 表设计</span>
            <ReButton size="small" type="primary" @click="saveTableDesign">
              <template #icon><ReIcon name="Check" /></template>保存
            </ReButton>
          </div>
          <ReTable
            :data="designColumns"
            :columns="designColumnDefs"
            :loading="designLoading"
            stripe
            border
            height="calc(100% - 60px)"
          />
        </div>

        <!-- SQL 查询视图 -->
        <div v-if="activeTabObj && activeTabObj.type === 'query'" class="dbm-query-view">
          <div class="dbm-query-editor">
            <div class="dbm-query-toolbar">
              <ReButton size="small" type="primary" @click="executeQuery">
                <template #icon><ReIcon name="VideoPlay" /></template>执行 (Ctrl+Enter)
              </ReButton>
              <ReButton size="small" @click="formatSql">
                <template #icon><ReIcon name="MagicStick" /></template>格式化
              </ReButton>
            </div>
            <textarea
              v-model="activeTabObj.sql"
              class="dbm-sql-editor"
              placeholder="输入 SQL 语句，支持 SELECT / INSERT / UPDATE / DELETE / CREATE / ALTER / DROP..."
              @keydown.ctrl.enter="executeQuery"
            ></textarea>
          </div>
          <div class="dbm-query-result">
            <div class="dbm-result-header">
              <span v-if="queryResult.message" class="dbm-result-message">{{ queryResult.message }}</span>
              <span v-else-if="queryResult.rowCount !== undefined" class="dbm-result-message">查询完成，共 {{ queryResult.rowCount }} 行{{ queryResult.truncated ? '（已截断）' : '' }}</span>
            </div>
            <ReTable
              v-if="queryResult.columns && queryResult.columns.length > 0"
              :data="queryResult.rows || []"
              :columns="queryColumns"
              stripe
              border
              height="calc(100% - 40px)"
            />
            <ReEmpty v-else description="执行 SQL 后显示结果" />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="tabs.length === 0" class="dbm-empty">
          <ReIcon name="Grid" size="64" class="dbm-empty-icon" />
          <p class="dbm-empty-text">从左侧选择表查看数据，或点击"新建查询"执行 SQL</p>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="dbm-context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click="contextMenu.visible = false"
    >
      <div class="dbm-context-item" @click="openTableData(contextMenu.tableName)">
        <ReIcon name="View" size="14" />查看数据
      </div>
      <div class="dbm-context-item" @click="openTableDesign(contextMenu.tableName)">
        <ReIcon name="Edit" size="14" />设计表
      </div>
      <div class="dbm-context-item" @click="openCreateTable">
        <ReIcon name="Plus" size="14" />新建表
      </div>
      <div class="dbm-context-divider"></div>
      <div class="dbm-context-item dbm-danger" @click="deleteTable(contextMenu.tableName)">
        <ReIcon name="Delete" size="14" />删除表
      </div>
      <div class="dbm-context-item" @click="refreshTree">
        <ReIcon name="Refresh" size="14" />刷新
      </div>
    </div>

    <!-- 新建表弹窗 -->
    <ReDialog v-model="createTableVisible" title="新建表" width="600px">
      <div class="dbm-create-form">
        <div class="dbm-form-item">
          <label>表名</label>
          <ReInput v-model="newTableName" placeholder="请输入表名" />
        </div>
        <div class="dbm-form-item">
          <label>表注释</label>
          <ReInput v-model="newTableRemark" placeholder="请输入表注释" />
        </div>
        <div class="dbm-form-item">
          <label>初始字段</label>
          <ReInput v-model="newTableFields" type="textarea" :rows="4" placeholder="id BIGINT PRIMARY KEY AUTO_INCREMENT,&#10;name VARCHAR(255) NOT NULL,&#10;created_at DATETIME" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="createTableVisible = false">取消</ReButton>
        <ReButton type="primary" @click="confirmCreateTable">创建</ReButton>
      </template>
    </ReDialog>
  </div>

  <!-- 编辑/新增行弹窗 -->
  <ReDialog v-model="rowDialogVisible" :title="rowDialogMode === 'edit' ? '编辑行' : '新增行'" width="600px">
    <ReForm label-width="120px">
      <ReFormItem v-for="col in tableData.columns" :key="col" :label="col">
        <ReInput v-model="rowForm[col]" :placeholder="`输入 ${col}`" />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="rowDialogVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="rowSaving" @click="saveRow">保存</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 数据库管理页
 *
 * 提供数据源/数据库/表/视图的浏览、SQL 查询执行、表结构查看与建表/删表操作。
 * @author CH
 * @since 4.0.0
 */
import { ref, computed, onMounted, reactive, watch } from "vue";
import {
  fetchDbDatabases,
  fetchDbTables,
  fetchTableColumns,
  fetchTableData,
  executeDbSql,
  dropDbTable,
  fetchDataSources,
  type DbTableInfo,
  type DbColumnInfo,
  type DbTableDataResult,
  type DbQueryResult,
  type DataSourceInfo,
} from "../monitorApi";

// 数据源
const datasources = ref<DataSourceInfo[]>([]);
const currentDatasourceId = ref<number | undefined>(undefined);
const currentDatasourceName = computed(() => {
  const ds = datasources.value.find(d => d.id === currentDatasourceId.value);
  return ds ? ds.name : "默认数据源";
});

// 连接树
const databases = ref<string[]>([]);
const tables = ref<DbTableInfo[]>([]);
const expandedNodes = ref(new Set<string>(["root"]));
const activeTable = ref<string>("");

// 标签页
interface Tab {
  id: string;
  type: "table" | "design" | "query";
  title: string;
  tableName?: string;
  sql?: string;
}
const tabs = ref<Tab[]>([]);
const activeTab = ref<string>("");
const activeTabObj = computed(() => tabs.value.find(t => t.id === activeTab.value));

// 表数据
const tableData = reactive<DbTableDataResult>({ columns: [], rows: [], total: 0, page: 1, pageSize: 50 });

// ==================== 新建数据库 ====================
const createDbVisible = ref(false);
const newDbName = ref("");
const newDbCharset = ref("utf8mb4");
const newDbCollation = ref("utf8mb4_general_ci");
const creatingDb = ref(false);

const openCreateDatabase = () => {
  newDbName.value = "";
  createDbVisible.value = true;
};

const createDatabase = async () => {
  if (!newDbName.value.trim()) {
    ElMessage.warning("请输入数据库名称");
    return;
  }
  creatingDb.value = true;
  try {
    const sql = `CREATE DATABASE \`${newDbName.value}\` CHARACTER SET ${newDbCharset.value} COLLATE ${newDbCollation.value}`;
    await executeDbSql(sql, currentDatasourceId.value, null);
    ElMessage.success("数据库创建成功");
    createDbVisible.value = false;
    await refreshDatabases();
  } catch (e) {
    ElMessage.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    creatingDb.value = false;
  }
};

// ==================== 导入数据 ====================
const importVisible = ref(false);
const importTableName = ref("");
const importFormat = ref("csv");
const importData = ref("");
const importSkipHeader = ref(true);
const importing = ref(false);

const openImportData = () => {
  importTableName.value = tables.value[0] || "";
  importFormat.value = "csv";
  importData.value = "";
  importVisible.value = true;
};

const doImportData = async () => {
  if (!importTableName.value) {
    ElMessage.warning("请选择目标表");
    return;
  }
  if (!importData.value.trim()) {
    ElMessage.warning("请输入数据内容");
    return;
  }
  importing.value = true;
  try {
    let sql = "";
    if (importFormat.value === "sql") {
      sql = importData.value;
    } else if (importFormat.value === "csv") {
      const lines = importData.value.trim().split("\n");
      const startIdx = importSkipHeader.value ? 1 : 0;
      const values = lines.slice(startIdx).map(line => {
        const fields = line.split(",").map(f => `'${f.trim().replace(/'/g, "''")}'`);
        return `(${fields.join(", ")})`;
      });
      sql = `INSERT INTO \`${importTableName.value}\` VALUES ${values.join(", ")}`;
    } else if (importFormat.value === "json") {
      const data = JSON.parse(importData.value);
      if (Array.isArray(data) && data.length > 0) {
        const columns = Object.keys(data[0]);
        const values = data.map(row => {
          const vals = columns.map(col => `'${String(row[col] ?? "").replace(/'/g, "''")}'`);
          return `(${vals.join(", ")})`;
        });
        sql = `INSERT INTO \`${importTableName.value}\` (${columns.map(c => `\`${c}\``).join(", ")}) VALUES ${values.join(", ")}`;
      }
    }
    if (sql) {
      await executeDbSql(sql, currentDatasourceId.value, databases.value[0]);
      ElMessage.success("数据导入成功");
      importVisible.value = false;
      await refreshTableData();
    }
  } catch (e) {
    ElMessage.error(`导入失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    importing.value = false;
  }
};

// ==================== 行编辑 ====================
const rowDialogVisible = ref(false);
const rowDialogMode = ref<'edit' | 'add'>('add');
const rowForm = ref<Record<string, any>>({});
const rowSaving = ref(false);
const editingRow = ref<Record<string, any> | null>(null);

const openAddRowDialog = () => {
  rowDialogMode.value = 'add';
  rowForm.value = {};
  tableData.columns.forEach(col => { rowForm.value[col] = ''; });
  editingRow.value = null;
  rowDialogVisible.value = true;
};

const openEditRowDialog = (row: Record<string, any>) => {
  rowDialogMode.value = 'edit';
  rowForm.value = { ...row };
  editingRow.value = row;
  rowDialogVisible.value = true;
};

const saveRow = async () => {
  if (!activeTabObj.value) return;
  rowSaving.value = true;
  try {
    const tableName = activeTabObj.value.tableName;
    if (rowDialogMode.value === 'add') {
      // 新增行：构建 INSERT SQL
      const cols = Object.keys(rowForm.value).filter(k => rowForm.value[k] !== '');
      const vals = cols.map(c => `'${String(rowForm.value[c]).replace(/'/g, "''")}'`);
      const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
      await executeDbSql(sql, currentDatasourceId.value, databases.value[0]);
      ElMessage.success('新增行成功');
    } else {
      // 编辑行：构建 UPDATE SQL（需要主键，这里用所有字段作为 WHERE 条件）
      const sets = Object.keys(rowForm.value).map(k => `${k} = '${String(rowForm.value[k]).replace(/'/g, "''")}'`);
      const wheres = Object.keys(editingRow.value || {}).map(k => `${k} = '${String(editingRow.value?.[k]).replace(/'/g, "''")}'`);
      const sql = `UPDATE ${tableName} SET ${sets.join(', ')} WHERE ${wheres.join(' AND ')}`;
      await executeDbSql(sql, currentDatasourceId.value, databases.value[0]);
      ElMessage.success('更新行成功');
    }
    rowDialogVisible.value = false;
    await refreshTableData();
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    rowSaving.value = false;
  }
};

const deleteRow = async (row: Record<string, any>) => {
  if (!activeTabObj.value) return;
  try {
    await ElMessageBox.confirm('确定删除这一行吗？', '删除确认', { type: 'warning' });
  } catch {
    return;
  }
  try {
    const tableName = activeTabObj.value.tableName;
    const wheres = Object.keys(row).map(k => `${k} = '${String(row[k]).replace(/'/g, "''")}'`);
    const sql = `DELETE FROM ${tableName} WHERE ${wheres.join(' AND ')}`;
    await executeDbSql(sql, currentDatasourceId.value, databases.value[0]);
    ElMessage.success('删除行成功');
    await refreshTableData();
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

const exportTableCsv = () => {
  if (tableData.rows.length === 0) {
    ElMessage.warning('没有数据可导出');
    return;
  }
  const headers = tableData.columns.join(',');
  const rows = tableData.rows.map((row: any) =>
    tableData.columns.map(col => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = '\ufeff' + headers + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${activeTabObj.value?.tableName || 'table'}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  ElMessage.success('导出成功');
};
const tableLoading = ref(false);
const tableColumns = computed(() => {
  const cols = tableData.columns.map(col => ({ prop: col, label: col, minWidth: 120, showOverflowTooltip: true }));
  cols.push({ prop: '__actions', label: '操作', width: 120, slot: 'actions', fixed: 'right' });
  return cols;
});

// 表设计
const designColumns = ref<DbColumnInfo[]>([]);
const designLoading = ref(false);
const designColumnDefs = [
  { prop: "position", label: "#", width: 60 },
  { prop: "name", label: "字段名", minWidth: 140 },
  { prop: "type", label: "类型", width: 120 },
  { prop: "size", label: "长度", width: 80 },
  { prop: "isPrimaryKey", label: "主键", width: 70, formatter: (r: any) => (r.isPrimaryKey ? "是" : "") },
  { prop: "nullable", label: "可空", width: 70, formatter: (r: any) => (r.nullable ? "是" : "否") },
  { prop: "default", label: "默认值", minWidth: 100 },
  { prop: "remark", label: "注释", minWidth: 150 },
];

// SQL 查询
const queryResult = reactive<DbQueryResult>({});
const queryColumns = computed(() =>
  (queryResult.columns || []).map(col => ({ prop: col, label: col, minWidth: 120, showOverflowTooltip: true }))
);

// 右键菜单
const contextMenu = reactive({ visible: false, x: 0, y: 0, tableName: "" });

// 新建表
const createTableVisible = ref(false);
const newTableName = ref("");
const newTableRemark = ref("");
const newTableFields = ref("id BIGINT PRIMARY KEY AUTO_INCREMENT,\nname VARCHAR(255) NOT NULL,\ncreated_at DATETIME");

// 初始化
onMounted(async () => {
  await loadDatasources();
});

async function loadDatasources() {
  try {
    const list = await fetchDataSources();
    datasources.value = list.filter(d => d.type === "jdbc");
    if (datasources.value.length > 0) {
      currentDatasourceId.value = datasources.value[0].id;
      await loadTree();
    }
  } catch (e) {
    console.error("加载数据源失败", e);
  }
}

async function onDatasourceChange() {
  await loadTree();
}

async function loadTree() {
  try {
    databases.value = await fetchDbDatabases(currentDatasourceId.value);
    if (databases.value.length > 0) {
      expandedNodes.value.add("db:" + databases.value[0]);
      await loadTables(databases.value[0]);
    }
  } catch (e) {
    console.error("加载数据库树失败", e);
  }
}

async function loadTables(db: string) {
  try {
    tables.value = await fetchDbTables(currentDatasourceId.value, db);
  } catch (e) {
    console.error("加载表列表失败", e);
  }
}

/**
 * 获取指定数据库已加载的表列表
 * @param db 数据库名
 */
function getTablesForDb(db: string) {
  return tables.value;
}

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) {
    expandedNodes.value.delete(key);
  } else {
    expandedNodes.value.add(key);
    if (key.startsWith("db:")) {
      loadTables(key.replace("db:", ""));
    }
  }
}

/**
 * 刷新数据源/数据库/表树
 */
function refreshTree() {
  loadTree();
}

/**
 * 选中表节点（展开结构）
 * @param tableName 表名
 */
function selectTable(tableName: string) {
  activeTable.value = tableName;
  openTableData(tableName);
}

/**
 * 打开表数据页签
 * @param tableName 表名
 */
function openTableData(tableName: string) {
  const id = "table-" + tableName;
  let tab = tabs.value.find(t => t.id === id);
  if (!tab) {
    tab = { id, type: "table", title: tableName, tableName };
    tabs.value.push(tab);
  }
  activeTab.value = id;
  loadTableData(tableName);
}

/**
 * 打开表结构设计页签
 * @param tableName 表名
 */
function openTableDesign(tableName: string) {
  const id = "design-" + tableName;
  let tab = tabs.value.find(t => t.id === id);
  if (!tab) {
    tab = { id, type: "design", title: tableName + " - 设计", tableName };
    tabs.value.push(tab);
  }
  activeTab.value = id;
  loadTableDesign(tableName);
}

/**
 * 新建 SQL 查询页签
 */
function openNewQuery() {
  const id = "query-" + Date.now();
  const tab: Tab = { id, type: "query", title: "查询 " + (tabs.value.filter(t => t.type === "query").length + 1), sql: "" };
  tabs.value.push(tab);
  activeTab.value = id;
}

/**
 * 关闭页签
 * @param id 页签 ID
 */
function closeTab(id: string) {
  const idx = tabs.value.findIndex(t => t.id === id);
  if (idx >= 0) {
    tabs.value.splice(idx, 1);
    if (activeTab.value === id) {
      activeTab.value = tabs.value.length > 0 ? tabs.value[Math.min(idx, tabs.value.length - 1)].id : "";
    }
  }
}

async function loadTableData(tableName: string) {
  tableLoading.value = true;
  try {
    const result = await fetchTableData(tableName, 1, 50, undefined, undefined, currentDatasourceId.value, databases.value[0]);
    Object.assign(tableData, result);
  } catch (e) {
    console.error("加载表数据失败", e);
  } finally {
    tableLoading.value = false;
  }
}

async function onPageChange(page: number) {
  if (activeTabObj.value?.tableName) {
    tableLoading.value = true;
    try {
      const result = await fetchTableData(activeTabObj.value.tableName, page, tableData.pageSize, undefined, undefined, currentDatasourceId.value, databases.value[0]);
      Object.assign(tableData, result);
    } finally {
      tableLoading.value = false;
    }
  }
}

/**
 * 刷新当前表数据
 */
function refreshTableData() {
  if (activeTabObj.value?.tableName) {
    loadTableData(activeTabObj.value.tableName);
  }
}

async function loadTableDesign(tableName: string) {
  designLoading.value = true;
  try {
    designColumns.value = await fetchTableColumns(tableName, currentDatasourceId.value, databases.value[0]);
  } catch (e) {
    console.error("加载表设计失败", e);
  } finally {
    designLoading.value = false;
  }
}

/**
 * 保存建表 SQL
 */
function saveTableDesign() {
  // 表设计保存功能（需要后端 ALTER TABLE 支持，此处提示）
  alert("表结构修改需要执行 ALTER TABLE SQL，请在 SQL 查询中执行");
}

async function executeQuery() {
  if (!activeTabObj.value?.sql) return;
  try {
    const result = await executeDbSql(activeTabObj.value.sql, currentDatasourceId.value);
    Object.assign(queryResult, result);
  } catch (e: any) {
    queryResult.message = "执行失败: " + (e.message || e);
  }
}

/**
 * 格式化当前 SQL
 */
function formatSql() {
  if (activeTabObj.value?.sql) {
    activeTabObj.value.sql = activeTabObj.value.sql
      .replace(/\s+/g, " ")
      .replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/gi, "\n$1");
  }
}

function onTableContextMenu(e: MouseEvent, tableName: string) {
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = tableName;
}

function onSidebarContextMenu(e: MouseEvent) {
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = "";
}

function openCreateTable() {
  newTableName.value = "";
  newTableRemark.value = "";
  createTableVisible.value = true;
}

async function confirmCreateTable() {
  if (!newTableName.value) return;
  let sql = `CREATE TABLE \`${newTableName.value}\` (\n${newTableFields.value}\n)`;
  if (newTableRemark.value) {
    sql += ` COMMENT='${newTableRemark.value}'`;
  }
  try {
    await executeDbSql(sql, currentDatasourceId.value);
    createTableVisible.value = false;
    refreshTree();
  } catch (e: any) {
    alert("创建表失败: " + (e.message || e));
  }
}

async function deleteTable(tableName: string) {
  if (!confirm(`确定要删除表 ${tableName} 吗？此操作不可恢复！`)) return;
  try {
    await dropDbTable(tableName, currentDatasourceId.value);
    refreshTree();
    // 关闭相关标签页
    tabs.value = tabs.value.filter(t => t.tableName !== tableName);
  } catch (e: any) {
    alert("删除表失败: " + (e.message || e));
  }
}

// 点击页面其他地方关闭右键菜单
document.addEventListener("click", () => {
  contextMenu.visible = false;
});
</script>

<style scoped>
.dbm {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--tel-bg, #0a0e1a);
  color: var(--tel-text, #e2e8f0);
  font-family: "JetBrains Mono", "Consolas", monospace;
}

.dbm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--tel-border, #1e293b);
  background: var(--tel-panel, #0f172a);
}

.dbm-toolbar-left {
  display: flex;
  gap: 8px;
}

.dbm-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.dbm-sidebar {
  width: 260px;
  border-right: 1px solid var(--tel-border, #1e293b);
  background: var(--tel-panel, #0f172a);
  overflow-y: auto;
}

.dbm-tree {
  padding: 8px 0;
}

.dbm-tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.dbm-tree-node:hover {
  background: var(--tel-hover, #1e293b);
}

.dbm-tree-node.active {
  background: var(--tel-primary, #3b82f6);
  color: #fff;
}

.dbm-tree-root {
  font-weight: 600;
  color: var(--tel-primary, #3b82f6);
}

.dbm-tree-children {
  padding-left: 16px;
}

.dbm-tree-icon {
  flex-shrink: 0;
}

.dbm-db-icon {
  color: #f59e0b;
}

.dbm-table-icon {
  color: #10b981;
}

.dbm-tree-label {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dbm-tree-remark {
  font-size: 11px;
  color: var(--tel-text-dim, #64748b);
  margin-left: 4px;
}

.dbm-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dbm-tabs {
  display: flex;
  gap: 2px;
  padding: 4px 8px 0;
  border-bottom: 1px solid var(--tel-border, #1e293b);
  background: var(--tel-panel, #0f172a);
  overflow-x: auto;
}

.dbm-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  white-space: nowrap;
  transition: all 0.15s;
}

.dbm-tab:hover {
  background: var(--tel-hover, #1e293b);
}

.dbm-tab.active {
  background: var(--tel-bg, #0a0e1a);
  border-color: var(--tel-border, #1e293b);
  color: var(--tel-primary, #3b82f6);
}

.dbm-tab-close {
  opacity: 0.5;
  transition: opacity 0.15s;
}

.dbm-tab-close:hover {
  opacity: 1;
  color: #ef4444;
}

.dbm-table-view,
.dbm-design-view,
.dbm-query-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dbm-table-toolbar,
.dbm-design-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--tel-border, #1e293b);
}

.dbm-table-name {
  font-weight: 600;
  color: var(--tel-primary, #3b82f6);
  font-size: 14px;
}

.dbm-query-view {
  flex-direction: column;
}

.dbm-query-editor {
  height: 40%;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--tel-border, #1e293b);
}

.dbm-query-toolbar {
  display: flex;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--tel-border, #1e293b);
}

.dbm-sql-editor {
  flex: 1;
  padding: 12px;
  background: var(--tel-bg, #0a0e1a);
  color: var(--tel-text, #e2e8f0);
  border: none;
  outline: none;
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
}

.dbm-sql-editor:focus {
  box-shadow: inset 0 0 0 1px var(--tel-primary, #3b82f6);
}

.dbm-query-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dbm-result-header {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--tel-text-dim, #64748b);
  border-bottom: 1px solid var(--tel-border, #1e293b);
}

.dbm-result-message {
  color: var(--tel-success, #10b981);
}

.dbm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--tel-text-dim, #64748b);
}

.dbm-empty-icon {
  opacity: 0.3;
}

.dbm-empty-text {
  font-size: 14px;
}

.dbm-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: var(--tel-panel, #0f172a);
  border: 1px solid var(--tel-border, #1e293b);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 4px 0;
}

.dbm-context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.dbm-context-item:hover {
  background: var(--tel-primary, #3b82f6);
  color: #fff;
}

.dbm-context-item.dbm-danger:hover {
  background: #ef4444;
}

.dbm-context-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--tel-border, #1e293b);
}

.dbm-create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dbm-form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dbm-form-item label {
  font-size: 13px;
  font-weight: 500;
  color: var(--tel-text, #e2e8f0);
}
</style>
