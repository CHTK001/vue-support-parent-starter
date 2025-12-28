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
import SpringFestivalSidebarItem from './SpringFestivalSidebarItem.vue';
provide('themeSidebarItem', SpringFestivalSidebarItem);
</script>

<template>
  <div class="spring-festival-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    />
  </div>
</template>

<style lang="scss" scoped>
// 春节主题 - 使用 CSS 变量提升可维护性
// SCSS 变量用于编译时，CSS 变量用于运行时主题切换
$spring-red: #dc143c;
$spring-red-dark: #a52a2a;
$spring-gold: #ffd700;
$couplet-normal: url('./assets/spring-couplet-menu-normal.svg');
$couplet-active: url('./assets/spring-couplet-menu-active.svg');

.spring-festival-sidebar-item-wrapper {
  // CSS 变量（可被父级覆盖）
  --spring-gold: #{$spring-gold};
  --spring-red: #{$spring-red};
  --spring-active-text: #8B0000;
  
  :deep(.sidebar-menu-item) {
    color: var(--spring-gold);
    background: $couplet-normal;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    margin: 4px 8px;
    border-radius: 4px;
    border: none;
    font-weight: 600;
    font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:hover {
      transform: translateX(2px);
      filter: brightness(1.1);
      box-shadow: 0 4px 12px rgba($spring-red, 0.3);
    }
    
    .el-icon, svg {
      color: var(--spring-gold);
      position: relative;
      z-index: 2;
    }
    
    span, div {
      color: inherit;
      position: relative;
      z-index: 2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    &.is-active {
      background: $couplet-active;
      background-size: 100% 100%;
      background-repeat: no-repeat;
      color: var(--spring-active-text);
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($spring-gold, 0.5),
        0 0 20px rgba($spring-gold, 0.3);
      
      .el-icon, svg, span, div {
        color: var(--spring-active-text);
        text-shadow: 0 1px 2px rgba(255, 215, 0, 0.5);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: var(--spring-gold);
      background: $couplet-normal;
      background-size: 100% 100%;
      background-repeat: no-repeat;
      margin: 4px 8px;
      border-radius: 4px;
      border: none;
      font-weight: 600;
      font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateX(2px);
        filter: brightness(1.1);
      }
      
      .el-icon, svg {
        color: var(--spring-gold);
      }
    }
    
    &.is-active > .el-sub-menu__title {
      background: $couplet-active;
      background-size: 100% 100%;
      background-repeat: no-repeat;
      color: var(--spring-active-text);
      font-weight: 700;
      
      .el-icon, svg {
        color: var(--spring-active-text);
      }
    }
    
    .el-menu {
      background: rgba($spring-red-dark, 0.9);
      
      .el-menu-item {
        color: var(--spring-gold);
        background: $couplet-normal;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        border: none;
        border-radius: 4px;
        margin: 4px 8px;
        font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
        
        &:hover {
          filter: brightness(1.1);
        }
        
        &.is-active {
          background: $couplet-active;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          color: var(--spring-active-text);
        }
        
        .el-icon, svg {
          color: var(--spring-gold);
        }
        
        &.is-active .el-icon,
        &.is-active svg {
          color: var(--spring-active-text);
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 春节主题 - 横向导航弹出菜单样式（组件化）
$spring-red: #DC143C;
$spring-red-dark: #B22222;
$spring-gold: #FFD700;

html[data-skin="spring-festival"] {
  .el-popper.horizontal-popper {
    background: rgba(139, 0, 0, 0.98) !important;
    border: 1px solid rgba($spring-gold, 0.4) !important;
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
      color: $spring-gold !important;
      font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
      font-size: 14px;
      transition: all 0.25s ease;
      
      .el-icon, svg {
        color: $spring-gold !important;
      }
      
      span, div {
        color: inherit !important;
        font-size: 14px;
      }
      
      &:hover {
        background: rgba($spring-gold, 0.1) !important;
        color: #fff !important;
        transform: translateX(4px);
      }
      
      &.is-active {
        background: linear-gradient(135deg, $spring-gold, #FFA500) !important;
        color: #8B0000 !important;
        box-shadow: 0 2px 8px rgba($spring-gold, 0.4);
        
        .el-icon, svg, span, div {
          color: #8B0000 !important;
        }
      }
    }
    
    .el-sub-menu__title {
      height: 44px;
      line-height: 44px;
      color: $spring-gold !important;
      background: transparent !important;
      border-radius: 6px;
      margin: 4px 0;
      padding: 0 16px;
      
      span, div {
        color: $spring-gold !important;
        font-size: 14px;
      }
      
      .el-icon, svg, .el-sub-menu__icon-arrow {
        color: $spring-gold !important;
      }
      
      &:hover {
        background: rgba($spring-gold, 0.08) !important;
      }
    }
    
    .el-sub-menu.is-active > .el-sub-menu__title {
      background: linear-gradient(135deg, $spring-gold, #FFA500) !important;
      color: #8B0000 !important;
      box-shadow: 0 2px 8px rgba($spring-gold, 0.4);
      
      span, div, .el-icon, svg, .el-sub-menu__icon-arrow {
        color: #8B0000 !important;
      }
    }
    
    .el-sub-menu > .el-menu {
      background: transparent !important;
      padding: 4px 0 4px 8px;
      border-left: 1px solid rgba($spring-gold, 0.2);
    }
  }
}
</style>
