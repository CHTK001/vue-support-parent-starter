<template>
  <div class="console" :style="gridStyle">
    <div class="left overflow-auto thin-scrollbar" @contextmenu.prevent>
      <div class="left-header">
        <IconifyIconOnline icon="ri:database-2-line" class="header-icon" />
        <span class="header-title">数据库对象</span>
      </div>
      <el-input
        v-model="keyword"
        placeholder="搜索表、字段..."
        size="small"
        clearable
        @change="loadRoot"
        class="search-input"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
      <el-tree
        ref="treeRef"
        :key="treeVersion"
        class="tree"
        :data="treeData"
        :props="treeProps"
        :load="loadChildrenLazy"
        lazy
        node-key="path"
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
        @node-contextmenu="handleNodeContextMenu"
      >
        <template #default="{ node, data }">
          <IconifyIconOnline :icon="getJdbcNodeIcon(node, data)" class="mr-1" />
          <span class="flex justify-between w-full !max-w-[120px]">
            <span>
              <span>{{ data.name }}</span>
              <span class="el-form-item-msg ml-2 mt-[3px]">{{
                data.properties?.columnType
              }}</span>
              <span
                v-if="data.properties?.columnSize"
                class="el-form-item-msg ml-2 mt-[3px]"
                >({{ data.properties?.columnSize }})</span
              >
            </span>
            <span class="el-form-item-msg ml-2 mt-[3px]">{{
              data.properties?.comment
            }}</span>
          </span>
        </template>
      </el-tree>
    </div>
    <div
      class="splitter cursor-col-resize"
      @mousedown="onDragStart"
      @dblclick="resetWidth"
    />
    <div class="right image-paper">
      <div class="right-header">
        <div class="path" :title="currentPath || '未选择'">
          <IconifyIconOnline icon="ri:route-line" class="mr-1" />
          <span class="ellipsis">{{ currentPath || "未选择" }}</span>
          <span v-if="currentComment" class="comment" :title="currentComment"
            >• 注释：{{ currentComment }}</span
          >
        </div>
        <div class="toolbar">
          <el-button
            v-if="showEditor"
            type="primary"
            size="small"
            @click="execute"
          >
            <IconifyIconOnline :icon="icons.execute" class="mr-1" />
            执行
          </el-button>
          <el-button v-if="showEditor" size="small" @click="formatSql">
            <IconifyIconOnline :icon="formatIcon" class="mr-1" />
            格式化
          </el-button>
          <el-button size="small" @click="onRefreshTree">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" /> 刷新
          </el-button>
          <el-button
            size="small"
            type="success"
            :disabled="!currentNodeData || !isTableNode(currentNodeData)"
            @click="openTableStructure()"
          >
            <IconifyIconOnline icon="ri:tools-line" class="mr-1" />
            设计表
          </el-button>
          <el-button-group>
            <el-button
              size="small"
              :type="showDataType ? 'primary' : 'default'"
              :disabled="!searched"
              @click="showDataType = !showDataType"
              >数据类型</el-button
            >
            <el-button
              size="small"
              :type="showTableComment ? 'primary' : 'default'"
              :disabled="!searched"
              @click="showTableComment = !showTableComment"
              >表头注释</el-button
            >
            <el-button
              size="small"
              :type="showFieldComments ? 'primary' : 'default'"
              :disabled="!searched"
              @click="showFieldComments = !showFieldComments"
              >字段注释</el-button
            >
          </el-button-group>
          <el-button
            size="small"
            :disabled="!currentPath || !columns.length"
            @click="toggleAnalyze"
          >
            <IconifyIconOnline
              :icon="analyzing ? 'ri:close-circle-line' : 'ri:bar-chart-2-line'"
              class="mr-1"
            />
            {{ analyzing ? "退出分析" : "分析" }}
          </el-button>
        </div>
      </div>
      <div class="right-body">
        <CodeEditor
          v-if="showEditor"
          v-model:content="sql"
          :showTool="false"
          :height="'200px'"
          :options="{ mode: 'sql' }"
        />
        <el-tabs
          v-model="activeTab"
          class="result-tabs"
          type="border-card"
          tab-position="top"
        >
          <el-tab-pane name="result" class="!h-full" label="结果">
            <div class="result" v-if="columns.length">
              <el-popover
                v-model:visible="columnFilterVisible"
                trigger="click"
                placement="bottom-end"
                width="280"
                :hide-after="0"
              >
                <template #reference>
                  <el-button size="small" text>
                    <IconifyIconOnline
                      icon="ri:menu-unfold-line"
                      class="mr-1"
                    />
                    筛选列
                  </el-button>
                </template>
                <div class="col-filter" @click.stop>
                  <div class="filter-header">
                    <span class="filter-title">选择显示列</span>
                    <div class="filter-actions">
                      <el-button
                        size="small"
                        link
                        type="primary"
                        @click.stop="
                          selectedColumnNames = columns.map((c) => c.name || c)
                        "
                      >
                        全选
                      </el-button>
                      <el-button
                        size="small"
                        link
                        type="danger"
                        @click.stop="selectedColumnNames = []"
                      >
                        清空
                      </el-button>
                    </div>
                  </div>
                  <el-scrollbar height="240px" class="filter-list">
                    <el-checkbox-group v-model="selectedColumnNames">
                      <el-checkbox
                        v-for="col in columns"
                        :key="col.name || col"
                        :label="col.name || col"
                        @click.stop
                      >
                        {{ col.name || col }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </el-scrollbar>
                </div>
              </el-popover>
            </div>
            <!-- 分析面板 -->
            <div
              v-if="analyzing && Object.keys(analysisData).length"
              class="analysis-panel"
            >
              <div class="analysis-title">
                <IconifyIconOnline icon="ri:bar-chart-2-line" class="mr-1" />
                字段分析
              </div>
              <div class="analysis-content">
                <div
                  v-for="col in visibleColumns"
                  :key="col.name || col"
                  class="analysis-item"
                >
                  <div class="analysis-col-name">{{ col.name || col }}</div>
                  <div
                    v-if="analysisData[col.name]?.length"
                    class="analysis-bars"
                  >
                    <div
                      v-for="b in analysisData[col.name].slice(0, 10)"
                      :key="b.value"
                      class="analysis-bar-item"
                    >
                      <el-tooltip
                        :content="`${b.value}: ${b.count}条`"
                        placement="top"
                      >
                        <div
                          class="analysis-bar"
                          :style="barStyle(col.name, b)"
                          @click="toggleFilter(col.name, b.value)"
                        >
                          <span class="bar-label">{{ b.value || "(空)" }}</span>
                        </div>
                      </el-tooltip>
                    </div>
                  </div>
                  <div v-else class="analysis-empty">无数据</div>
                </div>
              </div>
            </div>
            <el-table
              v-if="columns.length"
              ref="dataTableRef"
              :data="displayRows"
              :max-height="tableMaxHeight"
              size="small"
              border
              :row-class-name="rowClassName"
              class="data-table"
              @cell-dblclick="handleCellDblClick"
            >
              <el-table-column type="index" width="45" label="#" fixed="left" />
              <el-table-column
                v-for="col in visibleColumns"
                :key="col.name || col"
                :prop="col.name || col"
                :min-width="getColumnWidth(col)"
                show-overflow-tooltip
              >
                <template #header>
                  <div class="col-header">
                    <div class="col-header-main">
                      <span class="col-name">{{ col.name || col }}</span>
                      <span v-if="col.isPrimary" class="col-pk-badge">PK</span>
                    </div>
                    <div v-if="showDataType && col.dataType" class="col-type">
                      {{ col.dataType }}
                    </div>
                    <div
                      v-if="showTableComment && col.comment"
                      class="col-comment"
                      :title="col.comment"
                    >
                      {{ col.comment }}
                    </div>
                  </div>
                </template>
                <template #default="{ row }">
                  <div class="cell-wrapper">
                    <span
                      :class="{
                        'cell-null': row[`__null__${col.name || col}`],
                      }"
                    >
                      {{ row[col.name || col] }}
                    </span>
                    <div
                      v-if="showFieldComments && col.comment"
                      class="cell-comment"
                    >
                      {{ col.comment }}
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="无结果" />
          </el-tab-pane>
        </el-tabs>
      </div>
      <div class="right-status">
        <span v-if="statusText">{{ statusText }}</span>
      </div>
    </div>
    <CommonContextMenu
      :visible="menuVisible"
      :x="menuX"
      :y="menuY"
      :items="menuItems"
      @select="onMenuSelect"
      @close="menuVisible = false"
    />

    <!-- 表结构对话框 -->
    <TableStructureDialog
      v-model="showStructureDialog"
      :setting-id="props.id"
      :table-name="structureTableName"
      @refresh-table="onStructureRefresh"
    />

    <!-- 导入CSV对话框 -->
    <el-dialog
      v-model="importCsvVisible"
      :title="`导入CSV到 ${importCsvTableName}`"
      width="550px"
      :close-on-click-modal="false"
      class="import-csv-dialog"
    >
      <el-form :model="importCsvForm" label-width="100px" size="default">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        >
          <template #title>
            使用MySQL的LOAD
            DATA语句导入CSV文件，文件路径需要是MySQL服务器可访问的路径
          </template>
        </el-alert>
        <el-form-item label="文件路径" required>
          <el-input
            v-model="importCsvForm.filePath"
            placeholder="如：/tmp/data.csv 或 C:/data/import.csv"
          />
        </el-form-item>
        <el-form-item label="字段分隔符">
          <el-select
            v-model="importCsvForm.fieldTerminator"
            style="width: 100%"
          >
            <el-option label="逗号 (,)" value="," />
            <el-option label="制表符 (\\t)" value="\\t" />
            <el-option label="分号 (;)" value=";" />
            <el-option label="竖线 (|)" value="|" />
          </el-select>
        </el-form-item>
        <el-form-item label="行分隔符">
          <el-select v-model="importCsvForm.lineTerminator" style="width: 100%">
            <el-option label="换行符 (\\n)" value="\\n" />
            <el-option label="回车换行 (\\r\\n)" value="\\r\\n" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳过行数">
          <el-input-number
            v-model="importCsvForm.ignoreLines"
            :min="0"
            :max="100"
          />
          <span class="form-tip">通常设为1跳过标题行</span>
        </el-form-item>
        <el-form-item label="字符集">
          <el-select v-model="importCsvForm.charset" style="width: 100%">
            <el-option label="UTF-8" value="utf8mb4" />
            <el-option label="GBK" value="gbk" />
            <el-option label="GB2312" value="gb2312" />
            <el-option label="Latin1" value="latin1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importCsvVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportCsv">
          <IconifyIconOnline icon="ri:upload-2-line" class="mr-1" />
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import {
  ref,
  onMounted,
  computed,
  onBeforeUnmount,
  nextTick,
  inject,
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import CodeEditor from "@/components/codeEditor/index.vue";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { splitToArray } from "@repo/utils";
// request不再直接使用，统一在system-data.ts封装
import {
  extractArrayFromApi,
  normalizeTreeNode,
} from "@/views/data-management/utils/dataTree";
import CommonContextMenu, {
  type MenuItem,
} from "@/components/CommonContextMenu.vue";
import {
  getConsoleConfig,
  getFieldComment,
  saveFieldComment,
  openTable,
  analyzeTable,
  getConsoleRoot,
  getConsoleChildren,
  getConsoleNode,
  executeConsole,
  getStructureCapabilities,
  renameTable,
  backupTable,
  updateTableRow,
} from "@/api/system-data";
import TableStructureDialog from "./TableStructureDialog.vue";

const props = defineProps<{ id: number }>();

// 使用全局Socket.IO或创建独立连接
const globalSocket = inject<any>("globalSocket");
let socketConnection: any = null;
let unsubscribeHandlers: any[] = [];

const treeData = ref<any[]>([]);
const treeRef = ref<any>();
const treeVersion = ref(0);
const treeProps = { label: "name", children: "children", isLeaf: "leaf" };

// 工具栏图标（格式化图标由 JS 生成选择）
const icons = {
  execute: "ri:play-circle-line",
  structure: "ri:table-2",
} as const;
const formatIcon = computed(() => {
  // 简单随机切换书写笔/魔棒两种风格（可改为基于主题/偏好）
  return Math.random() > 0.5 ? "ri:magic-line" : "ri:pencil-ruler-2-line";
});

const searched = ref(false);
const keyword = ref("");
const currentPath = ref<string | undefined>(undefined);

const sql = ref("select * from file_system");
const columns = ref<any[]>([]);
const rows = ref<any[]>([]);
const tableComment = ref("");
const analyzing = ref(false);
const analysisData = ref<
  Record<string, Array<{ value: string; count: number }>>
>({});
const showEditor = ref(true);
const showDataType = ref(false);
const showTableComment = ref(false);
const showFieldComments = ref(false);

const columnFilterVisible = ref(false);
const selectedColumnNames = ref<string[]>([]);
const visibleColumns = computed(() => {
  if (!selectedColumnNames.value.length) return columns.value;
  return columns.value.filter((col) => {
    const colName = col.name || col;
    return selectedColumnNames.value.includes(colName);
  });
});

const dataTableRef = ref<any>(null);

/**
 * 获取列宽度（根据列名、类型、注释计算）
 */
function getColumnWidth(col: any): number {
  const name = col.name || col;
  let totalLen = String(name).length;
  if (showDataType.value && col.dataType) {
    totalLen += String(col.dataType).length + 3;
  }
  if (showTableComment.value && col.comment) {
    totalLen += String(col.comment).length + 3;
  }
  return Math.max(80, totalLen * 8 + 20);
}

// 处理后的表格数据（将 null 转为显示文本）
const displayRows = computed(() => {
  // 获取所有列名
  const colNames = columns.value.map((col: any) => col.name || col);

  return rows.value.map((row: any) => {
    const newRow: any = { ...row };
    colNames.forEach((key: string) => {
      const value = row[key];
      if (value === null || value === undefined) {
        newRow[key] = "NULL";
        newRow[`__null__${key}`] = true;
      } else if (typeof value === "object") {
        newRow[key] = JSON.stringify(value);
      }
    });
    return newRow;
  });
});

const activeTab = ref<"result" | "structure">("result");
const structureContent = ref("");
const statusText = ref("");
const currentNodeData = ref<any | null>(null);
const currentComment = ref("");

// 表结构对话框
const showStructureDialog = ref(false);
const structureTableName = ref("");

// 单元格编辑相关
const editingRowIndex = ref<number | null>(null);
const editingColumnName = ref<string | null>(null);
const editingValue = ref<string>("");
const editingOriginalValue = ref<any>(null);
const currentTableName = ref<string>("");
const primaryKeyColumn = ref<string>("");

// 表格最大高度
const tableMaxHeight = computed(() => {
  return showEditor.value ? "calc(100vh - 450px)" : "calc(100vh - 250px)";
});

/**
 * 判断单元格是否处于编辑状态
 */
function isEditing(rowIndex: number, columnName: string): boolean {
  return (
    editingRowIndex.value === rowIndex && editingColumnName.value === columnName
  );
}

/**
 * 格式化单元格值
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return "(NULL)";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * 双击单元格进入编辑模式
 */
function handleCellDblClick(
  row: any,
  column: any,
  cell: any,
  event: MouseEvent
) {
  // 忽略序号列
  if (column.type === "index") return;

  const columnName = column.property;
  if (!columnName) return;

  const rowIndex = rows.value.indexOf(row);
  if (rowIndex === -1) return;

  // 保存编辑状态
  editingRowIndex.value = rowIndex;
  editingColumnName.value = columnName;
  editingOriginalValue.value = row[columnName];
  editingValue.value = row[columnName] === null ? "" : String(row[columnName]);

  // 解析当前表名
  parseCurrentTableName();
}

/**
 * 解析当前表名（从 SQL 或路径中提取）
 */
function parseCurrentTableName() {
  // 从 currentPath 中提取表名
  if (currentPath.value) {
    const parts = currentPath.value.split("/");
    if (parts.length >= 2) {
      currentTableName.value = parts[parts.length - 1];
    }
  }
  // 从 currentNodeData 中获取
  if (currentNodeData.value?.name) {
    const type = (currentNodeData.value?.type || "").toString().toUpperCase();
    if (type.includes("TABLE")) {
      currentTableName.value = currentNodeData.value.name;
    }
  }
  // 尝试从 columns 中找主键
  const pkCol = columns.value.find((c: any) => c.isPrimary || c.primaryKey);
  if (pkCol) {
    primaryKeyColumn.value = pkCol.name || pkCol;
  } else if (columns.value.length > 0) {
    // 默认使用第一列
    const firstCol = columns.value[0];
    primaryKeyColumn.value = firstCol.name || firstCol;
  }
}

/**
 * 单元格失去焦点，保存修改
 */
async function handleCellBlur(row: any, columnName: string, rowIndex: number) {
  // 检查值是否变化
  const newValue = editingValue.value === "" ? null : editingValue.value;
  const oldValue = editingOriginalValue.value;

  if (
    newValue === oldValue ||
    (newValue === null && oldValue === null) ||
    String(newValue) === String(oldValue)
  ) {
    cancelEdit();
    return;
  }

  // 更新本地数据
  row[columnName] = newValue;

  // 尝试调用后端 API 更新（如果配置了表名和主键）
  if (currentTableName.value && primaryKeyColumn.value) {
    try {
      const primaryValue = row[primaryKeyColumn.value];
      await updateTableRow(props.id, {
        tableName: currentTableName.value,
        primaryKey: primaryKeyColumn.value,
        primaryValue: primaryValue,
        columnName: columnName,
        newValue: newValue,
      });
      statusText.value = `已更新: ${columnName} = ${newValue === null ? "NULL" : newValue}`;
    } catch (e: any) {
      // 恢复原值
      row[columnName] = oldValue;
      ElMessage.error("更新失败: " + (e?.message || "未知错误"));
    }
  }

  cancelEdit();
}

/**
 * 取消编辑
 */
function cancelEdit() {
  editingRowIndex.value = null;
  editingColumnName.value = null;
  editingValue.value = "";
  editingOriginalValue.value = null;
}

// 左右可拖拽分栏
const leftWidth = ref(300);
const isDragging = ref(false);
const gridStyle = computed(() => ({
  gridTemplateColumns: `${leftWidth.value}px 6px 1fr`,
}));
let startX = 0;
let startW = 300;
function onDragStart(e: MouseEvent) {
  isDragging.value = true;
  startX = e.clientX;
  startW = leftWidth.value;
  document.addEventListener("mousemove", onDragging);
  document.addEventListener("mouseup", onDragEnd);
  document.body.style.cursor = "col-resize";
}
function onDragging(e: MouseEvent) {
  if (!isDragging.value) return;
  const dx = e.clientX - startX;
  const next = Math.min(800, Math.max(220, startW + dx));
  leftWidth.value = next;
}
function onDragEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  document.removeEventListener("mousemove", onDragging);
  document.removeEventListener("mouseup", onDragEnd);
  document.body.style.cursor = "";
}
function resetWidth() {
  leftWidth.value = 300;
}

onBeforeUnmount(() => {
  onDragEnd();

  // 清理Socket.IO事件监听
  unsubscribeHandlers.forEach((handler) => handler());
  unsubscribeHandlers = [];

  // 如果是独立连接，断开连接
  if (socketConnection && !globalSocket?.value) {
    socketConnection.disconnect();
  }

  socketConnection = null;
});

// console config
const consoleConfig = ref<{
  jdbc?: {
    viewTableStructure?: boolean;
    copyTableName?: boolean;
    copyCreateTable?: boolean;
    addFieldComment?: boolean;
  };
}>({});

async function loadConsoleConfig() {
  if (!props.id) return;
  const res = await getConsoleConfig(props.id);
  const text = res?.data as string | undefined;
  if (text) {
    try {
      const parsed = JSON.parse(text) || {};
      // defaults when persisted config missing fields
      parsed.jdbc = Object.assign(
        {
          viewTableStructure: true,
          copyTableName: true,
          copyCreateTable: false,
          addFieldComment: true,
        },
        parsed.jdbc || {}
      );
      consoleConfig.value = parsed;
    } catch (_) {
      consoleConfig.value = {
        jdbc: {
          viewTableStructure: true,
          copyTableName: true,
          copyCreateTable: false,
          addFieldComment: true,
        },
      };
    }
  } else {
    // fallback defaults to avoid empty context menu
    consoleConfig.value = {
      jdbc: {
        viewTableStructure: true,
        copyTableName: true,
        copyCreateTable: false,
        addFieldComment: true,
      },
    };
  }
}

async function loadRoot() {
  const res = await getConsoleRoot(props.id, keyword.value);
  const records = extractArrayFromApi(res?.data);
  treeData.value = records.map(normalizeTreeNode);
  // 强制重建树，清理已加载/展开状态，避免重复追加
  await nextTick();
  treeVersion.value++;
}

function onRefreshTree() {
  loadRoot();
}

/**
 * 打开表结构对话框
 */
function openTableStructure(tableName?: string) {
  if (tableName) {
    structureTableName.value = tableName;
  } else if (currentNodeData.value) {
    const type = (currentNodeData.value?.type || "").toString().toUpperCase();
    if (type.includes("TABLE")) {
      structureTableName.value = currentNodeData.value.name;
    } else {
      ElMessage.warning("请先选择一个表");
      return;
    }
  } else {
    ElMessage.warning("请先选择一个表");
    return;
  }
  showStructureDialog.value = true;
}

/**
 * 刷新表结构后的回调
 * @param tableName 表名
 */
function onStructureRefresh(tableName: string) {
  // 刷新树节点
  if (tableName) {
    loadRoot();
  }
}

async function handleNodeClick(node: any) {
  currentNodeData.value = node;
  currentPath.value = node?.path;
  // 若为表节点，打开表（查询+注释）
  const type = (node?.type || "").toString().toUpperCase();
  if (type.includes("TABLE")) {
    sql.value = `select * from ${node.name} limit 1000`;
    await execute();
    //   const resp = await openTable(props.id, node.path, 100);
    //   columns.value = resp?.data?.data?.columns || [];
    //   rows.value = [];
    //   await Promise.resolve();
    //   rows.value = resp?.data?.data?.rows || [];
    //   columnComments.value = resp?.data?.data?.columnComments || {};
    //   tableComment.value = resp?.data?.data?.tableComment || '';
    //   activeTab.value = 'result';
  }
}

// 懒加载子节点（结合 hasChildren 展示展开图标）
const loadChildrenLazy = async (
  node: any,
  resolve: (children: any[]) => void
) => {
  // 根节点（node.level === 0）直接返回已有 children
  if (!node || node.level === 0) {
    return resolve(treeData.value || []);
  }
  const data = node.data || {};
  if (data.leaf === true) {
    return resolve([]);
  }
  const parentPath = data.path;
  const res = await getConsoleChildren(props.id, parentPath);
  const records = extractArrayFromApi(res?.data).map(normalizeTreeNode);
  resolve(records);
};

/**
 * 判断节点是否为表节点
 */
function isTableNode(node: any): boolean {
  if (!node) return false;
  const type = (node?.type || "").toString().toUpperCase();
  return type.includes("TABLE");
}

// 根据类型/层级返回 JDBC 树节点图标
/**
 * 根据节点元信息返回合适的图标
 */
function getJdbcNodeIcon(node: any, data: any): string {
  try {
    const type = (data?.type || "").toString().toLowerCase();
    if (type) {
      if (
        type.includes("db") ||
        type.includes("database") ||
        type.includes("schema") ||
        type.includes("catalog")
      )
        return "ri:database-2-line";
      if (type.includes("table")) return "ri:table-2";
      if (type.includes("column") || type.includes("field"))
        return "ri:braces-line";
      if (type.includes("view")) return "ri:layout-2-line";
      if (type.includes("index")) return "ri:hashtag";
    }
    // 按层级兜底：1-库 2-表 3-列 其他-文件
    const level = Number(node?.level || 0);
    if (level <= 1) return "ri:database-2-line";
    if (level === 2) return "ri:table-2";
    if (level === 3) return "ri:braces-line";
    return data?.leaf ? "ri:file-2-line" : "ri:folder-2-line";
  } catch (error) {
    return "ri:table-2";
  }
}

async function execute() {
  const start = performance.now();
  searched.value = false;
  const res = await executeConsole(
    props.id,
    sql.value,
    "sql",
    currentPath.value
  );
  const data = res?.data;
  const dataData = data?.data || {};
  columns.value = dataData?.columns || [];
  await Promise.resolve();
  rows.value = dataData?.rows || [];
  searched.value = true;
  const ms = Math.round(performance.now() - start);
  statusText.value = `已返回 ${rows.value.length} 行，用时 ${ms} ms, ${data?.errorMessage || ""}`;
  activeTab.value = "result";

  // 尝试加载字段信息（包含类型、注释等）
  if (currentPath.value && columns.value.length) {
    try {
      const resp = await openTable(props.id, currentPath.value, 1);
      if (resp?.data?.data) {
        tableComment.value = resp.data.data.tableComment || "";
        const columnInfos = resp.data.data.columns || [];
        const columnComments = resp.data.data.columnComments || {};

        // 构建列名到列信息的映射
        const columnInfoMap: Record<string, any> = {};
        columnInfos.forEach((info: any) => {
          if (info.name) {
            columnInfoMap[info.name] = info;
          }
        });

        // 合并列信息
        columns.value = columns.value.map((col: any) => {
          const colName = col.name || col;
          const info = columnInfoMap[colName] || {};
          return {
            ...(typeof col === "object" ? col : { name: col }),
            dataType: info.dataType || col?.dataType || "",
            comment:
              columnComments[colName] || info.comment || col?.comment || "",
            isPrimary: info.primaryKey || col?.isPrimary || false,
            nullable: info.nullable || col?.nullable,
            length: info.length || col?.length,
          };
        });
      }
    } catch (e) {
      // 忽略加载失败
    }
  }
}

function formatSql() {
  const src = sql.value || "";
  if (!src.trim()) return;
  try {
    const formatted = simpleSqlFormat(src);
    sql.value = formatted;
    statusText.value = "已格式化 SQL";
  } catch (e) {
    statusText.value = "格式化失败";
  }
}

function simpleSqlFormat(input: string): string {
  let s = (input || "").replace(/\r\n/g, "\n").trim();
  // 先统一多空格为单空格（注意：简单处理，可能影响字符串字面量）
  s = s.replace(/\s+/g, " ");

  // 关键词大写
  const KEYWORDS = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "CROSS JOIN",
    "ON",
    "AND",
    "OR",
    "UNION",
    "UNION ALL",
    "WITH",
    "VALUES",
    "INSERT",
    "UPDATE",
    "DELETE",
    "SET",
  ];
  // 先按长度降序，避免短词先匹配
  KEYWORDS.sort((a, b) => b.length - a.length);
  for (const kw of KEYWORDS) {
    const pattern = kw.replace(/\s+/g, "\\s+");
    const re = new RegExp(`\\b${pattern}\\b`, "gi");
    s = s.replace(re, kw);
  }

  // 在主要关键词前断行
  const BREAK_BEFORE = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "UNION ALL",
    "UNION",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "CROSS JOIN",
    "JOIN",
    "ON",
    "AND",
    "OR",
  ];
  for (const token of BREAK_BEFORE) {
    const pattern = token.replace(/\s+/g, "\\s+");
    const re = new RegExp(`\\s*\\b${pattern}\\b`, "g");
    s = s.replace(re, `\n${token}`);
  }

  // 逗号后换行，提升可读性
  s = s.replace(/,\s*/g, ",\n  ");
  // 多余空行压缩
  s = s.replace(/\n{2,}/g, "\n");

  // 简单缩进：根据括号层级
  const lines = s.split("\n").map((l) => l.trim());
  const out: string[] = [];
  let level = 0;
  for (let line of lines) {
    if (!line) continue;
    // 关闭括号在前，先减级
    const leadingClose = line.match(/^\)+/);
    if (leadingClose) {
      level = Math.max(0, level - leadingClose[0].length);
    }
    out.push("  ".repeat(level) + line);
    // 行内括号调整层级
    const open = (line.match(/\(/g) || []).length;
    const close = (line.match(/\)/g) || []).length;
    level = Math.max(0, level + open - close);
  }
  return out.join("\n");
}

async function openStructureTab() {
  if (!currentPath.value) return;
  structureContent.value = await fetchStructure(currentPath.value);
  activeTab.value = "structure";
}

function barStyle(col: string, b: { value: string; count: number }) {
  const list = analysisData.value[col] || [];
  const max = Math.max(1, ...list.map((i) => i.count));
  const w = Math.max(30, Math.round((b.count / max) * 120));
  return { width: `${w}px` };
}

function barTooltip(col: string, b: { value: string; count: number }) {
  const v =
    b.value === null || b.value === undefined || b.value === "null"
      ? "(空)"
      : String(b.value);
  return `${col}: ${v}（${b.count}）`;
}

const filters = ref<Record<string, Set<string>>>({});
const hasActiveFilters = computed(() =>
  Object.values(filters.value).some((s) => s && s.size > 0)
);
function toggleFilter(col: string, value: string) {
  if (!filters.value[col]) filters.value[col] = new Set();
  const set = filters.value[col];
  const v = String(value);
  if (set.has(v)) set.delete(v);
  else set.add(v);
}
function clearAllFilters() {
  filters.value = {} as any;
}
function removeFilterGroup(col: string) {
  delete filters.value[col];
}

function rowClassName({ row }) {
  // 当配置了某列的筛选值，则不在所选值集合中的行置灰
  for (const col of Object.keys(filters.value)) {
    const set = filters.value[col];
    if (set && set.size > 0) {
      const v = String(row[col]);
      if (!set.has(v)) return "row-dim";
    }
  }
  return "";
}

async function toggleAnalyze() {
  analyzing.value = !analyzing.value;
  if (!analyzing.value) {
    analysisData.value = {};
    filters.value = {} as any;
    return;
  }
  if (!currentPath.value) return;
  const resp = await analyzeTable(props.id, currentPath.value, 1000);
  analysisData.value = resp?.data || {};
}

async function fetchStructure(nodePath: string): Promise<string> {
  const res = await getConsoleNode(props.id, nodePath, "structure");
  const detail = res?.data?.data || "";
  return typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
}

async function loadCurrentComment() {
  currentComment.value = "";
  try {
    if (currentPath.value) {
      const res = await getFieldComment(props.id, currentPath.value);
      currentComment.value =
        res?.data?.data?.systemDataFieldCommentComment || "";
    }
  } catch (_) {}
}

/**
 * 右键菜单状态管理
 */
const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const contextNode = ref<any | null>(null);

/**
 * 判断是否为列/字段类型的叶子节点
 */
function isColumnLeaf(data: any): boolean {
  const type = (data?.type || "").toString().toLowerCase();
  if (type.includes("column") || type.includes("field")) return true;
  // level 3 usually column, also rely on leaf flag
  return (
    Boolean(data?.leaf) &&
    (data?.level === 3 || /\.(\w+)$/.test(data?.path || ""))
  );
}

/**
 * 构建右键菜单项
 * - 根据控制台配置和节点类型动态生成
 */
function buildMenuItems(type): MenuItem[] {
  const allow = (p?: boolean) => Boolean(p);
  const items: MenuItem[] = [];
  // 刷新当前节点（仅非叶子节点显示）
  if (contextNode.value && contextNode.value.leaf !== true) {
    items.push({ key: "refresh-node", label: "刷新", icon: "ri:refresh-line" });
  }
  if (type?.includes("TABLE")) {
    items.push({ key: "open-table", label: "打开表", icon: "ri:table-2" });
    items.push({
      key: "design-table",
      label: "设计表",
      icon: "ri:tools-line",
    });
    items.push({ key: "divider-1", label: "", divider: true });
    items.push({
      key: "import-csv",
      label: "导入CSV",
      icon: "ri:file-upload-line",
    });
    items.push({ key: "divider-2", label: "", divider: true });
  }
  if (
    allow(consoleConfig.value.jdbc?.copyTableName) &&
    type.includes("TABLE")
  ) {
    items.push({
      key: "copy-table-name",
      label: "复制表名",
      icon: "ri:file-copy-line",
    });
  }
  if (
    allow(consoleConfig.value.jdbc?.copyCreateTable) &&
    type.includes("TABLE")
  ) {
    items.push({
      key: "copy-create-sql",
      label: "复制建表语句",
      icon: "ri:article-line",
    });
  }

  if (
    allow(consoleConfig.value.jdbc?.copyTableName) &&
    type.includes("COLUMN")
  ) {
    items.push({
      key: "copy-column-name",
      label: "复制字段名",
      icon: "ri:file-copy-line",
    });
  }
  // 添加注释：仅在字段（叶子列）上显示
  if (
    allow(consoleConfig.value.jdbc?.addFieldComment) &&
    contextNode.value &&
    isColumnLeaf(contextNode.value) &&
    type.includes("COLUMN")
  ) {
    items.push({
      key: "add-comment",
      label: "添加注释",
      icon: "ri:chat-new-line",
    });
  }
  // SPI 能力：重命名表 / 备份表（仅在表节点显示）
  if (type.includes("TABLE")) {
    items.push({
      key: "rename-table",
      label: "重命名表",
      icon: "ri:edit-2-line",
    });
    items.push({
      key: "backup-table",
      label: "备份表",
      icon: "ri:database-2-line",
    });
  }
  return items;
}

const menuItems = ref<MenuItem[]>([]);

/**
 * 处理树节点右键事件，展示上下文菜单
 */
function handleNodeContextMenu(event: MouseEvent, data: any) {
  contextNode.value = data;
  menuItems.value = buildMenuItems(data.type);
  if (!menuItems.value.length) {
    return;
  }
  menuX.value = event.clientX;
  menuY.value = event.clientY;
  menuVisible.value = true;
  const hide = () => {
    menuVisible.value = false;
    document.removeEventListener("click", hide);
  };
  document.addEventListener("click", hide);
}

/**
 * 处理右键菜单点击
 */
async function onMenuSelect(key: string) {
  if (!contextNode.value) return;
  switch (key) {
    case "refresh-node":
      await refreshContextNodeChildren();
      break;
    case "open-table":
      await openTableAndRender(true);
      break;
    case "design-table":
      openTableStructure(contextNode.value?.name);
      break;
    case "import-csv":
      showImportCsvDialog(contextNode.value?.name);
      break;
    case "copy-table-name":
      await copyTableName(contextNode.value);
      break;
    case "copy-column-name":
      await copyTableName(contextNode.value);
      break;
    case "copy-create-sql":
      await copyCreateSql(contextNode.value);
      break;
    case "add-comment":
      await addFieldComment(contextNode.value);
      break;
    case "rename-table": {
      if (!contextNode.value?.path) return;
      try {
        const { value } = await ElMessageBox.prompt(
          "请输入新表名：",
          "重命名表",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            inputValue: contextNode.value.name,
          }
        );
        if (!value || !value.trim()) return;
        await renameTable(props.id, {
          nodePath: contextNode.value.path,
          newName: value.trim(),
        });
        ElMessage.success("已重命名");
        contextNode.value.name = value.trim();
        refreshNodeChildren({
          path: contextNode.value.parentPath,
        });
        // await refreshContextNodeChildren();
      } catch (_) {}
      break;
    }
    case "backup-table": {
      if (!contextNode.value?.path) return;
      try {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const defaultName = `${contextNode.value.name}${yyyy}${mm}${dd}`;
        const { value } = await ElMessageBox.prompt(
          "请输入备份表名：",
          "备份表",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            inputValue: defaultName,
          }
        );
        if (!value || !value.trim()) return;
        await backupTable(props.id, {
          nodePath: contextNode.value.path,
          backupName: value.trim(),
        });
        ElMessage.success("已发起备份");
        refreshNodeChildren({
          path: contextNode.value.parentPath,
        });
      } catch (_) {}
      break;
    }
  }
}

async function openTableAndRender(hideEditor: boolean) {
  const node = contextNode.value;
  if (!node?.path) return;

  try {
    // 设置当前节点
    currentNodeData.value = node;
    currentPath.value = node.path;

    // 生成查询SQL并执行
    sql.value = `SELECT * FROM ${node.name} LIMIT 1000`;
    showEditor.value = !hideEditor;

    // 执行查询
    await execute();

    // 加载表注释
    const resp = await openTable(props.id, node.path, 1000);
    if (resp?.data?.data) {
      tableComment.value = resp.data.data.tableComment || "";
      // 合并字段注释
      const columnComments = resp.data.data.columnComments || {};
      columns.value = columns.value.map((col: any) => {
        const colName = col.name || col;
        return {
          ...col,
          comment: columnComments[colName] || col.comment || "",
        };
      });
    }

    activeTab.value = "result";
    searched.value = true;
  } catch (e: any) {
    ElMessage.error("打开表失败: " + (e.message || e));
  }
}

/**
 * 显示导入CSV对话框
 */
const importCsvVisible = ref(false);
const importCsvTableName = ref("");
const importCsvForm = ref({
  filePath: "",
  fieldTerminator: ",",
  lineTerminator: "\\n",
  ignoreLines: 1,
  charset: "utf8mb4",
});

function showImportCsvDialog(tableName: string) {
  if (!tableName) {
    ElMessage.warning("请先选择一个表");
    return;
  }
  importCsvTableName.value = tableName;
  importCsvForm.value = {
    filePath: "",
    fieldTerminator: ",",
    lineTerminator: "\\n",
    ignoreLines: 1,
    charset: "utf8mb4",
  };
  importCsvVisible.value = true;
}

async function handleImportCsv() {
  if (!importCsvForm.value.filePath) {
    ElMessage.warning("请输入CSV文件路径");
    return;
  }

  // 构建LOAD DATA SQL
  const loadSql = `LOAD DATA LOCAL INFILE '${importCsvForm.value.filePath}'
INTO TABLE ${importCsvTableName.value}
CHARACTER SET ${importCsvForm.value.charset}
FIELDS TERMINATED BY '${importCsvForm.value.fieldTerminator}'
LINES TERMINATED BY '${importCsvForm.value.lineTerminator}'
IGNORE ${importCsvForm.value.ignoreLines} LINES`;

  try {
    sql.value = loadSql;
    await execute();
    ElMessage.success("导入成功");
    importCsvVisible.value = false;
  } catch (e: any) {
    ElMessage.error("导入失败: " + (e.message || e));
  }
}

/**
 * 刷新当前节点的子节点
 */
async function refreshNodeChildren(node: any) {
  if (!node?.path) return;
  try {
    const res = await getConsoleChildren(props.id, node?.path);
    const records = extractArrayFromApi(res?.data).map(normalizeTreeNode);
    if (
      treeRef.value &&
      typeof treeRef.value.updateKeyChildren === "function"
    ) {
      // 用 API 覆盖子节点，避免越刷越多
      treeRef.value.updateKeyChildren(node?.path, records);
    } else {
      // 兜底：直接覆盖数据
      node.children = records;
    }
    node.leaf = records.length === 0;
  } catch (e) {
    // ignore
  } finally {
    menuVisible.value = false;
  }
}
/**
 * 刷新当前右键节点的子节点
 */
async function refreshContextNodeChildren() {
  const node = contextNode.value;
  if (!node?.path) return;
  try {
    const res = await getConsoleChildren(props.id, node.path);
    const records = extractArrayFromApi(res?.data).map(normalizeTreeNode);
    if (
      treeRef.value &&
      typeof treeRef.value.updateKeyChildren === "function"
    ) {
      // 用 API 覆盖子节点，避免越刷越多
      treeRef.value.updateKeyChildren(node.path, records);
    } else {
      // 兜底：直接覆盖数据
      node.children = records;
    }
    node.leaf = records.length === 0;
  } catch (e) {
    // ignore
  } finally {
    menuVisible.value = false;
  }
}

/**
 * 查看表结构（将返回内容放置到 SQL 编辑器中展示）
 */
async function viewTableStructure(node: any) {
  if (!node?.path) return;
  const res = await getConsoleNode(props.id, node.path, "structure");
  const detail = res?.data?.data || "";
  // 简单展示：放到 editor 中
  sql.value =
    typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
}

/**
 * 复制树节点名称（通常为表名或列名）
 */
async function copyTableName(node: any) {
  const name = node?.name || "";
  if (!name) return;
  await navigator.clipboard.writeText(name);
}

/**
 * 复制建表语句
 */
async function copyCreateSql(node: any) {
  if (!node?.path) return;
  const res = await getConsoleNode(props.id, node.path, "ddl");
  const ddl = res?.data?.data || "";
  await navigator.clipboard.writeText(
    typeof ddl === "string" ? ddl : JSON.stringify(ddl)
  );
}

/**
 * 为指定字段节点添加注释
 * - 弹出输入框
 * - 提交到后端保存
 */
async function addFieldComment(node: any) {
  if (!node?.path) return;
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入要添加的注释内容：",
      "添加注释",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputType: "textarea",
        inputPlaceholder: "请输入注释...",
        inputValue: node?.properties?.comment || "",
      }
    );
    if (!value || !value.trim()) return;
    await saveFieldComment(props.id, {
      nodePath: node.path,
      comment: value.trim(),
      dataType: node.properties?.dataType,
      nullable: node.properties?.nullable,
    });
    ElMessage.success("已保存注释");
    node.properties.comment = value.trim();
  } catch (_) {
    // canceled
  }
}

onMounted(async () => {
  await Promise.all([loadConsoleConfig(), loadRoot()]);

  // 建立Socket.IO连接
  if (globalSocket?.value) {
    // 使用全局Socket.IO连接
    socketConnection = globalSocket.value;
  } else {
    // 创建独立的Socket.IO连接
    const config = getConfig();
    socketConnection = socket(splitToArray(config.SocketUrl), undefined, {});
  }

  if (socketConnection) {
    // 监听系统数据监听事件
    const listenHandler = (data: any) => {
      if (data.settingId === props.id && data.type === "jdbc") {
        try {
          console.log("JDBC Console received message:", data);
          if (data.messageType === "status") {
            statusText.value = data.content || "";
          } else if (data.messageType === "log") {
            ElMessage.info(data.content || "");
          } else if (data.messageType === "error") {
            ElMessage.error(data.content || "操作出现错误");
          }
        } catch (error) {
          console.error("Error processing console message:", error);
        }
      }
    };

    const logHandler = (data: any) => {
      if (data.settingId === props.id && data.type === "jdbc") {
        try {
          console.log("JDBC Console log:", data);
          ElMessage.info(data.content || "");
        } catch (error) {
          console.error("Error processing log message:", error);
        }
      }
    };

    socketConnection.on("system/data/listen", listenHandler);
    socketConnection.on("system/data/log", logHandler);

    unsubscribeHandlers.push(
      () => socketConnection.off("system/data/listen", listenHandler),
      () => socketConnection.off("system/data/log", logHandler)
    );
  }
});
</script>
<style scoped lang="scss">
/* 控制台主容器 */
.console {
  display: grid;
  grid-template-columns: 300px 6px 1fr;
  height: calc(100vh - 16px);
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 12px;
  gap: 0;
}

/* 左侧树形面板 */
.left {
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.left:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

/* 左侧头部 */
.left-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.left-header .header-icon {
  font-size: 20px;
  color: #3b82f6;
}

.left-header .header-title {
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

/* 搜索框 */
.search-input {
  margin-bottom: 8px;
}

.left :deep(.el-input) {
  border-radius: 10px;
  overflow: hidden;
}

.left :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.left :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.left :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 树形组件美化 */
.tree {
  margin-top: 12px;
  flex: 1;
  overflow: auto;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  padding: 8px;
}

.tree :deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 8px;
  margin: 2px 0;
  padding: 0 8px;
  transition: all 0.2s ease;
}

.tree :deep(.el-tree-node__content:hover) {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
}

.tree
  :deep(.el-tree-node.is-current > .el-tree-node__content .el-form-item-msg) {
  color: rgba(255, 255, 255, 0.8);
}

.left-toolbar {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

/* 拖拽分割条 */
.splitter {
  width: 6px;
  cursor: col-resize;
  background: transparent;
  position: relative;
  transition: all 0.2s ease;
}

.splitter::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 40px;
  background: #cbd5e1;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.splitter:hover::before {
  background: #3b82f6;
  height: 60px;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

/* 右侧内容面板 */
.right {
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 右侧头部工具栏 */
.right-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  gap: 16px;
}

.right-header .path {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.8);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.right-header .path .iconify {
  color: #3b82f6;
}

.right-header .comment {
  margin-left: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar :deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.toolbar :deep(.el-button:hover) {
  transform: translateY(-1px);
}

.toolbar :deep(.el-button--primary) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.toolbar :deep(.el-button--primary:hover) {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.toolbar :deep(.el-button-group) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  overflow: hidden;
}

.ellipsis {
  max-width: 520px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 右侧主体内容 */
.right-body {
  padding: 16px;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  background: #fff;
}

/* 代码编辑器容器 */
.right-body :deep(.code-editor) {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 结果区域 */
.result {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: row;
  align-content: end;
  gap: 8px;
}

.result :deep(.el-button) {
  border-radius: 6px;
}

/* 结果标签页美化 */
.result-tabs {
  flex: 1 !important;
  border-radius: 12px;
  overflow: hidden;
}

.result-tabs :deep(.el-tabs__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px 12px 0 0;
  margin: 0;
}

.result-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 12px;
}

.result-tabs :deep(.el-tabs__item) {
  height: 40px;
  line-height: 40px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.result-tabs :deep(.el-tabs__item.is-active) {
  color: #3b82f6;
}

.result-tabs :deep(.el-tabs__content) {
  padding: 12px;
  background: #fff;
}

/* 表格美化 */
.result-tabs :deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.result-tabs :deep(.el-table::before) {
  display: none;
}

.result-tabs :deep(.el-table th.el-table__cell) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  font-weight: 600;
  color: #334155;
  font-size: 13px;
  border-bottom: 2px solid #e2e8f0 !important;
  padding: 12px 8px;
}

.result-tabs :deep(.el-table td.el-table__cell) {
  padding: 10px 8px;
  font-size: 13px;
  color: #475569;
  border-bottom: 1px solid #f1f5f9 !important;
}

.result-tabs :deep(.el-table tr:hover > td.el-table__cell) {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
}

.result-tabs
  :deep(
    .el-table--striped
      .el-table__body
      tr.el-table__row--striped
      td.el-table__cell
  ) {
  background: #fafbfc !important;
}

.result-tabs :deep(.el-table .cell) {
  line-height: 1.5;
  word-break: break-word;
}

.result-tabs :deep(.el-table--border .el-table__cell) {
  border-right: 1px solid #f1f5f9 !important;
}

.result-tabs :deep(.el-table__empty-block) {
  min-height: 200px;
}

/* 数据表格美化 - Navicat 风格 */
.data-table {
  border-radius: 4px;
  overflow: auto;
}

.data-table :deep(.el-table__body-wrapper) {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

.data-table :deep(.el-scrollbar__bar.is-horizontal) {
  display: block !important;
  height: 8px !important;
}

.data-table :deep(.el-scrollbar__bar.is-horizontal .el-scrollbar__thumb) {
  background: #c0c4cc !important;
}

/* NULL 值样式 */
.cell-null {
  color: #999 !important;
  font-style: italic !important;
}

.data-table :deep(.el-table) {
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  --el-table-row-hover-bg-color: #e3f2fd;
  --el-table-current-row-bg-color: #bbdefb;
}

.data-table :deep(.el-table__header-wrapper th) {
  background: #f5f5f5 !important;
  padding: 4px 6px !important;
  font-weight: 600;
  color: #333;
  vertical-align: top;
}

.data-table :deep(.el-table__header-wrapper .cell) {
  padding: 4px !important;
  line-height: 1.4 !important;
}

.data-table :deep(.el-table__body-wrapper td) {
  padding: 2px 6px !important;
  height: 22px !important;
  line-height: 18px !important;
  border-bottom: 1px solid #eee !important;
}

.data-table :deep(.el-table__body-wrapper .cell) {
  padding: 0 4px !important;
  line-height: 18px !important;
}

.data-table :deep(.el-table__row) {
  height: 22px !important;
}

.data-table :deep(.el-table__row:hover > td) {
  background: #e3f2fd !important;
}

.data-table :deep(.el-table__row.current-row > td) {
  background: #bbdefb !important;
}

.data-table :deep(.el-table--border .el-table__cell) {
  border-right: 1px solid #eee !important;
}

/* ScTable 特有样式 */
.data-table :deep(.sc-table-container) {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.data-table :deep(.sc-table-header) {
  display: none;
}

.data-table :deep(.sc-table-footer) {
  display: none;
}

/* 列头样式 */
.col-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.col-header-main {
  display: flex;
  align-items: center;
  gap: 4px;
}

.col-name {
  font-weight: 600;
  color: #333;
  font-size: 12px;
}

.col-pk-badge {
  display: inline-block;
  padding: 0 4px;
  background: #ff9800;
  color: #fff;
  font-size: 9px;
  font-weight: 600;
  border-radius: 2px;
  line-height: 14px;
}

.col-type-badge {
  display: inline-block;
  padding: 0 4px;
  background: #e0e0e0;
  color: #666;
  font-size: 9px;
  font-weight: 500;
  border-radius: 2px;
  line-height: 14px;
  text-transform: uppercase;
}

.col-type {
  font-size: 11px;
  color: #666;
  font-style: italic;
}

.col-comment {
  font-size: 10px;
  color: #999;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 单元格包装 */
.cell-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cell-comment {
  font-size: 10px;
  color: #999;
  font-style: italic;
}

/* 单元格内容 */
.cell-content {
  display: flex;
  align-items: center;
  min-height: 16px;
  width: 100%;
}

.cell-content.cell-editing {
  padding: 0;
}

.cell-content :deep(.el-input) {
  width: 100%;
}

.cell-content :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #2196f3;
  border-radius: 2px;
  padding: 0 4px;
}

.cell-content :deep(.el-input__inner) {
  height: 20px !important;
  line-height: 20px !important;
  font-size: 12px;
}

.cell-value {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
  font-size: 12px;
}

.cell-null {
  color: #999;
  font-style: italic;
}

.field-comment {
  font-size: 11px;
  color: #94a3b8;
  margin-right: 4px;
}

.hidden-note {
  font-size: 11px;
  color: #94a3b8;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 分析面板 */
.analysis-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  max-height: 200px;
  overflow: auto;
}

.analysis-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 13px;
  color: #334155;
  margin-bottom: 10px;
}

.analysis-content {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.analysis-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 8px 12px;
  min-width: 120px;
  max-width: 200px;
}

.analysis-col-name {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-bars {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.analysis-bar-item {
  display: flex;
  align-items: center;
}

.analysis-bar {
  height: 16px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  padding: 0 6px;
  min-width: 30px;
}

.analysis-bar:hover {
  opacity: 0.8;
  transform: scaleX(1.02);
}

.bar-label {
  font-size: 10px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.analysis-empty {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

/* 分析柱状图 */
.mini-bar {
  display: inline-flex;
  align-items: flex-end;
  gap: 3px;
  height: 42px;
  margin-top: 6px;
  padding: 4px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 6px;
}

.mini-bar .bar-wrap {
  display: flex;
  align-items: flex-end;
}

.mini-bar .bar {
  width: 8px;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.9;
  transition: all 0.2s ease;
}

.mini-bar .bar:hover {
  opacity: 1;
  transform: scaleY(1.1);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

/* 置灰行 */
.row-dim {
  opacity: 0.35;
  transition: opacity 0.2s ease;
}

.row-dim:hover {
  opacity: 0.6;
}

/* 列筛选弹窗 */
.col-filter {
  padding: 12px;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.filter-title {
  font-weight: 600;
  color: #334155;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.filter-list {
  margin-top: 8px;
}

.col-filter :deep(.el-checkbox) {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.col-filter :deep(.el-checkbox:hover) {
  background: #f1f5f9;
}

.col-filter :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #475569;
}

/* 状态栏 */
.right-status {
  height: 36px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #64748b;
  font-size: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.right-status span {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 注释文本 */
.comment-text {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 2px;
}

/* 滚动条美化 */
.thin-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.thin-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.thin-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 空状态美化 */
.result-tabs :deep(.el-empty) {
  padding: 40px 0;
}

.result-tabs :deep(.el-empty__description) {
  color: #94a3b8;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.left,
.right {
  animation: fadeIn 0.4s ease forwards;
}

.right {
  animation-delay: 0.1s;
}

/* 导入CSV对话框 */
.import-csv-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.import-csv-dialog :deep(.el-alert) {
  border-radius: 8px;
}

.form-tip {
  margin-left: 12px;
  color: #94a3b8;
  font-size: 12px;
}

/* 工具栏按钮组优化 */
.toolbar :deep(.el-button--success) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.toolbar :deep(.el-button--success:hover) {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}
</style>
