<template>
  <component :is="currentComponent || ElOption" :value="value" :label="label" :disabled="disabled">
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * ScOption 选项组件
 * 封装 Element Plus Option
 * 支持主题切换
 * @author CH
 * @version 1.0.0
 * @since 2026-02-27
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElOption } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  /**
   * 选项的值
   */
  value: {
    type: [String, Number, Boolean, Object] as PropType<string | number | boolean | Record<string, any>>,
    required: true
  },
  /**
   * 选项的标签
   */
  label: {
    type: [String, Number],
    default: ""
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  }
});

/**
 * 使用主题组件系统
 */
const { currentComponent } = useThemeComponent("ElOption");
</script>

<style scoped>
/* 由主题控制样式 */
</style>
