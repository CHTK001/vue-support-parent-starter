<template>
  <component 
    :is="buttonComponent" 
    v-bind="$attrs"
    :size="size"
    :disabled="disabled"
    :appearance="appearance"
    :glow="glow"
    :glow-opacity="glowOpacity"
    :background-opacity="backgroundOpacity"
    :decoration-color-alt="decorationColorAlt"
    :scale-action="scaleAction"
    :direction-alt="directionAlt"
    :class="className"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * TechButton - 科幻风格按钮封装
 * 基于 @techui/scifi 的 scifiButton 系列组件
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */
import { computed, type Component } from "vue";
import { 
  scifiButtonA1, 
  scifiButtonA2, 
  scifiButtonA3, 
  scifiButtonA4, 
  scifiButtonA5 
} from "@techui/scifi";

// 组件映射表
const buttonComponents: Record<string, Component> = {
  A1: scifiButtonA1,
  A2: scifiButtonA2,
  A3: scifiButtonA3,
  A4: scifiButtonA4,
  A5: scifiButtonA5,
};

defineOptions({
  name: "TechButton",
  inheritAttrs: false
});

// 按钮变体类型
type ButtonVariant = "A1" | "A2" | "A3" | "A4" | "A5";

const props = withDefaults(defineProps<{
  /** 按钮变体 A1-A5 */
  variant?: ButtonVariant;
  /** 外观变体 A/B/C */
  appearance?: "A" | "B" | "C";
  /** 尺寸 */
  size?: "small" | "default" | "large";
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示发光效果 */
  glow?: boolean;
  /** 发光透明度 */
  glowOpacity?: number;
  /** 背景透明度 */
  backgroundOpacity?: number;
  /** 装饰颜色替换 */
  decorationColorAlt?: boolean;
  /** 缩放动作 */
  scaleAction?: boolean;
  /** 方向替换 */
  directionAlt?: boolean;
  /** 自定义类名 */
  className?: string;
}>(), {
  variant: "A1",
  appearance: "A",
  size: "default",
  disabled: false,
  glow: true,
  glowOpacity: 0.5,
  backgroundOpacity: 0.5,
  decorationColorAlt: false,
  scaleAction: true,
  directionAlt: false,
  className: ""
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

// 根据 variant 动态选择组件
const buttonComponent = computed(() => {
  return buttonComponents[props.variant] || scifiButtonA1;
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit("click", event);
  }
};
</script>

<style lang="scss" scoped>
/* 自定义样式扩展 */
</style>
