<script setup lang="ts">
import BaseCustomMix from './BaseCustomMix.vue';
</script>

<template>
  <div class="mid-autumn-mix-wrapper">
    <BaseCustomMix 
      theme-class="mid-autumn-mix" 
      menu-item-class="mid-autumn-mix-item"
    />
  </div>
</template>

<style lang="scss" scoped>
// 中秋主题颜色变量
$mid-blue: #1a237e;
$mid-blue-light: #283593;
$mid-gold: #ffd54f;
$mid-gold-light: #ffecb3;

.mid-autumn-mix-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  
  :deep(.mid-autumn-mix) {
    background: linear-gradient(180deg, $mid-blue, $mid-blue-light) !important;
    border-bottom: 2px solid rgba($mid-gold, 0.3) !important;
    
    .custom-menu-item {
      color: rgba(255, 255, 255, 0.9);
      border-radius: 6px;
      margin: 0 4px;
      padding: 0 16px;
      height: 40px;
      transition: all 0.3s ease;
      
      .menu-icon {
        color: $mid-gold-light;
      }
      
      &:hover {
        background: rgba($mid-gold, 0.15);
        color: $mid-gold;
        
        .menu-icon {
          color: $mid-gold;
        }
      }
      
      &.is-active {
        background: rgba($mid-gold, 0.2);
        color: $mid-gold;
        border-bottom: 2px solid $mid-gold;
        
        .menu-icon {
          color: $mid-gold;
        }
      }
    }
    
    .custom-sub-menu.more-menu {
      .custom-sub-menu-title {
        color: rgba(255, 255, 255, 0.9);
      }
    }
    
    .horizontal-header-right {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>
