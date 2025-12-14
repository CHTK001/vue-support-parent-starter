<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <BaseNavbar theme-class="default-navbar" />
</template>

<style lang="scss" scoped>
:deep(.default-navbar) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  
  .dark & {
    background: rgba(18, 18, 23, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}
</style>
