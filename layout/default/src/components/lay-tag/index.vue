<script setup lang="ts">
/**
 * lay-tag 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.0.0 - 重构版本
 */
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

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
