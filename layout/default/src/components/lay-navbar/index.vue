<script setup lang="ts">
/**
 * lay-navbar 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.0.0 - 重构版本
 */
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultNavbar from "./themes/Default.vue";
import SpringFestivalNavbar from "./themes/SpringFestival.vue";
import CyberpunkNavbar from "./themes/Cyberpunk.vue";
import MidAutumnNavbar from "./themes/MidAutumn.vue";
import ChristmasNavbar from "./themes/Christmas.vue";
import NewYearNavbar from "./themes/NewYear.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultNavbar,
  'spring-festival': SpringFestivalNavbar,
  'cyberpunk': CyberpunkNavbar,
  'mid-autumn': MidAutumnNavbar,
  'christmas': ChristmasNavbar,
  'new-year': NewYearNavbar,
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultNavbar);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
