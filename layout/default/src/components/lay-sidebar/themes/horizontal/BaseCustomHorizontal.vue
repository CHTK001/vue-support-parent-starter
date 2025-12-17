<script setup lang="ts">
/**
 * 横向导航基础组件 - 使用自定义菜单
 * 完全用 div 替代 el-menu，避免样式冲突
 */
import { computed, ref, provide, onMounted, onBeforeUnmount, type Component } from 'vue';
import { useRoute } from 'vue-router';
import { getConfig, responsiveStorageNameSpace } from '@repo/config';
import { usePermissionStoreHook, emitter } from '@repo/core';
import { isAllEmpty } from '@pureadmin/utils';
import { localStorageProxy } from '@repo/utils';
import type { StorageConfigs } from '@repo/config';
import { useNav } from '../../../../hooks/useNav';
import { CustomMenu, CustomSidebarItem } from '../../components/custom-menu';
import LayTool from '../../../lay-tool/index.vue';
import ThemeDecoration from '../../../ThemeDecoration.vue';
import { getComponentDecorations } from '../../../../themes/decorations';
import type { DecorationConfig } from '../../../../themes/decorations';

const props = defineProps<{
  /** 主题类名 */
  themeClass?: string;
  /** 弹出层类名 */
  popperClass?: string;
  /** 主题化的 SidebarItem 组件 */
  sidebarItemComponent?: Component;
}>();

const route = useRoute();
const { getLogo, backTopMenu } = useNav();

// 提供主题化组件给子组件递归使用
const ThemeSidebarItem = computed(() => props.sidebarItemComponent || CustomSidebarItem);
provide('themeSidebarItem', ThemeSidebarItem.value);

// 当前激活路径
const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

// === 主题装饰功能 ===
const currentTheme = ref<string>(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.systemTheme || 'default'
);

const sidebarDecorations = computed<DecorationConfig[]>(() => {
  return getComponentDecorations(currentTheme.value, 'lay-sidebar');
});

onMounted(() => {
  emitter.on("systemThemeChange", (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
});
</script>

<template>
  <div
    v-loading="usePermissionStoreHook().wholeMenus.length === 0"
    :class="['horizontal-header', 'horizontal-custom-menu', themeClass]"
  >
    <!-- Logo 区域 -->
    <div class="horizontal-header-left" @click="backTopMenu">
      <img :src="getLogo()" alt="logo" />
      <span>{{ getConfig().Title }}</span>
    </div>
    
    <!-- 菜单区域：使用自定义菜单组件 -->
    <CustomMenu
      mode="horizontal"
      :default-active="defaultActive as string"
      class="horizontal-header-menu"
      :theme-class="themeClass"
    >
      <component
        :is="ThemeSidebarItem"
        v-for="menuItem in usePermissionStoreHook().wholeMenus"
        :key="menuItem.path"
        :item="menuItem"
        :base-path="menuItem.path"
        :popper-class="popperClass"
      />
    </CustomMenu>
    
    <!-- 右侧工具栏 -->
    <div class="horizontal-header-right">
      <LayTool />
    </div>
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in sidebarDecorations"
      :key="`horizontal-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-loading-mask) {
  opacity: 0.45;
}

.horizontal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 56px;
  background: var(--pure-theme-menu-bg, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 16px;
  position: relative;
}

.horizontal-header-left {
  display: flex;
  align-items: center;
  min-width: 180px;
  height: 100%;
  padding-left: 8px;
  cursor: pointer;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.85;
  }

  img {
    display: inline-block;
    height: 32px;
  }

  span {
    display: inline-block;
    height: 32px;
    margin-left: 12px;
    font-size: 18px;
    font-weight: 600;
    line-height: 32px;
    color: var(--pure-theme-sub-menu-active-text);
  }
}

.horizontal-header-menu {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
  margin: 0 24px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.horizontal-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 300px;
  color: var(--pure-theme-sub-menu-active-text);
}
</style>
