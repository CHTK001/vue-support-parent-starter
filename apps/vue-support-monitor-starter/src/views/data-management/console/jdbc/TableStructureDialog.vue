<template>
  <el-dialog
    v-model="visible"
    :title="`表结构 - ${tableName}`"
    width="1100px"
    :close-on-click-modal="false"
    class="table-structure-dialog"
    draggable
    top="5vh"
  >
    <div class="structure-container">
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 字段列表 -->
        <el-tab-pane label="字段" name="columns">
          <div class="toolbar">
            <el-button type="primary" size="small" @click="handleAddRow">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              添加字段
            </el-button>
            <el-button type="success" size="small" @click="handleInsertRow" :disabled="selectedRowIndex < 0">
              <IconifyIconOnline icon="ri:insert-row-bottom" class="mr-1" />
              插入字段
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteRow" :disabled="selectedRowIndex < 0">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              删除字段
            </el-button>
            <el-divider direction="vertical" />
            <el-button size="small" @click="handleMoveUp" :disabled="selectedRowIndex <= 0">
              <IconifyIconOnline icon="ri:arrow-up-line" class="mr-1" />
              上移
            </el-button>
            <el-button size="small" @click="handleMoveDown" :disabled="selectedRowIndex < 0 || selectedRowIndex >= columns.length - 1">
              <IconifyIconOnline icon="ri:arrow-down-line" class="mr-1" />
              下移
            </el-button>
            <el-divider direction="vertical" />
            <el-button size="small" @click="loadStructure">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
            <el-button type="warning" size="small" @click="handleSaveAll" :loading="saving" :disabled="!hasChanges">
              <IconifyIconOnline icon="ri:save-line" class="mr-1" />
              保存修改
            </el-button>
          </div>

          <!-- 可编辑表格 -->
          <div class="table-wrapper">
            <el-table
              ref="tableRef"
              :data="columns"
              border
              size="small"
              height="450px"
              row-key="__key"
              highlight-current-row
              @current-change="handleCurrentChange"
              @row-dblclick="handleRowDblClick"
              :row-class-name="getRowClassName"
            >
              <el-table-column type="index" width="50" label="#" fixed="left" />
              
              <!-- 字段名 -->
              <el-table-column prop="name" label="字段名" width="150" fixed="left">
                <template #default="{ row, $index }">
                  <el-input
                    v-if="editingCell?.row === $index && editingCell?.col === 'name'"
                    v-model="row.name"
                    size="small"
                    @blur="finishEdit"
                    @keyup.enter="finishEdit"
                    ref="editInputRef"
                  />
                  <div v-else class="cell-content" @dblclick="startEdit($index, 'name')">
                    <span class="column-name">{{ row.name || '(未命名)' }}</span>
                    <el-tag v-if="row.primaryKey" type="warning" size="small" class="ml-1">PK</el-tag>
                    <el-tag v-if="row.autoIncrement" type="info" size="small" class="ml-1">AI</el-tag>
                    <el-tag v-if="row.__isNew" type="success" size="small" class="ml-1">新</el-tag>
                    <el-tag v-else-if="row.__modified" type="primary" size="small" class="ml-1">改</el-tag>
                  </div>
                </template>
              </el-table-column>

              <!-- 数据类型 -->
              <el-table-column prop="dataType" label="类型" width="160">
                <template #default="{ row, $index }">
                  <el-autocomplete
                    v-if="editingCell?.row === $index && editingCell?.col === 'dataType'"
                    v-model="row.fullType"
                    :fetch-suggestions="queryDataTypes"
                    size="small"
                    style="width: 100%"
                    @blur="finishEdit"
                    @select="finishEdit"
                    ref="editInputRef"
                    placeholder="如 VARCHAR(255)"
                  />
                  <div v-else class="cell-content type-cell" @dblclick="startEdit($index, 'dataType')">
                    {{ row.fullType || row.dataType || '(未设置)' }}
                  </div>
                </template>
              </el-table-column>

              <!-- 长度 -->
              <el-table-column prop="length" label="长度" width="80" align="center">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-if="editingCell?.row === $index && editingCell?.col === 'length'"
                    v-model="row.length"
                    size="small"
                    :min="0"
                    :controls="false"
                    style="width: 100%"
                    @blur="finishEdit"
                    @keyup.enter="finishEdit"
                    ref="editInputRef"
                  />
                  <div v-else class="cell-content" @dblclick="startEdit($index, 'length')">
                    {{ row.length ?? '-' }}
                  </div>
                </template>
              </el-table-column>

              <!-- 小数位 -->
              <el-table-column prop="scale" label="小数位" width="70" align="center">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-if="editingCell?.row === $index && editingCell?.col === 'scale'"
                    v-model="row.scale"
                    size="small"
                    :min="0"
                    :controls="false"
                    style="width: 100%"
                    @blur="finishEdit"
                    @keyup.enter="finishEdit"
                    ref="editInputRef"
                  />
                  <div v-else class="cell-content" @dblclick="startEdit($index, 'scale')">
                    {{ row.scale ?? '-' }}
                  </div>
                </template>
              </el-table-column>

              <!-- 不是null -->
              <el-table-column prop="nullable" label="不是null" width="80" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.notNull" @change="markModified(row)" />
                </template>
              </el-table-column>

              <!-- 主键 -->
              <el-table-column prop="primaryKey" label="主键" width="60" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.primaryKey" @change="markModified(row)" />
                </template>
              </el-table-column>

              <!-- 自增 -->
              <el-table-column prop="autoIncrement" label="自增" width="60" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.autoIncrement" @change="markModified(row)" />
                </template>
              </el-table-column>

              <!-- 默认值 -->
              <el-table-column prop="defaultValue" label="默认值" width="120">
                <template #default="{ row, $index }">
                  <el-input
                    v-if="editingCell?.row === $index && editingCell?.col === 'defaultValue'"
                    v-model="row.defaultValue"
                    size="small"
                    @blur="finishEdit"
                    @keyup.enter="finishEdit"
                    ref="editInputRef"
                  />
                  <div v-else class="cell-content default-value" @dblclick="startEdit($index, 'defaultValue')">
                    {{ row.defaultValue || '-' }}
                  </div>
                </template>
              </el-table-column>

              <!-- 注释 -->
              <el-table-column prop="comment" label="注释" min-width="180">
                <template #default="{ row, $index }">
                  <el-input
                    v-if="editingCell?.row === $index && editingCell?.col === 'comment'"
                    v-model="row.comment"
                    size="small"
                    @blur="finishEdit"
                    @keyup.enter="finishEdit"
                    ref="editInputRef"
                  />
                  <div v-else class="cell-content comment-text" @dblclick="startEdit($index, 'comment')">
                    {{ row.comment || '-' }}
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 状态栏 -->
          <div class="status-bar">
            <span v-if="hasChanges" class="status-changed">
              <IconifyIconOnline icon="ri:error-warning-line" class="mr-1" />
              有未保存的修改
            </span>
            <span v-else class="status-saved">
              <IconifyIconOnline icon="ri:checkbox-circle-line" class="mr-1" />
              已保存
            </span>
            <span class="status-count">共 {{ columns.length }} 个字段</span>
          </div>
        </el-tab-pane>

        <!-- 索引 -->
        <el-tab-pane label="索引" name="indexes">
          <div class="empty-tip">
            <IconifyIconOnline icon="ri:database-2-line" style="font-size: 48px; color: #c0c4cc;" />
            <p>索引管理功能开发中...</p>
          </div>
        </el-tab-pane>

        <!-- DDL语句 -->
        <el-tab-pane label="DDL" name="ddl">
          <div class="toolbar">
            <el-button size="small" @click="copyDdl">
              <IconifyIconOnline icon="ri:file-copy-line" class="mr-1" />
              复制
            </el-button>
            <el-button size="small" @click="loadStructure">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
          </div>
          <div class="ddl-container">
            <pre class="ddl-code"><code>{{ ddl || '加载中...' }}</code></pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" :loading="saving" :disabled="!hasChanges" @click="handleSaveAll">
          保存修改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 表结构编辑对话框
 * 参考Navicat实现，支持字段的新增、删除、修改、顺序调整等
 *
 * @author CH
 * @since 2025-11-30
 */
import { ref, watch, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getTableStructure,
  getCreateTableDdl,
  addColumn,
  modifyColumn,
  dropColumn,
  reorderColumn,
} from "@/api/system-data";

interface ColumnInfo {
  name: string;
  dataType: string;
  fullType: string;
  length?: number;
  scale?: number;
  nullable: boolean;
  notNull?: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  comment?: string;
  ordinalPosition: number;
  // 内部状态
  __key?: string;
  __isNew?: boolean;
  __modified?: boolean;
  __originalName?: string;
  __deleted?: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  settingId: number;
  tableName: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "refresh"): void;
}>();

const visible = ref(false);
const activeTab = ref("columns");
const columns = ref<ColumnInfo[]>([]);
const originalColumns = ref<ColumnInfo[]>([]);
const ddl = ref("");
const saving = ref(false);
const tableRef = ref<any>(null);
const editInputRef = ref<any>(null);

// 当前选中行
const selectedRowIndex = ref(-1);
const selectedRow = ref<ColumnInfo | null>(null);

// 编辑状态
const editingCell = ref<{ row: number; col: string } | null>(null);

// 删除的字段列表
const deletedColumns = ref<string[]>([]);

// 唯一key生成器
let keyCounter = 0;
function generateKey() {
  return `col_${Date.now()}_${keyCounter++}`;
}

// 常用数据类型
const commonDataTypes = [
  { value: "INT" },
  { value: "BIGINT" },
  { value: "SMALLINT" },
  { value: "TINYINT" },
  { value: "VARCHAR(255)" },
  { value: "VARCHAR(50)" },
  { value: "VARCHAR(100)" },
  { value: "CHAR(32)" },
  { value: "TEXT" },
  { value: "MEDIUMTEXT" },
  { value: "LONGTEXT" },
  { value: "DATETIME" },
  { value: "TIMESTAMP" },
  { value: "DATE" },
  { value: "TIME" },
  { value: "DECIMAL(10,2)" },
  { value: "DECIMAL(18,4)" },
  { value: "DOUBLE" },
  { value: "FLOAT" },
  { value: "BOOLEAN" },
  { value: "JSON" },
  { value: "BLOB" },
  { value: "LONGBLOB" },
];

// 是否有修改
const hasChanges = computed(() => {
  if (deletedColumns.value.length > 0) return true;
  return columns.value.some(col => col.__isNew || col.__modified);
});

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val && props.tableName) {
      resetState();
      loadStructure();
    }
  }
);

watch(visible, (val) => {
  emit("update:modelValue", val);
});

function resetState() {
  selectedRowIndex.value = -1;
  selectedRow.value = null;
  editingCell.value = null;
  deletedColumns.value = [];
}

async function loadStructure() {
  try {
    const [structRes, ddlRes] = await Promise.all([
      getTableStructure(props.settingId, props.tableName),
      getCreateTableDdl(props.settingId, props.tableName),
    ]);
    if (structRes?.data) {
      const cols = (structRes.data.columns || []).map((col: ColumnInfo) => ({
        ...col,
        __key: generateKey(),
        __originalName: col.name,
        notNull: !col.nullable,
      }));
      columns.value = cols;
      originalColumns.value = JSON.parse(JSON.stringify(cols));
    }
    if (ddlRes?.data) {
      ddl.value = ddlRes.data;
    }
    deletedColumns.value = [];
  } catch (e: any) {
    ElMessage.error("加载表结构失败: " + e.message);
  }
}

function queryDataTypes(queryString: string, cb: Function) {
  const results = queryString
    ? commonDataTypes.filter((t) => t.value.toLowerCase().includes(queryString.toLowerCase()))
    : commonDataTypes;
  cb(results);
}

// 行选择
function handleCurrentChange(row: ColumnInfo | null) {
  selectedRow.value = row;
  selectedRowIndex.value = row ? columns.value.findIndex(c => c.__key === row.__key) : -1;
}

// 行双击
function handleRowDblClick(row: ColumnInfo) {
  const index = columns.value.findIndex(c => c.__key === row.__key);
  if (index >= 0) {
    startEdit(index, 'name');
  }
}

// 开始编辑单元格
function startEdit(rowIndex: number, col: string) {
  editingCell.value = { row: rowIndex, col };
  nextTick(() => {
    editInputRef.value?.focus?.();
  });
}

// 结束编辑
function finishEdit() {
  if (editingCell.value) {
    const row = columns.value[editingCell.value.row];
    if (row && !row.__isNew) {
      row.__modified = true;
    }
  }
  editingCell.value = null;
}

// 标记为已修改
function markModified(row: ColumnInfo) {
  if (!row.__isNew) {
    row.__modified = true;
  }
}

// 获取行样式
function getRowClassName({ row }: { row: ColumnInfo }) {
  if (row.__isNew) return 'row-new';
  if (row.__modified) return 'row-modified';
  return '';
}

// 添加字段（末尾）
function handleAddRow() {
  const newCol: ColumnInfo = {
    name: '',
    dataType: 'VARCHAR',
    fullType: 'VARCHAR(255)',
    length: 255,
    nullable: true,
    notNull: false,
    primaryKey: false,
    autoIncrement: false,
    defaultValue: '',
    comment: '',
    ordinalPosition: columns.value.length + 1,
    __key: generateKey(),
    __isNew: true,
  };
  columns.value.push(newCol);
  nextTick(() => {
    tableRef.value?.setCurrentRow(newCol);
    startEdit(columns.value.length - 1, 'name');
  });
}

// 插入字段（当前行之后）
function handleInsertRow() {
  if (selectedRowIndex.value < 0) return;
  const newCol: ColumnInfo = {
    name: '',
    dataType: 'VARCHAR',
    fullType: 'VARCHAR(255)',
    length: 255,
    nullable: true,
    notNull: false,
    primaryKey: false,
    autoIncrement: false,
    defaultValue: '',
    comment: '',
    ordinalPosition: selectedRowIndex.value + 2,
    __key: generateKey(),
    __isNew: true,
  };
  columns.value.splice(selectedRowIndex.value + 1, 0, newCol);
  nextTick(() => {
    tableRef.value?.setCurrentRow(newCol);
    startEdit(selectedRowIndex.value + 1, 'name');
  });
}

// 删除字段
async function handleDeleteRow() {
  if (selectedRowIndex.value < 0 || !selectedRow.value) return;
  
  const row = selectedRow.value;
  try {
    await ElMessageBox.confirm(
      `确定删除字段 "${row.name || '(未命名)'}" 吗？`,
      "确认删除",
      { type: "warning" }
    );
    
    // 如果是已存在的字段，记录到删除列表
    if (!row.__isNew && row.__originalName) {
      deletedColumns.value.push(row.__originalName);
    }
    
    columns.value.splice(selectedRowIndex.value, 1);
    selectedRowIndex.value = -1;
    selectedRow.value = null;
  } catch {
    // 取消删除
  }
}

// 上移
function handleMoveUp() {
  if (selectedRowIndex.value <= 0) return;
  const idx = selectedRowIndex.value;
  const row = columns.value[idx];
  columns.value.splice(idx, 1);
  columns.value.splice(idx - 1, 0, row);
  row.__modified = true;
  selectedRowIndex.value = idx - 1;
  nextTick(() => {
    tableRef.value?.setCurrentRow(row);
  });
}

// 下移
function handleMoveDown() {
  if (selectedRowIndex.value < 0 || selectedRowIndex.value >= columns.value.length - 1) return;
  const idx = selectedRowIndex.value;
  const row = columns.value[idx];
  columns.value.splice(idx, 1);
  columns.value.splice(idx + 1, 0, row);
  row.__modified = true;
  selectedRowIndex.value = idx + 1;
  nextTick(() => {
    tableRef.value?.setCurrentRow(row);
  });
}

// 保存所有修改
async function handleSaveAll() {
  if (!hasChanges.value) return;
  
  saving.value = true;
  try {
    // 1. 先删除字段
    for (const colName of deletedColumns.value) {
      await dropColumn(props.settingId, {
        tableName: props.tableName,
        columnName: colName,
      });
    }
    
    // 2. 添加新字段
    const newCols = columns.value.filter(c => c.__isNew);
    for (let i = 0; i < newCols.length; i++) {
      const col = newCols[i];
      if (!col.name) continue;
      
      const colIndex = columns.value.findIndex(c => c.__key === col.__key);
      let position = '';
      let afterColumn = '';
      
      if (colIndex === 0) {
        position = 'FIRST';
      } else if (colIndex > 0) {
        position = 'AFTER';
        afterColumn = columns.value[colIndex - 1].name;
      }
      
      await addColumn(props.settingId, {
        tableName: props.tableName,
        columnName: col.name,
        dataType: col.fullType || col.dataType,
        nullable: !col.notNull,
        defaultValue: col.defaultValue || undefined,
        comment: col.comment || undefined,
        position: position || undefined,
        afterColumn: afterColumn || undefined,
      });
    }
    
    // 3. 修改已有字段
    const modifiedCols = columns.value.filter(c => c.__modified && !c.__isNew);
    for (const col of modifiedCols) {
      await modifyColumn(props.settingId, {
        tableName: props.tableName,
        oldColumnName: col.__originalName || col.name,
        newColumnName: col.name !== col.__originalName ? col.name : undefined,
        dataType: col.fullType || col.dataType,
        nullable: !col.notNull,
        defaultValue: col.defaultValue || undefined,
        comment: col.comment || undefined,
      });
    }
    
    // 4. 调整字段顺序（如果有移动）
    for (let i = 0; i < columns.value.length; i++) {
      const col = columns.value[i];
      const originalIndex = originalColumns.value.findIndex(c => c.__originalName === col.__originalName);
      
      if (!col.__isNew && originalIndex !== i && originalIndex >= 0) {
        const position = i === 0 ? 'FIRST' : 'AFTER';
        const afterColumn = i > 0 ? columns.value[i - 1].name : undefined;
        
        await reorderColumn(props.settingId, {
          tableName: props.tableName,
          columnName: col.name,
          position,
          afterColumn,
        });
      }
    }
    
    ElMessage.success("保存成功");
    await loadStructure();
    emit("refresh");
  } catch (e: any) {
    ElMessage.error("保存失败: " + (e.message || e));
  } finally {
    saving.value = false;
  }
}

// 关闭对话框
async function handleClose() {
  if (hasChanges.value) {
    try {
      await ElMessageBox.confirm(
        "有未保存的修改，确定要关闭吗？",
        "提示",
        { type: "warning" }
      );
    } catch {
      return;
    }
  }
  visible.value = false;
}

async function copyDdl() {
  try {
    await navigator.clipboard.writeText(ddl.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
}
</script>

<style scoped lang="scss">
.table-structure-dialog {
  :deep(.el-dialog__body) {
    padding: 16px;
  }
  
  :deep(.el-dialog__footer) {
    padding: 12px 20px;
    border-top: 1px solid #ebeef5;
  }
}

.structure-container {
  min-height: 520px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 6px;
  
  .el-divider--vertical {
    height: 20px;
    margin: 0 4px;
  }
}

.table-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  
  :deep(.el-table) {
    .cell {
      padding: 0 8px;
    }
    
    .el-table__row {
      &.row-new {
        background-color: #f0f9eb !important;
        
        &:hover > td {
          background-color: #e1f3d8 !important;
        }
      }
      
      &.row-modified {
        background-color: #fdf6ec !important;
        
        &:hover > td {
          background-color: #faecd8 !important;
        }
      }
      
      &.current-row > td {
        background-color: #ecf5ff !important;
      }
    }
  }
}

.cell-content {
  min-height: 24px;
  line-height: 24px;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f7fa;
  }
}

.type-cell {
  font-family: "Consolas", "Monaco", monospace;
  color: #409eff;
}

.column-name {
  font-weight: 600;
  color: #303133;
}

.default-value {
  color: #909399;
  font-family: monospace;
  font-size: 12px;
}

.comment-text {
  color: #606266;
  font-size: 12px;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-top: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  
  .status-changed {
    color: #e6a23c;
    display: flex;
    align-items: center;
  }
  
  .status-saved {
    color: #67c23a;
    display: flex;
    align-items: center;
  }
  
  .status-count {
    color: #909399;
  }
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #909399;
  
  p {
    margin-top: 16px;
    font-size: 14px;
  }
}

.ddl-container {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  max-height: 450px;
  overflow: auto;
}

.ddl-code {
  margin: 0;
  color: #d4d4d4;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.ml-1 {
  margin-left: 4px;
}

.mr-1 {
  margin-right: 4px;
}

// 编辑输入框样式
:deep(.el-input__wrapper),
:deep(.el-input-number) {
  box-shadow: 0 0 0 1px #409eff inset;
}
</style>
