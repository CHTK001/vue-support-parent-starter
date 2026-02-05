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
import DefaultSidebarItem from './DefaultSidebarItem.vue';
provide('themeSidebarItem', DefaultSidebarItem);
</script>

<template>
  <div class="default-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    >
      <template #activeDecoration>
        <div class="active-indicator"></div>
      </template>
    </BaseSidebarItem>
  </div>
</template>

<style lang="scss" scoped>
.default-sidebar-item-wrapper {
  --item-text-color: var(--el-text-color-primary);
  --item-hover-bg: rgba(0, 0, 0, 0.04);
  --item-active-bg: var(--el-color-primary-light-9);
  --item-active-text: var(--el-color-primary);
  --item-border-radius: 8px;
  
  :deep(.sidebar-menu-item) {
    color: var(--item-text-color);
    background-color: transparent;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin: 4px 8px;
    border-radius: var(--item-border-radius);
    height: 48px;
    line-height: 48px;
    
    .el-text {
      color: inherit;
    }

    &:hover {
      background-color: var(--item-hover-bg);
      transform: translateX(4px);
    }
    
    &.is-active {
      background-color: var(--item-active-bg);
      color: var(--item-active-text);
      font-weight: 600;
      
      .el-icon, svg, span, div, .el-text {
        color: var(--item-active-text);
      }

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 24px;
        background-color: var(--el-color-primary);
        border-radius: 0 4px 4px 0;
        opacity: 0; 
        // 默认主题使用背景色区分，这里隐藏左侧条，如果需要可以改为1
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: var(--item-text-color);
      margin: 4px 8px;
      border-radius: var(--item-border-radius);
      height: 48px;
      line-height: 48px;
      transition: all 0.3s ease;
      
      .el-text {
        color: inherit;
      }

      &:hover {
        background-color: var(--item-hover-bg);
      }
    }

    &.is-active > .el-sub-menu__title {
      color: var(--item-active-text);
      font-weight: 600;
      
      .el-icon, svg, span, div {
        color: var(--item-active-text);
      }
    }
  }
}

// 暗黑模式适配
html.dark {
  .default-sidebar-item-wrapper {
    --item-hover-bg: rgba(255, 255, 255, 0.05);
    --item-active-bg: rgba(var(--el-color-primary-rgb), 0.15);
  }
}
</style>
