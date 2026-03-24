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
  // 仅保留实际存在的未来科技主题，其余已删除的节日主题不再注册
  "future-tech": defineAsyncComponent(() => import("./themes/FutureTech.vue")),
  // 其他旧主题统一使用默认设置组件
  "spring-festival": DefaultSetting,
  halloween: DefaultSetting,
  "mid-autumn": DefaultSetting,
  christmas: DefaultSetting,
  "new-year": DefaultSetting,
  "8bit": DefaultSetting,
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultSetting);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>
