<template>
  <component 
    :is="panelTitleComponent" 
    v-bind="$attrs"
    :title="title"
    :glow="glow"
    :glow-opacity="glowOpacity"
    :decoration-color-alt="decorationColorAlt"
    :class="className"
  >
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <slot />
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * TechPanelTitle - 科幻风格面板标题封装
 * 基于 @techui/scifi 的 scifiPanelTitle 系列组件
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */
import { computed, resolveComponent } from "vue";

defineOptions({
  name: "TechPanelTitle",
  inheritAttrs: false
});

// 面板标题变体类型 (实际可用: A1-A3)
type PanelTitleVariant = "A1" | "A2" | "A3";

const props = withDefaults(defineProps<{
  /** 标题变体 */
  variant?: PanelTitleVariant;
  /** 标题文本 */
  title?: string;
  /** 是否显示发光效果 */
  glow?: boolean;
  /** 发光透明度 */
  glowOpacity?: number;
  /** 装饰颜色替换 */
  decorationColorAlt?: boolean;
  /** 自定义类名 */
  className?: string;
}>(), {
  variant: "A1",
  title: "",
  glow: true,
  glowOpacity: 0.5,
  decorationColorAlt: false,
  className: ""
});

// 根据 variant 动态选择组件
const panelTitleComponent = computed(() => {
  return resolveComponent(`scifiPanelTitle${props.variant}`);
});
</script>

<style lang="scss" scoped>
/* 自定义样式扩展 */
</style>
