<script setup lang="ts">
/**
 * 赛博朋克主题 - 自定义菜单项组件
 * 霓虹青色/品红配色，科技感效果
 */
import { computed, toRaw, provide } from 'vue';
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

import CyberpunkCustomSidebarItem from './CyberpunkCustomSidebarItem.vue';
provide('themeSidebarItem', CyberpunkCustomSidebarItem);

function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (httpReg.test(routePath) || httpReg.test(props.basePath || '')) {
    return routePath || props.basePath || '';
  }
  return configResolvePath(props.basePath || '', routePath);
}

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
    class="cyberpunk-menu-item"
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
    :popper-class="`cyberpunk-custom-popper ${popperClass || ''}`"
    :popper-direction="popperDirection"
    class="cyberpunk-sub-menu"
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
      <CyberpunkCustomSidebarItem
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
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-dark: #0a0a12;

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
  color: $cyber-cyan;
  filter: drop-shadow(0 0 3px rgba($cyber-cyan, 0.5));
  
  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.menu-title {
  font-size: 14px;
  white-space: nowrap;
  font-weight: 500;
}

.cyberpunk-menu-item,
.cyberpunk-sub-menu {
  margin: 2px 4px;
  
  :deep(.custom-sub-menu__title),
  &.custom-menu-item {
    color: $cyber-cyan;
    border-radius: 4px;
    
    &:hover {
      background: rgba($cyber-cyan, 0.1);
      box-shadow: 0 0 15px rgba($cyber-cyan, 0.2), inset 0 0 15px rgba($cyber-cyan, 0.05);
    }
  }
  
  &.is-active,
  &.is-active :deep(.custom-sub-menu__title) {
    background: rgba($cyber-cyan, 0.15);
    color: #fff;
    box-shadow: 0 0 20px rgba($cyber-cyan, 0.3), inset 0 0 20px rgba($cyber-cyan, 0.08);
    
    .menu-icon {
      color: #fff;
      filter: drop-shadow(0 0 5px rgba($cyber-cyan, 0.8));
    }
  }
}
</style>
