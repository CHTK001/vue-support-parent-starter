<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHover from "./themes/hover/Default.vue";
import EightBitHover from "./themes/hover/EightBit.vue";
import SpringFestivalHover from "./themes/hover/SpringFestival.vue";
import HalloweenHover from "./themes/hover/Halloween.vue";
import ChristmasHover from "./themes/hover/Christmas.vue";

// 主题组件映射 - 默认主题静态导入，其他存在的主题懒加载
const themeComponents = {
  default: DefaultHover,
<<<<<<< HEAD
  "8bit": EightBitHover,
  "spring-festival": SpringFestivalHover,
  halloween: HalloweenHover,
  christmas: ChristmasHover,
  "future-tech": defineAsyncComponent(() => import("./themes/hover/FutureTech.vue")),
=======
  // 仅保留实际存在的未来科技主题，其余已删除的节日主题不再懒加载
  "future-tech": defineAsyncComponent(
    () => import("./themes/hover/FutureTech.vue"),
  ),
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
};

const { CurrentComponent, currentTheme } = useThemeComponent(
  themeComponents,
  DefaultHover,
);
</script>

<template>
  <!-- 去掉 key，避免切换仅样式皮肤时悬浮导航被整体重建 -->
  <component :is="CurrentComponent" />
</template>
