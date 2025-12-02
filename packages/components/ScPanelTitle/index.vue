<template>
  <!-- 使用 scifiPanelTitle -->
  <scifi-panel-title v-bind="panelTitleProps">
    <slot />
  </scifi-panel-title>
</template>

<script setup lang="ts">
/**
 * ScPanelTitle 面板标题组件
 * 封装 scifiPanelTitle
 * @author CH
 * @since 2025-12-03
 * @version 1.0.0
 */
import { computed } from "vue";

interface Props {
  /** 标题文本 */
  text?: string;
  /** 图标 */
  icon?: string;
  /** 对齐方式 */
  align?: "left" | "center" | "right";
}

const props = withDefaults(defineProps<Props>(), {
  text: "",
  icon: "",
  align: "left"
});

const panelTitleProps = computed(() => ({
  // scifiPanelTitle 的属性，根据实际 API 调整
  text: props.text,
  icon: props.icon,
  align: props.align
}));
</script>

<style lang="scss" scoped>
// 自定义样式
</style>
