<script setup lang="ts">
/**
 * ReInputNumber —— 数字输入框组件
 *
 * 多种布局模式（与 ReSelect 等组件一致的分发模式）：
 *   - "modern" / "card"：现代化扁平数字输入框，**默认**；加减按钮左右分置
 *   - "default"：原生 el-input-number（需显式指定 layout="default"）
 *
 * 用法：
 *   <ReInputNumber v-model="num" />                              <!-- modern（默认） -->
 *   <ReInputNumber layout="default" v-model="num" :min="0" />     <!-- 原生 -->
 */
import { computed, defineAsyncComponent } from "vue";
import { ElInputNumber } from "element-plus";
import type { ReInputNumberControlsPosition, ReInputNumberLayout, ReInputNumberSize } from "./types";

/** modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReInputNumber", inheritAttrs: true });

const model = defineModel<number | undefined>({ default: undefined });

const props = withDefaults(
  defineProps<{
    /** 布局模式：modern 或 card（现代化扁平数字输入框，默认）/ default（原生 el-input-number） */
    layout?: ReInputNumberLayout;
    /** 最小值 */
    min?: number;
    /** 最大值 */
    max?: number;
    /** 步长 */
    step?: number;
    /** 是否必须为 step 的整数倍 */
    stepStrictly?: boolean;
    /** 精度（小数位数） */
    precision?: number;
    /** 占位符 */
    placeholder?: string;
    /** 禁用 */
    disabled?: boolean;
    /** 只读 */
    readonly?: boolean;
    /** 是否展示控制按钮 */
    controls?: boolean;
    /** 控制按钮位置 */
    controlsPosition?: ReInputNumberControlsPosition;
    /** 尺寸 */
    size?: ReInputNumberSize;
    /** modern 布局：前缀文本 */
    prefix?: string;
    /** modern 布局：后缀文本 */
    suffix?: string;
  }>(),
  {
    layout: "modern",
    min: undefined,
    max: undefined,
    step: 1,
    stepStrictly: false,
    precision: undefined,
    placeholder: "",
    disabled: false,
    readonly: false,
    controls: true,
    controlsPosition: "",
    size: "default",
    prefix: "",
    suffix: "",
  },
);

/** 统一处理 modern / card 别名（card 为 modern 的向后兼容别名） */
const resolvedLayout = computed<ReInputNumberLayout>(() => {
  const l = props.layout;
  if (l === "card") return "modern";
  return l ?? "default";
});
</script>

<template>
  <!-- modern / card 布局：现代化扁平数字输入框（异步加载） -->
  <ModernLayout
    v-if="resolvedLayout === 'modern'"
    :model-value="model"
    @update:model-value="(v: any) => (model = v)"
    v-bind="$attrs"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :controls="controls"
    :controls-position="controlsPosition"
    :size="size"
    :prefix="prefix"
    :suffix="suffix"
  />

  <!-- 默认：原生 el-input-number -->
  <ElInputNumber
    v-else
    v-model="model"
    v-bind="$attrs"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :controls="controls"
    :controls-position="(controlsPosition === 'right' ? 'right' : '') || undefined"
    :size="size"
  />
</template>

<style>
/* 高度统一 34px（与 ReInput / ReSelect 基线对齐）：
   el-input-number 内部 el-input 的 wrapper 是 content-box，默认会被 inner 撑到 44px，
   这里统一为 border-box + min-height 34px，inner 高度自适应。 */
.el-input-number .el-input__wrapper {
  box-sizing: border-box;
  min-height: 34px;
  height: auto;
}
.el-input-number .el-input__inner {
  height: auto !important;
  min-height: 24px !important;
  line-height: 24px !important;
}
/* small / large 变体保持 element 原有尺寸 */
.el-input-number--small .el-input__wrapper {
  min-height: 24px;
}
.el-input-number--large .el-input__wrapper {
  min-height: 40px;
}
</style>
