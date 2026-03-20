<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultMix from "./themes/mix/Default.vue";
import EightBitMix from "./themes/mix/EightBit.vue";
import SpringFestivalMix from "./themes/mix/SpringFestival.vue";
import HalloweenMix from "./themes/mix/Halloween.vue";
import ChristmasMix from "./themes/mix/Christmas.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
<<<<<<< HEAD
  'default': DefaultMix,
  '8bit': EightBitMix,
  'spring-festival': SpringFestivalMix,
  'halloween': HalloweenMix,
  'christmas': ChristmasMix,
  'future-tech': defineAsyncComponent(() => import("./themes/mix/FutureTech.vue")),
=======
  default: DefaultMix,
  "future-tech": defineAsyncComponent(
    () => import("./themes/mix/FutureTech.vue"),
  ),
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
};

const { CurrentComponent, currentTheme } = useThemeComponent(
  themeComponents,
  DefaultMix,
);
</script>

<template>
  <!-- 去掉 key，避免 mix 导航在仅主题皮肤变化时整体刷新 -->
  <component :is="CurrentComponent" />
</template>
