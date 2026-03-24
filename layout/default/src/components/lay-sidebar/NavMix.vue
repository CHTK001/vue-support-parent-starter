<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultMix from "./themes/mix/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultMix,
  'future-tech': defineAsyncComponent(() => import("./themes/mix/FutureTech.vue")),
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultMix);
</script>

<template>
  <!-- 去掉 key，避免 mix 导航在仅主题皮肤变化时整体刷新 -->
  <component :is="CurrentComponent" />
</template>
