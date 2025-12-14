<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultNavbar from "./themes/Default.vue";
import SpringFestivalNavbar from "./themes/SpringFestival.vue";
import CyberpunkNavbar from "./themes/Cyberpunk.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultNavbar,
  'spring-festival': SpringFestivalNavbar,
  'cyberpunk': CyberpunkNavbar,
  // 其他主题组件
  // 'christmas': ChristmasNavbar,
  // 'mid-autumn': MidAutumnNavbar,
  // 'new-year': NewYearNavbar,
  // 'valentines-day': ValentinesDayNavbar,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultNavbar);
</script>

<template>
  <component :is="CurrentComponent" />
</template>
