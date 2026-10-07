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

const emit = defineEmits<{
  (e: "clear"): void;
  (e: "input", value: string | number | null | undefined): void;
  (e: "change", value: string | number | null | undefined): void;
}>();

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
    rows?: number;
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
    size: undefined as undefined | "large" | "default" | "small",
    prefixIcon: "",
    suffixIcon: "",
    status: undefined as undefined | "success" | "warning" | "error",
    formatter: undefined,
    parser: undefined,
  },
);

function onInput(value: string | number | null | undefined): void {
  if (props.parser) {
    model.value = props.parser(String(value)) as never;
  } else {
    model.value = value as never;
  }
}

/** 点 × 清空：ElInput 会 emit update:model-value("")，这里回写 model 后再把 clear 向外透传。 */
function onClear(): void {
  emit("clear");
}
</script>

<template>
  <div class="re-input">
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
      @clear="onClear"
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
  </div>
</template>

<style>
/* 高度统一 34px（与 ReSelect / 表单控件基线对齐）；size=small/large 显式变体保持 element 原有尺寸。
   盒模型与 el-select__wrapper 对齐：border-box + min-height 34px（含 1px 上下 border），
   inner 内容高度 = 34 - 8(padding) - 2(border) = 24px，由 flex 垂直居中，box 总高恒为 34。 */
.re-input .el-input {
  --el-input-height: 34px;
}
.re-input .el-input.el-input--small {
  --el-input-height: 24px;
}
.re-input .el-input.el-input--large {
  --el-input-height: 40px;
}
.re-input .el-input .el-input__wrapper {
  box-sizing: border-box;
  min-height: var(--el-input-height);
  height: auto;
}
.re-input .el-input .el-input__inner {
  height: auto;
  min-height: calc(var(--el-input-height) - 10px);
  line-height: calc(var(--el-input-height) - 10px);
}
.re-input .el-input .el-input__prefix,
.re-input .el-input .el-input__suffix {
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
/* 包裹层不产生盒子，避免影响既有布局（class/style 通过 v-bind="$attrs" 仍落到内部控件） */
.re-input {
  display: contents;
}
</style>