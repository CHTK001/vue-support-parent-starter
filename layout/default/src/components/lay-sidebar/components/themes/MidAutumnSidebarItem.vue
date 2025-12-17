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
import MidAutumnSidebarItem from './MidAutumnSidebarItem.vue';
provide('themeSidebarItem', MidAutumnSidebarItem);
</script>

<template>
  <div class="mid-autumn-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

// 中秋主题颜色变量
$mid-autumn-navy: #1a237e;
$mid-autumn-navy-light: #283593;
$mid-autumn-gold: #ffd54f;
$mid-autumn-gold-light: #ffeb3b;
$mid-autumn-orange: #ff8f00;
$mid-autumn-white: #ffffff;
$mid-autumn-border: rgba(255, 213, 79, 0.4);

// 月光 SVG 背景
$moon-normal: url('./assets/mid-autumn-menu-normal.svg');
$moon-active: url('./assets/mid-autumn-menu-active.svg');

.mid-autumn-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $mid-autumn-gold !important;
    background: $moon-normal !important;
    background-size: 100% 100% !important;
    background-repeat: no-repeat !important;
    margin: 4px 8px;
    border-radius: 4px;
    border: none !important;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:hover {
      transform: translateX(2px);
      filter: brightness(1.1);
      box-shadow: 0 4px 12px rgba($mid-autumn-navy, 0.4);
    }
    
    .el-icon, svg {
      color: $mid-autumn-gold !important;
      position: relative;
      z-index: 2;
    }
    
    span, div {
      color: inherit !important;
      position: relative;
      z-index: 2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    &.is-active {
      background: $moon-active !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      color: $mid-autumn-navy !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($mid-autumn-gold, 0.5),
        0 0 20px rgba($mid-autumn-gold, 0.3);
      
      .el-icon, svg, span, div {
        color: $mid-autumn-navy !important;
        text-shadow: 0 1px 2px rgba($mid-autumn-gold, 0.5);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: $mid-autumn-gold !important;
      background: $moon-normal !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      margin: 4px 8px;
      border-radius: 4px;
      border: none !important;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateX(2px);
        filter: brightness(1.1);
      }
      
      .el-icon, svg {
        color: $mid-autumn-gold !important;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      background: $moon-active !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      color: $mid-autumn-navy !important;
      font-weight: 700;
      
      .el-icon, svg {
        color: $mid-autumn-navy !important;
      }
    }
    
    .el-menu {
background: rgba(color.adjust($mid-autumn-navy, $lightness: -5%), 0.95) !important;
      
      .el-menu-item {
        color: $mid-autumn-gold !important;
        background: $moon-normal !important;
        background-size: 100% 100% !important;
        background-repeat: no-repeat !important;
        border: none !important;
        border-radius: 4px;
        margin: 4px 8px !important;
        
        &:hover {
          filter: brightness(1.1);
        }
        
        &.is-active {
          background: $moon-active !important;
          background-size: 100% 100% !important;
          background-repeat: no-repeat !important;
          color: $mid-autumn-navy !important;
        }
        
        .el-icon, svg {
          color: $mid-autumn-gold !important;
        }
        
        &.is-active .el-icon,
        &.is-active svg {
          color: $mid-autumn-navy !important;
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 中秋主题 - 横向导航弹出菜单样式（组件化）
$mid-blue: #1a237e;
$mid-blue-light: #283593;
$mid-gold: #ffd54f;
$mid-gold-light: #ffecb3;
$mid-cyan: #00bcd4;

html[data-skin="mid-autumn"] {
  .el-popper.horizontal-popper {
    background: rgba(13, 27, 66, 0.98) !important;
    border: 1px solid rgba($mid-gold, 0.3) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
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
      color: $mid-gold-light !important;
      font-size: 14px;
      transition: all 0.25s ease;
      
      .el-icon, svg {
        color: $mid-gold !important;
      }
      
      span, div {
        color: inherit !important;
        font-size: 14px;
      }
      
      &:hover {
        background: rgba($mid-gold, 0.1) !important;
        color: #fff !important;
        transform: translateX(4px);
      }
      
      &.is-active {
        background: linear-gradient(135deg, $mid-gold, $mid-gold-light) !important;
        color: $mid-blue !important;
        box-shadow: 0 2px 8px rgba($mid-gold, 0.4);
        
        .el-icon, svg, span, div {
          color: $mid-blue !important;
        }
      }
    }
    
    .el-sub-menu__title {
      height: 44px;
      line-height: 44px;
      color: $mid-gold !important;
      background: transparent !important;
      border-radius: 6px;
      margin: 4px 0;
      padding: 0 16px;
      
      span, div {
        color: $mid-gold !important;
        font-size: 14px;
      }
      
      .el-icon, svg, .el-sub-menu__icon-arrow {
        color: $mid-gold !important;
      }
      
      &:hover {
        background: rgba($mid-gold, 0.08) !important;
      }
    }
    
    .el-sub-menu.is-active > .el-sub-menu__title {
      background: linear-gradient(135deg, $mid-gold, $mid-gold-light) !important;
      color: $mid-blue !important;
      box-shadow: 0 2px 8px rgba($mid-gold, 0.4);
      
      span, div, .el-icon, svg, .el-sub-menu__icon-arrow {
        color: $mid-blue !important;
      }
    }
    
    .el-sub-menu > .el-menu {
      background: transparent !important;
      padding: 4px 0 4px 8px;
      border-left: 1px solid rgba($mid-gold, 0.2);
    }
  }
}
</style>
