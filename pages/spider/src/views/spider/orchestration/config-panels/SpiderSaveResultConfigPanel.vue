<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>结果存储</strong>
        <span>数据源、结构化模板与库表字段映射</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <div class="spider-node-panel__item">
        <span>存储方式</span>
        <el-select :model-value="storageMode" @update:model-value="value => updateConfig('storageMode', value)">
          <el-option v-for="item in storageOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <label class="spider-node-panel__item">
        <span>结构化标识</span>
        <el-select
          :model-value="schemaCode"
          filterable
          allow-create
          placeholder="选择或输入结构化标识"
          @change="value => updateConfig('schemaCode', value)"
        >
          <el-option v-for="schema in schemaOptions" :key="schema" :label="schema" :value="schema" />
        </el-select>
        <span class="spider-node-panel__hint">这里展示由结构化节点约定的标识，保存时会按该标识选择表</span>
      </label>

      <!-- 表选择器：下拉选择已有表 + 创建新表按钮 -->
      <div class="spider-node-panel__item">
        <span>目标数据表</span>
        <div class="spider-table-selector">
          <el-select
            :model-value="selectedTableName"
            :loading="tablesLoading"
            filterable
            placeholder="选择已有表或输入新表名"
            style="flex: 1"
            @change="onTableSelected"
          >
            <el-option
              v-for="t in tableOptions"
              :key="t.tableName"
              :label="`${t.tableName}${t.tableComment ? ' (' + t.tableComment + ')' : ''}`"
              :value="t.tableName"
            />
          </el-select>
          <el-button @click="showCreateDialog = true">
            创建新表
          </el-button>
          <el-button v-if="selectedTableName" @click="loadTableColumns">
            刷新列
          </el-button>
        </div>
        <div v-if="!selectedTableName && !nodeConfig.outputTableName" class="spider-node-panel__hint">
          提示：选择已有表或创建新表后自动填充字段映射
        </div>
      </div>

      <!-- 已选表信息 -->
      <div v-if="tableColumns.length" class="spider-table-info">
        <div class="spider-table-info__header">
          <strong>{{ selectedTableName }}</strong>
          <span>{{ tableColumns.length }} 列</span>
        </div>
        <div class="spider-table-info__cols">
          <span v-for="col in tableColumns" :key="col.columnName" class="spider-table-info__col">
            <code>{{ col.columnName }}</code>
            <em>{{ col.columnType }}</em>
          </span>
        </div>
      </div>

      <label class="spider-node-panel__item">
        <span>自定义表名（可选，覆盖下拉选择）</span>
        <el-input :model-value="outputTableName" placeholder="留空则使用下拉选择的表" @update:model-value="value => updateConfig('outputTableName', value)" />
      </label>
    </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>上下文字段映射</strong>
        <el-button type="primary" plain @click="addMappingRow">添加映射</el-button>
      </div>

      <!-- 自动填充提示 -->
      <div v-if="tableColumns.length > 0 && resultMappings.length === 0" class="spider-node-panel__empty">
        该表有 {{ tableColumns.length }} 列，
        <el-button type="primary" link @click="autoFillMappings">点击自动填充映射</el-button>
      </div>

      <div v-if="resultMappings.length" class="spider-node-panel__mapping-list">
        <article
          v-for="(item, index) in resultMappings"
          :key="index"
          class="spider-node-panel__mapping-card"
        >
          <label class="spider-node-panel__item">
            <span>爬虫上下文字段</span>
            <el-input :model-value="item.contextField" @update:model-value="value => updateMapping(index, 'contextField', value)" />
          </label>
          <label class="spider-node-panel__item">
            <span>数据库字段</span>
            <el-select
              :model-value="item.columnName"
              filterable
              allow-create
              placeholder="输入或选择"
              @change="value => updateMapping(index, 'columnName', value)"
            >
              <el-option
                v-for="col in tableColumns"
                :key="col.columnName"
                :label="`${col.columnName} (${col.columnType})`"
                :value="col.columnName"
              />
            </el-select>
          </label>
          <div class="spider-node-panel__mapping-actions">
            <el-button type="danger" plain @click="removeMappingRow(index)">删除</el-button>
            <span class="spider-node-panel__col-type">{{ getColumnType(item.columnName) }}</span>
          </div>
        </article>
      </div>

      <div v-else-if="!tableColumns.length" class="spider-node-panel__empty">
        暂无字段映射，先选择或创建目标数据表。
      </div>
    </div>

    <div class="spider-node-panel__footer">
      <el-button type="danger" plain @click="removeNode">删除节点</el-button>
      <el-button type="primary" @click="saveConfig">保存配置</el-button>
    </div>

    <!-- 创建新表对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新数据表" width="600px">
      <div class="spider-create-table">
        <label class="spider-node-panel__item">
          <span>表名</span>
          <el-input v-model="newTableName" placeholder="仅支持字母数字下划线" />
        </label>
        <label class="spider-node-panel__item">
          <span>表注释</span>
          <el-input v-model="newTableComment" placeholder="可选" />
        </label>
        <div class="spider-node-panel__section-head" style="margin-top: 12px;">
          <strong>字段定义</strong>
          <el-button type="primary" plain @click="addNewColumnDef">添加字段</el-button>
        </div>
        <div v-for="(col, idx) in newTableColumns" :key="idx" class="spider-create-table__col-row">
          <el-input v-model="col.name" placeholder="列名" style="flex: 2;" />
          <el-select v-model="col.type" style="flex: 2;">
            <el-option v-for="t in columnTypeOptions" :key="t" :label="t" :value="t" />
          </el-select>
          <el-input v-model="col.comment" placeholder="注释" style="flex: 2;" />
          <el-button type="danger" plain @click="removeNewColumnDef(idx)">×</el-button>
        </div>
        <div class="spider-create-table__footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" :loading="creatingTable" @click="handleCreateTable">确认创建</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElButton, ElDialog, ElInput, ElOption, ElSelect, ElMessage } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScFlowEditor";
import { listDatabaseTables, listTableColumns, createDatabaseTable } from "../../../../api/spider";
import type { TableInfo, ColumnInfo } from "../../../../api/spider";

defineOptions({ name: "SpiderSaveResultConfigPanel" });

type ResultMapping = {
  contextField: string;
  columnName: string;
};

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const storageOptions = [
  { label: "数据库", value: "DATABASE" },
];

const storageMode = computed(() => String(props.nodeConfig.storageMode || "DATABASE"));
const schemaCode = computed(() => String(props.nodeConfig.schemaCode || ""));
const outputTableName = computed(() => String(props.nodeConfig.outputTableName || ""));
const resultMappings = computed<ResultMapping[]>(() =>
  Array.isArray(props.nodeConfig.resultMappings) ? props.nodeConfig.resultMappings : [],
);

const schemaOptions = computed(() => {
  const values = [schemaCode.value, String(props.nodeConfig.structureSchemaCode || "")].filter(Boolean);
  const flowSchemas = Array.isArray(props.nodeConfig.structureSchemas) ? props.nodeConfig.structureSchemas : [];
  return Array.from(new Set([...values, ...flowSchemas.map((item: any) => String(item?.schemaCode || item?.tableName || item || "")).filter(Boolean)]));
});

// ── 表选择 ──
const tablesLoading = ref(false);
const databaseTables = ref<TableInfo[]>([]);
const tableColumns = ref<ColumnInfo[]>([]);

const selectedTableName = computed(() => {
  const configured = outputTableName.value;
  if (configured && databaseTables.value.some(t => t.tableName === configured)) {
    return configured;
  }
  return "";
});

const tableOptions = computed(() => {
  const typed = outputTableName.value;
  const all = [...databaseTables.value];
  if (typed && !all.some(t => t.tableName === typed)) {
    all.unshift({ tableName: typed });
  }
  return all;
});

// ── 创建新表 ──
const showCreateDialog = ref(false);
const newTableName = ref("");
const newTableComment = ref("");
const newTableColumns = ref<Array<{ name: string; type: string; comment: string }>>([
  { name: "", type: "VARCHAR(255)", comment: "" },
]);
const creatingTable = ref(false);

const columnTypeOptions = [
  "VARCHAR(255)", "VARCHAR(2048)", "BIGINT", "INT", "DECIMAL(18,4)",
  "TINYINT(1)", "DATETIME", "DATE", "LONGTEXT", "TEXT",
];

async function loadTables() {
  tablesLoading.value = true;
  try {
    databaseTables.value = await listDatabaseTables();
  } catch (e) {
    console.warn("加载数据库表列表失败", e);
  } finally {
    tablesLoading.value = false;
  }
}

async function loadTableColumns() {
  const table = outputTableName.value;
  if (!table) return;
  try {
    tableColumns.value = await listTableColumns(table);
  } catch (e) {
    console.warn("加载表结构失败", e);
    tableColumns.value = [];
  }
}

function onTableSelected(tableName: string) {
  props.updateConfig("outputTableName", tableName);
  props.updateConfig("dataSourceName", "当前数据库");
  props.updateConfig("dataSourceCode", "default");
  loadTableColumns();
}

function autoFillMappings() {
  const next = tableColumns.value
    .filter(c => !["spider_id", "spider_definition_code", "spider_execution_no", "spider_create_time"].includes(c.columnName))
    .map(c => ({ contextField: c.columnName, columnName: c.columnName }));
  if (next.length) {
    const existing = resultMappings.value.map(m => ({ ...m }));
    props.updateConfig("resultMappings", [...existing, ...next]);
  }
}

function getColumnType(columnName: string): string {
  const col = tableColumns.value.find(c => c.columnName === columnName);
  return col ? col.columnType : "";
}

function nextMappings() {
  return resultMappings.value.map(item => ({ ...item }));
}

function addMappingRow() {
  const next = nextMappings();
  next.push({ contextField: "", columnName: "" });
  props.updateConfig("resultMappings", next);
}

function removeMappingRow(index: number) {
  const next = nextMappings();
  next.splice(index, 1);
  props.updateConfig("resultMappings", next);
}

function updateMapping(index: number, field: keyof ResultMapping, value: unknown) {
  const next = nextMappings();
  next[index] = {
    ...next[index],
    [field]: String(value ?? ""),
  };
  props.updateConfig("resultMappings", next);
}

function addNewColumnDef() {
  newTableColumns.value.push({ name: "", type: "VARCHAR(255)", comment: "" });
}

function removeNewColumnDef(index: number) {
  if (newTableColumns.value.length > 1) {
    newTableColumns.value.splice(index, 1);
  }
}

async function handleCreateTable() {
  if (!newTableName.value.trim()) {
    ElMessage.warning("请输入表名");
    return;
  }
  const validCols = newTableColumns.value.filter(c => c.name.trim());
  if (validCols.length === 0) {
    ElMessage.warning("至少需要一个有效字段");
    return;
  }
  creatingTable.value = true;
  try {
    const result = await createDatabaseTable({
      tableName: newTableName.value.trim(),
      columns: validCols.map(c => ({ name: c.name.trim(), type: c.type, comment: c.comment })),
      comment: newTableComment.value,
    });
    ElMessage.success(`表 ${result.tableName} 创建成功`);
    showCreateDialog.value = false;
    await loadTables();
    props.updateConfig("outputTableName", result.tableName);
    props.updateConfig("dataSourceName", "当前数据库");
    props.updateConfig("dataSourceCode", "default");
    tableColumns.value = [
      ...validCols.map(c => ({
        columnName: c.name.trim(),
        columnType: c.type,
        nullable: "YES",
        extra: "",
      })),
    ];
    newTableName.value = "";
    newTableComment.value = "";
    newTableColumns.value = [{ name: "", type: "VARCHAR(255)", comment: "" }];
  } catch (e: any) {
    ElMessage.error(`创建表失败：${e?.message || String(e)}`);
  } finally {
    creatingTable.value = false;
  }
}

watch(schemaCode, (value) => {
  if (value && props.nodeConfig.outputTableName == null) {
    props.updateConfig("outputTableName", value);
  }
});

onMounted(() => {
  loadTables();
  if (outputTableName.value) {
    loadTableColumns();
  }
});
</script>

<style scoped lang="scss">
.spider-node-panel { display: grid; gap: 16px; }
.spider-node-panel__section { display: grid; gap: 10px; }
.spider-node-panel__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__section-head strong { color: var(--lay-text-primary); font-size: 13px; font-weight: 700; }
.spider-node-panel__section-head span, .spider-node-panel__hint { color: var(--lay-text-placeholder); font-size: 11px; }
.spider-node-panel__item { display: grid; gap: 6px; }
.spider-node-panel__item > span { color: var(--lay-text-secondary); font-size: 12px; white-space: nowrap; }
.spider-table-selector { display: flex; gap: 8px; align-items: center; }
.spider-table-info { padding: 12px; border: 1px solid color-mix(in srgb, var(--lay-accent) 12%, var(--lay-border)); border-radius: 8px; background: color-mix(in srgb, var(--lay-bg) 92%, transparent); }
.spider-table-info__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.spider-table-info__header strong { font-size: 13px; color: var(--lay-text-primary); }
.spider-table-info__header span { font-size: 11px; color: var(--lay-text-placeholder); }
.spider-table-info__cols { display: flex; flex-wrap: wrap; gap: 6px; }
.spider-table-info__col { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: color-mix(in srgb, var(--lay-bg) 85%, transparent); border-radius: 6px; font-size: 11px; }
.spider-table-info__col code { color: var(--lay-text-primary); font-family: inherit; font-weight: 600; }
.spider-table-info__col em { color: var(--lay-text-placeholder); font-style: normal; font-size: 10px; }
.spider-node-panel__mapping-list { display: grid; gap: 10px; }
.spider-node-panel__mapping-card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; gap: 10px; padding: 12px; border: 1px solid color-mix(in srgb, var(--lay-accent) 12%, var(--lay-border)); border-radius: 8px; background: color-mix(in srgb, var(--lay-bg) 92%, transparent); align-items: end; }
.spider-node-panel__mapping-actions { display: flex; align-items: center; gap: 8px; }
.spider-node-panel__col-type { font-size: 10px; color: var(--lay-text-placeholder); background: color-mix(in srgb, var(--lay-bg) 80%, transparent); padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
.spider-node-panel__footer { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner),
.spider-node-panel :deep(.el-select__wrapper) { border-radius: 6px; }
.spider-node-panel__empty { padding: 16px; border-radius: 8px; color: var(--lay-text-placeholder); background: color-mix(in srgb, var(--lay-bg) 92%, transparent); text-align: center; font-size: 12px; }
.spider-create-table { display: grid; gap: 12px; }
.spider-create-table__col-row { display: flex; gap: 8px; align-items: center; }
.spider-create-table__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
@media (max-width: 720px) {
  .spider-node-panel__mapping-card { grid-template-columns: 1fr; }
  .spider-node-panel__mapping-actions { justify-content: stretch; }
}
</style>
