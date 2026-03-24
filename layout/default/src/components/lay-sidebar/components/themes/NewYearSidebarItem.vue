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

import NewYearSidebarItem from './NewYearSidebarItem.vue';
provide('themeSidebarItem', NewYearSidebarItem);
</script>

<template>
  <div class="ny-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    />
  </div>
</template>

<style lang="scss" scoped>
.ny-sidebar-item-wrapper {
  // 消费 Wrapper 变量
  
  :deep(.sidebar-menu-item), 
  :deep(.el-sub-menu__title) {
    margin: 4px 8px;
    border-radius: 6px;
    color: var(--hover-nav-menu-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;

    &:hover {
      background: var(--ny-primary);
      color: #fff;
      transform: translateX(3px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      
      .el-icon, .sub-menu-icon svg {
        color: #fff;
        transform: scale(1.1);
      }
    }

    .el-icon, .sub-menu-icon svg {
      transition: all 0.3s;
      color: var(--hover-nav-menu-color);
    }
  }

  // 激活状态
  :deep(.sidebar-menu-item.is-active) {
    background: var(--ny-primary);
    color: #fff;
    font-weight: 600;
    border-left: 3px solid #fff;
    
    .el-icon, .sub-menu-icon svg {
      color: #fff;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.4));
    }
    
    // 冰晶图标
    &::after {
      content: '❄';
      position: absolute;
      right: 12px;
      font-size: 14px;
      color: var(--ny-primary);
      opacity: 0.6;
      animation: spin 3s linear infinite;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 弹窗样式
:global(html[data-skin="new-year"]) {
  .el-menu--popup {
    background: rgba(240, 248, 255, 0.95) !important;
    border: 1px solid rgba(78, 168, 222, 0.3) !important;
    backdrop-filter: blur(10px);
    
    .el-menu-item {
      color: #1E5F8C !important;
      
      &:hover {
        background: rgba(78, 168, 222, 0.1) !important;
        color: #4EA8DE !important;
      }
      
      &.is-active {
        background: rgba(78, 168, 222, 0.15) !important;
        color: #4EA8DE !important;
        font-weight: 600;
      }
    }
  }
}

:global(html.dark[data-skin="new-year"]) {
  .el-menu--popup {
    background: rgba(20, 35, 54, 0.95) !important;
    border-color: rgba(78, 168, 222, 0.2) !important;
    
    .el-menu-item {
      color: #b8e0f2 !important;
      
      &:hover, &.is-active {
        color: #fff !important;
      }
    }
  }
}
</style>
