<template>
  <component 
    :is="decoComponent" 
    v-bind="$attrs"
    :width="width"
    :height="height"
    :glow="glow"
    :glow-opacity="glowOpacity"
    :decoration-color-alt="decorationColorAlt"
    :animation="animation"
    :class="className"
  />
</template>

<script setup lang="ts">
/**
 * TechDeco - 科幻风格装饰元素封装
 * 基于 @techui/scifi 的 scifiDeco 系列组件
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */
import { computed, defineOptions } from "vue";

defineOptions({
  name: "TechDeco",
  inheritAttrs: false
});

// 装饰变体类型
type DecoVariant = "A1" | "A2" | "A3" | "A4" | "A5" | "B1" | "B2" | "B3" | "B4" | "B5" | 
                   "C1" | "C2" | "C3" | "C4" | "C5" | "D1" | "D2" | "D3" | "D4" | "D5";

const props = withDefaults(defineProps<{
  /** 装饰变体 */
  variant?: DecoVariant;
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 是否显示发光效果 */
  glow?: boolean;
  /** 发光透明度 */
  glowOpacity?: number;
  /** 装饰颜色替换 */
  decorationColorAlt?: boolean;
  /** 是否启用动画 */
  animation?: boolean;
  /** 自定义类名 */
  className?: string;
}>(), {
  variant: "A1",
  width: "100%",
  height: "auto",
  glow: true,
  glowOpacity: 0.5,
  decorationColorAlt: false,
  animation: true,
  className: ""
});

// 根据 variant 动态选择组件
const decoComponent = computed(() => {
  return `scifiDeco${props.variant}`;
});
</script>

<style lang="scss" scoped>
/* 自定义样式扩展 */
</style>
