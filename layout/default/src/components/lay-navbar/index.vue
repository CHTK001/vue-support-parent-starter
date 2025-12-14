<script setup lang="ts">
import { watch } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultNavbar from "./themes/Default.vue";
import SpringFestivalNavbar from "./themes/SpringFestival.vue";
import CyberpunkNavbar from "./themes/Cyberpunk.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultNavbar,
  'spring-festival': SpringFestivalNavbar,
  'cyberpunk': CyberpunkNavbar,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultNavbar);

// 调试：监听主题变化
watch(currentTheme, (newTheme) => {
  console.log('🎨 lay-navbar - 主题切换到:', newTheme);
}, { immediate: true });
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
