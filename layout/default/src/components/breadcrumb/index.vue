<script setup lang="ts">
/**
 * breadcrumb 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.0.0 - 重构版本
 */
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultBreadcrumb from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultBreadcrumb,
  'spring-festival': defineAsyncComponent(() => import("./themes/SpringFestival.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/Halloween.vue")),
  'mid-autumn': defineAsyncComponent(() => import("./themes/MidAutumn.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/Christmas.vue")),
  'new-year': defineAsyncComponent(() => import("./themes/NewYear.vue")),
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultBreadcrumb);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
