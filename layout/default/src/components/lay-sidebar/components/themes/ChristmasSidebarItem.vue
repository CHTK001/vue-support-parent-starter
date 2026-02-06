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
    />
  </div>
</template>

<style lang="scss" scoped>
.christmas-sidebar-item-wrapper {
  // 消费 Wrapper 定义的变量
  
  :deep(.sidebar-menu-item), 
  :deep(.el-sub-menu__title) {
    margin: 4px 8px;
    border-radius: 8px;
    color: var(--hover-nav-menu-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;

    &:hover {
      background: var(--sidebar-hover-bg);
      transform: translateX(2px);
      border-color: rgba(255, 215, 0, 0.3);
      color: #fff;
      
      .el-icon, .sub-menu-icon svg {
        color: #fff;
        transform: scale(1.1);
      }
    }

    .el-icon, .sub-menu-icon svg {
      transition: transform 0.3s;
      color: var(--hover-nav-menu-color);
    }
  }

  // 激活状态
  :deep(.sidebar-menu-item.is-active) {
    background: linear-gradient(135deg, #c62828, #e53935) !important; 
    border: 2px solid #ffd700 !important; 
    box-shadow: 0 4px 16px rgba(198, 40, 40, 0.5) !important;
    font-weight: 600;
    color: #fff !important;
    
    .el-icon, .sub-menu-icon svg {
      color: #fff;
    }
    
    // 圣诞树装饰图标 (可选)
    &::after {
      content: '🎄';
      position: absolute;
      right: 10px;
      font-size: 14px;
      opacity: 0.8;
      animation: tree-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
  }

  // 子菜单激活时父级标题样式
  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #fff;
    font-weight: 600;
    
    .el-icon, .sub-menu-icon svg {
      color: #fff;
    }
  }
}

@keyframes tree-pop {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 0.8; }
}
</style>

<style lang="scss">
// 全局弹窗样式覆盖 (针对 horizontal 或 collapsed 模式)
html[data-skin="christmas"] {
  .el-menu--popup {
    background: linear-gradient(180deg, #0d3316 0%, #144923 100%) !important;
    border: 1px solid #ffb300 !important;
    
    .el-menu-item {
      color: #fff !important;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffb300 !important;
      }
      
      &.is-active {
        background: linear-gradient(135deg, #d32f2f, #ef5350) !important;
        color: #fff !important;
      }
    }
  }
}
</style>
