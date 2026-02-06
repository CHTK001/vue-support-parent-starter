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

import SpringFestivalSidebarItem from './SpringFestivalSidebarItem.vue';
provide('themeSidebarItem', SpringFestivalSidebarItem);
</script>

<template>
  <div class="sf-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    />
  </div>
</template>

<style lang="scss" scoped>
.sf-sidebar-item-wrapper {
  // 消费 Wrapper 变量
  
  :deep(.sidebar-menu-item), 
  :deep(.el-sub-menu__title) {
    margin: 4px 8px;
    border-radius: 6px;
    color: var(--hover-nav-menu-color);
    transition: all 0.3s ease;
    border: 1px solid transparent;

    &:hover {
      background: var(--sidebar-hover-bg);
      color: #fff;
      border-color: rgba(255, 207, 64, 0.2);
      
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
    color: #fff !important;
    font-weight: 600;
    
    .el-icon, .sub-menu-icon svg {
      color: #fff;
    }
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #fff;
    font-weight: 600;
    
    .el-icon, .sub-menu-icon svg {
      color: #fff;
    }
  }
}

// 弹窗样式
:global(html[data-skin="spring-festival"]) {
  .el-menu--popup {
    background: linear-gradient(135deg, #b31217 0%, #8e0e12 100%) !important;
    border: 1px solid #ffcf40 !important;
    
    .el-menu-item {
      color: #ffe082 !important;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffcf40 !important;
      }
      
      &.is-active {
        background: rgba(255, 207, 64, 0.1) !important;
        color: #ffcf40 !important;
        border: 1px solid #ffcf40;
      }
    }
  }
}
</style>
