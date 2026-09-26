<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
/**
 * ReDatePicker —— 日期选择组件
 *
 * 透传 el-date-picker 全部能力（v-model + 主要 props）。
 *
 * 说明：原 `layout="modern"` 变体（layouts/Modern.vue）经审计确认全仓无人使用，
 * 已随统一表面方案移除；需要时从 backups/ui-unused-layouts-retire-20260926/ 取回。
 */
import { ElDatePicker } from "element-plus";

defineOptions({ name: "ReDatePicker", inheritAttrs: true });

const model = defineModel<string | number | Date | (string | number | Date)[] | null>({
  default: null,
});

withDefaults(
  defineProps<{
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
  <!-- 透传 el-date-picker 全部能力 -->
  <ElDatePicker
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
