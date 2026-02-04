<script setup lang="ts">
/**
 * 默认主题 - 自定义菜单项组件
 */
import { computed, toRaw, inject, provide, type Component } from 'vue';
import { useRenderIcon } from '@repo/components/ReIcon/src/hooks';
import { transformI18n, resolvePath as configResolvePath } from '@repo/config';
import type { MenuType } from '@repo/core';
import CustomMenuItem from '../CustomMenuItem.vue';
import CustomSubMenu from '../CustomSubMenu.vue';

const props = defineProps<{
  item: MenuType;
  basePath?: string;
  isNest?: boolean;
  popperClass?: string;
}>();

// 提供自身组件用于递归
import DefaultCustomSidebarItem from './DefaultCustomSidebarItem.vue';
provide('themeSidebarItem', DefaultCustomSidebarItem);

// 解析路径
function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (httpReg.test(routePath) || httpReg.test(props.basePath || '')) {
    return routePath || props.basePath || '';
  }
  return configResolvePath(props.basePath || '', routePath);
}

// 判断是否只有一个子菜单
const onlyOneChild = computed(() => {
  const children = props.item?.children?.filter((item: MenuType) => item.meta?.showLink !== false) || [];
  if (children.length === 0) {
    return { ...props.item, path: props.item?.path || '', noShowingChildren: true };
  }
  if (children.length === 1 && !children[0]?.meta?.showParent) {
    return children[0];
  }
  return null;
});

const showAsMenuItem = computed(() => {
  return onlyOneChild.value && (!onlyOneChild.value.children || onlyOneChild.value.noShowingChildren);
});

const menuIcon = computed(() => {
  if (showAsMenuItem.value) {
    return toRaw(onlyOneChild.value?.meta?.icon) || toRaw(props.item?.meta?.icon) || 'ep:menu';
  }
  return toRaw(props.item?.meta?.icon) || 'ep:menu';
});

const menuTitle = computed(() => {
  if (showAsMenuItem.value) {
    return transformI18n(onlyOneChild.value?.meta?.i18nKey || onlyOneChild.value?.meta?.title);
  }
  return transformI18n(props.item?.meta?.i18nKey || props.item?.meta?.title);
});

const menuPath = computed(() => {
  if (showAsMenuItem.value) {
    return resolvePath(onlyOneChild.value?.path || '');
  }
  return resolvePath(props.item?.path || '');
});

const popperDirection = computed(() => props.isNest ? 'right' : 'bottom');
</script>

<template>
  <CustomMenuItem 
    v-if="showAsMenuItem" 
    :index="menuPath"
    class="default-menu-item"
  >
    <div class="menu-item-content">
      <span class="menu-icon">
        <component :is="useRenderIcon(menuIcon)" />
      </span>
      <span class="menu-title">{{ menuTitle }}</span>
    </div>
  </CustomMenuItem>
  
  <CustomSubMenu 
    v-else
    :index="resolvePath(item.path)"
    :popper-class="`default-custom-popper ${popperClass || ''}`"
    :popper-direction="popperDirection"
    class="default-sub-menu"
  >
    <template #title>
      <div class="menu-item-content">
        <span class="menu-icon">
          <component :is="useRenderIcon(menuIcon)" />
        </span>
        <span class="menu-title">{{ menuTitle }}</span>
      </div>
    </template>
    
    <template v-for="child in item.children" :key="child.path">
      <DefaultCustomSidebarItem
        v-if="child.meta?.showLink !== false"
        :item="child"
        :base-path="resolvePath(child.path)"
        :is-nest="true"
        :popper-class="popperClass"
      />
    </template>
  </CustomSubMenu>
</template>

<style lang="scss" scoped>
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--el-text-color-primary); // 默认颜色
  transition: color 0.3s;
  
  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.menu-title {
  font-size: 14px;
  white-space: nowrap;
  font-weight: 500;
  color: var(--el-text-color-primary);
  transition: color 0.3s;
}

.default-menu-item,
.default-sub-menu {
  margin: 4px 6px;
  border-radius: 8px;
  transition: all 0.3s ease;
  height: 40px;
  line-height: 40px;

  // 鼠标悬停
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    
    .menu-icon, .menu-title {
      color: var(--el-color-primary);
    }
  }
}

// 激活状态（CustomMenuItem 会添加 is-active 类）
:deep(.is-active) {
  &.default-menu-item,
  &.default-sub-menu > .custom-sub-menu__title { // Assuming structure
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    
    .menu-icon, .menu-title {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

// 暗色模式
html.dark {
  .default-menu-item,
  .default-sub-menu {
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  :deep(.is-active) {
    &.default-menu-item,
    &.default-sub-menu > .custom-sub-menu__title {
      background-color: rgba(var(--el-color-primary-rgb), 0.15);
    }
  }
}
</style>
