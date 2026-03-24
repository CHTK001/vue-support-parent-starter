<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <div class="future-tech-wrapper">
    <BaseNavbar theme-class="future-tech-navbar" />
  </div>
</template>

<style lang="scss" scoped>
$ft-cyan: #00ffff;
$ft-cyan-light: #4dfdfd;
$ft-bg-dark: #050a1f;
$ft-bg-darker: #0a1a3a;
$ft-border: rgba(0, 255, 255, 0.4);

.future-tech-wrapper {
  width: 100%;
  position: relative;
  overflow: hidden;

  :deep(.future-tech-navbar) {
    background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
    border-bottom: 1px solid $ft-border !important;
    box-shadow: 0 2px 20px rgba(0, 255, 255, 0.15) !important;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 10;
    
    .el-button, .el-dropdown, .breadcrumb-item {
      color: rgba(0, 255, 255, 0.8) !important;
    }
    
    .search-wrapper {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 255, 255, 0.3);
      color: $ft-cyan;
      
      &::placeholder {
        color: rgba(0, 255, 255, 0.5);
      }
    }
  }
}
</style>

