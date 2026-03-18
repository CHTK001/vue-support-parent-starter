<script setup lang="ts">
/**
 * lay-header 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.0 - 支持节日主题装饰
 */
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHeader from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，节日主题懒加载
const themeComponents = {
  'default': DefaultHeader,
  'spring-festival': defineAsyncComponent(() => import("./themes/SpringFestivalHeader.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/HalloweenHeader.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/ChristmasHeader.vue")),
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHeader);
</script>

<template>
  <component :is="CurrentComponent" />
</template>

<script lang="ts">
import '@repo/skin';
</script>
