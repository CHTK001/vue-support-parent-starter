<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <div class="default-wrapper">
    <BaseNavbar theme-class="default-navbar lay-navbar" />
  </div>
</template>

<style lang="scss" scoped>
// 使用 CSS 变量管理主题样式，保留 :deep() 但通过变量提升可维护性
.default-wrapper {
  // Use semantic tokens from the new theme system
  // The value of these variables is controlled by the global ThemeManager
  --default-navbar-bg: var(--stitch-lay-bg-overlay, rgba(255, 255, 255, 0.8));
  --default-navbar-border: var(--stitch-lay-border, rgba(0, 0, 0, 0.05));
  --default-navbar-backdrop: blur(12px);
  
  width: 100%;
  
  :deep(.default-navbar) {
    background: var(--default-navbar-bg);
    color: var(--stitch-lay-text-main);
    backdrop-filter: var(--default-navbar-backdrop);
    -webkit-backdrop-filter: var(--default-navbar-backdrop);
    border-bottom: 1px solid var(--default-navbar-border);
    transition: var(--stitch-lay-transition, all 0.3s ease);
  }
}
</style>
