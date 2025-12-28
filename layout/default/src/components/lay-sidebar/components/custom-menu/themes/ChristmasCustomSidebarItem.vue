<script setup lang="ts">
/**
 * 圣诞主题 - 自定义菜单项组件
 * 圣诞绿配红色和金色
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

import ChristmasCustomSidebarItem from './ChristmasCustomSidebarItem.vue';
provide('themeSidebarItem', ChristmasCustomSidebarItem);

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
    class="christmas-menu-item"
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
    :popper-class="`christmas-custom-popper ${popperClass || ''}`"
    :popper-direction="popperDirection"
    class="christmas-sub-menu"
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
      <ChristmasCustomSidebarItem
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
$xmas-green: #1b5e20;
$xmas-red: #c62828;
$xmas-gold: #ffd700;
$xmas-white: #ffffff;

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
  color: $xmas-gold;
  
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

.christmas-menu-item,
.christmas-sub-menu {
  margin: 2px 4px;
  
  :deep(.custom-sub-menu__title),
  &.custom-menu-item {
    color: $xmas-white;
    border-radius: 6px;
    
    &:hover {
      background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba(#e53935, 0.7));
      color: $xmas-white;
      
      .menu-icon {
        color: $xmas-white;
      }
    }
  }
  
  &.is-active,
  &.is-active :deep(.custom-sub-menu__title) {
    background: linear-gradient(135deg, $xmas-red, #e53935);
    color: $xmas-white;
    box-shadow: 0 3px 12px rgba($xmas-red, 0.4);
    border-bottom: 3px solid $xmas-gold;
    
    .menu-icon, .menu-title {
      color: $xmas-white;
    }
  }
}
</style>
