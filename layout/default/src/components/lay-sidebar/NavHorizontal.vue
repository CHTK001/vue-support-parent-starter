<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHorizontal from "./themes/horizontal/Default.vue";
import SpringFestivalHorizontal from "./themes/horizontal/SpringFestival.vue";
import CyberpunkHorizontal from "./themes/horizontal/Cyberpunk.vue";
import MidAutumnHorizontal from "./themes/horizontal/MidAutumn.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultHorizontal,
  'spring-festival': SpringFestivalHorizontal,
  'cyberpunk': CyberpunkHorizontal,
  'mid-autumn': MidAutumnHorizontal,
  // 其他主题组件
  // 'christmas': ChristmasHorizontal,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHorizontal);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
