<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
import SpringFestivalSidebarItem from '../components/themes/SpringFestivalSidebarItem.vue';
</script>

<template>
  <div class="spring-festival-sidebar-wrapper">
    <BaseSidebar 
      theme-class="spring-festival-sidebar" 
      :sidebar-item-component="SpringFestivalSidebarItem" 
    />
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
    
    // Logo 区域样式 - 春节主题
    .sidebar-logo-container {
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.9) 0%, rgba(178, 34, 34, 0.9) 100%);
      border-bottom: 2px solid rgba(255, 215, 0, 0.4);
      position: relative;
      
      // 金色顶边装饰
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #FFD700 30%, #FFA500 50%, #FFD700 70%, transparent);
      }
      
      .sidebar-logo-link {
        .sidebar-title {
          color: #FFD700 !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          font-weight: 700;
        }
        
        img {
          filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
        }
        
        // 环境标识春节风格
        .env-badge {
          background: linear-gradient(135deg, #FFD700, #FFA500) !important;
          color: #8B0000 !important;
          box-shadow: 0 2px 6px rgba(255, 215, 0, 0.5);
          border: 1px solid rgba(220, 20, 60, 0.3);
        }
      }
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
    
    // 底部折叠按钮 - 春节主题
    .left-collapse {
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.95) 0%, rgba(178, 34, 34, 0.95) 100%) !important;
      border-top: 2px solid rgba(255, 215, 0, 0.5) !important;
      box-shadow: 0 -2px 8px rgba(220, 20, 60, 0.3) !important;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #FFD700 30%, #FFA500 50%, #FFD700 70%, transparent);
      }
      
      &:hover {
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.95) 0%, rgba(178, 34, 34, 0.95) 100%) !important;
        box-shadow: 0 -4px 12px rgba(255, 215, 0, 0.4) !important;
      }
      
      &.collapsed-state {
        background: linear-gradient(135deg, #DC143C 0%, #B22222 100%) !important;
        border-top: 2px solid #FFD700 !important;
        
        &::before {
          background: #FFD700;
          width: 30px;
          left: 50%;
          transform: translateX(-50%);
        }
      }
      
      svg {
        color: #FFD700 !important;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }
      
      &:hover svg {
        color: #FFF !important;
      }
    }
    
    // 中间折叠按钮 - 春节主题
    .center-collapse {
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.95) 0%, rgba(178, 34, 34, 0.95) 100%) !important;
      border: 2px solid rgba(255, 215, 0, 0.5) !important;
      box-shadow: 0 2px 8px rgba(220, 20, 60, 0.4);
      
      &:hover {
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.95) 0%, rgba(178, 34, 34, 0.95) 100%) !important;
        border-color: #FFD700 !important;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
      }
      
      svg {
        color: #FFD700 !important;
      }
      
      &:hover svg {
        color: #FFF !important;
      }
    }
    
    // 垂直导航展开的子菜单容器
    .el-sub-menu .el-menu {
      background: rgba(139, 0, 0, 0.6) !important;
      
      .el-menu-item {
        color: #FFD700 !important;
        background: transparent !important;
        border: none !important;
        margin: 2px 8px !important;
        
        &:hover {
          background: rgba(220, 20, 60, 0.6) !important;
          color: #FFF !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, #FFD700, #FFA500) !important;
          color: #8B0000 !important;
          border-left: 3px solid #DC143C !important;
          
          .el-icon, svg, span, div {
            color: #8B0000 !important;
          }
        }
        
        .el-icon, svg {
          color: #FFD700 !important;
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 子菜单弹出层全局样式（teleport 到 body）
html[data-skin="spring-festival"] {
  .pure-scrollbar.el-menu--vertical,
  .el-menu--popup-container .el-menu--popup,
  .el-menu--popup {
    background: linear-gradient(135deg, rgba(220, 20, 60, 0.98) 0%, rgba(178, 34, 34, 0.98) 100%) !important;
    border: 2px solid rgba(255, 215, 0, 0.5) !important;
    border-radius: 8px !important;
    box-shadow:
      0 0 20px rgba(255, 215, 0, 0.2),
      0 15px 40px rgba(0, 0, 0, 0.4) !important;
    overflow: hidden !important;
    padding: 6px !important;
    position: relative;

    // 顶部金色装饰线
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #FFD700 30%, #FFA500 50%, #FFD700 70%, transparent);
      z-index: 1;
    }

    .el-menu-item {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.7) 0%, rgba(178, 34, 34, 0.7) 100%) !important;
      border: 1.5px solid rgba(255, 215, 0, 0.3) !important;
      color: #FFD700 !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative;
      z-index: 1;

      &:hover {
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.9) 0%, rgba(178, 34, 34, 0.9) 100%) !important;
        color: #FFF !important;
        border-color: rgba(255, 215, 0, 0.6) !important;
        transform: translateX(4px) !important;
        box-shadow:
          0 4px 12px rgba(255, 215, 0, 0.3),
          0 2px 8px rgba(220, 20, 60, 0.4) !important;
      }

      .el-icon, svg, .sub-menu-icon {
        color: #FFD700 !important;
        margin-right: 8px;
      }

      span, .el-text {
        color: inherit !important;
      }

      &.is-active {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
        color: #8B0000 !important;
        border: 2px solid #DC143C !important;
        font-weight: 700;
        box-shadow:
          0 4px 16px rgba(255, 215, 0, 0.5),
          0 0 20px rgba(255, 215, 0, 0.3) !important;

        .el-icon, svg, .sub-menu-icon, span, .el-text {
          color: #8B0000 !important;
        }

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
    }

    .el-sub-menu__title {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.7) 0%, rgba(178, 34, 34, 0.7) 100%) !important;
      border: 1.5px solid rgba(255, 215, 0, 0.3) !important;
      color: #FFD700 !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.9) 0%, rgba(178, 34, 34, 0.9) 100%) !important;
        color: #FFF !important;
        border-color: rgba(255, 215, 0, 0.6) !important;
        transform: translateX(4px) !important;
      }

      .el-icon, svg {
        color: #FFD700 !important;
      }

      .el-sub-menu__icon-arrow {
        color: #FFD700 !important;
      }
    }
  }
}
</style>
