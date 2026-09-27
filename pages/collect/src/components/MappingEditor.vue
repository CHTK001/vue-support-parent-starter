<!--
  入库字段映射编辑器。

  与 PairsEditor 存同一份数据（DSL 里的 cell:列名 名值对），区别只在左列从自由输入
  换成目标表的真实列下拉：选项来自 /datasource/columns，列名/类型/主键都来自数据库
  元数据，不会因为表结构变了而写错列。表名或数据源变化时自动重新读候选，并把已经
  失效的映射行标出来而不是悄悄丢掉——用户要看到自己配的列没了。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReTag from "@repo/ui/re-tag";
import type { CollectColumn } from "../types/collect";
import type { ParamPair } from "../utils/dsl";

const props = withDefaults(
  defineProps<{
    modelValue: ParamPair[];
    /** 目标表的列元数据，为空表示还没选表或还没读到 */
    columns?: CollectColumn[];
    /** 目标表名，用于空态提示与「重新读取」 */
    table?: string | null;
    /** 读列失败时的原因，直接显示给用户 */
    loadError?: string | null;
    /** 正在读列 */
    loading?: boolean;
    /** 触发重新读取列元数据 */
    onRefresh?: () => void;
  }>(),
  { columns: () => [], table: null, loadError: null, loading: false },
);

const emit = defineEmits<{ (event: "update:modelValue", value: ParamPair[]): void }>();

const rows = ref<ParamPair[]>([]);

watch(
  () => props.modelValue,
  value => {
    const incoming = (value ?? []).map(row => ({ key: row.key, value: row.value }));
    // 与 PairsEditor 同理：父级会过滤空键行，回写不能抹掉用户正在填的空行
    const drafts = rows.value.filter(row => row.key.trim() === "");
    rows.value = [...incoming, ...drafts];
  },
  { immediate: true },
);

/** 列下拉候选，主键列排在前面并标注出来 */
const columnOptions = computed(() =>
  props.columns.map(column => ({
    value: column.name,
    label: column.primaryKey ? `${column.name}（主键）` : column.name,
  })),
);

const knownColumns = computed(() => new Set(props.columns.map(column => column.name)));

/** 已经配了但当前表里没有的列：表结构变了，必须让用户看见 */
const orphanRows = computed(() =>
  rows.value
    .map((row, index) => ({ row, index }))
    .filter(item => item.row.key.trim() !== "" && !knownColumns.value.has(item.row.key.trim())),
);

function commit(): void {
  emit(
    "update:modelValue",
    rows.value.map(row => ({ key: row.key, value: row.value })),
  );
}

function addRow(): void {
  rows.value = [...rows.value, { key: "", value: "" }];
}

function removeRow(index: number): void {
  rows.value = rows.value.filter((_, i) => i !== index);
  commit();
}

function typeHint(name: string): string {
  const hit = props.columns.find(column => column.name === name);
  if (!hit) return "";
  return [hit.typeName, hit.nullable === false ? "NOT NULL" : ""].filter(Boolean).join(" ");
}
</script>

<template>
  <div class="mapping-editor" @focusout="commit">
    <div v-if="loading" class="mapping-state">正在读取表结构…</div>
    <div v-else-if="loadError" class="mapping-state mapping-state-error">{{ loadError }}</div>
    <div v-else-if="!table" class="mapping-state">先选目标表，再配置字段映射</div>
    <div v-else-if="!columnOptions.length" class="mapping-state">
      该表没有读到列，请确认表名正确或数据源可达
    </div>

    <template v-else>
      <div v-for="(row, index) in rows" :key="index" class="mapping-row">
        <ReSelect
          size="small"
          filterable
          clearable
          class="mapping-column"
          placeholder="目标列"
          :model-value="row.key"
          :options="columnOptions"
          @update:model-value="(v: unknown) => (row.key = String(v ?? ''))"
        />
        <ReInput
          size="small"
          class="mapping-value"
          placeholder="值 / ${表达式}"
          :model-value="row.value"
          @update:model-value="(v: unknown) => (row.value = String(v ?? ''))"
        />
        <span class="mapping-type">{{ typeHint(row.key.trim()) }}</span>
        <ReButton size="small" text type="danger" icon="Delete" @click="removeRow(index)" />
      </div>

      <div v-if="orphanRows.length" class="mapping-orphan">
        <ReTag type="warning" size="small">
          {{ orphanRows.length }} 个字段在当前表里不存在
        </ReTag>
        <span class="mapping-orphan-list">
          {{ orphanRows.map(item => item.row.key).join("、") }}
        </span>
      </div>

      <ReButton size="small" plain icon="Refresh" @click="props.onRefresh?.()">重新读取表结构</ReButton>
      <ReButton size="small" plain icon="Plus" @click="addRow">添加字段</ReButton>
    </template>
  </div>
</template>

<style scoped>
.mapping-editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mapping-column {
  flex: 0 0 38%;
}

/* 值/表达式输入框：入库节点靠它决定往目标列写什么 */
.mapping-value {
  flex: 0 0 34%;
  min-width: 0;
}

.mapping-type {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  opacity: 0.65;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mapping-state {
  font-size: 12px;
  opacity: 0.65;
  padding: 2px 0;
}

.mapping-state-error {
  color: var(--el-color-danger, #f56c6c);
  opacity: 1;
}

.mapping-orphan {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  flex-wrap: wrap;
}

.mapping-orphan-list {
  opacity: 0.75;
  word-break: break-all;
}
</style>
