<template>
  <component :is="currentComponent || ElIcon" :size="size" :color="color">
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * ScIcon 图标组件
 * 封装 Element Plus Icon
 * 支持主题切换
 * @author CH
 * @version 1.0.0
 * @since 2026-02-27
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElIcon } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  /**
   * 图标大小
   */
  size: {
    type: [Number, String] as PropType<number | string>,
    default: undefined
  },
  /**
   * 图标颜色
   */
  color: {
    type: String,
    default: ""
  }
});

/**
 * 使用主题组件系统
 */
const { currentComponent } = useThemeComponent("ElIcon");
</script>

<style scoped>
/* 由主题控制样式 */
</style>
