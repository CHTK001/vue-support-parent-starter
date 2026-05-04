<script setup lang="ts">
/**
 * breadcrumb 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.0.0 - 重构版本
 */
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultBreadcrumb from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入
const themeComponents = {
  default: DefaultBreadcrumb,
  "future-tech": DefaultBreadcrumb,
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(
  themeComponents,
  DefaultBreadcrumb,
);
</script>

<template>
  <!-- 去掉多余的 key，避免在仅样式变更时强制重建组件 -->
  <component :is="CurrentComponent" />
</template>
