<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <div class="mid-autumn-wrapper">
    <BaseNavbar theme-class="mid-autumn-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.mid-autumn-wrapper {
  width: 100%;
  
  :deep(.mid-autumn-navbar) {
    background: linear-gradient(180deg, #1a237e, #283593) !important;
    border-bottom: 2px solid rgba(255, 213, 79, 0.3) !important;
  }
}
</style>
