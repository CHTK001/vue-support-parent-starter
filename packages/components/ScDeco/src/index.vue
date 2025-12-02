<template>
  <!-- 使用 scifiDeco -->
  <scifi-deco v-bind="scifiDecoProps">
    <slot />
  </scifi-deco>
</template>

<script setup lang="ts">
/**
 * ScDeco 装饰组件
 * 封装 scifiDeco
 * @author CH
 * @since 2025-12-03
 * @version 3.0.0
 */
import { computed } from "vue";

interface Props {
  /** 装饰类型 */
  type?: string;
  /** 主题颜色 */
  theme?: string;
  /** 装饰大小 */
  size?: number;
  /** 是否启用动画 */
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "default",
  theme: "default",
  size: 20,
  animated: true
});

const scifiDecoProps = computed(() => ({
  // scifiDeco 的属性，根据实际 API 调整
  type: props.type,
  theme: props.theme,
  size: props.size,
  animated: props.animated
}));
</script>

<style lang="scss" scoped>
// 自定义样式
</style>
