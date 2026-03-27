<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultMix from "./themes/mix/Default.vue";
import EightBitMix from "./themes/mix/EightBit.vue";
import FutureTechMix from "./themes/mix/FutureTech.vue";
import SpringFestivalMix from "./themes/mix/SpringFestival.vue";
import HalloweenMix from "./themes/mix/Halloween.vue";
import ChristmasMix from "./themes/mix/Christmas.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultMix,
  "8bit": EightBitMix,
  "future-tech": FutureTechMix,
  "spring-festival": SpringFestivalMix,
  halloween: HalloweenMix,
  christmas: ChristmasMix,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultMix);
</script>

<template>
  <!-- 去掉 key，避免 mix 导航在仅主题皮肤变化时整体刷新 -->
  <component :is="CurrentComponent" />
</template>
