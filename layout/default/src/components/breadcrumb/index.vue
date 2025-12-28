<script setup lang="ts">
/**
 * breadcrumb 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.0.0 - 重构版本
 */
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultBreadcrumb from "./themes/Default.vue";
import SpringFestivalBreadcrumb from "./themes/SpringFestival.vue";
import CyberpunkBreadcrumb from "./themes/Cyberpunk.vue";
import MidAutumnBreadcrumb from "./themes/MidAutumn.vue";
import ChristmasBreadcrumb from "./themes/Christmas.vue";
import NewYearBreadcrumb from "./themes/NewYear.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultBreadcrumb,
  'spring-festival': SpringFestivalBreadcrumb,
  'cyberpunk': CyberpunkBreadcrumb,
  'mid-autumn': MidAutumnBreadcrumb,
  'christmas': ChristmasBreadcrumb,
  'new-year': NewYearBreadcrumb,
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultBreadcrumb);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
