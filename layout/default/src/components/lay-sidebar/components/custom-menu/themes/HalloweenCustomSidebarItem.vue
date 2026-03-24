<script setup lang="ts">
/**
 * 万圣节主题 - 自定义菜单项组件
 * 南瓜橙配深紫
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

import HalloweenCustomSidebarItem from './HalloweenCustomSidebarItem.vue';
provide('themeSidebarItem', HalloweenCustomSidebarItem);

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

const popperDirection = computed(() => props.isNest ? 'right' : 'bottom');
</script>

<template>
  <CustomMenuItem 
    v-if="showAsMenuItem" 
    :index="menuPath"
    class="halloween-menu-item"
    :class="{ 'menu-animation': menuAnimation }"
  >
    <div class="menu-item-content">
      <span class="menu-icon">
        <component :is="useRenderIcon(menuIcon)" />
      </span>
      <span class="menu-title">{{ menuTitle }}</span>
      <ReMenuNewBadge
        v-if="showNewMenu"
        :createTime="onlyOneChild?.meta?.createTime || item?.meta?.createTime"
        :type="onlyOneChild?.meta?.badgeType || item?.meta?.badgeType || 'primary'"
        :customText="onlyOneChild?.meta?.badgeText || item?.meta?.badgeText"
        :forceShow="forceNewMenu || onlyOneChild?.meta?.permanentNew || item?.meta?.permanentNew"
        :animation="newMenuAnimation"
      />
    </div>
  </CustomMenuItem>
  
  <CustomSubMenu 
    v-else
    :index="resolvePath(item.path)"
    :popper-class="`halloween-custom-popper ${popperClass || ''}`"
    :popper-direction="popperDirection"
    class="halloween-sub-menu"
    :class="{ 'menu-animation': menuAnimation }"
  >
    <template #title>
      <div class="menu-item-content">
        <span class="menu-icon">
          <component :is="useRenderIcon(menuIcon)" />
        </span>
        <span class="menu-title">{{ menuTitle }}</span>
        <ReMenuNewBadge
          v-if="showNewMenu"
          :createTime="item?.meta?.createTime"
          :type="item?.meta?.badgeType || 'primary'"
          :customText="item?.meta?.badgeText"
          :forceShow="forceNewMenu || item?.meta?.permanentNew"
          :animation="newMenuAnimation"
        />
      </div>
    </template>
    
    <template v-for="child in item.children" :key="child.path">
      <HalloweenCustomSidebarItem
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
$hw-pumpkin: #ff7518;
$hw-purple: #2c003e;
$hw-green: #76ff03;
$hw-white: #f8f8ff;

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
  color: $hw-pumpkin;
  
  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.menu-title {
  font-size: 14px;
  white-space: nowrap;
  font-weight: 500;
  color: $hw-pumpkin;
}

.halloween-menu-item,
.halloween-sub-menu {
  margin: 2px 4px;
  
  :deep(.custom-sub-menu__title),
  &.custom-menu-item {
    color: $hw-pumpkin;
    border-radius: 4px;
    
    &:hover {
      background: rgba(255, 117, 24, 0.15);
      color: $hw-green;
      
      .menu-icon {
        color: $hw-green;
      }
      
      .menu-title {
        color: $hw-green;
      }
    }
  }
  
  &.is-active,
  &.is-active :deep(.custom-sub-menu__title) {
    background: linear-gradient(135deg, $hw-pumpkin, #ff9f5a);
    color: $hw-purple;
    box-shadow: 0 0 10px rgba(255, 117, 24, 0.5);
    
    .menu-icon, .menu-title {
      color: $hw-purple;
      font-weight: bold;
    }
  }
}
</style>
