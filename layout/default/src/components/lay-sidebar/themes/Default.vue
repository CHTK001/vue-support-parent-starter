<script setup lang="ts">
import BaseSidebar from "./BaseSidebar.vue";
import DefaultSidebarItem from '../components/themes/DefaultSidebarItem.vue';
</script>

<template>
  <div class="default-sidebar-wrapper">
    <BaseSidebar 
      theme-class="default-sidebar" 
      :sidebar-item-component="DefaultSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
// CSS 变量管理主题样式
.default-sidebar-wrapper {
  // 亮色模式变量
  --sidebar-bg-start: rgba(255, 255, 255, 0.95);
  --sidebar-bg-end: rgba(255, 255, 255, 0.98);
  --sidebar-border: rgba(0, 0, 0, 0.05);
  
  height: 100%;
  
  :deep(.default-sidebar) {
    background: linear-gradient(180deg, var(--sidebar-bg-start), var(--sidebar-bg-end));
    backdrop-filter: blur(12px);
    border-right: 1px solid var(--sidebar-border);
    
    .sidebar-logo-container {
      background: transparent;
      border-bottom: 1px solid var(--sidebar-border);
      
      .sidebar-logo-link .sidebar-title {
        color: var(--el-text-color-primary);
      }
    }
    
    .el-menu {
      background: transparent;
      border-right: none;
    }
    
    .left-collapse {
      background: var(--el-bg-color-overlay);
      border-top: 1px solid var(--el-border-color-light);
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--el-color-primary-light-9);
      }
      
      &.collapsed-state {
        background: var(--el-color-primary-light-8);
        border-top: 2px solid var(--el-color-primary);
      }
      
      svg {
        color: var(--el-text-color-primary);
      }
    }
    
    .center-collapse {
      background: var(--el-bg-color-overlay);
      border-color: var(--el-border-color-light);
      
      svg {
        color: var(--el-text-color-primary);
      }
    }
    
    // 二级导航样式（内联展开）
    .el-sub-menu {
      .el-sub-menu__title {
        color: var(--el-text-color-primary) !important;
        
        &:hover {
          background: var(--el-color-primary-light-9) !important;
          color: var(--el-color-primary) !important;
        }
      }
      
      &.is-opened .el-sub-menu__title {
        color: var(--el-color-primary) !important;
      }
      
      .el-menu {
        background: var(--el-bg-color) !important;
        
        .el-menu-item {
          color: var(--el-text-color-primary) !important;
          background: transparent !important;
          border: none !important;
          margin: 2px 8px !important;
          
          &:hover {
            background: var(--el-color-primary-light-9) !important;
            color: var(--el-color-primary) !important;
          }
          
          &.is-active {
            background: var(--el-color-primary-light-8) !important;
            color: var(--el-color-primary) !important;
            border-left: 3px solid var(--el-color-primary) !important;
            
            .el-icon, svg, span, div {
              color: var(--el-color-primary) !important;
            }
          }
          
          .el-icon, svg {
            color: var(--el-text-color-regular) !important;
          }
        }
      }
    }
  }
}

// 深色模式覆盖变量
:global(.dark) .default-sidebar-wrapper {
  --sidebar-bg-start: rgba(28, 28, 35, 0.95);
  --sidebar-bg-end: rgba(30, 30, 40, 0.98);
  --sidebar-border: rgba(255, 255, 255, 0.05);
}
</style>

<style lang="scss">
// 二级导航弹出层全局样式（teleport 到 body）
.pure-scrollbar.el-menu--vertical,
.el-menu--popup-container .el-menu--popup,
.el-menu--popup {
  .el-menu-item {
    color: var(--el-text-color-primary) !important;
    
    &:hover {
      background: var(--el-color-primary-light-9) !important;
      color: var(--el-color-primary) !important;
    }
    
    &.is-active {
      background: var(--el-color-primary-light-8) !important;
      color: var(--el-color-primary) !important;
    }
    
    .el-icon, svg, .sub-menu-icon {
      color: var(--el-text-color-regular) !important;
      margin-right: 8px;
    }
    
    span, .el-text {
      color: inherit !important;
    }
  }
  
  .el-sub-menu__title {
    color: var(--el-text-color-primary) !important;
    
    &:hover {
      background: var(--el-color-primary-light-9) !important;
      color: var(--el-color-primary) !important;
    }
    
    .el-icon, svg {
      color: var(--el-text-color-regular) !important;
    }
    
    .el-sub-menu__icon-arrow {
      color: var(--el-text-color-regular) !important;
    }
  }
}
</style>
