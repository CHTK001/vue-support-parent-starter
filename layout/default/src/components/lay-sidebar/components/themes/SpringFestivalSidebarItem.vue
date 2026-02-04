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
    color: var(--sf-gold-light);
    transition: all 0.3s ease;
    border: 1px solid transparent;

    &:hover {
      background: var(--sidebar-hover-bg);
      color: var(--sf-gold);
      border-color: rgba(255, 207, 64, 0.2);
      
      .el-icon, .sub-menu-icon svg {
        color: var(--sf-gold);
        transform: scale(1.1);
      }
    }

    .el-icon, .sub-menu-icon svg {
      transition: transform 0.3s;
      color: rgba(255, 207, 64, 0.7);
    }
  }

  // 激活状态
  :deep(.sidebar-menu-item.is-active) {
    background: var(--sidebar-active-bg);
    color: var(--sf-gold);
    font-weight: 600;
    border: 1px solid var(--sf-gold);
    box-shadow: 0 0 10px rgba(255, 207, 64, 0.1);
    
    .el-icon, .sub-menu-icon svg {
      color: var(--sf-gold);
    }
    
    // 中国结装饰 (使用 CSS 绘制简化版)
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60%;
      background: var(--sf-gold);
      border-radius: 0 2px 2px 0;
    }
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: var(--sf-gold);
    font-weight: 600;
    
    .el-icon, .sub-menu-icon svg {
      color: var(--sf-gold);
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
