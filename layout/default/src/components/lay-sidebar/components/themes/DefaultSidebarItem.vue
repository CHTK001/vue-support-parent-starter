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
    />
  </div>
</template>

<style lang="scss" scoped>
// CSS 变量管理主题样式
.default-sidebar-item-wrapper {
  --item-text-color: var(--el-text-color-primary);
  --item-hover-shadow: rgba(0, 0, 0, 0.05);
  --item-active-bg: var(--el-color-primary);
  --item-active-text: #fff;
  
  :deep(.sidebar-menu-item) {
    color: var(--item-text-color);
    background-color: transparent;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateX(2px);
      box-shadow: 0 2px 8px var(--item-hover-shadow);
    }
    
    &.is-active {
      background: var(--item-active-bg);
      color: var(--item-active-text);
      
      .el-icon, svg, span, div {
        color: var(--item-active-text);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: var(--item-text-color);
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateX(2px);
      }
    }
  }
}
</style>
