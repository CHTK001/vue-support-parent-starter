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
      width: calc(100% - 16px) !important;
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
      // 默认（亮色）：使用主题色文字
      color: var(--el-color-primary) !important;
      font-weight: 600;
      
      .el-icon, svg, span, div {
        color: var(--el-color-primary) !important;
      }

      // 暗色模式适配
      @at-root html.dark & {
        color: var(--item-active-text) !important;
        .el-icon, svg, span, div {
          color: var(--item-active-text) !important;
        }
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
