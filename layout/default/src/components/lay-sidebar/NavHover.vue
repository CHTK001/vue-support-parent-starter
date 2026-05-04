<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHover from "./themes/hover/Default.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultHover,
  "future-tech": DefaultHover,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultHover);
</script>

<template>
  <!-- 去掉 key，避免切换仅样式皮肤时悬浮导航被整体重建 -->
  <component :is="CurrentComponent" />
</template>
