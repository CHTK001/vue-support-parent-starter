<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
</script>

<template>
  <div class="christmas-sidebar-wrapper">
    <BaseSidebar theme-class="christmas-sidebar" />
  </div>
</template>

<style lang="scss" scoped>
// 圣诞主题颜色变量
$xmas-green: #1b5e20;         // 圣诞绿
$xmas-green-light: #2e7d32;   // 浅绿
$xmas-red: #c62828;           // 圣诞红
$xmas-red-light: #e53935;     // 浅红
$xmas-gold: #ffd700;          // 金色
$xmas-white: #ffffff;         // 雪白
$xmas-border: rgba(255, 215, 0, 0.4);

.christmas-sidebar-wrapper {
  height: 100%;
  
  :deep(.christmas-sidebar) {
    background: linear-gradient(180deg, $xmas-green 0%, darken($xmas-green, 5%) 100%) !important;
    border-right: 3px solid $xmas-border !important;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.2),
      inset -1px 0 0 rgba($xmas-gold, 0.2) !important;
    position: relative;
    
    // 雪花装饰边线
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
        transparent 20px,
        rgba($xmas-white, 0.3) 20px,
        rgba($xmas-white, 0.3) 22px
      );
      z-index: 1;
    }
    
    // Logo 区域样式
    .sidebar-logo-container {
      background: linear-gradient(180deg, darken($xmas-green, 8%) 0%, darken($xmas-green, 5%) 100%);
      border-bottom: 2px solid $xmas-border;
      position: relative;
      
      // 金色顶边装饰
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, $xmas-gold 30%, $xmas-red 50%, $xmas-gold 70%, transparent);
      }
      
      .sidebar-logo-link {
        .sidebar-title {
          color: $xmas-white !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 10px rgba($xmas-gold, 0.3);
          font-weight: 700;
        }
        
        img {
          filter: drop-shadow(0 2px 4px rgba($xmas-gold, 0.3));
        }
        
        .env-badge {
          background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
          color: $xmas-white !important;
          box-shadow: 0 2px 6px rgba($xmas-red, 0.5);
          border: 1px solid rgba($xmas-gold, 0.3);
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
      color: $xmas-white !important;
      background: rgba(darken($xmas-green, 5%), 0.6) !important;
      margin: 4px 8px;
      border-radius: 8px;
      border: 1.5px solid rgba($xmas-gold, 0.25) !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
        color: $xmas-white !important;
        border-color: rgba($xmas-gold, 0.5) !important;
        transform: translateX(4px) scale(1.02);
        box-shadow: 
          0 4px 12px rgba($xmas-red, 0.3),
          0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .el-icon, svg {
        color: $xmas-gold !important;
      }
      
      span, div {
        color: inherit !important;
      }
    }
    
    .el-menu-item.is-active {
      background: linear-gradient(135deg, $xmas-red 0%, $xmas-red-light 100%) !important;
      color: $xmas-white !important;
      border: 2px solid $xmas-gold !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($xmas-red, 0.5),
        0 0 20px rgba($xmas-gold, 0.3);
      
      .el-icon, svg, span, div {
        color: $xmas-white !important;
      }
      
      // 左侧金色装饰条
      &::after {
        content: '';
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 70%;
        background: linear-gradient(to bottom, $xmas-gold, #ffeb3b, $xmas-gold);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba($xmas-gold, 0.8);
      }
    }
    
    // 子菜单样式
    .el-sub-menu.is-active > .el-sub-menu__title {
      color: $xmas-white !important;
      font-weight: 700;
    }
    
    // 底部折叠按钮
    .left-collapse {
      background: linear-gradient(180deg, darken($xmas-green, 8%), darken($xmas-green, 10%)) !important;
      border-top: 2px solid $xmas-border !important;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3) !important;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, $xmas-gold 30%, $xmas-red 50%, $xmas-gold 70%, transparent);
      }
      
      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
        box-shadow: 0 -4px 12px rgba($xmas-gold, 0.3) !important;
      }
      
      &.collapsed-state {
        background: linear-gradient(135deg, $xmas-red 0%, $xmas-red-light 100%) !important;
        border-top: 2px solid $xmas-gold !important;
      }
      
      svg {
        color: $xmas-gold !important;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }
      
      &:hover svg {
        color: $xmas-white !important;
      }
    }
    
    // 中间折叠按钮
    .center-collapse {
      background: linear-gradient(135deg, darken($xmas-green, 5%), $xmas-green) !important;
      border: 2px solid $xmas-border !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      
      &:hover {
        background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
        border-color: $xmas-gold !important;
        box-shadow: 0 4px 12px rgba($xmas-gold, 0.4);
      }
      
      svg {
        color: $xmas-gold !important;
      }
      
      &:hover svg {
        color: $xmas-white !important;
      }
    }
  }
}
</style>
