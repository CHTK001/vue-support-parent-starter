<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
import NewYearSidebarItem from '../components/themes/NewYearSidebarItem.vue';
</script>

<template>
  <div class="new-year-sidebar-wrapper">
    <!-- 冰棱装饰 -->
    <div class="ice-decor"></div>
    
    <BaseSidebar 
      theme-class="new-year-sidebar" 
      :sidebar-item-component="NewYearSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
.new-year-sidebar-wrapper {
  --ny-bg-start: #f0f8ff;
  --ny-bg-end: #e6f7ff;
  --ny-primary: #4EA8DE;
  --ny-text: #1E5F8C;
  --ny-active-bg: linear-gradient(90deg, rgba(78, 168, 222, 0.15), rgba(78, 168, 222, 0.05));
  --ny-hover-bg: rgba(255, 255, 255, 0.6);
  --ny-border: rgba(78, 168, 222, 0.2);

  height: 100%;
  position: relative;
  
  // 顶部冰棱装饰
  .ice-decor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #b8e0f2, #4ea8de, #b8e0f2);
    z-index: 2;
    box-shadow: 0 0 10px rgba(78, 168, 222, 0.5);
  }

  :deep(.new-year-sidebar) {
    background: linear-gradient(180deg, var(--ny-bg-start), var(--ny-bg-end)) !important;
    border-right: 1px solid var(--ny-border) !important;
    backdrop-filter: blur(10px);
    
    .sidebar-logo-container {
      background: rgba(255, 255, 255, 0.3);
      border-bottom: 1px solid var(--ny-border);
      
      .sidebar-logo-link .sidebar-title {
        color: var(--ny-primary) !important;
        text-shadow: 0 0 10px rgba(78, 168, 222, 0.2);
      }
    }
    
    .el-menu {
      background: transparent !important;
      border-right: none;
    }
    
    .left-collapse, .center-collapse {
      background: rgba(255, 255, 255, 0.5);
      border-top: 1px solid var(--ny-border);
      color: var(--ny-primary);
      
      &:hover {
        background: var(--ny-primary);
        color: #fff;
      }
    }
    
    // 二级导航样式（内联展开）
    .el-sub-menu {
      .el-sub-menu__title {
        color: var(--ny-text) !important;
        
        &:hover {
          background: rgba(78, 168, 222, 0.15) !important;
          color: var(--ny-primary) !important;
        }
      }
      
      &.is-opened .el-sub-menu__title {
        color: var(--ny-primary) !important;
      }
      
      .el-menu {
        background: rgba(240, 248, 255, 0.8) !important;
        
        .el-menu-item {
          color: var(--ny-text) !important;
          background: transparent !important;
          border: none !important;
          margin: 2px 8px !important;
          
          &:hover {
            background: rgba(78, 168, 222, 0.2) !important;
            color: var(--ny-primary) !important;
          }
          
          &.is-active {
            background: linear-gradient(135deg, var(--ny-primary), rgba(78, 168, 222, 0.8)) !important;
            color: #fff !important;
            border-left: 3px solid var(--ny-primary) !important;
            
            .el-icon, svg, span, div {
              color: #fff !important;
            }
          }
          
          .el-icon, svg {
            color: var(--ny-primary) !important;
          }
        }
      }
    }
  }
}

:global(.dark) .new-year-sidebar-wrapper {
  --ny-bg-start: #0f1c2e;
  --ny-bg-end: #142336;
  --ny-text: #b8e0f2;
  --ny-primary: #7cc2e8;
  --ny-active-bg: linear-gradient(90deg, rgba(124, 194, 232, 0.2), rgba(124, 194, 232, 0.05));
  --ny-hover-bg: rgba(255, 255, 255, 0.05);
  --ny-border: rgba(124, 194, 232, 0.15);
  
  .ice-decor {
    background: linear-gradient(90deg, #1e5f8c, #4ea8de, #1e5f8c);
    box-shadow: 0 0 15px rgba(78, 168, 222, 0.3);
  }
  
  :deep(.new-year-sidebar) {
    .el-sub-menu {
      .el-menu {
        background: rgba(15, 28, 46, 0.8) !important;
        
        .el-menu-item {
          color: var(--ny-text) !important;
          
          &:hover {
            background: rgba(124, 194, 232, 0.2) !important;
            color: var(--ny-primary) !important;
          }
          
          &.is-active {
            background: linear-gradient(135deg, var(--ny-primary), rgba(124, 194, 232, 0.8)) !important;
            color: #fff !important;
          }
          
          .el-icon, svg {
            color: var(--ny-primary) !important;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 二级导航弹出层全局样式（teleport 到 body）
html[data-skin="new-year"] {
  $ny-bg-start: #f0f8ff;
  $ny-bg-end: #e6f7ff;
  $ny-primary: #4EA8DE;
  $ny-text: #1E5F8C;
  $ny-primary-dark: #2a7ab8;

  .pure-scrollbar.el-menu--vertical,
  .el-menu--popup-container .el-menu--popup,
  .el-menu--popup {
    background: linear-gradient(135deg, rgba($ny-bg-start, 0.98) 0%, rgba($ny-bg-end, 0.98) 100%) !important;
    border: 2px solid rgba($ny-primary, 0.4) !important;
    border-radius: 8px !important;
    box-shadow:
      0 0 25px rgba($ny-primary, 0.15),
      0 15px 40px rgba(0, 0, 0, 0.2) !important;
    overflow: hidden !important;
    padding: 6px !important;
    position: relative;

    // 顶部蓝色装饰线
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, $ny-primary 20%, #b8e0f2 50%, $ny-primary 80%, transparent);
      z-index: 1;
    }

    .el-menu-item {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: rgba(255, 255, 255, 0.6) !important;
      border: 1.5px solid rgba($ny-primary, 0.25) !important;
      color: $ny-text !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative;
      z-index: 1;

      &:hover {
        background: rgba($ny-primary, 0.2) !important;
        color: $ny-primary !important;
        border-color: rgba($ny-primary, 0.5) !important;
        transform: translateX(4px) !important;
        box-shadow:
          0 4px 12px rgba($ny-primary, 0.25),
          0 2px 8px rgba($ny-primary, 0.2) !important;
      }

      .el-icon, svg, .sub-menu-icon {
        color: $ny-primary !important;
        margin-right: 8px;
      }

      span, .el-text {
        color: inherit !important;
      }

      &.is-active {
        background: linear-gradient(135deg, $ny-primary 0%, $ny-primary-dark 100%) !important;
        color: #fff !important;
        border: 2px solid $ny-primary !important;
        font-weight: 700;
        box-shadow:
          0 4px 16px rgba($ny-primary, 0.5),
          0 0 20px rgba($ny-primary, 0.3) !important;

        .el-icon, svg, .sub-menu-icon, span, .el-text {
          color: #fff !important;
        }

        &::after {
          content: '';
          position: absolute;
          left: -2px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 70%;
          background: linear-gradient(to bottom, $ny-primary, #b8e0f2, $ny-primary);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba($ny-primary, 0.8);
        }
      }
    }

    .el-sub-menu__title {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: rgba(255, 255, 255, 0.6) !important;
      border: 1.5px solid rgba($ny-primary, 0.25) !important;
      color: $ny-text !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        background: rgba($ny-primary, 0.2) !important;
        color: $ny-primary !important;
        border-color: rgba($ny-primary, 0.5) !important;
        transform: translateX(4px) !important;
      }

      .el-icon, svg {
        color: $ny-primary !important;
      }

      .el-sub-menu__icon-arrow {
        color: $ny-primary !important;
      }
    }
  }
  
  // 深色模式下的弹出层样式
  html.dark & {
    .pure-scrollbar.el-menu--vertical,
    .el-menu--popup-container .el-menu--popup,
    .el-menu--popup {
      background: linear-gradient(135deg, rgba(15, 28, 46, 0.98) 0%, rgba(20, 35, 54, 0.98) 100%) !important;
      border-color: rgba(124, 194, 232, 0.4) !important;
      
      .el-menu-item {
        background: rgba(20, 35, 54, 0.7) !important;
        color: #b8e0f2 !important;
        
        &:hover {
          background: rgba(124, 194, 232, 0.2) !important;
          color: #7cc2e8 !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, #7cc2e8 0%, #4ea8de 100%) !important;
          color: #fff !important;
        }
      }
      
      .el-sub-menu__title {
        background: rgba(20, 35, 54, 0.7) !important;
        color: #b8e0f2 !important;
        
        &:hover {
          background: rgba(124, 194, 232, 0.2) !important;
          color: #7cc2e8 !important;
        }
      }
    }
  }
}
</style>
