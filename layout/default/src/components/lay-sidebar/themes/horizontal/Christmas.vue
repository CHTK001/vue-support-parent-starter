<script setup lang="ts">
import BaseHorizontal from './BaseHorizontal.vue';
</script>

<template>
  <div class="christmas-horizontal-wrapper">
    <BaseHorizontal theme-class="christmas-horizontal" />
  </div>
</template>

<style lang="scss" scoped>
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
    background: linear-gradient(180deg, $xmas-green 0%, darken($xmas-green, 5%) 100%) !important;
    border-bottom: 2px solid $xmas-border !important;
    
    .el-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: $xmas-white !important;
        
        &:hover {
          background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
          color: $xmas-white !important;
        }
        
        .el-icon, svg {
          color: $xmas-gold !important;
        }
      }
      
      .el-menu-item.is-active {
        background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
        color: $xmas-white !important;
        border-bottom: 3px solid $xmas-gold !important;
        
        .el-icon, svg {
          color: $xmas-white !important;
        }
      }
    }
  }
}
</style>

<style lang="scss">
html[data-skin="christmas"] {
  $xmas-green: #1b5e20;
  $xmas-red: #c62828;
  $xmas-red-light: #e53935;
  $xmas-gold: #ffd700;
  $xmas-white: #ffffff;

  .el-menu--popup {
    background: linear-gradient(180deg, $xmas-green, darken($xmas-green, 5%)) !important;
    border: 2px solid rgba($xmas-gold, 0.4) !important;
    
    .el-menu-item {
      color: $xmas-white !important;
      
      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
      }
      
      &.is-active {
        background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
        color: $xmas-white !important;
      }
      
      .el-icon, svg {
        color: $xmas-gold !important;
      }
    }
  }
}
</style>
