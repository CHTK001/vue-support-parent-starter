<script setup lang="ts">
import BaseCustomHorizontal from './BaseCustomHorizontal.vue';
import ChristmasCustomSidebarItem from '../../components/custom-menu/themes/ChristmasCustomSidebarItem.vue';

// 引入圣诞主题弹出层样式
import '../../components/custom-menu/themes/christmas.scss';
</script>

<template>
  <div class="christmas-horizontal-wrapper">
    <BaseCustomHorizontal 
      theme-class="christmas-horizontal" 
      popper-class="christmas-custom-popper"
      :sidebar-item-component="ChristmasCustomSidebarItem" 
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
$xmas-border: rgba(255, 215, 0, 0.4);

.christmas-horizontal-wrapper {
  width: 100%;
  
  :deep(.christmas-horizontal) {
    background: linear-gradient(180deg, $xmas-green 0%, color.adjust($xmas-green, $lightness: -5%) 100%) !important;
    border-bottom: 2px solid $xmas-border !important;
    
    .horizontal-header-menu {
      background: transparent !important;
      
      .custom-menu-item,
      .custom-sub-menu__title {
        color: $xmas-white !important;
        
        &:hover {
          background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
          color: $xmas-white !important;
        }
        
        .menu-icon, svg {
          color: $xmas-gold !important;
        }
      }
      
      .custom-menu-item.is-active {
        background: rgba(255, 215, 0, 0.15) !important;
        color: $xmas-gold !important;
        border-bottom: 3px solid $xmas-gold !important;
        
        .menu-icon, svg {
          color: $xmas-gold !important;
        }
      }
    }
  }
}
</style>
