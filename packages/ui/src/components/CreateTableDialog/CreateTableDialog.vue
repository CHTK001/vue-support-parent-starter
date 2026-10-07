<!--
  建表 / 补列对话框（组件化）：数据源中心 JDBC DDL 能力的统一前端入口。

  <p>对话框只有一份实现，逻辑也只有一步 —— 打开即预览（把将要执行的 SQL 摊给用户看），
  确认后执行，执行成功 emit「executed」让宿主刷新列候选。请求与 preview / execute 回调
  都由宿主注入，组件不认识任何具体接口：采集侧数据库节点（databaseForm）、数据录入节点
  以及数据源中心的建表入口都走这一份。</p>

  <p>「先预览再执行」是刻意的 —— 建表 / 补列是 DDL，错了要人工收拾；预览一次的成本
  远低于误建一张表。</p>
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import { ElDialog } from "element-plus";
import ReButton from "../ReButton";
import type { TableDdlRequest, TableDdlResult } from "./types";

const props = defineProps<{
  /** 对话框可见性（v-model） */
  modelValue: boolean;
  /** 建表请求；打开时为空则只提示错误，不发预览 */
  request: TableDdlRequest | null;
  /** 预览回调（不执行） */
  preview: (request: TableDdlRequest) => Promise<TableDdlResult>;
  /** 执行回调 */
  execute: (request: TableDdlRequest) => Promise<TableDdlResult>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  /** 执行成功后触发，宿主据此刷新列候选 */
  (e: "executed"): void;
}>();

/** 弹窗与执行态 */
const busy = ref(false);
const payload = ref<TableDdlResult | null>(null);
const error = ref("");

// 打开即预览：先把 SQL 摊给用户，确认后才执行
watch(
  () => props.modelValue,
  async open => {
    if (!open) {
      return;
    }
    payload.value = null;
    error.value = "";
    if (!props.request) {
      error.value = "缺少建表请求（需先选择数据源与目标表）";
      return;
    }
    busy.value = true;
    try {
      payload.value = await props.preview(props.request);
    } catch (ex) {
      error.value = message(ex);
    } finally {
      busy.value = false;
    }
  },
);

/** 执行建表 / 补列，成功后保持弹窗展示结果并通知宿主 */
async function run(): Promise<void> {
  if (!props.request) {
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    payload.value = await props.execute(props.request);
    emit("executed");
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
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="建表 / 补列"
    width="760px"
    append-to-body
    @update:model-value="(value: unknown) => emit('update:modelValue', Boolean(value))"
  >
    <div v-if="error" class="ctd-error">{{ error }}</div>
    <template v-else-if="payload">
      <div class="ctd-summary">
        目标表 {{ request?.table }}：
        {{ payload.created ? "已新建" : (payload.exists ? "已存在" : "不存在") }}
        <span v-if="payload.appended.length">，补列 {{ payload.appended.join(" / ") }}</span>
        <span v-if="!payload.created && !payload.appended.length">，无需变更</span>
      </div>
      <pre class="ctd-sql">{{ payload.sql || "（数据源中心未返回 SQL）" }}</pre>
    </template>
    <div v-else class="ctd-summary">正在生成 DDL…</div>
    <template #footer>
      <ReButton @click="close">关闭</ReButton>
      <ReButton type="primary" :loading="busy" @click="run">执行</ReButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.ctd-summary {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.ctd-error {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: var(--el-radius-md, 8px);
}

/* 等宽显示 DDL：长语句要能横向滚动，不折行 */
.ctd-sql {
  max-height: 40vh;
  margin: 8px 0 0;
  padding: 10px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  white-space: pre;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}
</style>
