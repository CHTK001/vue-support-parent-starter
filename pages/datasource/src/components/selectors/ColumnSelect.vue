<!--
  字段选择器（共享组件）：跟着「数据源 + 表」读列元数据。

  <p>中文显示口径与 {@link TableSelect} 一致：有列注释时 label 显示中文、subtitle 显示字段名与类型；
  没注释时显示字段名。副标题里带上「主键」标记，入库节点的主键列要靠这个肉眼确认。</p>

  <p>换表会清空已选字段：字段名只在表内有效，留着旧字段会拼出一条不存在的列名。</p>
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ReSelect from "@repo/ui/re-select";
import { APP_DATASOURCE, fetchDatasourceColumns, toColumnOptions, toColumnRows } from "../../api";
import type { CollectColumn, CollectOption } from "../../api";

const props = withDefaults(
  defineProps<{
    /** 当前数据源（app 或台账 ID） */
    datasource?: string;
    /** 当前表名 */
    table?: string;
    /** 选中字段名；多选时是数组 */
    modelValue?: string | string[];
    /** 控件尺寸 */
    type?: "small" | "default" | "large";
    /** 禁用 */
    disabled?: boolean;
    /** 占位文案 */
    placeholder?: string;
    /** 多选（字段映射场景一次选多列） */
    multiple?: boolean;
    /**
     * 外部喂选项：传了就不再自己取数。
     *
     * <p>与 {@link TableSelect} 同理由：取数权有时必须在宿主手里（节点表单要按
     * 已映射内容过滤候选列），自取数会绕开那层过滤。</p>
     */
    options?: CollectOption[];
  }>(),
  {
    datasource: "",
    table: "",
    modelValue: "",
    type: "default",
    disabled: false,
    placeholder: "选择字段",
    multiple: false,
    options: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | string[]): void;
  /** 列元数据加载完成，宿主可据此刷新字段映射候选 */
  (e: "loaded", columns: CollectColumn[]): void;
  (e: "error", message: string): void;
}>();

const columns = ref<CollectColumn[]>([]);
const loading = ref(false);

/** 是否由宿主喂选项（此时组件不自己取数） */
const external = computed(() => Array.isArray(props.options));

/**
 * 外部模式下的列元数据：宿主给的选项还原成行，供 loaded 事件用。
 *
 * <p>补齐 position/size/nullable：toColumnRows 在裸选项时拿不到这几个字段，
 * 而 CollectColumn 把它们定义成必填的 null，不补就是编译错误。</p>
 */
const externalColumns = computed<CollectColumn[]>(() =>
  toColumnRows(props.options ?? []).map(row => ({
    position: row.position ?? null,
    size: row.size ?? null,
    nullable: row.nullable ?? null,
    ...row,
  })),
);

/** 最终渲染的选项：外部模式用宿主给的，自取数模式用本地列元数据换算 */
const options = computed<CollectOption[]>(() =>
  external.value ? (props.options ?? []) : toColumnOptions(columns.value),
);

/** 是否给出「请先选表」这类占位提示；外部模式下表由宿主管，不拦 */
const hint = computed(() => (props.table || external.value ? props.placeholder : "先选表"));

/** 读列元数据；外部模式只回填不请求，表还没选时不发请求 */
async function load(): Promise<void> {
  if (external.value) {
    columns.value = externalColumns.value;
    emit("loaded", columns.value);
    return;
  }
  if (!props.table) {
    columns.value = [];
    return;
  }
  loading.value = true;
  try {
    const rows = (await fetchDatasourceColumns(props.datasource || APP_DATASOURCE, props.table)) ?? [];
    columns.value = rows;
    emit("loaded", rows);
  } catch (error) {
    columns.value = [];
    emit("error", error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

let seq = 0;
watch(
  () => [props.datasource, props.table, external.value] as const,
  () => {
    // 换表等于换了整套字段名，已选字段必须清掉；外部模式下字段名由宿主决定
    if (!external.value && props.modelValue) {
      emit("update:modelValue", props.multiple ? [] : "");
    }
    const stamp = ++seq;
    void load().then(() => {
      if (stamp !== seq && !external.value) {
        columns.value = [];
      }
    });
  },
  { immediate: true },
);

defineExpose({ reload: load });

function onChange(value: unknown): void {
  if (props.multiple) {
    emit("update:modelValue", Array.isArray(value) ? value.map(String) : []);
    return;
  }
  emit("update:modelValue", value === null || value === undefined ? "" : String(value));
}
</script>

<template>
  <ReSelect
    class="column-select"
    layout="card"
    :model-value="modelValue"
    :type="type"
    :disabled="disabled || (!external && !table)"
    :loading="loading"
    :multiple="multiple"
    :collapse-tags="multiple"
    :placeholder="hint"
    :options="options"
    :popover-width="320"
    filterable
    @update:model-value="onChange"
  >
    <template #option="{ opt }">
      <!-- 自定义选项：主键列加标记，避免用户在副标题里找「PK」这种约定 -->
      <div class="column-option">
        <div class="column-option__main">
          <span class="column-option__label">{{ opt.label }}</span>
          <span v-if="opt.primaryKey" class="column-option__pk">主键</span>
        </div>
        <div class="column-option__desc">{{ opt.description }}</div>
      </div>
    </template>
  </ReSelect>
</template>

<style scoped>
.column-select {
  width: 100%;
}

.column-option__main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.column-option__label {
  font-size: var(--rm-font-md, 13px);
  font-weight: 500;
}

.column-option__pk {
  padding: 0 4px;
  font-size: 11px;
  line-height: 16px;
  color: var(--el-color-warning, #e6a23c);
  background: var(--el-color-warning-light-9, #fdf6ec);
  border: 1px solid var(--el-color-warning-light-7, #f5dab1);
  border-radius: 4px;
}

.column-option__desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>