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
  // 春节主题复用现有的新年标签组件
  'spring-festival': defineAsyncComponent(() => import("./themes/NewYearTag.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/HalloweenTag.vue")),
  'mid-autumn': defineAsyncComponent(() => import("./themes/MidAutumnTag.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/ChristmasTag.vue")),
  'new-year': defineAsyncComponent(() => import("./themes/NewYearTag.vue")),
  // future-tech 主题暂时复用默认标签组件，避免因未实现主题导致标签区域不显示
  'future-tech': DefaultTag,
  '8bit': DefaultTag, // 8-bit 主题使用默认标签组件
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <!-- 标签栏主题切换也不再用 key 强制重建，交给动态组件自身处理 -->
  <component :is="CurrentComponent" />
</template>
