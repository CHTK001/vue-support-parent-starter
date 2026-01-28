<template>
  <div class="column-definition-editor system-container modern-bg">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <el-button type="primary" :icon="Plus" @click="addColumn">添加列</el-button>
      <el-button :icon="Download" @click="importFromSource" :disabled="!canImport">
        从源表导入
      </el-button>
      <el-button :icon="View" @click="previewSql" :disabled="columns.length === 0">
        预览SQL
      </el-button>
      <el-button
        v-if="showAutoCreateSwitch"
        type="success"
        :icon="Promotion"
        :loading="creating"
        @click="handleCreateTable"
        :disabled="columns.length === 0"
      >
        立即建表
      </el-button>
    </div>

    <!-- 自动建表开关 -->
    <div v-if="showAutoCreateSwitch" class="auto-create-switch">
      <el-switch
        v-model="autoCreateEnabled"
        active-text="执行时自动建表"
        inactive-text="手动建表"
        @change="handleAutoCreateChange"
      />
      <el-tooltip content="启用后，同步任务执行时会自动创建目标表（如果不存在）">
        <el-icon class="help-icon"><QuestionFilled /></el-icon>
      </el-tooltip>
    </div>

    <!-- 列定义表格 -->
    <el-table :data="columns" border stripe class="columns-table" max-height="400">
      <el-table-column type="index" width="50" label="#" />
      
      <el-table-column prop="name" label="列名" min-width="120">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.name"
            placeholder="列名"
            size="small"
            @change="emitChange"
          />
        </template>
      </el-table-column>

      <el-table-column prop="type" label="类型" width="130">
        <template #default="{ row }">
          <el-select v-model="row.type" size="small" @change="emitChange">
            <el-option
              v-for="t in columnTypes"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column prop="length" label="长度" width="90">
        <template #default="{ row }">
          <el-input-number
            v-model="row.length"
            :min="1"
            :max="65535"
            size="small"
            controls-position="right"
            :disabled="!needsLength(row.type)"
            @change="emitChange"
          />
        </template>
      </el-table-column>

      <el-table-column label="约束" width="160">
        <template #default="{ row }">
          <div class="constraints">
            <el-checkbox v-model="row.primaryKey" size="small" @change="emitChange">主键</el-checkbox>
            <el-checkbox v-model="row.autoIncrement" size="small" @change="emitChange" :disabled="!row.primaryKey">自增</el-checkbox>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="nullable" label="可空" width="60" align="center">
        <template #default="{ row }">
          <el-checkbox v-model="row.nullable" size="small" :disabled="row.primaryKey" @change="emitChange" />
        </template>
      </el-table-column>

      <el-table-column prop="defaultValue" label="默认值" width="120">
        <template #default="{ row }">
          <el-input
            v-model="row.defaultValue"
            placeholder="默认值"
            size="small"
            @change="emitChange"
          />
        </template>
      </el-table-column>

      <el-table-column prop="comment" label="注释" min-width="120">
        <template #default="{ row }">
          <el-input
            v-model="row.comment"
            placeholder="列注释"
            size="small"
            @change="emitChange"
          />
        </template>
      </el-table-column>

      <el-table-column prop="sourceField" label="源字段" min-width="120">
        <template #default="{ row }">
          <el-input
            v-model="row.sourceField"
            placeholder="映射源字段"
            size="small"
            @change="emitChange"
          />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ $index }">
          <el-button
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click="removeColumn($index)"
          />
          <el-button
            :icon="Top"
            circle
            size="small"
            :disabled="$index === 0"
            @click="moveUp($index)"
          />
          <el-button
            :icon="Bottom"
            circle
            size="small"
            :disabled="$index === columns.length - 1"
            @click="moveDown($index)"
          />
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty v-if="columns.length === 0" description='暂无列定义，点击"添加列"开始定义' :image-size="80" />

    <!-- SQL预览对话框 -->
    <sc-dialog v-model="sqlPreviewVisible" title="建表SQL预览" width="700px">
      <el-input
        v-model="previewSqlText"
        type="textarea"
        :rows="15"
        readonly
        class="sql-preview"
      />
      <template #footer>
        <el-button @click="sqlPreviewVisible = false">关闭</el-button>
        <el-button type="primary" @click="copySql">复制SQL</el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Delete,
  Top,
  Bottom,
  Download,
  View,
  Promotion,
  QuestionFilled,
} from "@element-plus/icons-vue";
import {
  previewCreateTableSql,
  createOutputTable,
  type ColumnDefinition,
} from "@/api/sync";

interface Props {
  modelValue: ColumnDefinition[];
  nodeConfig?: string;
  tableName?: string;
  showAutoCreateSwitch?: boolean;
  autoCreate?: boolean;
  canImport?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: ColumnDefinition[]): void;
  (e: "update:autoCreate", value: boolean): void;
  (e: "import"): void;
}

const props = withDefaults(defineProps<Props>(), {
  showAutoCreateSwitch: true,
  autoCreate: false,
  canImport: false,
});

const emit = defineEmits<Emits>();

const columns = ref<ColumnDefinition[]>([]);
const autoCreateEnabled = ref(false);
const creating = ref(false);
const sqlPreviewVisible = ref(false);
const previewSqlText = ref("");

// 列类型选项
const columnTypes = [
  { label: "VARCHAR", value: "VARCHAR" },
  { label: "INT", value: "INT" },
  { label: "BIGINT", value: "BIGINT" },
  { label: "TEXT", value: "TEXT" },
  { label: "DATETIME", value: "DATETIME" },
  { label: "DATE", value: "DATE" },
  { label: "DECIMAL", value: "DECIMAL" },
  { label: "BOOLEAN", value: "BOOLEAN" },
  { label: "FLOAT", value: "FLOAT" },
  { label: "DOUBLE", value: "DOUBLE" },
  { label: "BLOB", value: "BLOB" },
  { label: "JSON", value: "JSON" },
];

// 需要长度的类型
const needsLength = (type: string) => {
  return ["VARCHAR", "DECIMAL"].includes(type);
};

// 同步数据
watch(
  () => props.modelValue,
  (newVal) => {
    columns.value = newVal ? [...newVal] : [];
  },
  { immediate: true, deep: true }
);

watch(
  () => props.autoCreate,
  (newVal) => {
    autoCreateEnabled.value = newVal;
  },
  { immediate: true }
);

// 触发更新
const emitChange = () => {
  // 更新 order
  columns.value.forEach((col, idx) => {
    col.order = idx;
  });
  emit("update:modelValue", [...columns.value]);
};

// 添加列
const addColumn = () => {
  columns.value.push({
    name: "",
    type: "VARCHAR",
    length: 255,
    nullable: true,
    primaryKey: false,
    autoIncrement: false,
    comment: "",
    order: columns.value.length,
  });
  emitChange();
};

// 删除列
const removeColumn = (index: number) => {
  columns.value.splice(index, 1);
  emitChange();
};

// 上移
const moveUp = (index: number) => {
  if (index > 0) {
    const temp = columns.value[index];
    columns.value[index] = columns.value[index - 1];
    columns.value[index - 1] = temp;
    emitChange();
  }
};

// 下移
const moveDown = (index: number) => {
  if (index < columns.value.length - 1) {
    const temp = columns.value[index];
    columns.value[index] = columns.value[index + 1];
    columns.value[index + 1] = temp;
    emitChange();
  }
};

// 从源表导入
const importFromSource = () => {
  emit("import");
};

// 预览SQL
const previewSql = async () => {
  if (!props.tableName) {
    ElMessage.warning("请先配置表名");
    return;
  }
  if (columns.value.length === 0) {
    ElMessage.warning("请先添加列定义");
    return;
  }

  try {
    const res = await previewCreateTableSql(props.tableName, columns.value);
    if (res.data?.success) {
      previewSqlText.value = res.data.data || "";
      sqlPreviewVisible.value = true;
    } else {
      ElMessage.error(res.data?.msg || "生成SQL失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("生成SQL失败");
  }
};

// 复制SQL
const copySql = async () => {
  try {
    await navigator.clipboard.writeText(previewSqlText.value);
    ElMessage.success("SQL已复制到剪贴板");
  } catch (e) {
    ElMessage.error("复制失败");
  }
};

// 自动建表开关变化
const handleAutoCreateChange = (value: boolean) => {
  emit("update:autoCreate", value);
};

// 立即建表
const handleCreateTable = async () => {
  if (!props.nodeConfig || !props.tableName) {
    ElMessage.warning("请先配置数据库连接和表名");
    return;
  }
  if (columns.value.length === 0) {
    ElMessage.warning("请先添加列定义");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要在目标数据库中创建表 "${props.tableName}" 吗？`,
      "确认建表",
      { type: "warning" }
    );
  } catch {
    return;
  }

  creating.value = true;
  try {
    const res = await createOutputTable(props.nodeConfig, props.tableName, columns.value);
    if (res.data?.success) {
      ElMessage.success("表创建成功");
    } else {
      ElMessage.error(res.data?.msg || "创建失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("创建表失败");
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.column-definition-editor {
  .editor-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .auto-create-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;

    .help-icon {
      color: #909399;
      cursor: help;
    }
  }

  .columns-table {
    .constraints {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  }

  .sql-preview {
    font-family: "Consolas", "Monaco", monospace;
    font-size: 13px;
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
