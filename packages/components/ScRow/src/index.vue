<template>
  <component :is="currentComponent || ElRow" :gutter="gutter" :tag="tag" :justify="justify" :align="align" :wrap="wrap">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScRow 行布局组件
 * 封装 Element Plus Row 与 PixelUI PxRow
 * 在 data-skin 为 8bit 时自动切换为像素风行布局
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElRow } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  gutter: {
    type: Number,
    default: 0
  },
  tag: {
    type: String,
    default: "div"
  },
  justify: {
    type: String as PropType<"start" | "end" | "center" | "space-around" | "space-between" | "space-evenly">,
    default: "start"
  },
  align: {
    type: String as PropType<"top" | "middle" | "bottom">,
    default: "top"
  },
  wrap: {
    type: Boolean,
    default: false
  }
});

const { currentComponent } = useThemeComponent("ElRow");


</script>
