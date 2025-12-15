<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultTag from "./themes/Default.vue";
import SpringFestivalTag from "./themes/SpringFestival.vue";
import CyberpunkTag from "./themes/Cyberpunk.vue";
import MidAutumnTag from "./themes/MidAutumn.vue";
import ChristmasTag from "./themes/Christmas.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultTag,
  'spring-festival': SpringFestivalTag,
  'cyberpunk': CyberpunkTag,
  'mid-autumn': MidAutumnTag,
  'christmas': ChristmasTag,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
