<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultSidebar from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultSidebar,
  'spring-festival': defineAsyncComponent(() => import("./themes/SpringFestival.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/Halloween.vue")),
  'mid-autumn': defineAsyncComponent(() => import("./themes/MidAutumn.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/Christmas.vue")),
  'new-year': defineAsyncComponent(() => import("./themes/NewYear.vue")),
  'future-tech': defineAsyncComponent(() => import("./themes/FutureTech.vue")),
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultSidebar);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>

<style lang="scss" scoped>
// 样式已移至 BaseSidebar.vue 和全局 skin 包
// 此处仅保留基础结构样式，主题相关样式由全局控制
</style>
