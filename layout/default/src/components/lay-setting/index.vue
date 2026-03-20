<script setup lang="ts">
/**
 * lay-setting 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.0 - 支持主题组件懒加载
 */
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultSetting from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他存在的主题懒加载
const themeComponents = {
  default: DefaultSetting,
  "8bit": defineAsyncComponent(() => import("./themes/EightBit.vue")),
  "spring-festival": defineAsyncComponent(() => import("./themes/SpringFestival.vue")),
  halloween: defineAsyncComponent(() => import("./themes/Halloween.vue")),
  christmas: defineAsyncComponent(() => import("./themes/Christmas.vue")),
  "future-tech": defineAsyncComponent(() => import("./themes/FutureTech.vue")),
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(
  themeComponents,
  DefaultSetting,
);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
