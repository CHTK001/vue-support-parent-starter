<script setup lang="ts">
/**
 * FutureTech 主题 - 自定义菜单项组件
 * 科技感青色系
 */
import { computed, toRaw, provide, ref, onMounted } from 'vue';
import { useRenderIcon } from '@repo/components/ReIcon/src/hooks';
import { transformI18n, resolvePath as configResolvePath, getConfig } from '@repo/config';
import { type MenuType, emitter } from '@repo/core';
import CustomMenuItem from '../CustomMenuItem.vue';
import CustomSubMenu from '../CustomSubMenu.vue';
import { ReMenuNewBadge } from "@repo/components/MenuNewBadge";

const props = defineProps<{
  item: MenuType;
  basePath?: string;
  isNest?: boolean;
  popperClass?: string;
}>();

import FutureTechCustomSidebarItem from './FutureTechCustomSidebarItem.vue';
provide('themeSidebarItem', FutureTechCustomSidebarItem);

const showNewMenu = ref(getConfig().ShowNewMenu ?? true);
const forceNewMenu = ref(false);
const menuAnimation = ref(getConfig().MenuAnimation ?? false);
const newMenuAnimation = ref(getConfig().NewMenuAnimation || 'bounce');

onMounted(() => {
  emitter.on("showNewMenuChange", (val) => {
    showNewMenu.value = val;
  });
  emitter.on("forceNewMenuChange", (val) => {
    forceNewMenu.value = val;
  });
  emitter.on("menuAnimationChange", (val) => {
    menuAnimation.value = val;
  });
  emitter.on("newMenuAnimationChange", (val) => {
    newMenuAnimation.value = val;
  });
});

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
</script>

<template>
  <CustomMenuItem
    v-if="showAsMenuItem"
    :item="onlyOneChild"
    :base-path="menuPath"
    :is-nest="props.isNest"
    :popper-class="props.popperClass"
  >
    <template #title>
      <span class="future-tech-menu-title">
        <component
          :is="useRenderIcon(menuIcon)"
          class="future-tech-menu-icon"
        />
        <span>{{ menuTitle }}</span>
        <ReMenuNewBadge
          v-if="showNewMenu && (forceNewMenu || (onlyOneChild?.meta?.isNew ?? false))"
          :animation="newMenuAnimation"
        />
      </span>
    </template>
  </CustomMenuItem>

  <CustomSubMenu
    v-else
    :item="props.item"
    :base-path="props.basePath"
    :is-nest="props.isNest"
    :popper-class="props.popperClass"
  >
    <template #title>
      <span class="future-tech-menu-title">
        <component
          :is="useRenderIcon(menuIcon)"
          class="future-tech-menu-icon"
        />
        <span>{{ menuTitle }}</span>
        <ReMenuNewBadge
          v-if="showNewMenu && (forceNewMenu || (props.item?.meta?.isNew ?? false))"
          :animation="newMenuAnimation"
        />
      </span>
    </template>
  </CustomSubMenu>
</template>

<style lang="scss" scoped>
.future-tech-menu-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(0, 255, 255, 0.7);
  transition: all 0.3s ease;
  
  .future-tech-menu-icon {
    color: rgba(0, 255, 255, 0.6);
    filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
    transition: all 0.3s ease;
  }
  
  &:hover {
    color: #00ffff;
    text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
    
    .future-tech-menu-icon {
      color: #00ffff;
      filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
    }
  }
}
</style>

