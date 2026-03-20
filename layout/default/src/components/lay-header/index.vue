<<<<<<< HEAD
=======
<template>
  <div class="header-container" :class="{ 'fixed-header': set.fixedHeader }">
    <LayNav />

    <!-- 标签页：在非移动模式下显示，且未隐藏标签页 -->
    <div v-if="layout !== 'mobile' && !set.hideTabs" class="header-tags">
      <LayTag v-if="defer(2)" />
    </div>
  </div>
</template>
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
<script setup lang="ts">
/**
 * lay-header 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.0 - 支持节日主题装饰
 */
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultHeader from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，节日主题懒加载
const themeComponents = {
  'default': DefaultHeader,
  '8bit': DefaultHeader,
  'spring-festival': defineAsyncComponent(() => import("./themes/SpringFestivalHeader.vue")),
  'halloween': defineAsyncComponent(() => import("./themes/HalloweenHeader.vue")),
  'christmas': defineAsyncComponent(() => import("./themes/ChristmasHeader.vue")),
  'future-tech': defineAsyncComponent(() => import("./themes/FutureTechHeader.vue")),
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultHeader);
</script>

<template>
  <component :is="CurrentComponent" />
</template>

<script lang="ts">
<<<<<<< HEAD
import '@repo/skin';
</script>
=======
// 导入集中的主题皮肤样式
import "@layout/default/src/skin/index.scss";
</script>

<style lang="scss" scoped>
// 基础容器样式
.header-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: var(--el-bg-color);
}

// 头部容器样式优化
.header-only-tags {
  position: relative;
  min-height: 48px;
  background: transparent;
}
</style>
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
