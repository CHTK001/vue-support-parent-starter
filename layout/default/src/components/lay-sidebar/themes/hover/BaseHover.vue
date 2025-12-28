<script setup lang="ts">
/**
 * Hover 导航基础组件
 * @description 提供主题类名注入能力
 */
import HoverNavigation from '../../components/HoverNavigation.vue';

defineProps<{
  /** 主题类名 */
  themeClass?: string;
}>();
</script>

<template>
  <div :class="['hover-nav-theme-wrapper', themeClass]">
    <HoverNavigation />
  </div>
</template>

<style lang="scss" scoped>
.hover-nav-theme-wrapper {
  height: 100%;
  width: auto;
}
</style>
