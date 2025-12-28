<script setup lang="ts">
import { provide, computed } from 'vue';
import { useRoute } from 'vue-router';
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

const route = useRoute();

// 计算当前菜单项是否激活
const isMenuActive = computed(() => {
  const currentPath = route.path;
  const itemPath = props.basePath || props.item?.path || '';
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
});

// 提供自身作为主题 SidebarItem（用于子菜单递归）
import NewYearSidebarItem from './NewYearSidebarItem.vue';
provide('themeSidebarItem', NewYearSidebarItem);
</script>

<template>
  <div class="new-year-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    />
  </div>
</template>

<style lang="scss" scoped>
// 元旦冰雪主题 - CSS 变量优化
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$frost-white: #FFFFFF;

.new-year-sidebar-item-wrapper {
  --ice-deep: #{$ice-deep};
  --ice-primary: #{$ice-primary};
  --frost-white: #{$frost-white};
  
  :deep(.sidebar-menu-item) {
    color: var(--ice-deep);
    background-color: transparent;
    transition: all 0.3s ease;
    
    &:hover {
      color: var(--ice-primary);
      background: linear-gradient(135deg, rgba($ice-medium, 0.15), rgba($ice-primary, 0.1));
      box-shadow: 0 2px 8px rgba($ice-primary, 0.15);
    }
    
    &.is-active {
      background: linear-gradient(135deg, $ice-primary, $ice-medium);
      color: var(--frost-white);
      box-shadow: 0 2px 12px rgba($ice-primary, 0.35);
      
      .el-icon, svg, span, div {
        color: var(--frost-white);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: var(--ice-deep);
      
      &:hover {
        background: linear-gradient(135deg, rgba($ice-medium, 0.12), rgba($ice-primary, 0.08));
      }
    }
    
    &.is-active > .el-sub-menu__title {
      color: var(--ice-primary);
      
      .el-icon, svg {
        color: var(--ice-primary);
      }
    }
  }
}
</style>

<style lang="scss">
// 元旦主题 - 横向导航弹出菜单样式（组件化）
$ice-lightest: #F5FBFF;
$ice-light: #B8E0F2;
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$frost-white: #FFFFFF;
$frost-purple: #E0E7F5;

html[data-skin="new-year"] {
  .el-popper.horizontal-popper {
    background: rgba($ice-lightest, 0.98) !important;
    border: 1px solid rgba($ice-medium, 0.3) !important;
    box-shadow: 0 8px 24px rgba($ice-deep, 0.2) !important;
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
      color: $ice-deep !important;
      font-size: 14px;
      transition: all 0.25s ease;
      
      .el-icon, svg {
        color: $ice-primary !important;
      }
      
      span, div {
        color: inherit !important;
        font-size: 14px;
      }
      
      &:hover {
        background: rgba($ice-medium, 0.15) !important;
        color: $ice-primary !important;
      }
      
      &.is-active {
        background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
        color: $frost-white !important;
        box-shadow: 0 2px 8px rgba($ice-primary, 0.35);
        
        .el-icon, svg, span, div {
          color: $frost-white !important;
        }
      }
    }
    
    .el-sub-menu__title {
      height: 44px;
      line-height: 44px;
      color: $ice-deep !important;
      background: transparent !important;
      border-radius: 6px;
      margin: 4px 0;
      padding: 0 16px;
      
      span, div {
        color: $ice-deep !important;
        font-size: 14px;
      }
      
      .el-icon, svg, .el-sub-menu__icon-arrow {
        color: $ice-primary !important;
      }
      
      &:hover {
        background: rgba($ice-medium, 0.12) !important;
      }
    }
    
    .el-sub-menu.is-active > .el-sub-menu__title {
      background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
      color: $frost-white !important;
      box-shadow: 0 2px 8px rgba($ice-primary, 0.35);
      
      span, div, .el-icon, svg, .el-sub-menu__icon-arrow {
        color: $frost-white !important;
      }
    }
    
    .el-sub-menu > .el-menu {
      background: transparent !important;
      padding: 4px 0 4px 8px;
      border-left: 1px solid rgba($ice-medium, 0.25);
    }
  }
}
</style>
