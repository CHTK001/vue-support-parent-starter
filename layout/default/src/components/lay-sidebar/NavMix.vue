<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultMix from "./themes/mix/Default.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultMix,
  "future-tech": DefaultMix,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultMix);
</script>

<template>
  <!-- 去掉 key，避免 mix 导航在仅主题皮肤变化时整体刷新 -->
  <component :is="CurrentComponent" />
</template>
