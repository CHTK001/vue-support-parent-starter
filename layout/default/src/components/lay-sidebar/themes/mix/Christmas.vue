<script setup lang="ts">
import BaseMix from './BaseMix.vue';
</script>

<template>
  <div class="christmas-mix-wrapper">
    <BaseMix theme-class="christmas-mix" />
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
    
    .el-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: $xmas-white !important;
        
        &:hover {
          background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
        }
        
        .el-icon, svg {
          color: $xmas-gold !important;
        }
      }
      
      .el-menu-item.is-active {
        background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
        color: $xmas-white !important;
        
        .el-icon, svg {
          color: $xmas-white !important;
        }
      }
    }
  }
}
</style>
