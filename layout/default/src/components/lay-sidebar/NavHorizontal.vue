<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHorizontal from "./themes/horizontal/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultHorizontal,
  'spring-festival': defineAsyncComponent(() => import("./themes/horizontal/SpringFestival.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/horizontal/Halloween.vue")),
  'mid-autumn': defineAsyncComponent(() => import("./themes/horizontal/MidAutumn.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/horizontal/Christmas.vue")),
  'new-year': defineAsyncComponent(() => import("./themes/horizontal/NewYear.vue")),
  'future-tech': defineAsyncComponent(() => import("./themes/horizontal/FutureTech.vue")),
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHorizontal);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
