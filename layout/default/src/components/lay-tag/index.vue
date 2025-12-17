<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultTag from "./themes/Default.vue";
import SpringFestivalTag from "./themes/SpringFestival.vue";
import CyberpunkTag from "./themes/Cyberpunk.vue";
import MidAutumnTag from "./themes/MidAutumn.vue";
import ChristmasTag from "./themes/Christmas.vue";
import NewYearTag from "./themes/NewYear.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultTag,
  'spring-festival': SpringFestivalTag,
  'cyberpunk': CyberpunkTag,
  'mid-autumn': MidAutumnTag,
  'christmas': ChristmasTag,
  'new-year': NewYearTag,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
