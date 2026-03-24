<script setup lang="ts">
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
  collapse: {
    type: Boolean,
    default: undefined,
  },
});
</script>

<template>
  <div class="default-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
      :collapse="collapse"
    >
      <template #activeDecoration>
        <div class="active-indicator"></div>
      </template>
    </BaseSidebarItem>
  </div>
</template>

<style lang="scss" scoped>
.default-sidebar-item-wrapper {
  --item-text-color: var(--hover-nav-menu-color);
  --item-hover-bg: rgba(0, 0, 0, 0.04);
  // 默认（亮色模式）：使用纯色主题色作为背景，白色文字
  --item-active-bg: var(--el-color-primary);
  --item-active-text: #fff;
  
  --item-border-radius: 8px;
  
  :deep(.sidebar-menu-item),
  :deep(.el-sub-menu__title) {
    color: var(--item-text-color) !important;
    background-color: transparent !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin: 4px 8px;
    border-radius: var(--item-border-radius);
    height: 48px;
    line-height: 48px;
    
    .el-text,
    span,
    div,
    .el-icon,
    svg {
      color: inherit !important;
    }

    // 统一 hover 状态
    &:hover,
    &:focus {
      background-color: var(--item-hover-bg) !important;
      transform: translateX(4px);
    }
    
    // 兼容 layui 类名 .layui-this
    &.is-active,
    &.layui-this {
      background-color: var(--item-active-bg) !important;
      color: var(--item-active-text) !important;
      font-weight: 600;
      
      .el-icon, svg, span, div, .el-text {
        color: var(--item-active-text) !important;
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
    // 兼容 layui 类名 .layui-nav-itemed
    &.is-active > .el-sub-menu__title,
    &.layui-nav-itemed > .el-sub-menu__title {
       color: var(--item-active-text);
    }

    .el-sub-menu__title {
      color: var(--item-text-color);
      margin: 4px 8px;
  
      border-radius: var(--item-border-radius);
      height: 48px;
      line-height: 48px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      position: relative;
      padding-right: 32px; // 为箭头预留空间
      
      .el-text {
        color: inherit;
      }

      // 文字部分需要能够收缩，避免覆盖箭头
      .menu-text,
      span.flex-1 {
        flex: 1;
        flex-shrink: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      // 确保展开箭头显示并固定在右侧
      .el-sub-menu__icon-arrow {
        display: inline-flex !important;
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        flex-shrink: 0;
        transition: transform 0.3s ease;
        color: inherit;
        z-index: 1;
      }

      &:hover {
        background-color: var(--item-hover-bg);
      }
    }

    // 展开状态下的箭头旋转
    &.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow {
      transform: translateY(-50%) rotate(180deg);
    }

    &.is-active > .el-sub-menu__title {
      // 默认（亮色）：使用主题色文字
      color: var(--el-color-primary) !important;
      font-weight: 600;
      
      .el-icon, svg, span, div, .el-sub-menu__icon-arrow {
        color: var(--el-color-primary) !important;
      }

      // 暗色模式适配
      @at-root html.dark & {
        color: var(--item-active-text) !important;
        .el-icon, svg, span, div, .el-sub-menu__icon-arrow {
          color: var(--item-active-text) !important;
        }
      }
    }
  }

  // 嵌套菜单（二级菜单）的箭头样式
  :deep(.nest-menu) {
    .sidebar-sub-menu {
      .el-sub-menu__title {
        padding-right: 32px !important; // 为箭头预留空间
        
        // 确保嵌套菜单的箭头也显示
        .el-sub-menu__icon-arrow {
          display: inline-flex !important;
          position: absolute !important;
          right: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          flex-shrink: 0;
          transition: transform 0.3s ease;
          color: inherit !important;
          z-index: 1;
          opacity: 1 !important;
          visibility: visible !important;
        }
      }

      // 展开状态下的箭头旋转
      &.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow {
        transform: translateY(-50%) rotate(180deg) !important;
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
