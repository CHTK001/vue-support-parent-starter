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
.default-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: var(--app-text-primary);
    background-color: transparent !important;
    transition: all 0.3s ease;
    
    &:hover {
      color: var(--app-text-primary) !important;
      transform: translateX(2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    &.is-active {
      background: var(--el-color-primary) !important;
      color: #fff !important;
      
      .el-icon, svg, span, div {
        color: #fff !important;
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: var(--app-text-primary);
      
      &:hover {
        transform: translateX(2px);
      }
    }
  }
}
</style>
