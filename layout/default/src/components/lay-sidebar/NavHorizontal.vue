<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHorizontal from "./themes/horizontal/Default.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultHorizontal,
  "tech": DefaultHorizontal,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultHorizontal);
</script>

<template>
  <!-- 去掉 key，减少不必要的组件重建 -->
  <component :is="CurrentComponent" />
</template>
