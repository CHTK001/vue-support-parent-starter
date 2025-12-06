<template>
  <component 
    :is="geometryComponent" 
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
 * TechGeometry - 科幻风格几何图形封装
 * 基于 @techui/scifi 的 scifiGeome 系列组件
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */
import { computed, defineOptions } from "vue";

defineOptions({
  name: "TechGeometry",
  inheritAttrs: false
});

// 几何变体类型
type GeometryVariant = "A1" | "A2" | "A3" | "A4" | "A5" | "B1" | "B2" | "B3" | "B4" | "B5";

const props = withDefaults(defineProps<{
  /** 几何变体 */
  variant?: GeometryVariant;
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
const geometryComponent = computed(() => {
  return `scifiGeome${props.variant}`;
});
</script>

<style lang="scss" scoped>
/* 自定义样式扩展 */
</style>
