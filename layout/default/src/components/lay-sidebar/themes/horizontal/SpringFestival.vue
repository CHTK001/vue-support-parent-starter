<script setup lang="ts">
import BaseHorizontal from './BaseHorizontal.vue';
import SpringFestivalSidebarItem from '../../components/themes/SpringFestivalSidebarItem.vue';
</script>

<template>
  <div class="spring-festival-horizontal-wrapper">
    <BaseHorizontal 
      theme-class="spring-festival-horizontal" 
      :sidebar-item-component="SpringFestivalSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
// 春节主题颜色变量
$spring-red: #DC143C;
$spring-red-dark: #B22222;
$spring-gold: #FFD700;
$spring-border: rgba(255, 215, 0, 0.3);

.spring-festival-horizontal-wrapper {
  width: 100%;
  position: relative;
  
  :deep(.spring-festival-horizontal) {
    background: linear-gradient(180deg, $spring-red, $spring-red-dark) !important;
    border-bottom: 2px solid $spring-border !important;
    box-shadow: 0 2px 15px rgba(220, 20, 60, 0.3) !important;
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
        $spring-gold 20%,
        rgba(255, 255, 255, 0.8) 50%,
        $spring-gold 80%,
        transparent 100%
      );
      z-index: 10;
    }
    
    .horizontal-header-left {
      span {
        color: $spring-gold !important;
        text-shadow: 
          0 1px 2px rgba(0, 0, 0, 0.3),
          0 0 10px rgba(255, 215, 0, 0.3);
        font-weight: 600;
      }
      
      img {
        filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
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
          background: $spring-gold;
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }
        
        &:hover {
          background: rgba(255, 215, 0, 0.15) !important;
          color: $spring-gold !important;
          
          &::after {
            width: 80%;
          }
        }
        
        &.is-active {
          background: rgba(255, 215, 0, 0.2) !important;
          color: $spring-gold !important;
          
          &::after {
            width: 100%;
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
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
          color: $spring-gold !important;
          background: rgba(255, 215, 0, 0.2) !important;
        }
      }
    }
    
    .horizontal-header-right {
      color: rgba(255, 255, 255, 0.95);
      
      .el-icon, svg {
        color: rgba(255, 255, 255, 0.9) !important;
        transition: all 0.3s ease;
        
        &:hover {
          color: $spring-gold !important;
        }
      }
    }
  }
}
</style>
