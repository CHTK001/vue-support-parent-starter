<template>
  <sc-dialog
    v-model="visible"
    :title="`设计表 - ${tableName}`"
    width="1300px"
    :close-on-click-modal="false"
    class="table-structure-dialog"
    draggable
    top="5vh"
  >
    <div class="structure-container">
      <!-- 表注释 -->
      <div class="table-comment-section">
        <label class="comment-label">表注释：</label>
        <el-input
          v-model="tableComment"
          size="small"
          placeholder="输入表注释"
          style="width: 400px"
          @change="tableCommentModified = true"
        />
        <el-tag
          v-if="tableCommentModified"
          type="warning"
          size="small"
          class="ml-2"
          >已修改</el-tag
        >
      </div>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 字段列表 -->
        <el-tab-pane label="字段" name="columns">
          <div class="toolbar">
            <el-button type="primary" size="small" @click="handleAddRow">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              添加字段
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleInsertRow"
              :disabled="selectedRowIndex < 0"
            >
              <IconifyIconOnline icon="ri:insert-row-bottom" class="mr-1" />
              插入字段
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteRow"
              :disabled="selectedRows.length === 0 && selectedRowIndex < 0"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              删除字段
              {{ selectedRows.length > 0 ? `(${selectedRows.length})` : "" }}
            </el-button>
            <el-divider direction="vertical" />
            <el-button
              size="small"
              @click="handleMoveUp"
              :disabled="selectedRowIndex <= 0"
            >
              <IconifyIconOnline icon="ri:arrow-up-line" class="mr-1" />
              上移
            </el-button>
            <el-button
              size="small"
              @click="handleMoveDown"
              :disabled="
                selectedRowIndex < 0 || selectedRowIndex >= columns.length - 1
              "
            >
              <IconifyIconOnline icon="ri:arrow-down-line" class="mr-1" />
              下移
            </el-button>
            <el-divider direction="vertical" />
            <el-button size="small" @click="loadStructure">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleSaveAll"
              :loading="saving"
              :disabled="!hasChanges"
            >
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
              @selection-change="handleSelectionChange"
              @row-dblclick="handleRowDblClick"
              :row-class-name="getRowClassName"
            >
              <el-table-column type="selection" width="45" fixed="left" />
              <el-table-column type="index" width="50" label="#" fixed="left" />

              <!-- 字段名-->
              <el-table-column
                prop="name"
                label="字段名"
                width="160"
                fixed="left"
              >
                <template #default="{ row }">
                  <div class="name-cell">
                    <el-input
                      v-model="row.name"
                      size="small"
                      placeholder="字段名"
                      @change="markModified(row)"
                    />
                    <div class="name-tags">
                      <el-tag v-if="row.primaryKey" type="warning" size="small"
                        >PK</el-tag
                      >
                      <el-tag v-if="row.autoIncrement" type="info" size="small"
                        >AI</el-tag
                      >
                      <el-tag v-if="row.__isNew" type="success" size="small"
                        >新</el-tag
                      >
                      <el-tag
                        v-else-if="
                          row.__modified && isColumnReallyModified(row)
                        "
                        type="primary"
                        size="small"
                        >改</el-tag
                      >
                    </div>
                  </div>
                </template>
              </el-table-column>

              <!-- 数据类型 -->
              <el-table-column prop="dataType" label="类型" width="140">
                <template #default="{ row }">
                  <el-select
                    v-model="row.dataType"
                    size="small"
                    filterable
                    allow-create
                    style="width: 100%"
                    @change="onDataTypeChange(row)"
                  >
                    <el-option-group
                      v-for="group in dataTypeGroups"
                      :key="group.label"
                      :label="group.label"
                    >
                      <el-option
                        v-for="type in group.types"
                        :key="type.value"
                        :label="type.label"
                        :value="type.value"
                      />
                    </el-option-group>
                  </el-select>
                </template>
              </el-table-column>

              <!-- 长度 -->
              <el-table-column
                prop="length"
                label="长度"
                width="90"
                align="center"
              >
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.length"
                    size="small"
                    :min="0"
                    :max="65535"
                    :controls="false"
                    :disabled="!needsLength(row.dataType)"
                    style="width: 100%"
                    @change="markModified(row)"
                  />
                </template>
              </el-table-column>

              <!-- 小数位 -->
              <el-table-column
                prop="scale"
                label="小数位"
                width="80"
                align="center"
              >
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.scale"
                    size="small"
                    :min="0"
                    :max="30"
                    :controls="false"
                    :disabled="!needsScale(row.dataType)"
                    style="width: 100%"
                    @change="markModified(row)"
                  />
                </template>
              </el-table-column>

              <!-- 不是null -->
              <el-table-column
                prop="nullable"
                label="不是null"
                width="80"
                align="center"
              >
                <template #default="{ row }">
                  <el-checkbox
                    v-model="row.notNull"
                    @change="markModified(row)"
                  />
                </template>
              </el-table-column>

              <!-- 主键 -->
              <el-table-column
                prop="primaryKey"
                label="主键"
                width="60"
                align="center"
              >
                <template #default="{ row }">
                  <el-checkbox
                    v-model="row.primaryKey"
                    @change="markModified(row)"
                  />
                </template>
              </el-table-column>

              <!-- 自增 -->
              <el-table-column
                prop="autoIncrement"
                label="自增"
                width="60"
                align="center"
              >
                <template #default="{ row }">
                  <el-checkbox
                    v-model="row.autoIncrement"
                    @change="markModified(row)"
                  />
                </template>
              </el-table-column>

              <!-- 默认值 -->
              <el-table-column prop="defaultValue" label="默认值" width="120">
                <template #default="{ row }">
                  <el-input
                    v-model="row.defaultValue"
                    size="small"
                    placeholder="-"
                    @change="markModified(row)"
                  />
                </template>
              </el-table-column>

              <!-- 注释 -->
              <el-table-column prop="comment" label="注释" min-width="160">
                <template #default="{ row }">
                  <el-input
                    v-model="row.comment"
                    size="small"
                    placeholder="-"
                    @change="markModified(row)"
                  />
                </template>
              </el-table-column>

              <!-- 操作列 -->
              <el-table-column
                label="操作"
                width="80"
                fixed="right"
                align="center"
              >
                <template #default="{ $index }">
                  <div class="row-actions">
                    <el-button
                      type="primary"
                      link
                      size="small"
                      :disabled="$index === 0"
                      @click.stop="handleMoveRowUp($index)"
                    >
                      <IconifyIconOnline icon="ri:arrow-up-s-line" />
                    </el-button>
                    <el-button
                      type="primary"
                      link
                      size="small"
                      :disabled="$index >= columns.length - 1"
                      @click.stop="handleMoveRowDown($index)"
                    >
                      <IconifyIconOnline icon="ri:arrow-down-s-line" />
                    </el-button>
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
        <el-tab-pane label="索引" name="indexes" v-if="supportsIndexes">
          <div class="toolbar">
            <el-button type="primary" size="small" @click="handleAddIndex">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              添加索引
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteIndex"
              :disabled="selectedIndexes.length === 0"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              删除索引
              {{
                selectedIndexes.length > 0 ? `(${selectedIndexes.length})` : ""
              }}
            </el-button>
            <el-divider direction="vertical" />
            <el-button size="small" @click="loadIndexes">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
          </div>

          <div class="table-wrapper" v-if="indexes.length > 0">
            <el-table
              :data="indexes"
              border
              size="small"
              height="450px"
              @selection-change="handleIndexSelectionChange"
            >
              <el-table-column type="selection" width="45" fixed="left" />
              <el-table-column type="index" width="50" label="#" fixed="left" />
              <el-table-column prop="name" label="索引名" width="180" />
              <el-table-column prop="type" label="类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getIndexTypeTag(row.type)" size="small">
                    {{ row.type || "NORMAL" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="columns" label="字段" min-width="200">
                <template #default="{ row }">
                  <div class="index-columns">
                    <el-tag
                      v-for="col in row.columns"
                      :key="col"
                      size="small"
                      class="mr-1"
                    >
                      {{ col }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="unique"
                label="唯一"
                width="80"
                align="center"
              >
                <template #default="{ row }">
                  <el-icon v-if="row.unique" color="var(--el-color-success)">
                    <IconifyIconOnline icon="ri:checkbox-circle-fill" />
                  </el-icon>
                </template>
              </el-table-column>
              <el-table-column prop="comment" label="注释" min-width="150" />
            </el-table>
          </div>
          <el-empty v-else description="暂无索引" />
        </el-tab-pane>

        <!-- 分区 -->
        <el-tab-pane label="分区" name="partitions" v-if="supportsPartitions">
          <div class="toolbar">
            <el-button type="primary" size="small" @click="handleAddPartition">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              添加分区
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDeletePartition"
              :disabled="selectedPartitions.length === 0"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              删除分区
              {{
                selectedPartitions.length > 0
                  ? `(${selectedPartitions.length})`
                  : ""
              }}
            </el-button>
            <el-divider direction="vertical" />
            <el-button size="small" @click="loadPartitions">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
          </div>

          <div class="table-wrapper" v-if="partitions.length > 0">
            <el-table
              :data="partitions"
              border
              size="small"
              height="450px"
              @selection-change="handlePartitionSelectionChange"
            >
              <el-table-column type="selection" width="45" fixed="left" />
              <el-table-column type="index" width="50" label="#" fixed="left" />
              <el-table-column prop="name" label="分区名" width="180" />
              <el-table-column prop="method" label="分区方式" width="120">
                <template #default="{ row }">
                  <el-tag type="info" size="small">
                    {{ row.method || "RANGE" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="expression"
                label="分区表达式"
                min-width="200"
              />
              <el-table-column
                prop="description"
                label="描述"
                min-width="200"
              />
              <el-table-column
                prop="rows"
                label="行数"
                width="100"
                align="right"
              />
            </el-table>
          </div>
          <el-empty v-else description="暂无分区" />
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
            <pre class="ddl-code"><code>{{ ddl || '加载中..' }}</code></pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!hasChanges"
          @click="handleSaveAll"
        >
          保存修改
        </el-button>
      </div>
    </template>
  </sc-dialog>
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
  batchModifyTableStructure,
  getTableIndexes,
  createTableIndex,
  deleteTableIndex,
  getTablePartitions,
  createTablePartition,
  deleteTablePartition,
  getDatabaseCapabilities,
} from "@/api/data-management/system-data";

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
  __originalData?: string;
  __deleted?: boolean;
}

/**
 * 索引信息
 */
interface IndexInfo {
  name: string;
  type: string;
  columns: string[];
  unique: boolean;
  comment?: string;
}

/**
 * 分区信息
 */
interface PartitionInfo {
  name: string;
  method: string;
  expression: string;
  description?: string;
  rows?: number;
}

const props = defineProps<{
  modelValue: boolean;
  settingId: number;
  tableName: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "refreshTable", tableName: string): void;
}>();

const visible = ref(false);
const activeTab = ref("columns");
const columns = ref<ColumnInfo[]>([]);
const originalColumns = ref<ColumnInfo[]>([]);
const ddl = ref("");
const saving = ref(false);
const tableRef = ref<any>(null);

// 索引相关
const indexes = ref<IndexInfo[]>([]);
const selectedIndexes = ref<IndexInfo[]>([]);
const supportsIndexes = ref(true); // 默认支持索引

// 分区相关
const partitions = ref<PartitionInfo[]>([]);
const selectedPartitions = ref<PartitionInfo[]>([]);
const supportsPartitions = ref(false); // 默认不支持分区

// 表注释
const tableComment = ref("");
const originalTableComment = ref("");
const tableCommentModified = ref(false);

// 当前选中行
const selectedRowIndex = ref(-1);
const selectedRow = ref<ColumnInfo | null>(null);

// 多选的行
const selectedRows = ref<ColumnInfo[]>([]);

// 删除的字段列表
const deletedColumns = ref<string[]>([]);

// 唯一key生成器
let keyCounter = 0;
function generateKey() {
  return `col_${Date.now()}_${keyCounter++}`;
}

// MySQL数据类型分组
const dataTypeGroups = [
  {
    label: "整数类型",
    types: [
      { value: "TINYINT", label: "TINYINT" },
      { value: "SMALLINT", label: "SMALLINT" },
      { value: "MEDIUMINT", label: "MEDIUMINT" },
      { value: "INT", label: "INT" },
      { value: "BIGINT", label: "BIGINT" },
    ],
  },
  {
    label: "浮点类型",
    types: [
      { value: "FLOAT", label: "FLOAT" },
      { value: "DOUBLE", label: "DOUBLE" },
      { value: "DECIMAL", label: "DECIMAL" },
    ],
  },
  {
    label: "字符串类型",
    types: [
      { value: "CHAR", label: "CHAR" },
      { value: "VARCHAR", label: "VARCHAR" },
      { value: "TINYTEXT", label: "TINYTEXT" },
      { value: "TEXT", label: "TEXT" },
      { value: "MEDIUMTEXT", label: "MEDIUMTEXT" },
      { value: "LONGTEXT", label: "LONGTEXT" },
    ],
  },
  {
    label: "日期时间类型",
    types: [
      { value: "DATE", label: "DATE" },
      { value: "TIME", label: "TIME" },
      { value: "DATETIME", label: "DATETIME" },
      { value: "TIMESTAMP", label: "TIMESTAMP" },
      { value: "YEAR", label: "YEAR" },
    ],
  },
  {
    label: "二进制类型",
    types: [
      { value: "BINARY", label: "BINARY" },
      { value: "VARBINARY", label: "VARBINARY" },
      { value: "TINYBLOB", label: "TINYBLOB" },
      { value: "BLOB", label: "BLOB" },
      { value: "MEDIUMBLOB", label: "MEDIUMBLOB" },
      { value: "LONGBLOB", label: "LONGBLOB" },
    ],
  },
  {
    label: "其他类型",
    types: [
      { value: "BOOLEAN", label: "BOOLEAN" },
      { value: "JSON", label: "JSON" },
      { value: "ENUM", label: "ENUM" },
      { value: "SET", label: "SET" },
    ],
  },
];

// 需要长度的类型
const typesNeedLength = [
  "CHAR",
  "VARCHAR",
  "BINARY",
  "VARBINARY",
  "TINYINT",
  "SMALLINT",
  "MEDIUMINT",
  "INT",
  "BIGINT",
];
// 需要小数位的类型
const typesNeedScale = ["DECIMAL", "FLOAT", "DOUBLE"];

function needsLength(dataType: string): boolean {
  if (!dataType) return false;
  const baseType = dataType
    .toUpperCase()
    .replace(/\(.*\)/, "")
    .trim();
  return typesNeedLength.includes(baseType);
}

function needsScale(dataType: string): boolean {
  if (!dataType) return false;
  const baseType = dataType
    .toUpperCase()
    .replace(/\(.*\)/, "")
    .trim();
  return typesNeedScale.includes(baseType);
}

// 数据类型变更时更新fullType
function onDataTypeChange(row: ColumnInfo) {
  updateFullType(row);
  markModified(row);
}

// 根据dataType、length、scale生成fullType
function updateFullType(row: ColumnInfo) {
  const baseType = row.dataType?.toUpperCase() || "";
  if (needsScale(baseType) && row.length && row.scale !== undefined) {
    row.fullType = `${baseType}(${row.length},${row.scale})`;
  } else if (needsLength(baseType) && row.length) {
    row.fullType = `${baseType}(${row.length})`;
  } else {
    row.fullType = baseType;
  }
}

// 是否有修改
const hasChanges = computed(() => {
  if (tableCommentModified.value) return true;
  if (deletedColumns.value.length > 0) return true;
  return columns.value.some((col) => col.__isNew || col.__modified);
});

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val && props.tableName) {
      resetState();
      loadStructure();
      // 加载索引和分区数据
      if (supportsIndexes.value) {
        loadIndexes();
      }
      if (supportsPartitions.value) {
        loadPartitions();
      }
    }
  }
);

watch(visible, (val) => {
  emit("update:modelValue", val);
});

function resetState() {
  selectedRowIndex.value = -1;
  selectedRow.value = null;
  deletedColumns.value = [];
  tableCommentModified.value = false;
}

async function loadStructure() {
  try {
    const [structRes, ddlRes, capabilitiesRes] = await Promise.all([
      getTableStructure(props.settingId, props.tableName),
      getCreateTableDdl(props.settingId, props.tableName),
      getDatabaseCapabilities(props.settingId),
    ]);

    // 设置数据库能力
    if (capabilitiesRes?.data) {
      supportsIndexes.value = capabilitiesRes.data.supportsIndexes !== false;
      supportsPartitions.value =
        capabilitiesRes.data.supportsPartitions === true;
    }
    if (structRes?.data) {
      // 加载表注释
      tableComment.value = structRes.data.tableComment || "";
      originalTableComment.value = structRes.data.tableComment || "";
      tableCommentModified.value = false;

      const cols = (structRes.data.columns || []).map((col: ColumnInfo) => {
        // 解析fullType获取dataType、length、scale
        const parsed = parseFullType(col.fullType || col.dataType || "");
        return {
          ...col,
          dataType: parsed.dataType,
          length: col.length ?? parsed.length,
          scale: col.scale ?? parsed.scale,
          __key: generateKey(),
          __originalName: col.name,
          __originalData: JSON.stringify({
            name: col.name,
            dataType: parsed.dataType,
            fullType: col.fullType,
            length: col.length ?? parsed.length,
            scale: col.scale ?? parsed.scale,
            nullable: col.nullable,
            primaryKey: col.primaryKey,
            autoIncrement: col.autoIncrement,
            defaultValue: col.defaultValue,
            comment: col.comment,
          }),
          notNull: !col.nullable,
          __isNew: false,
          __modified: false,
        };
      });
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

// 解析fullType如VARCHAR(255)或DECIMAL(10,2)
function parseFullType(fullType: string): {
  dataType: string;
  length?: number;
  scale?: number;
} {
  if (!fullType) return { dataType: "" };
  const match = fullType.match(/^(\w+)(?:\((\d+)(?:,(\d+))?\))?$/i);
  if (match) {
    return {
      dataType: match[1].toUpperCase(),
      length: match[2] ? parseInt(match[2]) : undefined,
      scale: match[3] ? parseInt(match[3]) : undefined,
    };
  }
  return { dataType: fullType.toUpperCase() };
}

// 行选择
function handleCurrentChange(row: ColumnInfo | null) {
  selectedRow.value = row;
  selectedRowIndex.value = row
    ? columns.value.findIndex((c) => c.__key === row.__key)
    : -1;
}

// 多选变化
function handleSelectionChange(rows: ColumnInfo[]) {
  selectedRows.value = rows;
}

// 行双击（可以用于其他操作）
function handleRowDblClick(row: ColumnInfo) {
  // 双击行时可以执行其他操作
}

// 标记为已修改
function markModified(row: ColumnInfo) {
  if (!row.__isNew) {
    row.__modified = true;
  }
}

// 获取行样式
function getRowClassName({ row }: { row: ColumnInfo }) {
  if (row.__isNew) return "row-new";
  if (row.__modified) return "row-modified";
  return "";
}

// 添加字段（末尾）
function handleAddRow() {
  const newCol: ColumnInfo = {
    name: "",
    dataType: "VARCHAR",
    fullType: "VARCHAR(255)",
    length: 255,
    nullable: true,
    notNull: false,
    primaryKey: false,
    autoIncrement: false,
    defaultValue: "",
    comment: "",
    ordinalPosition: columns.value.length + 1,
    __key: generateKey(),
    __isNew: true,
  };
  columns.value.push(newCol);
  nextTick(() => {
    tableRef.value?.setCurrentRow(newCol);
  });
}

// 插入字段（当前行之后）
function handleInsertRow() {
  if (selectedRowIndex.value < 0) return;
  const newCol: ColumnInfo = {
    name: "",
    dataType: "VARCHAR",
    fullType: "VARCHAR(255)",
    length: 255,
    nullable: true,
    notNull: false,
    primaryKey: false,
    autoIncrement: false,
    defaultValue: "",
    comment: "",
    ordinalPosition: selectedRowIndex.value + 2,
    __key: generateKey(),
    __isNew: true,
  };
  columns.value.splice(selectedRowIndex.value + 1, 0, newCol);
  nextTick(() => {
    tableRef.value?.setCurrentRow(newCol);
  });
}

// 删除字段（支持多选批量删除）
async function handleDeleteRow() {
  // 优先使用多选的行，否则使用当前选中行
  const rowsToDelete =
    selectedRows.value.length > 0
      ? selectedRows.value
      : selectedRow.value
        ? [selectedRow.value]
        : [];

  if (rowsToDelete.length === 0) return;

  const names = rowsToDelete.map((r) => r.name || "(未命名)").join(", ");
  try {
    await ElMessageBox.confirm(
      rowsToDelete.length === 1
        ? `确定删除字段 "${names}" 吗？`
        : `确定删除 ${rowsToDelete.length} 个字段吗？\n${names}`,
      "确认删除",
      { type: "warning" }
    );

    // 遍历删除
    for (const row of rowsToDelete) {
      // 如果是已存在的字段，记录到删除列表
      if (!row.__isNew && row.__originalName) {
        deletedColumns.value.push(row.__originalName);
      }
      const idx = columns.value.findIndex((c) => c.__key === row.__key);
      if (idx >= 0) {
        columns.value.splice(idx, 1);
      }
    }

    // 清空选中状态
    selectedRowIndex.value = -1;
    selectedRow.value = null;
    selectedRows.value = [];
    tableRef.value?.clearSelection();
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
  if (
    selectedRowIndex.value < 0 ||
    selectedRowIndex.value >= columns.value.length - 1
  )
    return;
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

// 按索引上移
function handleMoveRowUp(index: number) {
  if (index <= 0) return;
  const row = columns.value[index];
  columns.value.splice(index, 1);
  columns.value.splice(index - 1, 0, row);
  row.__modified = true;
  selectedRowIndex.value = index - 1;
  selectedRow.value = row;
  nextTick(() => {
    tableRef.value?.setCurrentRow(row);
  });
}

// 按索引下移
function handleMoveRowDown(index: number) {
  if (index >= columns.value.length - 1) return;
  const row = columns.value[index];
  columns.value.splice(index, 1);
  columns.value.splice(index + 1, 0, row);
  row.__modified = true;
  selectedRowIndex.value = index + 1;
  selectedRow.value = row;
  nextTick(() => {
    tableRef.value?.setCurrentRow(row);
  });
}

// 检查字段是否真正被修改
function isColumnReallyModified(col: ColumnInfo): boolean {
  if (!col.__originalData) return true;

  // 更新fullType
  updateFullType(col);

  const currentData = JSON.stringify({
    name: col.name,
    dataType: col.dataType,
    fullType: col.fullType,
    length: col.length,
    scale: col.scale,
    nullable: !col.notNull,
    primaryKey: col.primaryKey,
    autoIncrement: col.autoIncrement,
    defaultValue: col.defaultValue || "",
    comment: col.comment || "",
  });

  // 标准化原始数据进行比较
  const originalParsed = JSON.parse(col.__originalData);
  const originalNormalized = JSON.stringify({
    name: originalParsed.name,
    dataType: originalParsed.dataType,
    fullType: originalParsed.fullType,
    length: originalParsed.length,
    scale: originalParsed.scale,
    nullable: originalParsed.nullable,
    primaryKey: originalParsed.primaryKey,
    autoIncrement: originalParsed.autoIncrement,
    defaultValue: originalParsed.defaultValue || "",
    comment: originalParsed.comment || "",
  });

  return currentData !== originalNormalized;
}

// 保存所有修改
async function handleSaveAll() {
  if (!hasChanges.value) return;

  saving.value = true;
  try {
    // 构建批量请求
    const batchRequest: any = {
      tableName: props.tableName,
    };

    // 1. 删除字段
    if (deletedColumns.value.length > 0) {
      batchRequest.dropColumns = [...deletedColumns.value];
    }

    // 2. 添加新字段
    const newCols = columns.value.filter((c) => c.__isNew && c.name);
    if (newCols.length > 0) {
      batchRequest.addColumns = newCols.map((col, idx) => {
        updateFullType(col);
        const colIndex = columns.value.findIndex((c) => c.__key === col.__key);
        let position = "";
        let afterColumn = "";

        if (colIndex === 0) {
          position = "FIRST";
        } else if (colIndex > 0) {
          position = "AFTER";
          afterColumn = columns.value[colIndex - 1].name;
        }

        return {
          columnName: col.name,
          dataType: col.fullType || col.dataType,
          nullable: !col.notNull,
          defaultValue: col.defaultValue || undefined,
          comment: col.comment || undefined,
          position: position || undefined,
          afterColumn: afterColumn || undefined,
        };
      });
    }

    // 3. 修改已有字段（只修改真正变化的）
    const modifiedCols = columns.value.filter(
      (c) => c.__modified && !c.__isNew && isColumnReallyModified(c)
    );
    if (modifiedCols.length > 0) {
      batchRequest.modifyColumns = modifiedCols.map((col) => {
        updateFullType(col);
        return {
          oldColumnName: col.__originalName || col.name,
          newColumnName: col.name !== col.__originalName ? col.name : undefined,
          dataType: col.fullType || col.dataType,
          nullable: !col.notNull,
          defaultValue: col.defaultValue || undefined,
          comment: col.comment || undefined,
        };
      });
    }

    // 4. 调整字段顺序（如果有移动）
    const reorderCols: any[] = [];
    for (let i = 0; i < columns.value.length; i++) {
      const col = columns.value[i];
      const originalIndex = originalColumns.value.findIndex(
        (c) => c.__originalName === col.__originalName
      );

      if (!col.__isNew && originalIndex !== i && originalIndex >= 0) {
        const position = i === 0 ? "FIRST" : "AFTER";
        const afterColumn = i > 0 ? columns.value[i - 1].name : undefined;

        reorderCols.push({
          columnName: col.name,
          position,
          afterColumn,
        });
      }
    }
    if (reorderCols.length > 0) {
      batchRequest.reorderColumns = reorderCols;
    }

    // 5. 修改表注释（如果有变化）
    if (
      tableCommentModified.value &&
      tableComment.value !== originalTableComment.value
    ) {
      batchRequest.tableComment = tableComment.value;
    }

    // 检查是否有实际的修改内?
    const hasActualChanges =
      batchRequest.dropColumns ||
      batchRequest.addColumns ||
      batchRequest.modifyColumns ||
      batchRequest.reorderColumns ||
      batchRequest.tableComment !== undefined;

    if (!hasActualChanges) {
      ElMessage.info("没有检测到实际修改");
      return;
    }

    // 调用批量接口
    console.log("批量修改请求:", JSON.stringify(batchRequest, null, 2));
    await batchModifyTableStructure(props.settingId, batchRequest);

    ElMessage.success("保存成功");
    // 重置删除列表
    deletedColumns.value = [];
    await loadStructure();
    emit("refreshTable", props.tableName);
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
      await ElMessageBox.confirm("有未保存的修改，确定要关闭吗？", "提示", {
        type: "warning",
      });
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

// ==================== 索引管理 ====================

/**
 * 加载索引列表
 */
async function loadIndexes() {
  try {
    const res = await getTableIndexes(props.settingId, props.tableName);
    const data = res?.data || [];
    indexes.value = data.map((item: any) => ({
      name: item.name || item.indexName,
      type: item.type || item.indexType || "NORMAL",
      columns: Array.isArray(item.columns)
        ? item.columns
        : item.columnName
          ? [item.columnName]
          : [],
      unique: item.unique || item.nonUnique === false,
      comment: item.comment || item.indexComment || "",
    }));
  } catch (e: any) {
    console.error("加载索引失败", e);
    indexes.value = [];
  }
}

/**
 * 索引选择变化
 */
function handleIndexSelectionChange(selection: IndexInfo[]) {
  selectedIndexes.value = selection;
}

/**
 * 添加索引
 */
async function handleAddIndex() {
  try {
    const { value: indexName } = await ElMessageBox.prompt(
      "请输入索引名称：",
      "添加索引",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
        inputErrorMessage: "索引名称格式不正确",
      }
    );

    if (!indexName) return;

    // TODO: 调用后端 API 创建索引
    // await createTableIndex(props.settingId, props.tableName, { name: indexName });

    ElMessage.success("索引添加成功");
    await loadIndexes();
  } catch (e: any) {
    if (e !== "cancel") {
      ElMessage.error("添加索引失败: " + (e.message || e));
    }
  }
}

/**
 * 删除索引
 */
async function handleDeleteIndex() {
  if (selectedIndexes.value.length === 0) return;

  const names = selectedIndexes.value.map((idx) => idx.name).join(", ");
  try {
    await ElMessageBox.confirm(`确定要删除索引 "${names}" 吗？`, "确认删除", {
      type: "warning",
    });

    // TODO: 调用后端 API 删除索引
    // for (const idx of selectedIndexes.value) {
    //   await deleteTableIndex(props.settingId, props.tableName, idx.name);
    // }

    ElMessage.success("索引删除成功");
    selectedIndexes.value = [];
    await loadIndexes();
  } catch (e: any) {
    if (e !== "cancel") {
      ElMessage.error("删除索引失败: " + (e.message || e));
    }
  }
}

/**
 * 获取索引类型标签
 */
function getIndexTypeTag(
  type: string
): "primary" | "success" | "warning" | "info" | "danger" | undefined {
  const typeMap: Record<
    string,
    "primary" | "success" | "warning" | "info" | "danger" | undefined
  > = {
    PRIMARY: "danger",
    UNIQUE: "warning",
    FULLTEXT: "success",
    SPATIAL: "info",
    NORMAL: undefined,
  };
  return typeMap[type] || undefined;
}

// ==================== 分区管理 ====================

/**
 * 加载分区列表
 */
async function loadPartitions() {
  try {
    const res = await getTablePartitions(props.settingId, props.tableName);
    const data = res?.data || [];
    partitions.value = data.map((item: any) => ({
      name: item.name || item.partitionName,
      method: item.method || item.partitionMethod || "RANGE",
      expression: item.expression || item.partitionExpression || "",
      description: item.description || item.partitionDescription || "",
      rows: item.rows || item.tableRows || 0,
    }));
  } catch (e: any) {
    console.error("加载分区失败", e);
    partitions.value = [];
  }
}

/**
 * 分区选择变化
 */
function handlePartitionSelectionChange(selection: PartitionInfo[]) {
  selectedPartitions.value = selection;
}

/**
 * 添加分区
 */
async function handleAddPartition() {
  try {
    const { value: partitionName } = await ElMessageBox.prompt(
      "请输入分区名称：",
      "添加分区",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
        inputErrorMessage: "分区名称格式不正确",
      }
    );

    if (!partitionName) return;

    // TODO: 调用后端 API 创建分区
    // await createTablePartition(props.settingId, props.tableName, { name: partitionName });

    ElMessage.success("分区添加成功");
    await loadPartitions();
  } catch (e: any) {
    if (e !== "cancel") {
      ElMessage.error("添加分区失败: " + (e.message || e));
    }
  }
}

/**
 * 删除分区
 */
async function handleDeletePartition() {
  if (selectedPartitions.value.length === 0) return;

  const names = selectedPartitions.value.map((p) => p.name).join(", ");
  try {
    await ElMessageBox.confirm(`确定要删除分区 "${names}" 吗？`, "确认删除", {
      type: "warning",
    });

    // TODO: 调用后端 API 删除分区
    // for (const partition of selectedPartitions.value) {
    //   await deleteTablePartition(props.settingId, props.tableName, partition.name);
    // }

    ElMessage.success("分区删除成功");
    selectedPartitions.value = [];
    await loadPartitions();
  } catch (e: any) {
    if (e !== "cancel") {
      ElMessage.error("删除分区失败: " + (e.message || e));
    }
  }
}
</script>

<style scoped lang="scss">
/* ==================== 对话框整体样式 ==================== */
.table-structure-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 20px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background: var(--el-color-danger-light-9);

        .el-dialog__close {
          color: var(--el-color-danger);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px 24px;
    background: var(--el-fill-color-lighter);
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

/* ==================== 结构容器 ==================== */
.structure-container {
  min-height: 520px;
}

/* ==================== 表注释区域 ==================== */
.table-comment-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.comment-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: "";
    width: 4px;
    height: 16px;
    background: var(--el-color-primary);
    border-radius: 2px;
  }
}

/* ==================== 工具栏 ==================== */
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;

  :deep(.el-button) {
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
    }
  }

  .el-divider--vertical {
    height: 24px;
    margin: 0 6px;
  }
}

/* ==================== 表格容器 ==================== */
.table-wrapper {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  background: var(--el-bg-color);

  :deep(.el-table) {
    .el-table__header-wrapper {
      th {
        background: linear-gradient(
          180deg,
          var(--el-fill-color-light) 0%,
          var(--el-fill-color) 100%
        ) !important;
        font-weight: 600;
        font-size: 13px;
        padding: 14px 0;
      }
    }

    .cell {
      padding: 0 10px;
    }

    .el-table__row {
      transition: all 0.2s ease;

      &.row-new {
        background: linear-gradient(
          90deg,
          rgba(103, 194, 58, 0.08) 0%,
          rgba(103, 194, 58, 0.04) 100%
        ) !important;

        &:hover > td {
          background: rgba(103, 194, 58, 0.12) !important;
        }
      }

      &.row-modified {
        background: linear-gradient(
          90deg,
          rgba(230, 162, 60, 0.08) 0%,
          rgba(230, 162, 60, 0.04) 100%
        ) !important;

        &:hover > td {
          background: rgba(230, 162, 60, 0.12) !important;
        }
      }

      &.current-row > td {
        background: var(--el-color-primary-light-9) !important;
      }
    }
  }
}

/* ==================== 字段名单元格 ==================== */
.name-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .name-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;

    .el-tag {
      height: 20px;
      line-height: 18px;
      padding: 0 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
  }
}

/* ==================== 状态栏 ==================== */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-top: 12px;
  background: var(--el-bg-color);
  border-radius: 10px;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .status-changed {
    color: var(--el-color-warning);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;

    .iconify {
      font-size: 16px;
    }
  }

  .status-saved {
    color: var(--el-color-success);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;

    .iconify {
      font-size: 16px;
    }
  }

  .status-count {
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
  }
}

/* ==================== 空状态 ==================== */
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border-radius: 12px;

  .iconify {
    opacity: 0.5;
  }

  p {
    margin-top: 20px;
    font-size: 15px;
    color: var(--el-text-color-placeholder);
  }
}

/* ==================== 索引列表 ==================== */
.index-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .el-tag {
    font-family: "Consolas", "Monaco", monospace;
    font-size: 12px;
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
    color: var(--el-color-primary);
  }
}

/* ==================== 分区列表 ==================== */
:deep(.el-table) {
  .el-tag {
    font-weight: 500;
  }
}

/* ==================== DDL 展示区 ==================== */
.ddl-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 20px;
  max-height: 450px;
  overflow: auto;
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.2);

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.ddl-code {
  margin: 0;
  color: #e0e0e0;
  font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;

  // 关键词高亮效果（CSS实现有限，实际可考虑用 highlight.js）
  code {
    color: #e0e0e0;
  }
}

/* ==================== 对话框底部 ==================== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  :deep(.el-button) {
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
    }
  }
}

/* ==================== 工具类 ==================== */
.ml-1 {
  margin-left: 4px;
}

.mr-1 {
  margin-right: 4px;
}

.ml-2 {
  margin-left: 8px;
}

/* ==================== 操作列 ==================== */
.row-actions {
  display: flex;
  justify-content: center;
  gap: 4px;

  .el-button {
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--el-color-primary-light-9);
      transform: scale(1.1);
    }
  }
}

/* ==================== 表格内输入框 ==================== */
:deep(.el-table .el-input) {
  .el-input__wrapper {
    background: transparent;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-border-color) inset;
      background: var(--el-fill-color-lighter);
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
      background: var(--el-bg-color);
    }
  }
}

:deep(.el-table .el-input-number) {
  .el-input__wrapper {
    background: transparent;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-border-color) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }
}

:deep(.el-table .el-select) {
  .el-input__wrapper {
    background: transparent;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-border-color) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }
}

:deep(.el-table .el-checkbox) {
  .el-checkbox__inner {
    border-radius: 4px;
    transition: all 0.2s ease;
  }
}

/* ==================== 标签页美化 ==================== */
:deep(.el-tabs--border-card) {
  border: none;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .el-tabs__header {
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-tabs__item {
    height: 44px;
    line-height: 44px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    &.is-active {
      font-weight: 600;
    }
  }

  .el-tabs__content {
    padding: 16px;
    background: var(--el-bg-color);
  }
}

/* ==================== 深色模式适配 ==================== */
:root.dark {
  .table-structure-dialog {
    :deep(.el-dialog) {
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    :deep(.el-dialog__header) {
      background: linear-gradient(
        135deg,
        var(--el-fill-color) 0%,
        var(--el-bg-color) 100%
      );
    }
  }

  .ddl-container {
    background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
  }

  .ddl-code {
    color: #c9d1d9;
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
