<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <BaseNavbar theme-class="spring-festival-navbar" />
</template>

<style lang="scss" scoped>
:deep(.spring-festival-navbar) {
  background: linear-gradient(180deg, #DC143C, #B22222) !important;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3) !important;
}
</style>
