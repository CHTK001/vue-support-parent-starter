<script setup lang="ts">
import BaseCustomHorizontal from './BaseCustomHorizontal.vue';
import HalloweenCustomSidebarItem from '../../components/custom-menu/themes/HalloweenCustomSidebarItem.vue';

// 引入万圣节主题弹出层样式
import '../../components/custom-menu/themes/halloween.scss';
</script>

<template>
  <div class="halloween-horizontal-wrapper">
    <BaseCustomHorizontal 
      theme-class="halloween-horizontal" 
      popper-class="halloween-custom-popper"
      :sidebar-item-component="HalloweenCustomSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
// 万圣节主题颜色变量
$hw-pumpkin: #ff7518;
$hw-purple: #2c003e;
$hw-bg: #1a0026;
$hw-green: #76ff03;
$hw-border: #4a0e68;

.halloween-horizontal-wrapper {
  width: 100%;
  position: relative;
  
  :deep(.halloween-horizontal) {
    background: linear-gradient(180deg, $hw-purple, $hw-bg) !important;
    border-bottom: 2px solid $hw-pumpkin !important;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.8) !important;
    position: relative;
    
    // 顶部南瓜色装饰线
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
        $hw-pumpkin 20%,
        $hw-green 50%,
        $hw-pumpkin 80%,
        transparent 100%
      );
      z-index: 10;
    }
    
    .horizontal-header-left {
      span {
        color: $hw-pumpkin !important;
        text-shadow: 
          0 1px 2px rgba(0, 0, 0, 0.8),
          0 0 5px rgba(255, 117, 24, 0.3);
        font-weight: 600;
        font-family: 'Creepster', 'cursive', sans-serif;
      }
      
      img {
        filter: drop-shadow(0 0 5px $hw-green);
      }
    }
    
    // 横向菜单样式
    .horizontal-header-menu {
      background: transparent !important;
      border-bottom: none !important;
      
      &.el-menu {
        background: transparent !important;
        --el-menu-bg-color: transparent !important;
      }
      
      .el-menu-item,
      .el-sub-menu__title {
        color: $hw-pumpkin !important;
        background: transparent !important;
        border-radius: 4px;
        margin: 0 4px;
        border-bottom: none !important;
        transition: all 0.3s ease;
        position: relative;
        
        // 底部指示线
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: $hw-green;
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }
        
        &:hover {
          background: rgba(255, 117, 24, 0.15) !important;
          color: $hw-green !important;
          
          &::after {
            width: 80%;
          }
          
          .el-icon, svg {
             color: $hw-green !important;
          }
        }
        
        &.is-active {
          background: rgba(255, 117, 24, 0.2) !important;
          color: $hw-green !important;
          
          &::after {
            width: 100%;
            box-shadow: 0 0 8px $hw-green;
          }
          
          .el-icon, svg {
             color: $hw-green !important;
          }
        }
        
        .el-icon, svg {
          color: $hw-pumpkin !important;
        }
        
        span {
          color: inherit !important;
        }
      }
      
      // 子菜单样式
      .el-sub-menu {
        .el-sub-menu__title {
          color: $hw-pumpkin !important;
          background: transparent !important;
          
          .el-sub-menu__icon-arrow {
            color: inherit !important;
          }
        }
        
        &.is-active > .el-sub-menu__title {
          color: $hw-green !important;
          background: rgba(255, 117, 24, 0.2) !important;
        }
      }
    }
    
    .horizontal-header-right {
      color: $hw-pumpkin;
      
      .el-icon, svg {
        color: $hw-pumpkin !important;
        transition: all 0.3s ease;
        
        &:hover {
          color: $hw-green !important;
        }
      }
    }
  }
}
</style>
