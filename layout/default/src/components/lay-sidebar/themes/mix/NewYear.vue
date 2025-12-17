<script setup lang="ts">
import BaseCustomMix from './BaseCustomMix.vue';
</script>

<template>
  <div class="new-year-mix-wrapper">
    <BaseCustomMix 
      theme-class="new-year-mix" 
      menu-item-class="new-year-mix-item"
    />
  </div>
</template>

<style lang="scss" scoped>
// 元旦主题颜色变量
$ice-lightest: #F5FBFF;
$ice-lighter: #E8F4FC;
$ice-light: #B8E0F2;
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$ice-darker: #1E5F8C;
$frost-purple: #E0E7F5;
$frost-white: #FFFFFF;

.new-year-mix-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  
  :deep(.new-year-mix) {
    background: linear-gradient(180deg, rgba($ice-lightest, 0.98) 0%, rgba($frost-purple, 0.95) 100%) !important;
    border-bottom: 1px solid rgba($ice-medium, 0.25) !important;
    box-shadow: 0 2px 15px rgba($ice-deep, 0.1) !important;
    position: relative;
    backdrop-filter: blur(12px);
    
    // 顶部冰晶装饰线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        $ice-medium 20%,
        $ice-primary 50%,
        $ice-medium 80%,
        transparent 100%
      );
      z-index: 10;
    }
    
    .horizontal-header-right {
      color: $ice-darker;
      
      .el-icon, svg {
        color: $ice-primary !important;
        
        &:hover {
          color: $ice-deep !important;
        }
      }
    }
    
    // 自定义菜单项样式
    .custom-menu-item {
      color: $ice-darker;
      background: transparent;
      border-radius: 8px;
      margin: 0 4px;
      padding: 0 16px;
      height: 40px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      
      // 底部指示线
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, $ice-primary, $ice-medium);
        transform: translateX(-50%);
        transition: width 0.3s ease;
        border-radius: 1px;
      }
      
      .menu-icon {
        color: $ice-primary;
      }
      
      .menu-title {
        font-weight: 500;
      }
      
      &:hover {
        background: rgba($ice-medium, 0.15);
        color: $ice-deep;
        
        &::after {
          width: 80%;
        }
        
        .menu-icon {
          color: $ice-deep;
        }
      }
      
      &.is-active {
        background: linear-gradient(135deg, $ice-primary, $ice-medium);
        color: $frost-white;
        box-shadow: 0 3px 12px rgba($ice-primary, 0.35);
        
        &::after {
          width: 100%;
          background: rgba($frost-white, 0.6);
          box-shadow: 0 0 8px rgba($frost-white, 0.4);
        }
        
        .menu-icon, .menu-title {
          color: $frost-white;
        }
      }
    }
  }
}
</style>
