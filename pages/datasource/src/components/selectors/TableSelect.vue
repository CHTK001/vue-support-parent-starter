<!--
  表选择器（共享组件）：跟着数据源拉该库下的表与视图。

  <p>中文显示口径：有表注释时 label 显示中文、subtitle 显示表名与类型；
  没注释时 label 直接显示表名 —— 不显示成空白项，也不把中文占位当成真实备注。</p>

  <p>用 card 布局而不是默认文本下拉：表一多就要搜索，card 布局自带搜索框，
  且副标题能把「中文名 → 真实表名」这条对应关系摊在选项里。</p>

  <p>切换数据源会清空已选表：上一个库的表名在新库里往往不存在，
  留着会让下游字段映射拿着一个查不到列的表名去请求。</p>
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ReSelect from "@repo/ui/re-select";
import { APP_DATASOURCE, fetchDatasourceTableInfos, toTableOptions, toTableRows } from "../../api";
import type { CollectColumn, CollectOption, CollectTable } from "../../api";

const props = withDefaults(
  defineProps<{
    /** 当前数据源（app 或台账 ID）；空串表示应用主库 */
    datasource?: string;
    /** 选中表名 */
    modelValue?: string;
    /** 控件尺寸 */
    type?: "small" | "default" | "large";
    /** 禁用 */
    disabled?: boolean;
    /** 占位文案 */
    placeholder?: string;
    /**
     * 允许手填表名（allow-create）。
     *
     * <p>默认关闭。打开后下拉里可输入一个库里还没有的表名并回车选中 ——
     * 入库场景正是「表还不存在、运行时再建」的一票数据。</p>
     */
    allowCreate?: boolean;
    /**
     * 外部喂选项：传了就不再自己取数。
     *
     * <p>存在的理由是**取数权有时必须在宿主手里**：采集节点表单的表候选要按
     * 「数据源 + 节点语义」过滤（见 middlewareForm 给 ctx 喂过滤后清单的做法），
     * 组件自取数会把那层过滤绕过去。传了就以宿主给的为准。</p>
     */
    options?: CollectOption[];
    /**
     * 加载态由宿主控制（外部选项模式下组件不知道宿主何时取完数）。
     */
    loading?: boolean;
  }>(),
  {
    datasource: "",
    modelValue: "",
    type: "default",
    disabled: false,
    placeholder: "选择表",
    allowCreate: false,
    options: undefined,
    loading: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  /** 表清单加载完成，宿主可据此提示「表不存在」 */
  (e: "loaded", tables: CollectTable[]): void;
  (e: "error", message: string): void;
}>();

const tables = ref<CollectTable[]>([]);
const loading = ref(false);

/** 是否由宿主喂选项（此时组件不自己取数） */
const external = computed(() => Array.isArray(props.options));

/** 外部模式下的表元数据：宿主给的选项还原成行，供 loaded 事件用 */
const externalTables = computed<CollectTable[]>(() => toTableRows(props.options ?? []));

/** 最终渲染的选项：外部模式用宿主给的，自取数模式用本地表元数据换算 */
const renderedOptions = computed<CollectOption[]>(() =>
  external.value ? (props.options ?? []) : toTableOptions(tables.value),
);

/** 生效的加载态：外部模式用宿主的，自取数模式用本地的 */
const busy = computed(() => (external.value ? props.loading : loading.value));

/** 拉表清单；外部模式只回填不请求 */
async function load(): Promise<void> {
  if (external.value) {
    tables.value = externalTables.value;
    emit("loaded", tables.value);
    return;
  }
  loading.value = true;
  try {
    const rows = await fetchDatasourceTableInfos(props.datasource || APP_DATASOURCE);
    tables.value = rows;
    emit("loaded", rows);
  } catch (error) {
    tables.value = [];
    emit("error", error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

let seq = 0;
watch(
  () => [props.datasource, external.value],
  () => {
    // 换库等于换了整套表名，已选表必须清掉，否则下游拿着旧库表名去读列。
    // 外部模式下表名由宿主决定，不归这个 watch 管。
    if (!external.value && props.modelValue) {
      emit("update:modelValue", "");
    }
    // 快速切换数据源时丢弃过期响应：后发的请求回来才是当前库的清单
    const stamp = ++seq;
    void load().then(() => {
      if (stamp !== seq && !external.value) {
        tables.value = [];
      }
    });
  },
  { immediate: true },
);

defineExpose({ reload: load });

function onChange(value: unknown): void {
  emit("update:modelValue", value === null || value === undefined ? "" : String(value));
}
</script>

<template>
  <ReSelect
    class="table-select"
    layout="card"
    :model-value="modelValue"
    :type="type"
    :disabled="disabled || (!external && !datasource)"
    :loading="busy"
    :placeholder="placeholder"
    :options="renderedOptions"
    :allow-create="allowCreate"
    :default-first-option="allowCreate"
    :popover-width="320"
    filterable
    @update:model-value="onChange"
  />
</template>

<style scoped>
.table-select {
  width: 100%;
}
</style>