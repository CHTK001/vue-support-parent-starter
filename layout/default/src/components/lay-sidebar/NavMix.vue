<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultMix from "./themes/mix/Default.vue";
import SpringFestivalMix from "./themes/mix/SpringFestival.vue";
import CyberpunkMix from "./themes/mix/Cyberpunk.vue";
import MidAutumnMix from "./themes/mix/MidAutumn.vue";
import ChristmasMix from "./themes/mix/Christmas.vue";
import NewYearMix from "./themes/mix/NewYear.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultMix,
  'spring-festival': SpringFestivalMix,
  'cyberpunk': CyberpunkMix,
  'mid-autumn': MidAutumnMix,
  'christmas': ChristmasMix,
  'new-year': NewYearMix,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultMix);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
