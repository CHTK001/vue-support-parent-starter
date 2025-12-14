<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <div class="spring-festival-wrapper">
    <BaseNavbar theme-class="spring-festival-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-wrapper {
  width: 100%;
  
  :deep(.spring-festival-navbar) {
    background: linear-gradient(180deg, #DC143C, #B22222) !important;
    border-bottom: 2px solid rgba(255, 215, 0, 0.3) !important;
  }
}
</style>
