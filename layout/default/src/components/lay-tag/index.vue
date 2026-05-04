<script setup lang="ts">
/**
 * lay-tag 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.0
 */
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultTag from "./themes/Default.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultTag,
  "future-tech": DefaultTag,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultTag);
</script>

<template>
  <!-- 标签栏主题切换也不再用 key 强制重建，交给动态组件自身处理 -->
  <component :is="CurrentComponent" />
</template>
