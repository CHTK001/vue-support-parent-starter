<!--
  建表 / 补列对话框（数据源中心共享件）。

  <p>能力本身在后端 {@code /ms/datasource/ddl/preview|execute}，这里只做两件事：
  把「列名 + 主键列」按运行期同一套规则补成带类型的 DDL 请求（{@link toDdlRequest}），
  以及把后端返回摊平成对话框能显示的形态（{@link toDdlPayload}）。</p>

  <p>这两段逻辑原先写在采集侧 {@code FlowView} 里，他模块要建表就只能抄一遍 ——
  抄一份就多一份「主键列给 TEXT 被 MySQL 拒」的坑，所以收在这里。</p>

  <p>「先预览再执行」是刻意的：建表/补列是 DDL，错了要人工收拾。</p>
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElDialog } from "element-plus";
import ReButton from "@repo/ui/re-button";
import { APP_DATASOURCE, executeTableDdl, previewTableDdl } from "../../api";
import type { DdlColumn, TableDdlRequest, TableDdlResult } from "../../api";

const props = withDefaults(
  defineProps<{
    /** 对话框可见性（v-model） */
    modelValue: boolean;
    /** 数据源引用（app 或台账 ID） */
    datasource?: string;
    /** 目标表名 */
    table?: string;
    /** 目标列名 */
    columns?: string[];
    /** 主键列名 */
    primaryKey?: string[];
    /** 表注释 */
    comment?: string;
    /** 表已存在策略：APPEND（默认，补缺失列）/ SKIP / ERROR */
    ifExists?: string;
    /** 主键为空时是否自动加自增主键列 */
    autoIdPrimaryKey?: boolean;
    /** 列类型策略：TEXT（默认，与运行期建表同口径）/ VARCHAR / AUTO（按来源推断） */
    columnType?: string;
  }>(),
  {
    datasource: "",
    table: "",
    columns: () => [],
    primaryKey: () => [],
    comment: "",
    ifExists: "APPEND",
    autoIdPrimaryKey: false,
    columnType: "TEXT",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  /** 建表 / 补列成功，宿主据此刷新表清单与列候选 */
  (e: "executed", result: TableDdlResult): void;
}>();

const busy = ref(false);
const payload = ref<TableDdlResult | null>(null);
const error = ref("");

/** 是否给出「可执行」的状态：至少要有表名和一列 */
const canRun = computed(() => Boolean(props.table.trim()) && props.columns.length > 0);

/**
 * 把「列名 + 主键列」补成带类型的 DDL 请求。
 *
 * <p>主键列必须是可索引类型：TEXT 做主键会被 MySQL/MariaDB 直接拒
 * （实测报错 BLOB/TEXT column 'x' used in key specification without a key length），
 * 所以主键列给 VARCHAR(191)，其余按 {@code columnType} 给 TEXT —— 与采集运行期
 * {@code CollectJdbcSupport.ensureTable} 同一套口径。</p>
 */
function toDdlRequest(): TableDdlRequest {
  const keys = new Set(props.primaryKey);
  const built: DdlColumn[] = props.columns.map(name => ({
    name,
    type: keys.has(name)
      ? "VARCHAR(191)"
      : (props.columnType === "VARCHAR" ? "VARCHAR(255)" : props.columnType),
  }));
  return {
    datasource: props.datasource || APP_DATASOURCE,
    table: props.table.trim(),
    columns: built,
    primaryKey: props.primaryKey.length ? props.primaryKey : null,
    comment: props.comment || null,
    ifExists: props.ifExists,
    autoIdPrimaryKey: props.autoIdPrimaryKey,
  };
}

// 打开即预览：先把 SQL 摊给用户，确认后才执行
watch(
  () => props.modelValue,
  async open => {
    if (!open) {
      return;
    }
    payload.value = null;
    error.value = "";
    if (!canRun.value) {
      error.value = "缺少建表信息（需先选择数据源、目标表与至少一列）";
      return;
    }
    busy.value = true;
    try {
      payload.value = await previewTableDdl(toDdlRequest());
    } catch (ex) {
      error.value = message(ex);
    } finally {
      busy.value = false;
    }
  },
);

async function run(): Promise<void> {
  if (!canRun.value) {
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    const result = await executeTableDdl(toDdlRequest());
    payload.value = result;
    emit("executed", result);
  } catch (ex) {
    error.value = message(ex);
  } finally {
    busy.value = false;
  }
}

function close(): void {
  emit("update:modelValue", false);
}

function message(ex: unknown): string {
  return ex instanceof Error ? ex.message : String(ex);
}

/** 预览 / 执行结果摊平成一段 SQL 文本；后端 statements 是数组 */
const sqlText = computed(() => (payload.value?.statements ?? []).join("\n"));
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="建表 / 补列"
    width="760px"
    append-to-body
    @update:model-value="(value: unknown) => emit('update:modelValue', Boolean(value))"
  >
    <div class="dcd-error" v-if="error">{{ error }}</div>
    <template v-else-if="payload">
      <div class="dcd-summary">
        目标表 {{ table }}：
        {{ payload.created ? "已新建" : (payload.exists ? "已存在" : "不存在") }}
        <span v-if="payload.appendedColumns?.length">，补列 {{ payload.appendedColumns.join(" / ") }}</span>
        <span v-if="!payload.created && !payload.appendedColumns?.length">，无需变更</span>
      </div>
      <ul v-if="payload.warnings?.length" class="dcd-warnings">
        <li v-for="(tip, index) in payload.warnings" :key="index">{{ tip }}</li>
      </ul>
      <pre class="dcd-sql">{{ sqlText || "（数据源中心未返回 SQL）" }}</pre>
    </template>
    <div v-else class="dcd-summary">正在生成 DDL…</div>
    <template #footer>
      <ReButton @click="close">关闭</ReButton>
      <ReButton type="primary" :loading="busy" :disabled="!canRun" @click="run">执行</ReButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.dcd-summary {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.dcd-error {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: var(--rm-radius-md, 8px);
}

/* 提示（类型推断、列已存在跳过等）：比错误弱一档，用次要色 */
.dcd-warnings {
  margin: 0 0 8px;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* 等宽显示 DDL：长语句横向滚动，不折行 */
.dcd-sql {
  max-height: 40vh;
  margin: 0;
  padding: 10px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  white-space: pre;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--rm-radius-md, 8px);
}
</style>