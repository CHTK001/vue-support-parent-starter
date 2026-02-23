<script setup lang="ts">
/**
 * lay-tag 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.0 - 支持主题组件懒加载
 */
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultTag from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultTag,
  'spring-festival': defineAsyncComponent(() => import("./themes/SpringFestivalTag.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/HalloweenTag.vue")),
  'mid-autumn': defineAsyncComponent(() => import("./themes/MidAutumnTag.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/ChristmasTag.vue")),
  'new-year': defineAsyncComponent(() => import("./themes/NewYearTag.vue")),
  'future-tech': defineAsyncComponent(() => import("./themes/FutureTechTag.vue")),
  'pixel-art': DefaultTag, // 像素艺术主题使用默认标签组件
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
