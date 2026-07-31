<script setup lang="ts">
/**
 * ReDatePicker —— 日期选择组件
 *
 * 透传 el-date-picker 全部能力（v-model + 主要 props）。
 */
import { ElDatePicker } from "element-plus";

defineOptions({ name: "ReDatePicker", inheritAttrs: true });

const model = defineModel<string | number | Date | (string | number | Date)[] | null>({
  default: null,
});

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
}>();
</script>

<template>
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
