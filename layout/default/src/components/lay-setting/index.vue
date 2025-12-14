<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultSetting from "./themes/Default.vue";
import SpringFestivalSetting from "./themes/SpringFestival.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultSetting,
  'spring-festival': SpringFestivalSetting,
  // 其他主题组件
  // 'cyberpunk': CyberpunkSetting,
  // 'christmas': ChristmasSetting,
  // 'mid-autumn': MidAutumnSetting,
  // 'new-year': NewYearSetting,
  // 'valentines-day': ValentinesDaySetting,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultSetting);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
