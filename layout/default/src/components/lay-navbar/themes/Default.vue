<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <div class="default-wrapper">
    <BaseNavbar theme-class="default-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.default-wrapper {
  width: 100%;
  
  :deep(.default-navbar) {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
}

.dark .default-wrapper {
  :deep(.default-navbar) {
    background: rgba(18, 18, 23, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}
</style>
