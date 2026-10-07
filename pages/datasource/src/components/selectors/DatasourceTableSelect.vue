<!--
  数据源 / 表 / 字段三联选（共享组合组件）。

  <p>把 {@link DatasourceSelect} + {@link TableSelect} + {@link ColumnSelect} 串成一组：
  选完数据源自动拉表，选完表自动拉字段，中间任何一个变了下游都会清空。
  他模块要「选个地方落库」时直接用这一个，不必自己接三段联动状态。</p>

  <p>联动状态刻意**由本组件持有**：三段清空规则彼此依赖（换表要清字段），
  拆到宿主就意味着每个使用方都要重写一遍这套 watch，越容易漏一处就多一种脏数据。</p>

  <p>横排布局；字段栏默认收起（{@code withColumns} 默认 false），只要落库目标表的模块
  显式传 {@code withColumns: true} 才出现。</p>
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DatasourceSelect from "./DatasourceSelect.vue";
import TableSelect from "./TableSelect.vue";
import ColumnSelect from "./ColumnSelect.vue";
import type { CollectColumn, CollectTable } from "../../api";

const props = withDefaults(
  defineProps<{
    /** 选中数据源（app 或台账 ID） */
    datasource?: string;
    /** 选中表名 */
    table?: string;
    /** 选中字段名；多选时是数组 */
    column?: string | string[];
    /** 是否显示字段栏 */
    withColumns?: boolean;
    /** 字段栏多选 */
    multipleColumns?: boolean;
    /** 整体禁用 */
    disabled?: boolean;
    /** 表名允许手填（表还不存在时） */
    allowCreateTable?: boolean;
  }>(),
  {
    datasource: "",
    table: "",
    column: "",
    withColumns: false,
    multipleColumns: false,
    disabled: false,
    allowCreateTable: false,
  },
);

const emit = defineEmits<{
  (e: "update:datasource", value: string): void;
  (e: "update:table", value: string): void;
  (e: "update:column", value: string | string[]): void;
  /** 三项都就绪（字段栏关闭时只看前两项） */
  (e: "change", value: { datasource: string; table: string; column: string | string[] }): void;
  /** 表清单加载完成 */
  (e: "tables", tables: CollectTable[]): void;
  /** 列元数据加载完成 */
  (e: "columns", columns: CollectColumn[]): void;
  /** 取数失败（表或列读不到） */
  (e: "error", message: string): void;
}>();

/** 表选择器实例：建表成功后要让它重拉，新表才会出现在下拉里 */
const tablePicker = ref<InstanceType<typeof TableSelect> | null>(null);

function onDatasource(value: string): void {
  emit("update:datasource", value);
  // 表与字段的清理由各自子组件的 watch 完成，这里只负责把上一层的值往下传，
  // 避免两处同时清同一项导致 emit 顺序不确定。
}

/** 最近一次取数失败原因，空串即无错误 */
const errorText = ref("");

function onLoadError(message: string): void {
  errorText.value = message;
}

function onTable(value: string): void {
  emit("update:table", value);
}

function onColumn(value: string | string[]): void {
  emit("update:column", value);
}

/**
 * 三项齐了才对外发 change。
 *
 * <p>用 watch 而不是让子组件各自 emit：这三层的值都由宿主 v-model 回填，
 * 只有这里能同时看到最新值；子组件事件发生在回填之前，用它判断必然读到旧值。</p>
 */
const ready = computed<boolean>(() => {
  if (!props.datasource || !props.table) {
    return false;
  }
  if (!props.withColumns) {
    return true;
  }
  return Array.isArray(props.column) ? props.column.length > 0 : Boolean(props.column);
});

watch(
  [() => props.datasource, () => props.table, () => props.column, ready],
  () => {
    if (!ready.value) {
      return;
    }
    emit("change", {
      datasource: props.datasource,
      table: props.table,
      column: props.column ?? (props.multipleColumns ? [] : ""),
    });
  },
);

/** 重新拉表（建表成功后调用，让新表立刻出现在下拉里） */
function reloadTables(): void {
  tablePicker.value?.reload();
}

defineExpose({ reloadTables });
</script>

<template>
  <div class="trio">
    <DatasourceSelect
      class="trio__item"
      :model-value="datasource"
      :disabled="disabled"
      @update:model-value="(v: string) => { onDatasource(v); }"
    />
    <TableSelect
      ref="tablePicker"
      class="trio__item"
      :datasource="datasource"
      :model-value="table"
      :disabled="disabled"
      :allow-create="allowCreateTable"
      @update:model-value="(v: string) => { onTable(v); }"
      @loaded="(rows: CollectTable[]) => emit('tables', rows)"
      @error="onLoadError"
    />
    <ColumnSelect
      v-if="withColumns"
      class="trio__item"
      :datasource="datasource"
      :table="table"
      :model-value="column"
      :multiple="multipleColumns"
      :disabled="disabled"
      @update:model-value="(v: string | string[]) => { onColumn(v); }"
      @loaded="(rows: CollectColumn[]) => emit('columns', rows)"
      @error="onLoadError"
    />
    <!-- 表或列读不到时把原因摊出来：静默的空下拉会被当成「这个库里没有表」 -->
    <span v-if="errorText" class="trio__error">{{ errorText }}</span>
  </div>
</template>

<style scoped>
/* 三栏等宽横排：数据源/表名长度都不固定，固定一栏会把长库名截得太狠 */
.trio {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.trio__item {
  flex: 1 1 0;
  min-width: 0;
}

/* 取数失败原因：占一行摊在三栏下面，不挤占下拉宽度 */
.trio__error {
  flex: 1 0 100%;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-color-danger);
}
</style>