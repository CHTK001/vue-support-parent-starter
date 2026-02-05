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

import HalloweenSidebarItem from './HalloweenSidebarItem.vue';
provide('themeSidebarItem', HalloweenSidebarItem);
</script>

<template>
  <div class="hw-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    />
  </div>
</template>

<style lang="scss" scoped>
.hw-sidebar-item-wrapper {
  // 消费 Wrapper 变量
  --hw-pumpkin: #ff7518;
  --hw-purple: #2c003e;
  --hw-purple-light: #4a148c;
  --hw-green: #76ff03;
  --hw-text: #b39ddb;

  :deep(.sidebar-menu-item), 
  :deep(.el-sub-menu__title) {
    margin: 4px 8px;
    border-radius: 6px;
    color: var(--hw-text);
    transition: all 0.3s ease;
    border: 1px solid transparent;

    &:hover {
      background: rgba(255, 117, 24, 0.1);
      color: var(--hw-pumpkin);
      border-color: rgba(255, 117, 24, 0.3);
      box-shadow: 0 0 8px rgba(44, 0, 62, 0.5);
      
      .el-icon, .sub-menu-icon svg {
        color: var(--hw-pumpkin);
        transform: scale(1.1) rotate(5deg);
      }
    }

    .el-icon, .sub-menu-icon svg {
      transition: transform 0.3s;
      color: rgba(179, 157, 219, 0.7);
    }
  }

  // 激活状态
  :deep(.sidebar-menu-item.is-active) {
    background: linear-gradient(90deg, rgba(255, 117, 24, 0.2), rgba(44, 0, 62, 0.5));
    color: var(--hw-pumpkin);
    font-weight: 600;
    border: 1px solid var(--hw-pumpkin);
    box-shadow: 0 0 15px rgba(255, 117, 24, 0.2);
    
    .el-icon, .sub-menu-icon svg {
      color: var(--hw-pumpkin);
    }
    
    // 南瓜装饰
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60%;
      background: var(--hw-pumpkin);
      border-radius: 0 2px 2px 0;
      box-shadow: 0 0 5px var(--hw-pumpkin);
    }
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: var(--hw-pumpkin);
    font-weight: 600;
    text-shadow: 0 0 5px rgba(255, 117, 24, 0.3);
    
    .el-icon, .sub-menu-icon svg {
      color: var(--hw-pumpkin);
    }
  }
}

// 弹窗样式
:global(html[data-skin="halloween"]) {
  .el-menu--popup {
    background: linear-gradient(135deg, #2c003e 0%, #1a0026 100%) !important;
    border: 1px solid #4a148c !important;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.8) !important;
    
    .el-menu-item {
      color: #b39ddb !important;
      
      &:hover {
        background: rgba(255, 117, 24, 0.15) !important;
        color: #ff7518 !important;
      }
      
      &.is-active {
        background: rgba(255, 117, 24, 0.2) !important;
        color: #ff7518 !important;
        border: 1px solid #ff7518;
        box-shadow: inset 0 0 10px rgba(255, 117, 24, 0.1);
      }
    }
  }
}
</style>
