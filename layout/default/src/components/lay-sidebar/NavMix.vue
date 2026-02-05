<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultMix from "./themes/mix/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultMix,
  'spring-festival': defineAsyncComponent(() => import("./themes/mix/SpringFestival.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/mix/Halloween.vue")),
  'cyberpunk': defineAsyncComponent(() => import("./themes/mix/Cyberpunk.vue")),
  'mid-autumn': defineAsyncComponent(() => import("./themes/mix/MidAutumn.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/mix/Christmas.vue")),
  'new-year': defineAsyncComponent(() => import("./themes/mix/NewYear.vue")),
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultMix);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
