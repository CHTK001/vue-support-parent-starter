<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHorizontal from "./themes/horizontal/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultHorizontal,
 
  'future-tech': defineAsyncComponent(() => import("./themes/horizontal/FutureTech.vue")),
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHorizontal);
</script>

<template>
  <!-- 去掉 key，减少不必要的组件重建 -->
  <component :is="CurrentComponent" />
</template>
