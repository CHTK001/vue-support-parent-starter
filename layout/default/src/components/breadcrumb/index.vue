<script setup lang="ts">
/**
 * breadcrumb 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.0.0 - 重构版本
 */
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultBreadcrumb from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，仅对真实存在的主题组件做懒加载
const themeComponents = {
  default: DefaultBreadcrumb,
  // 未来科技与 8bit 主题有独立组件，按需懒加载
  "future-tech": defineAsyncComponent(() => import("./themes/FutureTech.vue")),
  "8bit": defineAsyncComponent(() => import("./themes/EightBit.vue")),
  // 其余节日主题暂未提供独立组件，统一复用默认组件，样式由全局 data-skin 控制
  "spring-festival": DefaultBreadcrumb,
  halloween: DefaultBreadcrumb,
  "mid-autumn": DefaultBreadcrumb,
  christmas: DefaultBreadcrumb,
  "new-year": DefaultBreadcrumb,
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultBreadcrumb);
</script>

<template>
  <!-- 去掉多余的 key，避免在仅样式变更时强制重建组件 -->
  <component :is="CurrentComponent" />
</template>
