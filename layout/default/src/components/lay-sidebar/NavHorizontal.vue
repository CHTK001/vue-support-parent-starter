<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHorizontal from "./themes/horizontal/Default.vue";
import SpringFestivalHorizontal from "./themes/horizontal/SpringFestival.vue";
import CyberpunkHorizontal from "./themes/horizontal/Cyberpunk.vue";
import MidAutumnHorizontal from "./themes/horizontal/MidAutumn.vue";
import ChristmasHorizontal from "./themes/horizontal/Christmas.vue";
import NewYearHorizontal from "./themes/horizontal/NewYear.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultHorizontal,
  'spring-festival': SpringFestivalHorizontal,
  'cyberpunk': CyberpunkHorizontal,
  'mid-autumn': MidAutumnHorizontal,
  'christmas': ChristmasHorizontal,
  'new-year': NewYearHorizontal,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHorizontal);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
