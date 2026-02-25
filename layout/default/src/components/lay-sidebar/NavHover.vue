<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHover from "./themes/hover/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他存在的主题懒加载
const themeComponents = {
  default: DefaultHover,
  // 仅保留实际存在的未来科技主题，其余已删除的节日主题不再懒加载
  "future-tech": defineAsyncComponent(() => import("./themes/hover/FutureTech.vue")),
  
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHover);
</script>

<template>
  <!-- 去掉 key，避免切换仅样式皮肤时悬浮导航被整体重建 -->
  <component :is="CurrentComponent" />
</template>
