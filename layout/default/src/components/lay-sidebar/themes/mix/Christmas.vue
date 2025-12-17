<script setup lang="ts">
import BaseCustomMix from './BaseCustomMix.vue';
</script>

<template>
  <div class="christmas-mix-wrapper">
    <BaseCustomMix 
      theme-class="christmas-mix" 
      menu-item-class="christmas-mix-item"
    />
  </div>
</template>

<style lang="scss" scoped>
$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-red: #c62828;
$xmas-red-light: #e53935;
$xmas-gold: #ffd700;
$xmas-white: #ffffff;

.christmas-mix-wrapper {
  width: 100%;
  
  :deep(.christmas-mix) {
    background: linear-gradient(180deg, $xmas-green 0%, darken($xmas-green, 5%) 100%) !important;
    
    .custom-menu-item {
      color: $xmas-white;
      border-radius: 6px;
      margin: 0 4px;
      padding: 0 16px;
      height: 40px;
      transition: all 0.3s ease;
      
      .menu-icon {
        color: $xmas-gold;
      }
      
      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7));
        
        .menu-icon {
          color: $xmas-white;
        }
      }
      
      &.is-active {
        background: linear-gradient(135deg, $xmas-red, $xmas-red-light);
        color: $xmas-white;
        
        .menu-icon {
          color: $xmas-white;
        }
      }
    }
    
    .custom-sub-menu.more-menu {
      .custom-sub-menu-title {
        color: $xmas-white;
      }
    }
  }
}
</style>
