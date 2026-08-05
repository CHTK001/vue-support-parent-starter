<script setup lang="ts">
/**
 * ReInput —— 输入框组件
 *
 * 透传 el-input 全部能力（v-model + 所有 props / slots）。
 * 增强：
 *   - icon：可传 Element Plus PascalCase 名 / Iconify 三方库 / HTTP URL，自动渲染为 prefix / suffix 图标
 *   - status：success / warning / error，用于表单校验态
 *   - formatter / parser：双向格式化（如金额千分位、trim 等）
 *   - layout：布局变体，"el"（默认，el-input）/ "modern"（现代化扁平输入框，异步加载）
 */
import { defineAsyncComponent } from "vue";
import { ElInput } from "element-plus";
import ReIcon from "../ReIcon/theme/default/ReIcon.vue";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReInput", inheritAttrs: true });

const model = defineModel<string | number | null | undefined>({ default: "" });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-input）/ "modern"（现代化扁平输入框） */
    layout?: "el" | "modern";
    type?: "text" | "password" | "textarea" | "number" | "email" | "tel" | "url" | "search" | "date" | "datetime-local" | (string & {});
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    showPassword?: boolean;
    showWordLimit?: boolean;
    maxlength?: number | string;
    minlength?: number | string;
    rows?: number | string;
    autosize?: boolean | { minRows: number; maxRows: number };
    size?: "large" | "default" | "small";
    /** 前缀图标 */
    prefixIcon?: string;
    /** 后缀图标 */
    suffixIcon?: string;
    /** 校验态：success / warning / error */
    status?: "" | "success" | "warning" | "error";
    /** 显示格式化（如千分位） */
    formatter?: (value: string | number | undefined) => string;
    /** 输入回写格式化（与 formatter 配合使用） */
    parser?: (value: string) => string;
  }>(),
  {
    layout: "el",
    type: "text",
    placeholder: "",
    clearable: false,
    disabled: false,
    readonly: false,
    showPassword: false,
    showWordLimit: false,
    maxlength: undefined,
    minlength: undefined,
    rows: 2,
    autosize: false,
    size: "",
    prefixIcon: "",
    suffixIcon: "",
    status: "",
    formatter: undefined,
    parser: undefined,
  },
);

function onInput(value: string | number): void {
  if (props.parser) {
    model.value = props.parser(String(value)) as never;
  } else {
    model.value = value as never;
  }
}
</script>

<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
    :model-value="model"
    @update:model-value="onInput"
    v-bind="$attrs"
    :type="type"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :readonly="readonly"
    :show-password="showPassword"
    :show-word-limit="showWordLimit"
    :maxlength="maxlength"
    :minlength="minlength"
    :rows="rows"
    :autosize="autosize"
    :size="size"
    :prefix-icon="prefixIcon"
    :suffix-icon="suffixIcon"
    :status="status"
    :formatter="formatter"
    :parser="parser"
  >
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </ModernLayout>

  <!-- 默认 el-input 布局 -->
  <ElInput
    v-else
    :model-value="formatter ? formatter(model as never) : (model as never)"
    v-bind="$attrs"
    :type="type"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :readonly="readonly"
    :show-password="showPassword"
    :show-word-limit="showWordLimit"
    :maxlength="maxlength"
    :minlength="minlength"
    :rows="rows"
    :autosize="autosize"
    :size="size"
    :prefix-icon="prefixIcon || undefined"
    :suffix-icon="suffixIcon || undefined"
    :status="status"
    @update:model-value="onInput"
  >
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.suffix || $slots.append" #suffix>
      <slot name="suffix" />
    </template>
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </ElInput>
</template>