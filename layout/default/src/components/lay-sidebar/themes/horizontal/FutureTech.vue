<script setup lang="ts">
import BaseCustomHorizontal from './BaseCustomHorizontal.vue';
</script>

<template>
  <div class="future-tech-horizontal-wrapper">
    <BaseCustomHorizontal 
      theme-class="future-tech-horizontal" 
    />
  </div>
</template>

<style lang="scss" scoped>
$ft-cyan: #00ffff;
$ft-cyan-light: #4dfdfd;
$ft-bg-dark: #050a1f;
$ft-bg-darker: #0a1a3a;
$ft-border: rgba(0, 255, 255, 0.4);

.future-tech-horizontal-wrapper {
  width: 100%;
  
  :deep(.future-tech-horizontal) {
    background: linear-gradient(180deg, $ft-bg-dark 0%, $ft-bg-darker 100%) !important;
    border-bottom: 2px solid $ft-border !important;
    
    .horizontal-header-menu {
      background: transparent !important;
      
      .custom-menu-item,
      .custom-sub-menu__title {
        color: rgba(0, 255, 255, 0.7) !important;
        
        &:hover {
          background: rgba(0, 255, 255, 0.15) !important;
          color: $ft-cyan !important;
        }
        
        .menu-icon, svg {
          color: $ft-cyan !important;
        }
      }
      
      .custom-menu-item.is-active {
        background: rgba(0, 255, 255, 0.2) !important;
        color: $ft-cyan !important;
        border-bottom: 3px solid $ft-cyan !important;
        
        .menu-icon, svg {
          color: $ft-cyan !important;
        }
      }
    }
  }
}
</style>

