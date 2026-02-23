<script setup lang="ts">
/**
 * lay-navbar 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.0 - 支持主题组件懒加载
 */
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultNavbar from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultNavbar,
  'spring-festival': defineAsyncComponent(() => import("./themes/SpringFestival.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/Halloween.vue")),
  'mid-autumn': defineAsyncComponent(() => import("./themes/MidAutumn.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/Christmas.vue")),
  'new-year': defineAsyncComponent(() => import("./themes/NewYear.vue")),
  'future-tech': defineAsyncComponent(() => import("./themes/FutureTech.vue")),
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultNavbar);
</script>

<template>
  <component :is="CurrentComponent" />
</template>
