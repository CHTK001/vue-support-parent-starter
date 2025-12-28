<script setup lang="ts">
/**
 * lay-setting 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.0.0 - 重构版本
 */
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultSetting from "./themes/Default.vue";
import SpringFestivalSetting from "./themes/SpringFestival.vue";
import CyberpunkSetting from "./themes/Cyberpunk.vue";
import MidAutumnSetting from "./themes/MidAutumn.vue";
import ChristmasSetting from "./themes/Christmas.vue";
import NewYearSetting from "./themes/NewYear.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultSetting,
  'spring-festival': SpringFestivalSetting,
  'cyberpunk': CyberpunkSetting,
  'mid-autumn': MidAutumnSetting,
  'christmas': ChristmasSetting,
  'new-year': NewYearSetting,
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultSetting);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
