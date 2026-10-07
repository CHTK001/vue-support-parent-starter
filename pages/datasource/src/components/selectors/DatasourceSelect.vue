<!--
  数据源选择器（共享组件）。

  <p>从数据源中心拉台账，首项固定「应用主库」（app），其后是启用中的台账项。
  组件只管「选哪个数据源」，不碰表与字段；下游由 {@link TableSelect} / {@link ColumnSelect} 跟随。</p>

  <p>已选中项用中文名做 label、台账里的类型与地址做副标题；app 固定显示「应用主库」
  并标注它不是台账里的行（解析的是容器主 DataSource）。</p>
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import ReSelect from "@repo/ui/re-select";
import { APP_DATASOURCE, fetchDataSources } from "../../api";
import type { CollectOption, DataSourceInfo } from "../../api";

const props = withDefaults(
  defineProps<{
    /** 选中值：app 或台账 ID 字符串 */
    modelValue?: string;
    /** 控件尺寸 */
    type?: "small" | "default" | "large";
    /** 禁用 */
    disabled?: boolean;
    /** 占位文案 */
    placeholder?: string;
    /**
     * 外部喂选项：传了就不再拉台账。
     *
     * <p>采集节点表单要按节点类型过滤数据源（中间件节点只列 influxdb/neo4j 等），
     * 过滤发生在宿主侧；组件自拉台账会把那层过滤绕过去。</p>
     */
    options?: CollectOption[];
  }>(),
  {
    modelValue: "",
    type: "default",
    disabled: false,
    placeholder: "选择数据源",
    options: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  /** 选项加载完成，宿主据此知道是否需要兜底 */
  (e: "loaded", options: CollectOption[]): void;
}>();

/** 台账原始数据，保留类型与地址用于副标题 */
const rows = ref<DataSourceInfo[]>([]);
const loading = ref(false);
const failed = ref("");

/** 是否由宿主喂选项（此时组件不拉台账） */
const external = computed(() => Array.isArray(props.options));

/**
 * 下拉选项。
 *
 * <p>停用项（status === 0）不给选：它们连不上，拉表与建表都会直接失败，
 * 而用户看不出「为什么这张表列不出来」。</p>
 */
const options = computed<CollectOption[]>(() => {
  if (external.value) {
    // 宿主的过滤结果就是最终口径：不再补「应用主库」，也不剔除停用项 ——
    // 那些都是宿主的决定，组件替它做主会把过滤结果改样
    return props.options ?? [];
  }
  const list: CollectOption[] = [
    { value: APP_DATASOURCE, label: "应用主库", description: "本系统当前连接的应用库" },
  ];
  for (const row of rows.value) {
    if (row.status !== null && row.status !== undefined && row.status === 0) {
      continue;
    }
    const parts = [row.type, row.database || row.host].filter(Boolean);
    list.push({
      value: String(row.id),
      label: row.name,
      description: parts.length ? `${parts.join(" · ")}` : "",
      type: row.type,
    });
  }
  return list;
});

async function load(): Promise<void> {
  if (external.value) {
    emit("loaded", options.value);
    return;
  }
  loading.value = true;
  failed.value = "";
  try {
    rows.value = (await fetchDataSources()) ?? [];
    emit("loaded", options.value);
  } catch (error) {
    rows.value = [];
    // 只剩「应用主库」这一项时给一句可读原因：否则用户看到空下拉会以为台账是空的
    failed.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void load();
});

// 外部模式的选项会随宿主过滤条件变化（如切节点类型），要跟着重新发 loaded
watch(external, () => {
  void load();
});

/** 重新拉台账：建表成功后表/字段可能变了，但台账没变；这里给宿主一个显式刷新入口 */
defineExpose({ reload: load });

function onChange(value: unknown): void {
  emit("update:modelValue", value === null || value === undefined ? "" : String(value));
}
</script>

<template>
  <ReSelect
    class="ds-select"
    :model-value="modelValue"
    :type="type"
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    :options="options"
    filterable
    @update:model-value="onChange"
  />
</template>

<style scoped>
.ds-select {
  width: 100%;
}
</style>