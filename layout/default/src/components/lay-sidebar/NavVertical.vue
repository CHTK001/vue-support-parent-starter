<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultSidebar from "./themes/Default.vue";
import SpringFestivalSidebar from "./themes/SpringFestival.vue";
import CyberpunkSidebar from "./themes/Cyberpunk.vue";
import MidAutumnSidebar from "./themes/MidAutumn.vue";
import ChristmasSidebar from "./themes/Christmas.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultSidebar,
  'spring-festival': SpringFestivalSidebar,
  'cyberpunk': CyberpunkSidebar,
  'mid-autumn': MidAutumnSidebar,
  'christmas': ChristmasSidebar,
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
