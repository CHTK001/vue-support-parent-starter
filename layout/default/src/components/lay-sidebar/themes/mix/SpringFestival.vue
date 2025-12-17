<script setup lang="ts">
import BaseCustomMix from './BaseCustomMix.vue';
</script>

<template>
  <div class="spring-festival-mix-wrapper">
    <BaseCustomMix 
      theme-class="spring-festival-mix" 
      menu-item-class="spring-festival-mix-item"
    />
  </div>
</template>

<style lang="scss" scoped>
// 春节主题颜色变量
$spring-red: #DC143C;
$spring-red-dark: #B22222;
$spring-gold: #FFD700;

.spring-festival-mix-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  
  :deep(.spring-festival-mix) {
    background: linear-gradient(180deg, $spring-red, $spring-red-dark) !important;
    border-bottom: 2px solid rgba($spring-gold, 0.3) !important;
    
    .custom-menu-item {
      color: rgba(255, 255, 255, 0.9);
      border-radius: 6px;
      margin: 0 4px;
      padding: 0 16px;
      height: 40px;
      transition: all 0.3s ease;
      
      .menu-icon {
        color: $spring-gold;
      }
      
      &:hover {
        background: rgba($spring-gold, 0.15);
        color: $spring-gold;
        
        .menu-icon {
          color: $spring-gold;
        }
      }
      
      &.is-active {
        background: rgba($spring-gold, 0.2);
        color: $spring-gold;
        border-bottom: 2px solid $spring-gold;
        
        .menu-icon {
          color: $spring-gold;
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
