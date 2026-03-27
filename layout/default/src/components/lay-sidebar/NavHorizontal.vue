<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHorizontal from "./themes/horizontal/Default.vue";
import EightBitHorizontal from "./themes/horizontal/EightBit.vue";
import FutureTechHorizontal from "./themes/horizontal/FutureTech.vue";
import SpringFestivalHorizontal from "./themes/horizontal/SpringFestival.vue";
import HalloweenHorizontal from "./themes/horizontal/Halloween.vue";
import ChristmasHorizontal from "./themes/horizontal/Christmas.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultHorizontal,
  "8bit": EightBitHorizontal,
  "future-tech": FutureTechHorizontal,
  "spring-festival": SpringFestivalHorizontal,
  halloween: HalloweenHorizontal,
  christmas: ChristmasHorizontal,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultHorizontal);
</script>

<template>
  <!-- 去掉 key，减少不必要的组件重建 -->
  <component :is="CurrentComponent" />
</template>
