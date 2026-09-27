<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
/**
 * ReForm —— 表单组件
 *
 * 两种用法：
 *   1) 常规：透传 el-form 能力，通过插槽自定义内容
 *   2) Schema：传入 fields 自动渲染（input/select/date/textarea/number/switch 等）
 *
 * 增强：
 *   - 字段 span：栅格列宽（0-24）；>0 时自动启用 el-row/col 布局
 *   - 默认值：field.defaultValue 在挂载时自动写入 model
 *   - 内置 validate() / resetFields() / clearValidate() 暴露给父组件
 *   - actions 插槽：底部操作区（确定/取消等）
 *   - help：字段下方帮助文本
 *   - 支持更多控件类型：slider / rate / color-picker / cascader / tree-select / icon-select
 */
import { computed, defineAsyncComponent, onMounted, reactive, ref, useTemplateRef } from "vue";
import { defineComponent, h } from "vue";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElTimePicker,
  ElTimeSelect,
  ElSwitch,
  ElCheckbox,
  ElCheckboxGroup,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElSlider,
  ElRate,
  ElColorPicker,
  ElCascader,
  ElTreeSelect,
  ElRow,
  ElCol,
} from "element-plus";
import { useDataSource, type ReDataSource } from "@repo/core";
import ReIconSelect from "../ReIconSelect/theme/default/ReIconSelect.vue";
import type { ReFieldOption, ReFormField } from "./types";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReForm", inheritAttrs: true });

const model = defineModel<Record<string, unknown>>({ default: () => ({}) });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-form）/ "modern"（现代化扁平表单） */
    layout?: "el" | "modern";
    /** 字段 schema */
    fields?: ReFormField[];
    /** 表单 label 宽度 */
    labelWidth?: string | number;
    /** 行内表单 */
    inline?: boolean;
    /** 禁用整个表单 */
    disabled?: boolean;
    /** 校验规则（会与 schema 生成的规则合并） */
    rules?: Record<string, Array<Record<string, unknown>>>;
    /** 栅格列宽（默认 24），span 模式生效 */
    gutter?: number;
  }>(),
  {
    layout: "el",
    fields: () => [],
    labelWidth: "100px",
    inline: false,
    disabled: false,
    rules: undefined,
    gutter: 16,
  },
);

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "cancel"): void;
}>();

/** el-form 引用，用于 expose validate/resetFields 等 */
const formRef = useTemplateRef<InstanceType<typeof ElForm>>("formRef");

/** 合并 schema 生成的规则与外部规则 */
const formRules = computed<Record<string, Array<Record<string, unknown>>>>(() => {
  const merged: Record<string, Array<Record<string, unknown>>> = { ...(props.rules ?? {}) };
  for (const field of props.fields) {
    if (field.hidden) continue;
    if (field.required) {
      const rule = { required: true, message: `${field.label ?? field.prop}不能为空`, trigger: "blur" };
      merged[field.prop] = [...(merged[field.prop] ?? []), ...(field.rules ?? []), rule];
    } else if (field.rules) {
      merged[field.prop] = [...(merged[field.prop] ?? []), ...field.rules];
    }
  }
  return merged;
});

/** 是否启用栅格模式：任意字段 span > 0 即启用 */
const useGrid = computed<boolean>(() => props.fields.some((f) => typeof f.span === "number" && f.span > 0));

/** 挂载时填充默认值 */
onMounted(() => {
  for (const field of props.fields) {
    if (field.hidden) continue;
    if (field.defaultValue !== undefined && model.value[field.prop] === undefined) {
      model.value[field.prop] = field.defaultValue;
    }
  }
});

/** Select / Radio / Checkbox 等选项字段渲染 */
const OptionsField = defineComponent({
  name: "ReFormOptionsField",
  inheritAttrs: false,
  props: {
    field: { type: Object as () => ReFormField, required: true },
    value: { default: undefined },
    disabled: Boolean,
    type: { type: String as () => "select" | "checkbox-group" | "radio-group", required: true },
  },
  emits: ["update"],
  setup(p, { emit }) {
    const source = computed<ReDataSource<ReFieldOption>>(() => p.field.dataSource ?? p.field.options ?? []);
    const { data: options, loading } = useDataSource(source);
    return () => {
      const opts = options.value ?? [];
      if (p.type === "select") {
        return h(
          ElSelect,
          {
            modelValue: p.value,
            "onUpdate:modelValue": (v: unknown) => emit("update", v),
            placeholder: p.field.placeholder ?? "请选择",
            disabled: p.disabled || p.field.disabled,
            loading: loading.value,
            ...(p.field.attrs ?? {}),
          },
          () => opts.map((o) =>
            h(ElOption, { key: String(o?.value), label: o?.label, value: o?.value, disabled: o?.disabled }),
          ),
        );
      }
      if (p.type === "checkbox-group") {
        return h(
          ElCheckboxGroup,
          {
            modelValue: p.value,
            "onUpdate:modelValue": (v: unknown) => emit("update", v),
            disabled: p.disabled || p.field.disabled,
            ...(p.field.attrs ?? {}),
          },
          () => opts.map((o) =>
            h(ElCheckbox, { key: String(o?.value), value: o?.value, disabled: o?.disabled }, () => o?.label),
          ),
        );
      }
      return h(
        ElRadioGroup,
        {
          modelValue: p.value,
          "onUpdate:modelValue": (v: unknown) => emit("update", v),
          disabled: p.disabled || p.field.disabled,
          class: "re-form-radio-group",
          ...(p.field.attrs ?? {}),
        },
        () => opts.map((o) =>
          h(ElRadioButton, {
            key: String(o?.value),
            value: o?.value,
            disabled: o?.disabled,
            class: "re-form-radio-button",
          }, () => o?.label),
        ),
      );
    };
  },
});

/** 字段渲染器 */
function renderField(field: ReFormField) {
  const value = model.value[field.prop];
  const update = (v: unknown): void => {
    if (field.format && v !== undefined) v = field.format(v);
    model.value[field.prop] = v;
  };

  if (typeof field.component === "object") {
    return h(field.component, {
      modelValue: value,
      "onUpdate:modelValue": update,
      ...(field.attrs ?? {}),
    });
  }

  switch (field.component ?? "input") {
    case "textarea":
      return h(ElInput, {
        modelValue: value,
        "onUpdate:modelValue": update,
        type: "textarea",
        placeholder: field.placeholder,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "select":
      return h(OptionsField, { field, value, disabled: props.disabled, type: "select", onUpdate: update });
    case "checkbox":
      return h(OptionsField, { field, value, disabled: props.disabled, type: "checkbox-group", onUpdate: update });
    case "radio":
      return h(OptionsField, { field, value, disabled: props.disabled, type: "radio-group", onUpdate: update });
    case "date":
      return h(ElDatePicker, {
        modelValue: value,
        "onUpdate:modelValue": update,
        type: "date",
        placeholder: field.placeholder,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "date-range":
      return h(ElDatePicker, {
        modelValue: value,
        "onUpdate:modelValue": update,
        type: "daterange",
        startPlaceholder: "开始日期",
        endPlaceholder: "结束日期",
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "datetime":
      return h(ElDatePicker, {
        modelValue: value,
        "onUpdate:modelValue": update,
        type: "datetime",
        placeholder: field.placeholder,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "datetime-range":
      return h(ElDatePicker, {
        modelValue: value,
        "onUpdate:modelValue": update,
        type: "datetimerange",
        startPlaceholder: "开始时间",
        endPlaceholder: "结束时间",
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "time":
      return h(ElTimePicker, {
        modelValue: value,
        "onUpdate:modelValue": update,
        placeholder: field.placeholder,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "time-select":
      return h(ElTimeSelect, {
        modelValue: value,
        "onUpdate:modelValue": update,
        placeholder: field.placeholder,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "number":
      return h(ElInputNumber, {
        modelValue: value,
        "onUpdate:modelValue": update,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "switch":
      return h(ElSwitch, {
        modelValue: value,
        "onUpdate:modelValue": update,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "slider":
      return h(ElSlider, {
        modelValue: value,
        "onUpdate:modelValue": update,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "rate":
      return h(ElRate, {
        modelValue: value,
        "onUpdate:modelValue": update,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "color-picker":
      return h(ElColorPicker, {
        modelValue: value,
        "onUpdate:modelValue": update,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "cascader":
      return h(ElCascader, {
        modelValue: value,
        "onUpdate:modelValue": update,
        placeholder: field.placeholder,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "tree-select":
      return h(ElTreeSelect, {
        modelValue: value,
        "onUpdate:modelValue": update,
        placeholder: field.placeholder,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
    case "icon-select":
      return h(ReIconSelect, {
        modelValue: value as string,
        "onUpdate:modelValue": update,
        ...(field.attrs ?? {}),
      });
    default:
      return h(ElInput, {
        modelValue: value,
        "onUpdate:modelValue": update,
        placeholder: field.placeholder,
        disabled: props.disabled || field.disabled,
        ...(field.attrs ?? {}),
      });
  }
}

/** 暴露给父组件的方法 */
defineExpose({
  /** 校验整个表单；返回 Promise<boolean> */
  async validate(): Promise<boolean> {
    if (!formRef.value) return true;
    try {
      await formRef.value.validate();
      return true;
    } catch {
      return false;
    }
  },
  /** 校验单个字段 */
  validateField(prop: string): Promise<boolean> {
    return formRef.value?.validate(prop) ?? Promise.resolve(true);
  },
  /** 重置整个表单 */
  resetFields(): void {
    formRef.value?.resetFields();
  },
  /** 清除校验态 */
  clearValidate(props?: string | string[]): void {
    formRef.value?.clearValidate(props);
  },
  /** 提交（触发校验，通过后 emit submit） */
  async submit(): Promise<boolean> {
    const ok = await (this as unknown as { validate(): Promise<boolean> }).validate();
    if (ok) emit("submit");
    return ok;
  },
  /** 当前表单 model 引用 */
  getModel(): Record<string, unknown> {
    return model.value;
  },
});
</script>

<template>
  <!-- Modern 布局（包裹 el-form 加现代样式） -->
  <ModernLayout
    v-if="layout === 'modern'"
    :label-width="labelWidth"
    :inline="inline"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <ElForm
      ref="formRef"
      :model="model"
      :rules="formRules"
      :label-width="labelWidth"
      :inline="inline"
      :disabled="disabled"
      class="re-form"
    >
      <template v-if="fields.length">
        <ElRow v-if="useGrid" :gutter="gutter">
          <ElCol v-for="field in fields.filter((f) => !f.hidden)" :key="field.prop" :span="field.span ?? 24">
            <ElFormItem :prop="field.prop" :label="field.label">
              <component :is="renderField(field)" />
              <div v-if="field.help" class="re-form__help">{{ field.help }}</div>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <template v-else>
          <ElFormItem v-for="field in fields.filter((f) => !f.hidden)" :key="field.prop" :prop="field.prop" :label="field.label">
            <component :is="renderField(field)" />
            <div v-if="field.help" class="re-form__help">{{ field.help }}</div>
          </ElFormItem>
        </template>
      </template>
      <slot />
      <slot name="actions" :submit="() => emit('submit')" :cancel="() => emit('cancel')" />
    </ElForm>
  </ModernLayout>

  <!-- 默认 el-form 布局 -->
  <ElForm
    v-else
    ref="formRef"
    v-bind="$attrs"
    :model="model"
    :rules="formRules"
    :label-width="labelWidth"
    :inline="inline"
    :disabled="disabled"
    class="re-form"
  >
    <!-- schema 模式 -->
    <template v-if="fields.length">
      <ElRow v-if="useGrid" :gutter="gutter">
        <ElCol
          v-for="field in fields.filter((f) => !f.hidden)"
          :key="field.prop"
          :span="field.span ?? 24"
        >
          <ElFormItem
            :prop="field.prop"
            :label="field.label"
          >
            <component :is="renderField(field)" />
            <div v-if="field.help" class="re-form__help">{{ field.help }}</div>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <template v-else>
        <ElFormItem
          v-for="field in fields.filter((f) => !f.hidden)"
          :key="field.prop"
          :prop="field.prop"
          :label="field.label"
        >
          <component :is="renderField(field)" />
          <div v-if="field.help" class="re-form__help">{{ field.help }}</div>
        </ElFormItem>
      </template>
    </template>

    <slot />

    <!-- actions 插槽：底部按钮区 -->
    <slot name="actions" :submit="() => emit('submit')" :cancel="() => emit('cancel')" />
  </ElForm>
</template>

<style scoped>
.re-form__help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  margin-top: 4px;
}
</style>

<style>
/* 全局样式：radio-button 盒子更大 */
.re-form-radio-group .el-radio-button__inner {
  padding: 10px 20px;
  font-size: 14px;
}
</style>