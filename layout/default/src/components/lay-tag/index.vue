<script setup lang="ts">
/**
 * lay-tag 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.0
 */
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultTag from "./themes/Default.vue";
import NewYearTag from "./themes/NewYearTag.vue";
import HalloweenTag from "./themes/HalloweenTag.vue";
import ChristmasTag from "./themes/ChristmasTag.vue";
import FutureTechTag from "./themes/FutureTechTag.vue";
import MidAutumnTag from "./themes/MidAutumnTag.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultTag,
  "8bit": DefaultTag,
  "future-tech": FutureTechTag,
  "spring-festival": NewYearTag,
  halloween: HalloweenTag,
  christmas: ChristmasTag,
  "mid-autumn": MidAutumnTag,
  "new-year": NewYearTag,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <!-- 标签栏主题切换也不再用 key 强制重建，交给动态组件自身处理 -->
  <component :is="CurrentComponent" />
</template>
