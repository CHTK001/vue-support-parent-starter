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
import ChristmasSidebarItem from './ChristmasSidebarItem.vue';
provide('themeSidebarItem', ChristmasSidebarItem);
</script>

<template>
  <div class="christmas-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    >
      <!-- 选中状态底部雪地装饰 -->
      <template #activeDecoration="{ isActive }">
        <div v-if="isActive" class="snow-ground-decoration"></div>
      </template>
    </BaseSidebarItem>
  </div>
</template>

<style lang="scss" scoped>
// 圣诞主题颜色变量
$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-red: #c62828;
$xmas-red-light: #e53935;
$xmas-gold: #ffd700;
$xmas-white: #ffffff;
$xmas-border: rgba(255, 215, 0, 0.4);

// 使用独立 SVG 文件作为横向圣诞树背景
$tree-svg-normal: url('./assets/christmas-tree-normal.svg');
$tree-svg-active: url('./assets/christmas-tree-active.svg');

.christmas-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $xmas-white !important;
    margin: 4px 8px;
    border-radius: 4px;
    border: none !important;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    
    // 横向圣诞树 SVG 背景
    background: $tree-svg-normal !important;
    background-size: 100% 100% !important;
    background-repeat: no-repeat !important;
    
    &:hover {
      transform: translateX(4px);
      filter: brightness(1.1);
      box-shadow: 
        0 4px 12px rgba($xmas-green, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .el-icon, .sub-menu-icon svg {
      color: $xmas-gold !important;
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
    }
    
    span, div {
      color: inherit !important;
      position: relative;
      z-index: 2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }
    
    &.is-active {
      background: $tree-svg-active !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($xmas-green, 0.5),
        0 0 15px rgba($xmas-gold, 0.3);
      
      .el-icon, .sub-menu-icon svg {
        color: $xmas-gold !important;
        filter: drop-shadow(0 0 4px rgba($xmas-gold, 0.6));
      }
      
      span, div {
        color: $xmas-white !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
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
    
    // 当子菜单项选中时，父级菜单显示激活样式
    &.is-active > .el-sub-menu__title {
      color: $xmas-white !important;
      background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
      border-color: rgba($xmas-gold, 0.5) !important;
      font-weight: 700;
      box-shadow: 
        0 4px 12px rgba($xmas-red, 0.3),
        0 2px 8px rgba(0, 0, 0, 0.2) !important;
      
      .el-icon, svg {
        color: $xmas-white !important;
      }
    }
    
    // 子菜单容器
    .el-menu {
      background: rgba(darken($xmas-green, 8%), 0.8) !important;
      
      .el-menu-item {
        color: $xmas-white !important;
        background: rgba(darken($xmas-green, 5%), 0.6) !important;
        border: 1.5px solid rgba($xmas-gold, 0.25) !important;
        border-radius: 8px;
        margin: 4px 8px !important;
        
        &:hover {
          background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
          color: $xmas-white !important;
          border-color: rgba($xmas-gold, 0.5) !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
          color: $xmas-white !important;
          border: 2px solid $xmas-gold !important;
          
          .el-icon, svg, span, div {
            color: $xmas-white !important;
          }
        }
        
        .el-icon, svg {
          color: $xmas-gold !important;
        }
        
        span, div {
          color: inherit !important;
        }
      }
    }
  }
}

// 激活状态的雪地已经在 SVG 背景中实现，不需要额外装饰
.snow-ground-decoration {
  display: none;
}
</style>
