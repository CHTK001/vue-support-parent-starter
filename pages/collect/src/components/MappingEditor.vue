<!--
  入库字段映射编辑器。

  与 PairsEditor 存同一份数据（DSL 里的 cell:列名 名值对），区别只在左列从自由输入
  换成目标表的真实列下拉：选项来自 /datasource/columns，列名/类型/主键都来自数据库
  元数据，不会因为表结构变了而写错列。表名或数据源变化时自动重新读候选，并把已经
  失效的映射行标出来而不是悄悄丢掉——用户要看到自己配的列没了。

  目标表还不存在时（tableExists === false）走"新建表"模式：左列退回自由输入，
  运行时由后端按这里填的列名自动建表。此时"字段在当前表里不存在"的告警要静默——
  新列本来就不在库里，那条告警会把正常配置全部染成警告。

  读列中 / 读列失败只压一条状态横幅，不吞下面的映射行（2026-10-08 起）：
  读列是辅助信息，抖一次网络不能把用户已配的行和「添加字段」一起换成错误页——
  实测反馈「映射点不出来」就是这条硬阻断路径。列清单不可用时左列退回自由输入，
  映射照常能配；告警只在真拿到了列清单时才能判定，拿不到就不猜。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReErrorBar from "@repo/ui/re-error-bar";
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
    /**
     * 目标表是否已存在：null=还没确认，true=已存在，false=确认不存在（新建表模式）
     */
    tableExists?: boolean | null;
    /** 读列失败时的原因，直接显示给用户 */
    loadError?: string | null;
    /** 正在读列 */
    loading?: boolean;
    /** 触发重新读取列元数据 */
    onRefresh?: () => void;
  }>(),
  { columns: () => [], table: null, tableExists: null, loadError: null, loading: false },
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

/** 列下拉候选，主键列排在前面并标注出来；description 给类型，便于下拉里也能看到字段类型 */
const columnOptions = computed(() =>
  props.columns.map(column => ({
    value: column.name,
    label: column.primaryKey ? `${column.name}（主键）` : column.name,
    description: column.typeName
      ? `${column.typeName}${column.nullable === false ? " NOT NULL" : ""}`
      : "未读取类型",
  })),
);

const knownColumns = computed(() => new Set(props.columns.map(column => column.name)));

/** 目标表还不存在 → 新建表模式，必须先设计表，映射才能选字段 */
const creatingTable = computed(() => props.tableExists === false);

/** 已经配了但当前表里没有的列：表结构变了，必须让用户看见（新建表模式与列清单缺失时不算，不猜） */
const orphanRows = computed(() =>
  !props.columns.length
    ? []
    : rows.value
      .map((row, index) => ({ row, index }))
      .filter(item => item.row.key.trim() !== "" && !knownColumns.value.has(item.row.key.trim())),
);

/** 失效行下标集合：逐行标出「当前表中不存在」，不只在底部汇总 */
const orphanIndexes = computed(() => new Set(orphanRows.value.map(item => item.index)));

/**
 * 目标列下拉的候选：真实列 + 已失效的历史列（禁用项）。
 *
 * <p>失效列必须补进候选里 —— 否则模型值匹配不到任何选项，el-select 会把输入框显示成空白，
 * 用户看不到自己原来配的是哪个列，只能靠底部那行汇总文字去猜。补进来的项禁用，
 * 既能把列名显示出来，又避免把已删除的列重新选回去。</p>
 */
const selectOptions = computed(() => {
  const seen = new Set(columnOptions.value.map(option => option.value));
  const stale = orphanRows.value
    .map(item => item.row.key.trim())
    .filter(name => name !== "" && !seen.has(name))
    .map(name => ({ value: name, label: `${name}（当前表中不存在）`, disabled: true }));
  return [...columnOptions.value, ...stale];
});

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
    <!-- 状态横幅：只提示不挡路 —— 读列中 / 读列失败也照常渲染下面的映射行 -->
    <div v-if="loading" class="mapping-state">正在读取表结构…</div>
    <!-- 错误条：列读不出来，告诉人之后的操作步骤，并留一行「重新读取」 -->
    <ReErrorBar
      v-else-if="loadError"
      :message="loadError"
      retryText="重新读取表结构"
      @retry="props.onRefresh"
    />
    <div v-else-if="!table" class="mapping-state">
      先在上方选「目标表」，再回来配置：左边选这张表的列，右边写要写进去的值 / ${表达式}。
    </div>
    <div v-else-if="creatingTable" class="mapping-state mapping-state-create">
      目标表 {{ table }} 尚不存在：请先用上方的「设计表」创建并配置字段，创建后这里会按真实字段下拉选择。
    </div>
    <div v-else-if="!columnOptions.length" class="mapping-state">
      该表没有读到列：确认表名正确、数据源可达，或点下方「重新读取表结构」重试；也可用「设计表」调整字段。
    </div>

    <!-- 表头：写清左右两列各是什么，避免「目标列 ← 值表达式」的对应关系靠猜 -->
    <div v-if="rows.length" class="mapping-head">
        <span class="head-col">目标列（写到哪）</span>
        <span class="head-value">值表达式（写什么）</span>
        <span class="head-type">列类型</span>
        <span class="head-op"></span>
      </div>

      <div
        v-for="(row, index) in rows"
        :key="index"
        class="mapping-row"
        :class="{ 'mapping-row--orphan': orphanIndexes.has(index) }"
      >
        <ReSelect
          filterable
          clearable
          layout="card"
          class="mapping-column"
          placeholder="选择目标表的列"
          :model-value="row.key"
          :options="selectOptions"
          @update:model-value="(v: unknown) => (row.key = String(v ?? ''))"
        />
        <ReInput
          
          class="mapping-value"
          placeholder="值 / ${表达式}，如 ${title} 或固定文本"
          :model-value="row.value"
          @update:model-value="(v: unknown) => (row.value = String(v ?? ''))"
        />
        <span class="mapping-type">
          <template v-if="orphanIndexes.has(index)">当前表中不存在</template>
          <template v-else-if="!props.columns.length">未读取类型</template>
          <template v-else>{{ typeHint(row.key.trim()) || "—" }}</template>
        </span>
        <ReButton
          text
          type="danger"
          icon="Delete"
          :show-text="false"
          :icon-size="28"
          tip="删除这一行"
          @click="removeRow(index)"
        />
      </div>

      <!-- 空行态：给出下一步动作与示例 -->
      <div v-if="!rows.length" class="mapping-empty">
        <div class="mapping-empty-title">还没有字段映射</div>
        <div class="mapping-empty-tip">
          点下面的「添加字段」新建一行，左边选目标表的列，右边写要写进去的值。
          例：目标列 title ← 值表达式 ${title}；也可以直接写固定文本。
        </div>
      </div>

      <div v-if="orphanRows.length" class="mapping-orphan">
        <ReTag type="warning">当前表里已不存在 {{ orphanRows.length }} 列</ReTag>
        <span class="mapping-orphan-list">{{ orphanRows.map(item => item.row.key).join("、") }}</span>
        <span class="mapping-orphan-hint">这些列已被表结构删除，请改选或删掉对应行，否则保存后也写不进去。</span>
      </div>

      <ReButton
        v-if="!creatingTable && columnOptions.length"
        
        plain
        icon="Refresh"
        @click="props.onRefresh?.()"
      >
        重新读取表结构
      </ReButton>
    <ReButton
      v-if="!creatingTable && columnOptions.length"
      plain
      icon="Plus"
      @click="addRow"
    >添加字段</ReButton>
  </div>
</template>

<style scoped>
.mapping-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

/* 表头与映射行共用同一套列宽，保证「目标列 / 值表达式 / 列类型」上下对齐 */
.mapping-head,
.mapping-row {
  display: grid;
  grid-template-columns: 1.1fr 1.3fr 0.9fr 36px;
  gap: 8px;
  align-items: center;
  padding: 0 6px;
}

.mapping-head > span {
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.mapping-row {
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
}

/* 失效行：底色 + 边框一起标出来，不用装饰投影（契约 §2） */
.mapping-row--orphan {
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-7);
}

.mapping-column,
.mapping-value {
  min-width: 0;
}

/* ReInput 根节点是 display:contents，网格项实际是内层 el-input，须显式允许收缩 */
.mapping-column :deep(.el-input),
.mapping-value :deep(.el-input) {
  min-width: 0;
}

/* 列类型：小号徽标，比原来的灰色小字更容易扫读 */
.mapping-type {
  justify-self: start;
  max-width: 100%;
  padding: 1px 6px;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.mapping-row--orphan .mapping-type {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-8);
  border-color: var(--el-color-warning-light-5);
}

.mapping-state {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

/* 新建表是正常配置路径，不是故障：用主色而不是错误色，提示该做什么就行 */
.mapping-state-create {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.mapping-empty {
  padding: 16px;
  text-align: center;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
}

.mapping-empty-title {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.mapping-empty-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.mapping-orphan {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 6px 8px;
  font-size: 12px;
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
  border-radius: var(--el-radius-md, 8px);
}

.mapping-orphan-list {
  color: var(--el-color-warning);
  word-break: break-all;
}

.mapping-orphan-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
