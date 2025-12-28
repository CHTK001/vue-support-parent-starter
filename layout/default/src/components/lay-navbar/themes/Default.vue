<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <div class="default-wrapper">
    <BaseNavbar theme-class="default-navbar" />
  </div>
</template>

<style lang="scss" scoped>
// 使用 CSS 变量管理主题样式，保留 :deep() 但通过变量提升可维护性
.default-wrapper {
  --default-navbar-bg: rgba(255, 255, 255, 0.95);
  --default-navbar-border: rgba(0, 0, 0, 0.06);
  --default-navbar-backdrop: blur(20px);
  
  width: 100%;
  
  :deep(.default-navbar) {
    background: var(--default-navbar-bg);
    backdrop-filter: var(--default-navbar-backdrop);
    border-bottom: 1px solid var(--default-navbar-border);
  }
}

// 深色模式覆盖变量
:global(.dark) .default-wrapper {
  --default-navbar-bg: rgba(18, 18, 23, 0.95);
  --default-navbar-border: rgba(255, 255, 255, 0.08);
}
</style>
