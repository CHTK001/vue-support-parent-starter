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
@use "sass:color";

$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-red: #c62828;
$xmas-red-light: #e53935;
$xmas-gold: #ffd700;
$xmas-white: #ffffff;

.christmas-mix-wrapper {
  width: 100%;
  
:deep(.christmas-mix) {
    background: linear-gradient(180deg, $xmas-green 0%, color.adjust($xmas-green, $lightness: -5%) 100%) !important;
    
    .custom-menu-item,
    .custom-sub-menu__title {
      color: var(--hover-nav-menu-color);
      border-radius: 6px;
      margin: 0 4px;
      padding: 0 16px;
      height: 40px;
      transition: all 0.3s ease;
      
      .menu-icon {
        color: var(--hover-nav-menu-color);
      }
      
      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7));
        color: #fff;
        
        .menu-icon {
          color: #fff;
        }
      }
      
      &.is-active {
        background: linear-gradient(135deg, #c62828, #e53935) !important; 
        border: 2px solid #ffd700 !important; 
        box-shadow: 0 4px 16px rgba(198, 40, 40, 0.5) !important;
        color: #fff !important;
        
        .menu-icon {
          color: #fff !important;
        }
      }
    }
  }
}
</style>
