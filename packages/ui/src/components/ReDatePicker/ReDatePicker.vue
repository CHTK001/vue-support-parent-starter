<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
/**
 * ReDatePicker —— 日期选择组件
 *
 * 透传 el-date-picker 全部能力（v-model + 主要 props）。
 *   - layout：布局变体，"el"（默认，el-date-picker）/ "modern"（现代化扁平日期选择，异步加载）
 */
import { defineAsyncComponent } from "vue";
import { ElDatePicker } from "element-plus";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReDatePicker", inheritAttrs: true });

const model = defineModel<string | number | Date | (string | number | Date)[] | null>({
  default: null,
});

withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-date-picker）/ "modern"（现代化扁平日期选择） */
    layout?: "el" | "modern";
    type?: "year" | "month" | "date" | "dates" | "week" | "datetime" | "datetimerange" | "daterange" | "monthrange";
    placeholder?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
    format?: string;
    valueFormat?: string;
    clearable?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    size?: "large" | "default" | "small";
    rangeSeparator?: string;
    disabledDate?: (date: Date) => boolean;
    shortcuts?: Array<{ text: string; value: Date | (() => Date) }>;
  }>(),
  {
    layout: "el",
    type: undefined,
    placeholder: undefined,
    startPlaceholder: undefined,
    endPlaceholder: undefined,
    format: undefined,
    valueFormat: undefined,
    clearable: false,
    disabled: false,
    readonly: false,
    size: undefined,
    rangeSeparator: undefined,
    disabledDate: undefined,
    shortcuts: undefined,
  },
);
</script>

<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
    v-model="model"
    v-bind="$attrs"
    :type="type"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :format="format"
    :value-format="valueFormat"
    :clearable="clearable"
    :disabled="disabled"
    :readonly="readonly"
    :size="size"
    :range-separator="rangeSeparator"
  />

  <!-- 默认 el-date-picker 布局 -->
  <ElDatePicker
    v-else
    v-model="model"
    v-bind="$attrs"
    :type="type"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :format="format"
    :value-format="valueFormat"
    :clearable="clearable"
    :disabled="disabled"
    :readonly="readonly"
    :size="size"
    :range-separator="rangeSeparator"
    :disabled-date="disabledDate"
    :shortcuts="shortcuts"
  />
</template>
