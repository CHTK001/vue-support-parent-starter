<template>
  <component :is="currentComponent || ElEmpty" :image="image" :image-size="imageSize" :description="description">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.image" #image>
      <slot name="image" />
    </template>
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScEmpty 空状态组件
 * 封装 Element Plus Empty
 * 支持主题切换
 * @author CH
 * @version 1.0.0
 * @since 2026-02-27
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElEmpty } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  /**
   * 图片地址
   */
  image: {
    type: String,
    default: ""
  },
  /**
   * 图片大小
   */
  imageSize: {
    type: Number,
    default: undefined
  },
  /**
   * 描述文字
   */
  description: {
    type: String,
    default: ""
  }
});

/**
 * 使用主题组件系统
 */
const { currentComponent } = useThemeComponent("ElEmpty");
</script>

<style scoped>
/* 由主题控制样式 */
</style>
