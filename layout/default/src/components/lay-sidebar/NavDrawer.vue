<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultDrawer from "./themes/drawer/Default.vue";
import EightBitDrawer from "./themes/drawer/EightBit.vue";
import SpringFestivalDrawer from "./themes/drawer/SpringFestival.vue";
import HalloweenDrawer from "./themes/drawer/Halloween.vue";
import ChristmasDrawer from "./themes/drawer/Christmas.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultDrawer,
  "8bit": EightBitDrawer,
  "spring-festival": SpringFestivalDrawer,
  halloween: HalloweenDrawer,
  christmas: ChristmasDrawer,
  "future-tech": DefaultDrawer,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultDrawer);
</script>

<template>
  <component :is="CurrentComponent" />
</template>
