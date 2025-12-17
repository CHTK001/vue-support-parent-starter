<script setup lang="ts">
/**
 * 自定义横向导航菜单项
 * 使用 CustomMenuItem 和 CustomSubMenu 替代 el-menu-item 和 el-sub-menu
 */
import { computed, toRaw, inject, type Component } from 'vue';
import { useRoute } from 'vue-router';
import { useRenderIcon } from '@repo/components/ReIcon/src/hooks';
import { transformI18n, resolvePath as configResolvePath } from '@repo/config';
import type { MenuType } from '@repo/core';
import CustomMenuItem from './CustomMenuItem.vue';
import CustomSubMenu from './CustomSubMenu.vue';

const props = defineProps<{
  item: MenuType;
  basePath?: string;
  isNest?: boolean;
  popperClass?: string;
}>();

const route = useRoute();

// 注入主题化组件（用于递归）
const ThemeSidebarItem = inject<Component>('themeSidebarItem');

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

// 是否显示为单个菜单项（无子菜单）
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
</script>

<template>
  <!-- 单个菜单项 -->
  <CustomMenuItem 
    v-if="showAsMenuItem" 
    :index="menuPath"
    class="custom-sidebar-item"
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
    :popper-class="popperClass"
    popper-direction="bottom"
    class="custom-sidebar-item"
  >
    <template #title>
      <div class="menu-item-content">
        <span class="menu-icon">
          <component :is="useRenderIcon(menuIcon)" />
        </span>
        <span class="menu-title">{{ menuTitle }}</span>
      </div>
    </template>
    
    <!-- 子菜单项 -->
    <template v-for="child in item.children" :key="child.path">
      <component
        v-if="child.meta?.showLink !== false"
        :is="ThemeSidebarItem || CustomSidebarItem"
        :item="child"
        :base-path="resolvePath(child.path)"
        :is-nest="true"
        :popper-class="popperClass"
      />
    </template>
  </CustomSubMenu>
</template>

<style lang="scss" scoped>
.custom-sidebar-item {
  .menu-item-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    
    :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }
  
  .menu-title {
    font-size: 14px;
    white-space: nowrap;
  }
}
</style>
