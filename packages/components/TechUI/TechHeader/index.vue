<template>
  <component 
    :is="headerComponent" 
    v-bind="$attrs"
    :title="title"
    :sub-title="subTitle"
    :glow="glow"
    :glow-opacity="glowOpacity"
    :background-opacity="backgroundOpacity"
    :decoration-color-alt="decorationColorAlt"
    :class="className"
  >
    <template v-if="$slots.left" #left>
      <slot name="left" />
    </template>
    <template v-if="$slots.center" #center>
      <slot name="center" />
    </template>
    <template v-if="$slots.right" #right>
      <slot name="right" />
    </template>
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * TechHeader - 科幻风格头部封装
 * 基于 @techui/scifi 的 scifiHeader 系列组件
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */
import { computed, resolveComponent } from "vue";

defineOptions({
  name: "TechHeader",
  inheritAttrs: false
});

// 头部变体类型 (实际可用: A1-A4)
type HeaderVariant = "A1" | "A2" | "A3" | "A4";

const props = withDefaults(defineProps<{
  /** 头部变体 */
  variant?: HeaderVariant;
  /** 主标题 */
  title?: string;
  /** 副标题 */
  subTitle?: string;
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
  subTitle: "",
  glow: true,
  glowOpacity: 0.5,
  backgroundOpacity: 0.5,
  decorationColorAlt: false,
  className: ""
});

// 根据 variant 动态选择组件
const headerComponent = computed(() => {
  return resolveComponent(`scifiHeader${props.variant}`);
});
</script>

<style lang="scss" scoped>
/* 自定义样式扩展 */
</style>
