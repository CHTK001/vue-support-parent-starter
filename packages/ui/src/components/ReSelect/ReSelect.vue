<script setup lang="ts">
/**
 * ReSelect —— 下拉选择组件
 *
 * 透传 el-select 全部能力，并支持动态数据源（data / url / 函数）。
 */
import { computed } from "vue";
import { ElSelect, ElOption } from "element-plus";
import { useDataSource, type ReDataSource } from "../../hooks/useDataSource";
import type { ReOption } from "./types";

defineOptions({ name: "ReSelect", inheritAttrs: true });

const model = defineModel<string | number | (string | number)[] | null>({ default: "" });

const props = withDefaults(
  defineProps<{
    /** 选项数据：静态数组 / url / 函数 */
    data?: ReDataSource<ReOption[]>;
    /** 静态选项（data 为 url/函数时忽略） */
    options?: ReOption[];
    placeholder?: string;
    clearable?: boolean;
    filterable?: boolean;
    multiple?: boolean;
    collapseTags?: boolean;
    disabled?: boolean;
    loading?: boolean;
    size?: "large" | "default" | "small";
  }>(),
  {
    data: undefined,
    options: () => [],
    placeholder: "请选择",
    clearable: false,
    filterable: false,
    multiple: false,
    collapseTags: false,
    disabled: false,
    loading: false,
    size: "",
  },
);

/** 实际数据源：显式 data 优先，否则静态 options */
const source = computed<ReDataSource<ReOption[]>>(() => props.data ?? props.options);

const { loading: dataLoading, data: dataList } = useDataSource<ReOption[]>(source);
</script>

<template>
  <ElSelect
    v-model="model"
    v-bind="$attrs"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :disabled="disabled"
    :loading="loading || dataLoading"
    :size="size"
  >
    <ElOption
      v-for="opt in dataList ?? []"
      :key="String(opt.value)"
      :label="opt.label"
      :value="opt.value"
      :disabled="opt.disabled"
    />
  </ElSelect>
</template>
