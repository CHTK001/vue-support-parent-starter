<script setup lang="ts">
import BaseHorizontal from './BaseHorizontal.vue';
import MidAutumnSidebarItem from '../../components/themes/MidAutumnSidebarItem.vue';
</script>

<template>
  <div class="mid-autumn-horizontal-wrapper">
    <BaseHorizontal 
      theme-class="mid-autumn-horizontal" 
      :sidebar-item-component="MidAutumnSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
// 中秋主题颜色变量
$mid-blue: #1a237e;
$mid-blue-light: #283593;
$mid-gold: #ffd54f;
$mid-gold-light: #ffecb3;
$mid-cyan: #00bcd4;
$mid-border: rgba(255, 213, 79, 0.3);

.mid-autumn-horizontal-wrapper {
  width: 100%;
  position: relative;
  
  :deep(.mid-autumn-horizontal) {
    background: linear-gradient(180deg, $mid-blue, $mid-blue-light) !important;
    border-bottom: 2px solid $mid-border !important;
    box-shadow: 0 2px 15px rgba(26, 35, 126, 0.3) !important;
    position: relative;
    
    // 顶部金色装饰线
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
        $mid-gold 20%,
        rgba(255, 255, 255, 0.8) 50%,
        $mid-gold 80%,
        transparent 100%
      );
      z-index: 10;
    }
    
    .horizontal-header-left {
      span {
        color: $mid-gold !important;
        text-shadow: 
          0 1px 2px rgba(0, 0, 0, 0.3),
          0 0 10px rgba(255, 213, 79, 0.3);
        font-weight: 600;
      }
      
      img {
        filter: drop-shadow(0 0 5px rgba(255, 213, 79, 0.5));
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
        color: rgba(255, 255, 255, 0.95) !important;
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
          background: $mid-gold;
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }
        
        &:hover {
          background: rgba(255, 213, 79, 0.15) !important;
          color: $mid-gold !important;
          
          &::after {
            width: 80%;
          }
        }
        
        &.is-active {
          background: rgba(255, 213, 79, 0.2) !important;
          color: $mid-gold !important;
          
          &::after {
            width: 100%;
            box-shadow: 0 0 8px rgba(255, 213, 79, 0.5);
          }
        }
        
        .el-icon, svg {
          color: inherit !important;
        }
        
        span {
          color: inherit !important;
        }
      }
      
      // 子菜单样式
      .el-sub-menu {
        .el-sub-menu__title {
          color: rgba(255, 255, 255, 0.95) !important;
          background: transparent !important;
          
          .el-sub-menu__icon-arrow {
            color: inherit !important;
          }
        }
        
        &.is-active > .el-sub-menu__title {
          color: $mid-gold !important;
          background: rgba(255, 213, 79, 0.2) !important;
        }
      }
    }
    
    .horizontal-header-right {
      color: rgba(255, 255, 255, 0.95);
      
      .el-icon, svg {
        color: rgba(255, 255, 255, 0.9) !important;
        transition: all 0.3s ease;
        
        &:hover {
          color: $mid-gold !important;
        }
      }
    }
  }
}
</style>
