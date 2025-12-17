<script setup lang="ts">
/**
 * 春节主题 - 自定义菜单项组件
 * 中国红配金色
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

import SpringFestivalCustomSidebarItem from './SpringFestivalCustomSidebarItem.vue';
provide('themeSidebarItem', SpringFestivalCustomSidebarItem);

function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (httpReg.test(routePath) || httpReg.test(props.basePath || '')) {
    return routePath || props.basePath || '';
  }
  return configResolvePath(props.basePath || '', routePath);
}

const onlyOneChild = computed(() => {
  const children = props.item?.children?.filter((item: any) => item.meta?.showLink !== false) || [];
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
    class="spring-menu-item"
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
    :popper-class="`spring-festival-custom-popper ${popperClass || ''}`"
    :popper-direction="popperDirection"
    class="spring-sub-menu"
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
      <SpringFestivalCustomSidebarItem
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
$spring-red: #DC143C;
$spring-gold: #FFD700;

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
  color: rgba(255, 255, 255, 0.9);
  
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

.spring-menu-item,
.spring-sub-menu {
  margin: 2px 4px;
  
  :deep(.custom-sub-menu__title),
  &.custom-menu-item {
    color: rgba(255, 255, 255, 0.95);
    border-radius: 4px;
    
    &:hover {
      background: rgba($spring-gold, 0.15);
      color: $spring-gold;
      
      .menu-icon {
        color: $spring-gold;
      }
    }
  }
  
  &.is-active,
  &.is-active :deep(.custom-sub-menu__title) {
    background: linear-gradient(135deg, $spring-gold, #FFA500);
    color: $spring-red;
    box-shadow: 0 3px 12px rgba($spring-gold, 0.4);
    
    .menu-icon, .menu-title {
      color: $spring-red;
    }
  }
}
</style>
