<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHorizontal from "./themes/horizontal/Default.vue";
import SpringFestivalHorizontal from "./themes/horizontal/SpringFestival.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultHorizontal,
  'spring-festival': SpringFestivalHorizontal,
  // 其他主题组件
  // 'cyberpunk': CyberpunkHorizontal,
  // 'christmas': ChristmasHorizontal,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHorizontal);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
