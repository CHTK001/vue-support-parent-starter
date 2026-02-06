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
        background: rgba($spring-gold, 0.15);
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
    
    .horizontal-header-right {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>
