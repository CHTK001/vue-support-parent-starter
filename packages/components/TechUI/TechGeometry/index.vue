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
import { computed, type Component } from "vue";
import { 
  scifiGeomeParallelogram, 
  scifiGeomeRectangle, 
  scifiGeomeTrapezoid, 
  scifiGeomeTriangle, 
  scifiGeomHexagon  // 注意: Hexagon 没有 'e'
} from "@techui/scifi";

// 组件映射表
const geometryComponents: Record<string, Component> = {
  Parallelogram: scifiGeomeParallelogram,
  Rectangle: scifiGeomeRectangle,
  Trapezoid: scifiGeomeTrapezoid,
  Triangle: scifiGeomeTriangle,
  Hexagon: scifiGeomHexagon,
};

defineOptions({
  name: "TechGeometry",
  inheritAttrs: false
});

// 几何变体类型 (对应 scifiGeome + 形状名称)
type GeometryVariant = "Parallelogram" | "Rectangle" | "Trapezoid" | "Triangle" | "Hexagon";

const props = withDefaults(defineProps<{
  /** 几何变体: Parallelogram(平行四边形), Rectangle(矩形), Trapezoid(梯形), Triangle(三角形), Hexagon(六边形) */
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
  variant: "Rectangle",
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
  return geometryComponents[props.variant] || scifiGeomeRectangle;
});
</script>

<style lang="scss" scoped>
/* 自定义样式扩展 */
</style>
