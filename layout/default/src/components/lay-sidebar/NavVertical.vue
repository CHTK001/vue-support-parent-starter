<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultSidebar from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他存在的主题懒加载
const themeComponents = {
  default: DefaultSidebar,
  // 仅保留实际存在的未来科技主题，其余已删除的节日主题不再懒加载
  "future-tech": defineAsyncComponent(() => import("./themes/FutureTech.vue")),
 
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultSidebar);
</script>

<template>
  <!-- 不再使用 currentTheme 作为 key，避免仅皮肤变化时导航整体重新挂载 -->
  <component :is="CurrentComponent" />
</template>

<style lang="scss" scoped>
// 样式已移至 BaseSidebar.vue 和全局 skin 包
// 此处仅保留基础结构样式，主题相关样式由全局控制
</style>
