<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHover from "./themes/hover/Default.vue";
import EightBitHover from "./themes/hover/EightBit.vue";
import SpringFestivalHover from "./themes/hover/SpringFestival.vue";
import HalloweenHover from "./themes/hover/Halloween.vue";
import ChristmasHover from "./themes/hover/Christmas.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultHover,
  "8bit": EightBitHover,
  "future-tech": DefaultHover,
  "spring-festival": SpringFestivalHover,
  halloween: HalloweenHover,
  christmas: ChristmasHover,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultHover);
</script>

<template>
  <!-- 去掉 key，避免切换仅样式皮肤时悬浮导航被整体重建 -->
  <component :is="CurrentComponent" />
</template>
