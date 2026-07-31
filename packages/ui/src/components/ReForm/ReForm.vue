<script setup lang="ts">
/**
 * ReForm —— 表单组件
 *
 * 支持两种用法：
 *  - 常规：透传 el-form 能力，通过插槽自定义内容
 *  - Schema：传入 fields 自动渲染 el-input / el-select / el-date-picker 等
 */
import { computed } from "vue";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElSwitch,
} from "element-plus";
import { useDataSource, type ReDataSource } from "../../hooks/useDataSource";
import type { ReFormField } from "./types";

defineOptions({ name: "ReForm", inheritAttrs: true });

const model = defineModel<Record<string, unknown>>({ default: () => ({}) });

const props = withDefaults(
  defineProps<{
    /** 字段 schema */
    fields?: ReFormField[];
    /** 表单 label 宽度 */
    labelWidth?: string | number;
    /** 行内表单 */
    inline?: boolean;
    /** 禁用整个表单 */
    disabled?: boolean;
    /** 校验规则 */
    rules?: Record<string, Array<Record<string, unknown>>>;
  }>(),
  {
    fields: () => [],
    labelWidth: "100px",
    inline: false,
    disabled: false,
    rules: undefined,
  },
);

/** 合并 schema 生成的规则与外部规则 */
const formRules = computed<Record<string, Array<Record<string, unknown>>>>(() => {
  const merged: Record<string, Array<Record<string, unknown>>> = { ...(props.rules ?? {}) };
  for (const field of props.fields) {
    if (field.hidden) continue;
    if (field.required) {
      const rule = { required: true, message: `${field.label}不能为空`, trigger: "blur" };
      merged[field.prop] = [...(merged[field.prop] ?? []), ...(field.rules ?? []), rule];
    } else if (field.rules) {
      merged[field.prop] = [...(merged[field.prop] ?? []), ...field.rules];
    }
  }
  return merged;
});

/** 单选字段（含动态数据源） */
const SelectField = defineComponent({
  name: "ReSelectField",
  inheritAttrs: false,
  props: {
    field: { type: Object as import("vue").PropType<ReFormField>, required: true },
    value: { type: null as unknown as import("vue").PropType<unknown>, default: undefined },
    disabled: Boolean,
  },
  emits: ["update"],
  setup(props, { emit }) {
    const source = computed<ReDataSource<Array<{ label: string; value: string | number; disabled?: boolean }>>>(
      () => props.field.dataSource ?? props.field.options ?? [],
    );
    const { data: options, loading } = useDataSource(source);
    return () =>
      h(
        ElSelect,
        {
          modelValue: props.value,
          "onUpdate:modelValue": (v: unknown) => emit("update", v),
          placeholder: props.field.placeholder ?? "请选择",
          disabled: props.disabled,
          loading: loading.value,
          ...(props.field.attrs ?? {}),
        },
        () =>
          (options.value ?? []).map((opt) =>
            h(ElOption, { key: String(opt.value), label: opt.label, value: opt.value, disabled: opt.disabled }),
          ),
      );
  },
});

/** 根据字段类型渲染对应组件（渲染函数，避免模板中复杂分支） */
function renderField(field: ReFormField) {
  const value = model.value[field.prop];
  const update = (v: unknown): void => {
    model.value[field.prop] = v;
  };

  // 自定义组件
  if (typeof field.component === "object") {
    return h(field.component, { modelValue: value, "onUpdate:modelValue": update });
  }

  switch (field.component ?? "input") {
    case "textarea":
      return h(ElInput, {
        modelValue: value,
        "onUpdate:modelValue": update,
        type: "textarea",
        placeholder: field.placeholder,
        disabled: props.disabled,
        ...(field.attrs ?? {}),
      });
    case "select":
      return h(SelectField, { field, value, disabled: props.disabled, "onUpdate": update });
    case "date":
      return h(ElDatePicker, {
        modelValue: value,
        "onUpdate:modelValue": update,
        type: "date",
        placeholder: field.placeholder,
        disabled: props.disabled,
        ...(field.attrs ?? {}),
      });
    case "date-range":
      return h(ElDatePicker, {
        modelValue: value,
        "onUpdate:modelValue": update,
        type: "daterange",
        startPlaceholder: "开始日期",
        endPlaceholder: "结束日期",
        disabled: props.disabled,
        ...(field.attrs ?? {}),
      });
    case "number":
      return h(ElInputNumber, {
        modelValue: value,
        "onUpdate:modelValue": update,
        disabled: props.disabled,
        ...(field.attrs ?? {}),
      });
    case "switch":
      return h(ElSwitch, {
        modelValue: value,
        "onUpdate:modelValue": update,
        disabled: props.disabled,
        ...(field.attrs ?? {}),
      });
    default:
      return h(ElInput, {
        modelValue: value,
        "onUpdate:modelValue": update,
        placeholder: field.placeholder,
        disabled: props.disabled,
        ...(field.attrs ?? {}),
      });
  }
}
</script>

<script lang="ts">
import { defineComponent, h } from "vue";
</script>

<template>
  <ElForm
    v-bind="$attrs"
    :model="model"
    :rules="formRules"
    :label-width="labelWidth"
    :inline="inline"
    :disabled="disabled"
    class="re-form"
  >
    <ElFormItem
      v-for="field in fields"
      v-show="!field.hidden"
      :key="field.prop"
      :prop="field.prop"
      :label="field.label"
    >
      <component :is="renderField(field)" />
    </ElFormItem>
    <slot />
  </ElForm>
</template>
