<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultTag from "./themes/Default.vue";
import SpringFestivalTag from "./themes/SpringFestival.vue";
import CyberpunkTag from "./themes/Cyberpunk.vue";
import MidAutumnTag from "./themes/MidAutumn.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultTag,
  'spring-festival': SpringFestivalTag,
  'cyberpunk': CyberpunkTag,
  'mid-autumn': MidAutumnTag,
  // 其他主题组件
  // 'christmas': ChristmasTag,
  // 'new-year': NewYearTag,
  // 'valentines-day': ValentinesDayTag,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
