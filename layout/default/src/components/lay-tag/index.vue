<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultTag from "./themes/Default.vue";
import SpringFestivalTag from "./themes/SpringFestival.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultTag,
  'spring-festival': SpringFestivalTag,
  // 其他主题组件
  // 'cyberpunk': CyberpunkTag,
  // 'christmas': ChristmasTag,
  // 'mid-autumn': MidAutumnTag,
  // 'new-year': NewYearTag,
  // 'valentines-day': ValentinesDayTag,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
