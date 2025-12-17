<script setup lang="ts">
import { provide } from 'vue';
import type { MenuType } from "@repo/core";
import type { PropType } from "vue";
import BaseSidebarItem from '../BaseSidebarItem.vue';

const props = defineProps({
  item: {
    type: Object as PropType<MenuType>,
  },
  isNest: {
    type: Boolean,
    default: false,
  },
  basePath: {
    type: String,
    default: "",
  },
});

// 提供自身作为主题 SidebarItem（用于子菜单递归）
import CyberpunkSidebarItem from './CyberpunkSidebarItem.vue';
provide('themeSidebarItem', CyberpunkSidebarItem);
</script>

<template>
  <div class="cyberpunk-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    />
  </div>
</template>

<style lang="scss" scoped>
// 赛博朋克主题颜色变量
$cyber-dark: #0a0a0f;
$cyber-dark-light: #1a1a2e;
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-yellow: #ffff00;
$cyber-pink: #ff0080;
$cyber-white: #ffffff;
$cyber-border: rgba(0, 255, 255, 0.4);

.cyberpunk-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $cyber-cyan !important;
    background: rgba($cyber-dark, 0.95) !important;
    margin: 4px 8px;
    border-radius: 4px;
    border: 1px solid $cyber-border !important;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;
    
    span, div, .el-text {
      font-size: 14px;
      color: inherit !important;
    }
    
    &:hover {
      background: rgba($cyber-cyan, 0.1) !important;
      color: $cyber-white !important;
      border-color: $cyber-cyan !important;
      box-shadow: 0 0 10px rgba($cyber-cyan, 0.4);
    }
    
    .el-icon, svg {
      color: $cyber-cyan !important;
    }
    
    &.is-active {
      background: rgba($cyber-cyan, 0.15) !important;
      color: $cyber-white !important;
      border: 1px solid $cyber-cyan !important;
      box-shadow: 0 0 12px rgba($cyber-cyan, 0.5);
      
      .el-icon, svg, span, div {
        color: $cyber-white !important;
      }
      
      // 左侧霓虹装饰条
      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: $cyber-cyan;
        border-radius: 2px;
        box-shadow: 0 0 6px $cyber-cyan;
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: $cyber-cyan !important;
      background: rgba($cyber-dark, 0.95) !important;
      margin: 4px 8px;
      border-radius: 4px;
      border: 1px solid $cyber-border !important;
      font-weight: 500;
      transition: all 0.2s ease;
      
      span, div, .el-text {
        font-size: 14px;
      }
      
      &:hover {
        background: rgba($cyber-cyan, 0.08) !important;
        color: $cyber-white !important;
        border-color: $cyber-cyan !important;
      }
      
      .el-icon, svg {
        color: $cyber-cyan !important;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      color: $cyber-white !important;
      background: rgba($cyber-cyan, 0.1) !important;
      border-color: $cyber-cyan !important;
      box-shadow: 0 0 8px rgba($cyber-cyan, 0.4);
      
      .el-icon, svg {
        color: $cyber-white !important;
      }
    }
    
    .el-menu {
      background: transparent !important;
      border-left: 1px solid rgba($cyber-cyan, 0.2);
      
      .el-menu-item {
        color: $cyber-cyan !important;
        background: rgba($cyber-dark, 0.9) !important;
        border: 1px solid $cyber-border !important;
        border-radius: 4px;
        margin: 4px 8px !important;
        
        span, div, .el-text {
          font-size: 14px;
        }
        
        &:hover {
          background: rgba($cyber-cyan, 0.08) !important;
          color: $cyber-white !important;
          border-color: $cyber-cyan !important;
        }
        
        &.is-active {
          background: rgba($cyber-cyan, 0.15) !important;
          color: $cyber-white !important;
          border: 1px solid $cyber-cyan !important;
          box-shadow: 0 0 10px rgba($cyber-cyan, 0.4);
        }
        
        .el-icon, svg {
          color: $cyber-cyan !important;
        }
      }
    }
  }
}

</style>

<style lang="scss">
// 赛博朋克主题 - 横向导航弹出菜单样式（组件化）
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-dark: #0a0a12;
$cyber-dark-light: #1a1a2e;
$cyber-white: #ffffff;

html[data-skin="cyberpunk"] {
  // 弹出菜单容器背景
  .el-popper.horizontal-popper {
    background: rgba($cyber-dark, 0.98) !important;
    border: 1px solid rgba($cyber-cyan, 0.3) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
  }
  
  .horizontal-popper,
  .el-menu--horizontal .el-menu--popup,
  .el-menu--horizontal .el-menu--popup-container {
    > .el-menu {
      background: transparent !important;
    }
    
    .el-menu-item {
      height: 44px;
      line-height: 44px;
      background: transparent !important;
      border: none !important;
      border-radius: 6px;
      margin: 4px 0;
      padding: 0 16px;
      color: $cyber-cyan !important;
      font-size: 14px;
      transition: all 0.2s ease;
      
      .el-icon, svg {
        color: $cyber-cyan !important;
      }
      
      span, div {
        color: inherit !important;
        font-size: 14px;
      }
      
      &:hover {
        background: rgba($cyber-cyan, 0.1) !important;
        color: $cyber-white !important;
      }
      
      &.is-active {
        background: rgba($cyber-cyan, 0.2) !important;
        color: $cyber-white !important;
        box-shadow: 0 0 10px rgba($cyber-cyan, 0.4);
        
        .el-icon, svg, span, div {
          color: $cyber-white !important;
        }
      }
    }
    
    .el-sub-menu__title {
      height: 44px;
      line-height: 44px;
      color: $cyber-cyan !important;
      background: transparent !important;
      border-radius: 6px;
      margin: 4px 0;
      padding: 0 16px;
      
      span, div {
        color: $cyber-cyan !important;
        font-size: 14px;
      }
      
      .el-icon, svg, .el-sub-menu__icon-arrow {
        color: $cyber-cyan !important;
      }
      
      &:hover {
        background: rgba($cyber-cyan, 0.08) !important;
      }
    }
    
    .el-sub-menu.is-active > .el-sub-menu__title {
      background: rgba($cyber-cyan, 0.2) !important;
      color: $cyber-white !important;
      box-shadow: 0 0 10px rgba($cyber-cyan, 0.4);
      
      span, div, .el-icon, svg, .el-sub-menu__icon-arrow {
        color: $cyber-white !important;
      }
    }
    
    .el-sub-menu > .el-menu {
      background: transparent !important;
      padding: 4px 0 4px 8px;
      border-left: 1px solid rgba($cyber-cyan, 0.2);
    }
  }
}
</style>
