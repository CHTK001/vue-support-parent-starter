<script setup lang="ts">
import BaseHover from './BaseHover.vue';
</script>

<template>
  <BaseHover theme-class="default-hover" />
</template>

<style lang="scss" scoped>
// 与 SidebarMenuItem 保持一致的激活态样式
.hover-nav-theme-wrapper {
  height: 100%;

  // 一级菜单激活态：左侧 3px 色条
  :deep(.first-level-menu-item.is-active) {
    position: relative;
    background: rgba(var(--el-color-primary-rgb), 0.1);
    color: var(--el-color-primary);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: var(--el-color-primary);
      border-radius: 0 3px 3px 0;
    }
  }

  // 子菜单激活态
  :deep(.menu-item.is-active) {
    color: var(--el-color-primary);
    background: rgba(var(--el-color-primary-rgb), 0.08);
    font-weight: 500;
  }
}
</style>
