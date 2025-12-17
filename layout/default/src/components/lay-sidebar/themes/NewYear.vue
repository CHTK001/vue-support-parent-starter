<script setup lang="ts">
/**
 * 元旦主题侧边栏 - 冰雪蓝白清新现代风
 * 设计理念：冰晶玻璃感、清透纯净
 */
import BaseSidebar from './BaseSidebar.vue';
import NewYearSidebarItem from '../components/themes/NewYearSidebarItem.vue';
</script>

<template>
  <div class="new-year-sidebar-wrapper">
    <BaseSidebar 
      theme-class="new-year-sidebar" 
      :sidebar-item-component="NewYearSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
// 冰雪主题颜色变量
$ice-lightest: #F5FBFF;
$ice-lighter: #E8F4FC;
$ice-light: #B8E0F2;
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$ice-darker: #1E5F8C;
$frost-purple: #E0E7F5;
$frost-glow: rgba(124, 194, 232, 0.3);

.new-year-sidebar-wrapper {
  height: 100%;
  
  :deep(.new-year-sidebar) {
    background: linear-gradient(180deg, rgba($ice-lightest, 0.98) 0%, rgba($frost-purple, 0.95) 100%) !important;
    border-right: 1px solid rgba($ice-medium, 0.25) !important;
    box-shadow: 2px 0 20px rgba($ice-deep, 0.08) !important;
    position: relative;
    backdrop-filter: blur(12px);
    
    // 冰晶装饰背景
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 30%, rgba($ice-light, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba($frost-purple, 0.12) 0%, transparent 45%);
      pointer-events: none;
      z-index: 0;
    }
    
    // Logo 区域样式
    .sidebar-logo-container {
      background: linear-gradient(135deg, rgba($ice-lightest, 0.95) 0%, rgba($ice-lighter, 0.9) 100%);
      border-bottom: 1px solid rgba($ice-medium, 0.2);
      position: relative;
      z-index: 1;
      
      .sidebar-logo-link {
        .sidebar-title {
          color: $ice-deep !important;
          text-shadow: 0 1px 2px rgba($ice-medium, 0.3);
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        img {
          filter: drop-shadow(0 2px 6px rgba($ice-primary, 0.25));
        }
        
        .env-badge {
          background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
          color: #fff !important;
          box-shadow: 0 2px 8px rgba($ice-primary, 0.35);
          border: none;
        }
      }
    }
    
    // 菜单样式
    .el-menu {
      background: transparent !important;
      border-right: none;
      position: relative;
      z-index: 1;
    }
    
    .el-menu-item,
    .el-sub-menu__title {
      color: $ice-darker !important;
      background: rgba(255, 255, 255, 0.65) !important;
      margin: 6px 10px;
      border-radius: 10px;
      border: 1px solid rgba($ice-medium, 0.2) !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
      
      &:hover {
        background: rgba(255, 255, 255, 0.85) !important;
        border-color: rgba($ice-primary, 0.4) !important;
        transform: translateX(4px);
        box-shadow: 0 4px 16px rgba($ice-primary, 0.15);
        color: $ice-deep !important;
      }
      
      .el-icon, svg {
        color: $ice-primary !important;
        transition: all 0.3s ease;
      }
      
      &:hover .el-icon, &:hover svg {
        color: $ice-deep !important;
      }
    }
    
    .el-menu-item.is-active {
      background: linear-gradient(135deg, $ice-primary 0%, $ice-medium 100%) !important;
      color: #fff !important;
      border: 1px solid rgba($ice-deep, 0.3) !important;
      font-weight: 600;
      box-shadow: 
        0 4px 20px rgba($ice-primary, 0.35),
        0 0 0 1px rgba(255, 255, 255, 0.2) inset;
      
      .el-icon, svg, span, div {
        color: #fff !important;
      }
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 60%;
        background: linear-gradient(to bottom, #fff, rgba(255, 255, 255, 0.5));
        border-radius: 0 2px 2px 0;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
      }
    }
    
    // 底部折叠按钮
    .left-collapse {
      background: linear-gradient(180deg, rgba($ice-lightest, 0.95), rgba($frost-purple, 0.9)) !important;
      border-top: 1px solid rgba($ice-medium, 0.2) !important;
      position: relative;
      z-index: 1;
      
      &:hover {
        box-shadow: 0 -4px 16px rgba($ice-primary, 0.15) !important;
      }
      
      svg {
        color: $ice-primary !important;
      }
      
      &:hover svg {
        color: $ice-deep !important;
      }
    }
    
    // 中间折叠按钮
    .center-collapse {
      background: rgba(255, 255, 255, 0.8) !important;
      border: 1px solid rgba($ice-medium, 0.25) !important;
      backdrop-filter: blur(8px);
      
      &:hover {
        border-color: $ice-primary !important;
        box-shadow: 0 4px 16px rgba($ice-primary, 0.2);
        background: rgba(255, 255, 255, 0.95) !important;
      }
      
      svg {
        color: $ice-primary !important;
      }
    }
    
    // 子菜单样式
    .el-sub-menu .el-menu {
      background: rgba($ice-lighter, 0.6) !important;
      border-radius: 8px;
      margin: 4px 8px;
      
      .el-menu-item {
        background: rgba(255, 255, 255, 0.5) !important;
        border: 1px solid rgba($ice-medium, 0.15) !important;
        margin: 4px 6px;
        
        &:hover {
          background: rgba(255, 255, 255, 0.8) !important;
          border-color: rgba($ice-primary, 0.3) !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
          color: #fff !important;
          border: 1px solid rgba($ice-deep, 0.2) !important;
          
          .el-icon, svg, span, div {
            color: #fff !important;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 子菜单弹出层全局样式 - 冰雪风格
html[data-skin="new-year"] {
  $ice-lightest: #F5FBFF;
  $ice-lighter: #E8F4FC;
  $ice-light: #B8E0F2;
  $ice-medium: #7CC2E8;
  $ice-primary: #4EA8DE;
  $ice-deep: #2A7AB8;
  $ice-darker: #1E5F8C;
  $frost-purple: #E0E7F5;

  .pure-scrollbar.el-menu--vertical,
  .el-menu--popup-container .el-menu--popup,
  .el-menu--popup {
    background: linear-gradient(180deg, rgba($ice-lightest, 0.98), rgba($frost-purple, 0.96)) !important;
    border: 1px solid rgba($ice-medium, 0.25) !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba($ice-deep, 0.15) !important;
    padding: 8px !important;
    backdrop-filter: blur(16px);

    .el-menu-item {
      margin: 4px 6px !important;
      border-radius: 8px !important;
      background: rgba(255, 255, 255, 0.7) !important;
      border: 1px solid rgba($ice-medium, 0.2) !important;
      color: $ice-darker !important;
      transition: all 0.3s ease !important;

      &:hover {
        background: rgba(255, 255, 255, 0.9) !important;
        border-color: rgba($ice-primary, 0.4) !important;
        transform: translateX(4px) !important;
        color: $ice-deep !important;
      }

      .el-icon, svg {
        color: $ice-primary !important;
      }
      
      &:hover .el-icon, &:hover svg {
        color: $ice-deep !important;
      }

      &.is-active {
        background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
        color: #fff !important;
        border: 1px solid rgba($ice-deep, 0.2) !important;
        box-shadow: 0 4px 16px rgba($ice-primary, 0.3) !important;

        .el-icon, svg, span {
          color: #fff !important;
        }
      }
    }
  }
}
</style>
