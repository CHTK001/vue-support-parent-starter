<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
</script>

<template>
  <div class="spring-festival-sidebar-wrapper">
    <BaseSidebar theme-class="spring-festival-sidebar" />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-sidebar-wrapper {
  height: 100%;
  
  :deep(.spring-festival-sidebar) {
    background: linear-gradient(135deg, rgba(220, 20, 60, 0.98) 0%, rgba(178, 34, 34, 0.98) 100%) !important;
    border-right: 3px solid rgba(255, 215, 0, 0.5) !important;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.2),
      inset -1px 0 0 rgba(255, 215, 0, 0.2) !important;
    position: relative;
    
    // 金色装饰纹样
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 2px;
      height: 100%;
      background: repeating-linear-gradient(
        to bottom,
        transparent,
        transparent 10px,
        rgba(255, 215, 0, 0.3) 10px,
        rgba(255, 215, 0, 0.3) 11px
      );
      z-index: 1;
    }
    
    // 菜单样式
    .el-menu {
      background: transparent !important;
      border-right: none;
    }
    
    .el-menu-item,
    .el-sub-menu__title {
      color: #FFD700 !important;
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.7) 0%, rgba(178, 34, 34, 0.7) 100%) !important;
      margin: 4px 8px;
      border-radius: 8px;
      border: 1.5px solid rgba(255, 215, 0, 0.3) !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.9) 0%, rgba(178, 34, 34, 0.9) 100%) !important;
        color: #FFF !important;
        border-color: rgba(255, 215, 0, 0.6) !important;
        transform: translateX(4px) scale(1.02);
        box-shadow: 
          0 4px 12px rgba(255, 215, 0, 0.3),
          0 2px 8px rgba(220, 20, 60, 0.4);
      }
      
      .el-icon, svg {
        color: #FFD700 !important;
      }
      
      span, div {
        color: inherit !important;
      }
    }
    
    .el-menu-item.is-active {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
      color: #8B0000 !important;
      border: 2px solid #DC143C !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba(255, 215, 0, 0.5),
        0 0 20px rgba(255, 215, 0, 0.3);
      
      .el-icon, svg, span, div {
        color: #8B0000 !important;
      }
      
      // 左侧红色装饰条
      &::after {
        content: '';
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 70%;
        background: linear-gradient(to bottom, #DC143C, #B22222, #DC143C);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba(220, 20, 60, 0.8);
      }
    }
    
    // 子菜单样式
    .el-sub-menu.is-active > .el-sub-menu__title {
      color: #FFF !important;
      font-weight: 700;
    }
  }
}
</style>
