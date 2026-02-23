<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHover from "./themes/hover/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultHover,
  'spring-festival': defineAsyncComponent(() => import("./themes/hover/SpringFestival.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/hover/Halloween.vue")),
  'mid-autumn': defineAsyncComponent(() => import("./themes/hover/MidAutumn.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/hover/Christmas.vue")),
  'new-year': defineAsyncComponent(() => import("./themes/hover/NewYear.vue")),
  'future-tech': defineAsyncComponent(() => import("./themes/hover/FutureTech.vue")),
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHover);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
