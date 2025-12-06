<template>
  <component 
    :is="panelComponent" 
    v-bind="$attrs"
    :title="title"
    :width="width"
    :height="height"
    :glow="glow"
    :glow-opacity="glowOpacity"
    :background-opacity="backgroundOpacity"
    :decoration-color-alt="decorationColorAlt"
    :class="className"
  >
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * TechPanel - 科幻风格面板封装
 * 基于 @techui/scifi 的 scifiPanel 系列组件
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */
import { computed, defineOptions } from "vue";

defineOptions({
  name: "TechPanel",
  inheritAttrs: false
});

// 面板变体类型
type PanelVariant = "A1" | "A2" | "A3" | "A4" | "A5" | "B1" | "B2" | "B3" | "B4" | "B5";

const props = withDefaults(defineProps<{
  /** 面板变体 */
  variant?: PanelVariant;
  /** 标题 */
  title?: string;
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 是否显示发光效果 */
  glow?: boolean;
  /** 发光透明度 */
  glowOpacity?: number;
  /** 背景透明度 */
  backgroundOpacity?: number;
  /** 装饰颜色替换 */
  decorationColorAlt?: boolean;
  /** 自定义类名 */
  className?: string;
}>(), {
  variant: "A1",
  title: "",
  width: "100%",
  height: "auto",
  glow: true,
  glowOpacity: 0.5,
  backgroundOpacity: 0.5,
  decorationColorAlt: false,
  className: ""
});

// 根据 variant 动态选择组件
const panelComponent = computed(() => {
  return `scifiPanel${props.variant}`;
});
</script>

<style lang="scss" scoped>
/* 自定义样式扩展 */
</style>
