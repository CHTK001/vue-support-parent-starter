<script setup lang="ts">
/**
 * 元旦主题 - 自定义菜单项组件
 * 使用冰雪蓝色调，搭配霜白色激活效果
 */
import { computed, toRaw, inject, provide, type Component } from 'vue';
import { useRoute } from 'vue-router';
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

const route = useRoute();

// 提供自身组件用于递归
import NewYearCustomSidebarItem from './NewYearCustomSidebarItem.vue';
provide('themeSidebarItem', NewYearCustomSidebarItem);

// 注入主题化组件（递归时使用）
const ThemeSidebarItem = inject<Component>('themeSidebarItem', NewYearCustomSidebarItem);

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
  const children = props.item?.children?.filter((item: any) => item.meta?.showLink !== false) || [];
  
  if (children.length === 0) {
    return { ...props.item, path: props.item?.path || '', noShowingChildren: true };
  }
  
  if (children.length === 1 && !children[0]?.meta?.showParent) {
    return children[0];
  }
  
  return null;
});

// 是否显示为单个菜单项
const showAsMenuItem = computed(() => {
  return onlyOneChild.value && (!onlyOneChild.value.children || onlyOneChild.value.noShowingChildren);
});

// 获取图标
const menuIcon = computed(() => {
  if (showAsMenuItem.value) {
    return toRaw(onlyOneChild.value?.meta?.icon) || toRaw(props.item?.meta?.icon) || 'ep:menu';
  }
  return toRaw(props.item?.meta?.icon) || 'ep:menu';
});

// 获取标题
const menuTitle = computed(() => {
  if (showAsMenuItem.value) {
    return transformI18n(onlyOneChild.value?.meta?.i18nKey || onlyOneChild.value?.meta?.title);
  }
  return transformI18n(props.item?.meta?.i18nKey || props.item?.meta?.title);
});

// 获取路径
const menuPath = computed(() => {
  if (showAsMenuItem.value) {
    return resolvePath(onlyOneChild.value?.path || '');
  }
  return resolvePath(props.item?.path || '');
});

// 判断弹出方向
const popperDirection = computed(() => props.isNest ? 'right' : 'bottom');
</script>

<template>
  <!-- 单个菜单项 -->
  <CustomMenuItem 
    v-if="showAsMenuItem" 
    :index="menuPath"
    class="new-year-menu-item"
  >
    <div class="menu-item-content">
      <span class="menu-icon">
        <component :is="useRenderIcon(menuIcon)" />
      </span>
      <span class="menu-title">{{ menuTitle }}</span>
    </div>
  </CustomMenuItem>
  
  <!-- 有子菜单 -->
  <CustomSubMenu 
    v-else
    :index="resolvePath(item.path)"
    :popper-class="`new-year-custom-popper ${popperClass || ''}`"
    :popper-direction="popperDirection"
    class="new-year-sub-menu"
  >
    <template #title>
      <div class="menu-item-content">
        <span class="menu-icon">
          <component :is="useRenderIcon(menuIcon)" />
        </span>
        <span class="menu-title">{{ menuTitle }}</span>
      </div>
    </template>
    
    <!-- 子菜单项递归 -->
    <template v-for="child in item.children" :key="child.path">
      <NewYearCustomSidebarItem
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
@use "sass:color";

// 元旦冰雪主题色
$ice-lightest: #F5FBFF;
$ice-light: #B8E0F2;
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$ice-darker: #1E5F8C;
$frost-white: #FFFFFF;
$frost-purple: #E0E7F5;

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
  color: $ice-primary;
  transition: color 0.25s ease;
  
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

// 菜单项样式
.new-year-menu-item {
  --custom-menu-text-color: #{$ice-darker};
  --custom-menu-item-bg: transparent;
--custom-menu-item-hover-bg: rgba(#{color.channel($ice-medium, 'red', $space: rgb)}, #{color.channel($ice-medium, 'green', $space: rgb)}, #{color.channel($ice-medium, 'blue', $space: rgb)}, 0.15);
  --custom-menu-item-hover-color: #{$ice-deep};
  --custom-menu-item-active-bg: linear-gradient(135deg, #{$ice-primary}, #{$ice-medium});
  --custom-menu-item-active-color: #{$frost-white};
--custom-menu-item-active-shadow: 0 3px 12px rgba(#{color.channel($ice-primary, 'red', $space: rgb)}, #{color.channel($ice-primary, 'green', $space: rgb)}, #{color.channel($ice-primary, 'blue', $space: rgb)}, 0.35);
  
  border-radius: 8px;
  margin: 2px 4px;
  
  &:deep(.menu-icon) {
    color: $ice-primary;
  }
  
  &:hover {
    :deep(.menu-icon) {
      color: $ice-deep;
    }
  }
  
  &.is-active {
    :deep(.menu-icon) {
      color: $frost-white;
    }
  }
}

// 子菜单样式
.new-year-sub-menu {
  --custom-menu-text-color: #{$ice-darker};
  --custom-menu-item-hover-bg: rgba(#{red($ice-medium)}, #{green($ice-medium)}, #{blue($ice-medium)}, 0.12);
  --custom-menu-item-hover-color: #{$ice-deep};
  --custom-menu-sub-active-color: #{$ice-deep};
  --custom-menu-sub-active-bg: rgba(#{red($ice-medium)}, #{green($ice-medium)}, #{blue($ice-medium)}, 0.15);
  
  margin: 2px 4px;
  
  :deep(.custom-sub-menu__title) {
    border-radius: 8px;
    
    .menu-icon {
      color: $ice-primary;
    }
  }
  
  &.is-active :deep(.custom-sub-menu__title) {
    background: linear-gradient(135deg, $ice-primary, $ice-medium) !important;
    color: $frost-white !important;
    box-shadow: 0 3px 12px rgba($ice-primary, 0.35);
    
    .menu-icon, .menu-title {
      color: $frost-white !important;
    }
    
    .custom-sub-menu__icon-arrow {
      color: $frost-white !important;
    }
  }
  
  :deep(.custom-sub-menu__icon-arrow) {
    color: $ice-primary;
  }
}
</style>
