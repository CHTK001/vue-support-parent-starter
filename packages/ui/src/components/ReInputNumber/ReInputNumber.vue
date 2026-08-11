<script setup lang="ts">
/**
 * ReInputNumber —— 数字输入框组件
 *
 * 多种布局模式（与 ReSelect 等组件一致的分发模式）：
 *   - "default"：原生 el-input-number（默认）
 *   - "card" / "modern"：现代化扁平数字输入框（卡片风格，异步加载）
 *
 * 用法：
 *   <ReInputNumber v-model="num" />
 *   <ReInputNumber layout="modern" v-model="num" :min="0" :max="100" />
 */
import { computed, defineAsyncComponent } from "vue";
import { ElInputNumber } from "element-plus";
import type { ReInputNumberControlsPosition, ReInputNumberLayout, ReInputNumberSize } from "./types";

/** card 布局组件（按需异步加载） */
const CardLayout = defineAsyncComponent(() => import("./layouts/Card.vue"));

defineOptions({ name: "ReInputNumber", inheritAttrs: true });

const model = defineModel<number | undefined>({ default: undefined });

const props = withDefaults(
  defineProps<{
    /** 布局模式：default（原生 el-input-number）/ card 或 modern（现代化扁平数字输入框） */
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
    /** card 布局：前缀文本 */
    prefix?: string;
    /** card 布局：后缀文本 */
    suffix?: string;
  }>(),
  {
    layout: "default",
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

/** 统一处理 modern / card 别名 */
const resolvedLayout = computed<ReInputNumberLayout>(() => {
  const l = props.layout;
  if (l === "modern") return "card";
  return l ?? "default";
});
</script>

<template>
  <!-- card / modern 布局：现代化扁平数字输入框（异步加载） -->
  <CardLayout
    v-if="resolvedLayout === 'card'"
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
